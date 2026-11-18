import pool from "../config/db.js";

export const getLeaveTypes = async (req, res) => {
  const leaveTypeResult = await pool.query(
    `SELECT id, name, description, 
     default_days, is_paid
     FROM leave_type
     ORDER BY name`,
  );

  return res.status(200).json({
    leaveTypes: leaveTypeResult.rows,
  });
};
