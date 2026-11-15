import jwt from "jsonwebtoken";
import "dotenv/config";
import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({
      message: "Email and password must be strings",
    });
  }
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const userResult = await pool.query(
    `SELECT users.id, 
              users.password_hash, 
              users.role, 
              users.is_active,
              employee.first_name
              FROM users 
              INNER JOIN employee
              ON users.employee_id = employee.id
              WHERE LOWER(employee.email) = $1`,
    [normalizedEmail],
  );

  const user = userResult.rows[0];

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  if (!user.is_active) {
    return res.status(403).json({
      message: "Account is disabled",
    });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );

  return res.status(200).json({
    token,
    user: { id: user.id, role: user.role, firstName: user.first_name },
  });
};

export const getMe = async (req, res) => {
  const result = await pool.query(
    "SELECT id, role FROM users WHERE id = $1 AND is_active = true",
    [req.user.id],
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      role: user.role,
    },
  });
};
