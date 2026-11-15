import pool from "../config/db.js";

export const getDepartments = async (req, res) => {
  const departmentResult = await pool.query(
    "SELECT id, name, description FROM department ORDER BY name",
  );

  res.status(200).json({
    departments: departmentResult.rows,
  });
};

export const createDepartment = async (req, res) => {
  const { name, description = null } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Name must be a string",
    });
  }
  if (!name) {
    return res.status(400).json({
      message: "Department name is required",
    });
  }

  try {
    const departmentResult = await pool.query(
      `INSERT INTO department (name, description) VALUES ( $1, $2 ) RETURNING id, name, description`,
      [name.trim(), description],
    );

    return res.status(201).json({
      department: departmentResult.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Department already exists" });
    }
    throw error;
  }
};
