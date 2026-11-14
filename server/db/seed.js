import bcrypt from "bcrypt";
import pool from "../config/db.js";

async function seed() {
  const client = await pool.connect();

  try {
    if (!process.env.ADMIN_PASSWORD) {
      throw new Error("ADMIN_PASSWORD is missing in .env");
    }

    const existing = await client.query(
      "SELECT id FROM employee WHERE employee_number = $1",
      ["EMP-001"],
    );
    if (existing.rows.length > 0) {
      console.log("Already seeded, nothing to do.");
      return;
    }

    await client.query("BEGIN");

    const departmentResult = await client.query(
      "INSERT INTO department (name, description) VALUES ($1, $2) RETURNING id",
      ["Administration", "Handles HR and company administration"],
    );
    const departmentId = departmentResult.rows[0].id;

    const scheduleResult = await client.query(
      "INSERT INTO work_schedule (name, work_days, start_time, end_time, grace_period_minutes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [
        "Regular Day Shift",
        JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri"]),
        "08:00",
        "17:00",
        15,
      ],
    );
    const scheduleId = scheduleResult.rows[0].id;

    const employeeResult = await client.query(
      `INSERT INTO employee
        (employee_number, first_name, last_name, email, phone, position,
         hire_date, base_salary, salary_type, department_id, work_schedule_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        "EMP-001",
        "System",
        "Admin",
        "admin@company.com",
        "09123456789",
        "HR Administrator",
        "2026-01-01",
        30000,
        "monthly",
        departmentId,
        scheduleId,
      ],
    );
    const employeeId = employeeResult.rows[0].id;

    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    await client.query(
      "INSERT INTO users (employee_id, password_hash, role) VALUES ($1, $2, $3)",
      [employeeId, passwordHash, "admin"],
    );

    await client.query("COMMIT");
    console.log("Seed complete. Admin login: admin@company.com");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed, nothing was saved:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();