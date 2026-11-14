import pool from "../config/db.js";

async function seed() {
  try {
    const result = await pool.query(
      "INSERT INTO department (name, description) VALUES ($1, $2) RETURNING id",
      ["Administration", "Handles HR and company administration"],
    );
    console.log("Department created with id:", result.rows[0].id);
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await pool.end();
  }
}

seed();
