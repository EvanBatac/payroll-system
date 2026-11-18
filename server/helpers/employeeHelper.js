import pool from "../config/db.js";

export const getEmployeeIdByUserId = async (userId) => {
  const employeeResult = await pool.query(
    `SELECT e.id AS employee_id
     FROM employee e
     INNER JOIN users u
        ON u.employee_id = e.id
     WHERE u.id = $1`,
    [userId],
  );

  return employeeResult.rows[0]?.employee_id ?? null;
};
