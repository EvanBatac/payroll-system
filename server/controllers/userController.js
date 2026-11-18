import bcrypt from "bcrypt";
import pool from "../config/db.js";

export const createUser = async (req, res) => {
  const { employee_id, password, role } = req.body ?? {};

  if (!/^\d+$/.test(String(employee_id)) || Number(employee_id) < 1) {
    return res.status(400).json({ message: "employee_id must be a whole number" });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }

  if (!["employee", "hr", "admin"].includes(role)) {
    return res.status(400).json({ message: "Role must be employee, hr, or admin" });
  }

  // Only an admin can create hr or admin accounts
  if (role !== "employee" && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Only an admin can create hr or admin accounts" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const userResult = await pool.query(
      `INSERT INTO users (employee_id, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, employee_id, role, is_active`,
      [Number(employee_id), passwordHash, role],
    );

    return res.status(201).json({ user: userResult.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "This employee already has an account" });
    }
    if (error.code === "23503") {
      return res.status(400).json({ message: "Employee does not exist" });
    }
    throw error;
  }
};