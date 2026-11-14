import pool from "../config/db.js";

async function seed() {
  try {
    const departmentResult = await pool.query(
      "INSERT INTO department (name, description) VALUES ($1, $2) RETURNING id",
      ["Administration", "Handles HR and company administration"],
    );

    const scheduleResult = await pool.query(
      "INSERT INTO work_schedule (name, work_days, start_time, end_time, grace_period_minutes) VALUES ( $1, $2, $3, $4, $5) RETURNING id",
      [
        "Regular Day Shift",
        JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
        "08:00",
        "17:00",
        15,
      ],
    );

    console.log("Department created with id:", departmentResult.rows[0].id);
    console.log("Schedule created with id:", scheduleResult.rows[0].id);
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await pool.end();
  }
}

seed();
