import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
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
              WHERE employee.email = $1`,
      [email],
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

    return res.status(200).json({
      message: "password ok",
      firstName: user.first_name,
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
