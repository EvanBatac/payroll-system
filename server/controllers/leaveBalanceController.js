import pool from "../config/db.js";
import { getEmployeeIdByUserId } from "../helpers/employeeHelper.js";

export const getMyLeaveBalances = async (req, res) => {
  let { year } = req.query;

  if (year === undefined) {
    year = new Date()
      .toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
      .slice(0, 4);
  }

  if (!/^\d{4}$/.test(year)) {
    return res.status(400).json({
      message: "year must be YYYY",
    });
  }

  year = Number(year);

  const employeeId = await getEmployeeIdByUserId(req.user.id);

  if (!employeeId) {
    return res.status(404).json({
      message: "Employee record not found",
    });
  }

  // Query 1: Create missing leave balances
  await pool.query(
    `INSERT INTO leave_balance (
       employee_id,
       leave_type_id,
       year,
       allocated_days
     )
     SELECT $1, id, $2::smallint, default_days
     FROM leave_type
     ON CONFLICT (employee_id, leave_type_id, year)
     DO NOTHING`,
    [employeeId, year],
  );

  // Query 2: Retrieve leave balances
  const balanceResult = await pool.query(
    `SELECT lb.id,
            lt.id AS leave_type_id,
            lt.name AS leave_type,
            lt.is_paid,
            lb.year,
            lb.allocated_days,
            lb.used_days,
            (lb.allocated_days - lb.used_days) AS remaining_days
     FROM leave_balance lb
     INNER JOIN leave_type lt
        ON lb.leave_type_id = lt.id
     WHERE lb.employee_id = $1
       AND lb.year = $2
     ORDER BY lt.name`,
    [employeeId, year],
  );

  return res.status(200).json({
    balances: balanceResult.rows,
  });
};
