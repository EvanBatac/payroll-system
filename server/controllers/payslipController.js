import pool from "../config/db.js";
import { getEmployeeIdByUserId } from "../helpers/employeeHelper.js";

export const getPayslipById = async (req, res) => {
  const { id } = req.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      message: "Invalid payslip id",
    });
  }

  let employeeId = null;

  // Employees can only access their own completed payslips
  if (req.user.role === "employee") {
    employeeId = await getEmployeeIdByUserId(req.user.id);

    if (!employeeId) {
      return res.status(404).json({
        message: "Payslip not found",
      });
    }
  }

  const payslipResult = await pool.query(
    `SELECT
       p.id,
       p.employee_id,
       p.base_salary,
       p.salary_type,
       p.days_worked,
       p.days_absent,
       p.paid_leave_days,
       p.unpaid_leave_days,
       p.late_minutes,
       p.gross_pay,
       p.total_deductions,
       p.net_pay,
       pr.id AS run_id,
       pr.status AS run_status,
       to_char(pr.period_start, 'YYYY-MM-DD') AS period_start,
       to_char(pr.period_end, 'YYYY-MM-DD') AS period_end,
       to_char(pr.pay_date, 'YYYY-MM-DD') AS pay_date,
       e.employee_number,
       e.first_name,
       e.last_name,
       e.position,
       d.name AS department
     FROM payslip p
     INNER JOIN employee e ON p.employee_id = e.id
     INNER JOIN department d ON e.department_id = d.id
     INNER JOIN payroll_run pr ON p.payroll_run_id = pr.id
     WHERE p.id = $1`,
    [id],
  );

  const payslip = payslipResult.rows[0];

  if (!payslip) {
    return res.status(404).json({
      message: "Payslip not found",
    });
  }

  // Employees cannot view another employee's payslip
  // or a payslip from a draft payroll run
  if (
    req.user.role === "employee" &&
    (payslip.employee_id !== employeeId || payslip.run_status !== "completed")
  ) {
    return res.status(404).json({
      message: "Payslip not found",
    });
  }

  const deductionResult = await pool.query(
    `SELECT
       deduction_type AS type,
       amount
     FROM payroll_deduction
     WHERE payslip_id = $1
     ORDER BY id`,
    [payslip.id],
  );

  return res.status(200).json({
    payslip: {
      id: payslip.id,
      runId: payslip.run_id,
      runStatus: payslip.run_status,
      periodStart: payslip.period_start,
      periodEnd: payslip.period_end,
      payDate: payslip.pay_date,
      employee: {
        id: payslip.employee_id,
        employeeNumber: payslip.employee_number,
        name: `${payslip.first_name} ${payslip.last_name}`,
        position: payslip.position,
        department: payslip.department,
      },
      baseSalary: Number(payslip.base_salary),
      salaryType: payslip.salary_type,
      daysWorked: Number(payslip.days_worked),
      daysAbsent: Number(payslip.days_absent),
      paidLeaveDays: Number(payslip.paid_leave_days),
      unpaidLeaveDays: Number(payslip.unpaid_leave_days),
      lateMinutes: payslip.late_minutes,
      grossPay: Number(payslip.gross_pay),
      totalDeductions: Number(payslip.total_deductions),
      netPay: Number(payslip.net_pay),
      deductions: deductionResult.rows.map((deduction) => ({
        ...deduction,
        amount: Number(deduction.amount),
      })),
    },
  });
};

export const getMyPayslips = async (req, res) => {
  const employeeId = await getEmployeeIdByUserId(req.user.id);

  if (!employeeId) {
    return res.status(404).json({
      message: "Employee record not found",
    });
  }

  const payslipResult = await pool.query(
    `SELECT
       p.id,
       pr.id AS run_id,
       to_char(pr.period_start, 'YYYY-MM-DD') AS period_start,
       to_char(pr.period_end, 'YYYY-MM-DD') AS period_end,
       to_char(pr.pay_date, 'YYYY-MM-DD') AS pay_date,
       p.gross_pay,
       p.total_deductions,
       p.net_pay
     FROM payslip p
     INNER JOIN payroll_run pr
       ON p.payroll_run_id = pr.id
     WHERE p.employee_id = $1
       AND pr.status = 'completed'
     ORDER BY pr.period_start DESC`,
    [employeeId],
  );

  const payslips = payslipResult.rows.map((row) => ({
    id: row.id,
    runId: row.run_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    payDate: row.pay_date,
    grossPay: Number(row.gross_pay),
    totalDeductions: Number(row.total_deductions),
    netPay: Number(row.net_pay),
  }));

  return res.status(200).json({
    payslips,
  });
};
