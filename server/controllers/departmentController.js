import pool from "../config/db.js";

export const getDepartments = async (req, res) => {
  const departmentResult = await pool.query(
    "SELECT id, name, description FROM department ORDER BY name",
  );

  res.status(200).json({
    departments: departmentResult.rows,
  });
};
