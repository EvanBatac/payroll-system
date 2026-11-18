import pool from "../config/db.js";

export const getWorkSchedules = async (req, res) => {
  const scheduleResult = await pool.query(
    `SELECT id, name, work_days, 
            start_time, end_time,
            grace_period_minutes
            FROM work_schedule
            ORDER BY name`,
  );

  return res.status(200).json({
    workSchedules: scheduleResult.rows,
  });
};
