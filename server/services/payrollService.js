import { summarizeAttendance } from "../utils/attendanceSummary.js";
import { computePayslip } from "../utils/payslipCalculator.js";

// Groups a list of rows into a Map: key -> array of rows
const groupBy = (rows, key) => {
  const groups = new Map();

  for (const row of rows) {
    if (!groups.has(row[key])) {
      groups.set(row[key], []);
    }
    groups.get(row[key]).push(row);
  }

  return groups;
};

// `db` is anything with a .query method: the pool now, a transaction client later
export const buildPayslips = async (db, { periodStart, periodEnd }) => {
  // 1. Active employees who were hired by the end of the period
  const employeeResult = await db.query(
    `SELECT e.id, e.first_name, e.last_name, e.base_salary, e.salary_type,
            ws.work_days
     FROM employee e
     INNER JOIN work_schedule ws ON e.work_schedule_id = ws.id
     WHERE e.employment_status = 'active'
       AND e.hire_date <= $1::date
     ORDER BY e.last_name, e.first_name`,
    [periodEnd],
  );

  // 2. Everyone's attendance in the period, with late minutes worked out in Manila time
  const attendanceResult = await db.query(
    `SELECT a.employee_id,
            to_char(a.attendance_date, 'YYYY-MM-DD') AS date,
            a.status,
            CASE
              WHEN a.status = 'late' AND a.clock_in IS NOT NULL THEN
                GREATEST(0, FLOOR(EXTRACT(EPOCH FROM
                  ((a.clock_in AT TIME ZONE 'Asia/Manila')::time - ws.start_time)) / 60))::int
              ELSE 0
            END AS "lateMinutes"
     FROM attendance a
     INNER JOIN employee e ON a.employee_id = e.id
     INNER JOIN work_schedule ws ON e.work_schedule_id = ws.id
     WHERE a.attendance_date BETWEEN $1::date AND $2::date`,
    [periodStart, periodEnd],
  );

  // 3. Approved leaves that overlap the period
  const leaveResult = await db.query(
    `SELECT lr.employee_id,
            to_char(lr.start_date, 'YYYY-MM-DD') AS "startDate",
            to_char(lr.end_date, 'YYYY-MM-DD') AS "endDate",
            lt.is_paid AS "isPaid"
     FROM leave_request lr
     INNER JOIN leave_type lt ON lr.leave_type_id = lt.id
     WHERE lr.status = 'approved'
       AND lr.start_date <= $2::date
       AND lr.end_date >= $1::date`,
    [periodStart, periodEnd],
  );

  const attendanceByEmployee = groupBy(attendanceResult.rows, "employee_id");
  const leavesByEmployee = groupBy(leaveResult.rows, "employee_id");

  // The 1st to 15th is the first half, the 16th onwards is the second
  const half = periodStart.slice(8, 10) === "01" ? "first" : "second";

  return employeeResult.rows.map((employee) => {
    const baseSalary = Number(employee.base_salary);

    const summary = summarizeAttendance({
      periodStart,
      periodEnd,
      workDays: employee.work_days,
      attendance: attendanceByEmployee.get(employee.id) ?? [],
      leaves: leavesByEmployee.get(employee.id) ?? [],
    });

    const payslip = computePayslip({
      baseSalary,
      salaryType: employee.salary_type,
      scheduledDays: summary.scheduledDays,
      absentDays: summary.absentDays,
      unpaidLeaveDays: summary.unpaidLeaveDays,
      lateMinutes: summary.lateMinutes,
      half,
    });

    return {
      employeeId: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      baseSalary,
      salaryType: employee.salary_type,
      summary,
      payslip,
    };
  });
};