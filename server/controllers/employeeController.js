import pool from "../config/db.js";

export const getEmployees = async (req, res) => {
  const employeeResult = await pool.query(
    `SELECT e.id,
            e.employee_number,
            e.first_name,
            e.last_name,
            e.email,
            e.position,
            to_char(e.hire_date, 'YYYY-MM-DD') AS hire_date,
            e.employment_status,
            d.name AS department_name,
            ws.name AS schedule_name 
            FROM employee e
            INNER JOIN department d
                ON e.department_id = d.id
            INNER JOIN work_schedule ws
                ON e.work_schedule_id = ws.id
            ORDER BY e.last_name, e.first_name`);
  return res.status(200).json({
    employees: employeeResult.rows,
  });
};
