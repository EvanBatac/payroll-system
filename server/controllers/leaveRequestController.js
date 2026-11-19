import pool from "../config/db.js";
import { countWorkDays } from "../utils/workDays.js";

// true only for real calendar dates like "2026-12-07" (rejects "2026-02-30")
const isRealDate = (text) => {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  const parsed = new Date(`${text}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === text
  );
};

export const createLeaveRequest = async (req, res) => {
  const { leave_type_id, start_date, end_date, reason = null } = req.body ?? {};

  // 1. Validate input
  if (!/^\d+$/.test(String(leave_type_id)) || Number(leave_type_id) < 1) {
    return res
      .status(400)
      .json({ message: "leave_type_id must be a whole number" });
  }

  if (!isRealDate(start_date) || !isRealDate(end_date)) {
    return res.status(400).json({
      message: "start_date and end_date must be real dates (YYYY-MM-DD)",
    });
  }

  if (end_date < start_date) {
    return res
      .status(400)
      .json({ message: "end_date cannot be before start_date" });
  }

  if (reason !== null && typeof reason !== "string") {
    return res.status(400).json({ message: "reason must be text" });
  }

  // 2. Find the employee and their schedule
  const employeeResult = await pool.query(
    `SELECT e.id AS employee_id, ws.work_days
     FROM employee e
     INNER JOIN work_schedule ws 
        ON e.work_schedule_id = ws.id
     INNER JOIN users u 
        ON u.employee_id = e.id
     WHERE u.id = $1`,
    [req.user.id],
  );

  const employee = employeeResult.rows[0];

  if (!employee) {
    return res.status(404).json({ message: "Employee record not found" });
  }

  // 3. Count only the working days
  const totalDays = countWorkDays(start_date, end_date, employee.work_days);

  if (totalDays === 0) {
    return res
      .status(400)
      .json({ message: "The selected dates contain no working days" });
  }

  // 4. Reject overlaps with pending or approved requests
  const overlapResult = await pool.query(
    `SELECT id FROM leave_request
     WHERE employee_id = $1
       AND status IN ('pending', 'approved')
       AND start_date <= $3::date
       AND end_date >= $2::date`,
    [employee.employee_id, start_date, end_date],
  );

  if (overlapResult.rowCount > 0) {
    return res
      .status(409)
      .json({ message: "You already have a leave request in that period" });
  }

  // 5. Insert
  try {
    const leaveRequestResult = await pool.query(
      `INSERT INTO leave_request
         (employee_id, leave_type_id, start_date, end_date, total_days, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, employee_id, leave_type_id,
                 to_char(start_date, 'YYYY-MM-DD') AS start_date,
                 to_char(end_date, 'YYYY-MM-DD') AS end_date,
                 total_days, reason, status`,
      [
        employee.employee_id,
        Number(leave_type_id),
        start_date,
        end_date,
        totalDays,
        reason,
      ],
    );

    return res.status(201).json({
      leaveRequest: leaveRequestResult.rows[0],
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        message: "Leave type does not exist",
      });
    }
    throw error;
  }
};

export const getLeaveRequests = async (req, res) => {
  const { status } = req.query;

  const conditions = [];
  const values = [];

  // Employees can only see their own leave requests
  if (req.user.role === "employee") {
    const employeeId = await getEmployeeIdByUserId(req.user.id);

    if (!employeeId) {
      return res.status(404).json({
        message: "Employee record not found",
      });
    }

    values.push(employeeId);
    conditions.push(`lr.employee_id = $${values.length}`);
  }

  // Optional status filter
  if (status !== undefined) {
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "status must be pending, approved, or rejected",
      });
    }

    values.push(status);
    conditions.push(`lr.status = $${values.length}::leave_status`);
  }

  // Build WHERE clause
  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Retrieve leave requests
  const leaveRequestResult = await pool.query(
    `SELECT lr.id,
            lr.employee_id,
            e.first_name,
            e.last_name,
            lt.name AS leave_type,
            to_char(lr.start_date, 'YYYY-MM-DD') AS start_date,
            to_char(lr.end_date, 'YYYY-MM-DD') AS end_date,
            lr.total_days,
            lr.reason,
            lr.status,
            lr.created_at
     FROM leave_request lr
     INNER JOIN employee e
        ON lr.employee_id = e.id
     INNER JOIN leave_type lt
        ON lr.leave_type_id = lt.id
     ${where}
     ORDER BY lr.created_at DESC`,
    values,
  );

  return res.status(200).json({
    leaveRequests: leaveRequestResult.rows,
  });
};