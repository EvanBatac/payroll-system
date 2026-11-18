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

export const clockOut = async (req, res) => {
  const employeeResult = await pool.query(
    `SELECT e.id AS employee_id
     FROM employee e
     INNER JOIN users u
        ON u.employee_id = e.id
     WHERE u.id = $1`,
    [req.user.id],
  );

  if (employeeResult.rowCount === 0) {
    return res.status(404).json({
      message: "Employee record not found",
    });
  }

  const employeeId = employeeResult.rows[0].employee_id;

  const attendanceResult = await pool.query(
    `UPDATE attendance
     SET clock_out = NOW(),
         updated_at = CURRENT_TIMESTAMP
     WHERE employee_id = $1
       AND attendance_date = (NOW() AT TIME ZONE 'Asia/Manila')::date
       AND clock_out IS NULL
     RETURNING id,
               employee_id,
               to_char(attendance_date, 'YYYY-MM-DD') AS attendance_date,
               clock_in,
               clock_out,
               status`,
    [employeeId],
  );

  if (attendanceResult.rowCount === 0) {
    const existingAttendance = await pool.query(
      `SELECT clock_out
       FROM attendance
       WHERE employee_id = $1
         AND attendance_date = (NOW() AT TIME ZONE 'Asia/Manila')::date`,
      [employeeId],
    );

    if (existingAttendance.rowCount === 0) {
      return res.status(400).json({
        message: "You have not clocked in today",
      });
    }

    return res.status(409).json({
      message: "You already clocked out today",
    });
  }

  return res.status(200).json({
    attendance: attendanceResult.rows[0],
  });
};

export const getMyAttendance = async (req, res) => {
  let { month } = req.query;

  const employeeResult = await pool.query(
    `SELECT e.id AS employee_id
     FROM employee e
     INNER JOIN users u
        ON u.employee_id = e.id
     WHERE u.id = $1`,
    [req.user.id],
  );

  if (employeeResult.rowCount === 0) {
    return res.status(404).json({
      message: "Employee record not found",
    });
  }
  const employeeId = employeeResult.rows[0].employee_id;

  if (month === undefined) {
    month = new Date()
      .toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })
      .slice(0, 7);
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ message: "month must be YYYY-MM" });
  }

  const attendanceResult = await pool.query(
    `SELECT id, 
            to_char(attendance_date, 'YYYY-MM-DD') AS attendance_date,
            clock_in, clock_out, status
     FROM attendance
     WHERE employee_id = $1
        AND attendance_date >= $2::date
        AND attendance_date < $2::date + INTERVAL '1 month'
    ORDER BY attendance_date`,
    [employeeId, `${month}-01`],
  );

  return res.status(200).json({
    attendance: attendanceResult.rows,
  });
};
