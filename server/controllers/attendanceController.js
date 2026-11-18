import pool from "../config/db.js";

export const clockIn = async (req, res) => {
  const scheduleResult = await pool.query(
    `SELECT e.id AS employee_id, 
            ws.start_time, 
            ws.grace_period_minutes
    FROM employee e
    INNER JOIN work_schedule ws
        ON e.work_schedule_id = ws.id
    INNER JOIN users u
        ON u.employee_id = e.id
    WHERE u.id = $1`,
    [req.user.id],
  );

  const schedule = scheduleResult.rows[0];

  if (!schedule) {
    return res.status(404).json({
      message: "Employee record not found",
    });
  }

  try {
    const attendanceResult = await pool.query(
      `INSERT INTO attendance (
      employee_id,
      attendance_date,
      clock_in,
      status
  )
  VALUES (
    $1,
    (NOW() AT TIME ZONE 'Asia/Manila')::date,
    NOW(),
    CASE
        WHEN (NOW() AT TIME ZONE 'Asia/Manila')::time
             > $2::time + ($3 * INTERVAL '1 minute')
        THEN 'late'
        ELSE 'present'
    END::attendance_status
  )  
  RETURNING id,
            employee_id,
            to_char(attendance_date, 'YYYY-MM-DD') AS attendance_date,
            clock_in,
            status`,
      [
        schedule.employee_id,
        schedule.start_time,
        schedule.grace_period_minutes,
      ],
    );

    return res.status(201).json({
      attendance: attendanceResult.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "You already clocked in today",
      });
    }
    throw error;
  }
};
