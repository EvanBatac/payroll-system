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
            ORDER BY e.last_name, e.first_name`,
  );
  return res.status(200).json({
    employees: employeeResult.rows,
  });
};

const isPositiveInt = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

export const createEmployee = async (req, res) => {
  const body = req.body ?? {};

  // 1. Required text fields (field name -> max length from the schema)
  const requiredText = {
    employee_number: 50,
    first_name: 100,
    last_name: 100,
    email: 255,
    phone: 20,
    position: 100,
  };

  for (const [field, maxLength] of Object.entries(requiredText)) {
    const value = body[field];
    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({ message: `${field} is required` });
    }
    if (value.trim().length > maxLength) {
      return res
        .status(400)
        .json({ message: `${field} must be at most ${maxLength} characters` });
    }
  }

  // 2. Optional government IDs (empty or missing becomes null)
  const optionalIds = {};
  for (const field of [
    "sss_number",
    "philhealth_number",
    "pagibig_number",
    "tin",
  ]) {
    const value = body[field];
    if (value === undefined || value === null) {
      optionalIds[field] = null;
      continue;
    }
    if (typeof value !== "string" || value.trim().length > 30) {
      return res
        .status(400)
        .json({ message: `${field} must be text up to 30 characters` });
    }
    optionalIds[field] = value.trim() === "" ? null : value.trim();
  }

  // 3. Other fields
  const {
    hire_date,
    base_salary,
    salary_type,
    department_id,
    work_schedule_id,
  } = body;

  if (typeof hire_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(hire_date)) {
    return res.status(400).json({ message: "hire_date must be YYYY-MM-DD" });
  }

  const salary = Number(base_salary);
  if (!Number.isFinite(salary) || salary <= 0 || salary >= 100000000) {
    return res
      .status(400)
      .json({ message: "base_salary must be a number greater than 0" });
  }

  if (!["monthly", "daily"].includes(salary_type)) {
    return res
      .status(400)
      .json({ message: "salary_type must be monthly or daily" });
  }

  if (!isPositiveInt(department_id) || !isPositiveInt(work_schedule_id)) {
    return res.status(400).json({
      message: "department_id and work_schedule_id must be whole numbers",
    });
  }

  // 4. Insert
  try {
    const employeeResult = await pool.query(
      `INSERT INTO employee
         (employee_number, first_name, last_name, email, phone, position,
          hire_date, base_salary, salary_type,
          sss_number, philhealth_number, pagibig_number, tin,
          department_id, work_schedule_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, employee_number, first_name, last_name, email, phone,
                 position, to_char(hire_date, 'YYYY-MM-DD') AS hire_date,
                 base_salary, salary_type, employment_status,
                 department_id, work_schedule_id`,
      [
        body.employee_number.trim(),
        body.first_name.trim(),
        body.last_name.trim(),
        body.email.trim().toLowerCase(),
        body.phone.trim(),
        body.position.trim(),
        hire_date,
        salary,
        salary_type,
        optionalIds.sss_number,
        optionalIds.philhealth_number,
        optionalIds.pagibig_number,
        optionalIds.tin,
        Number(department_id),
        Number(work_schedule_id),
      ],
    );

    return res.status(201).json({ employee: employeeResult.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      if (error.constraint === "employee_email_key") {
        return res.status(409).json({ message: "Email already exists" });
      }
      if (error.constraint === "employee_employee_number_key") {
        return res
          .status(409)
          .json({ message: "Employee number already exists" });
      }
      return res.status(409).json({
        message: "A government ID number is already used by another employee",
      });
    }
    if (error.code === "23503") {
      return res.status(400).json({
        message: "Selected department or work schedule does not exist",
      });
    }
    if (error.code === "22007" || error.code === "22008") {
      return res.status(400).json({ message: "hire_date is not a valid date" });
    }
    throw error;
  }
};

export const getEmployeeById = async (req, res) => {
  const id = req.params.id;

  if (!/^\d+$/.test(String(id)) || Number(id) < 1) {
    return res.status(400).json({ message: "Invalid employee id" });
  }
  const employeeResult = await pool.query(
    `SELECT e.id,
            e.employee_number,
            e.first_name,
            e.last_name,
            e.email,
            e.position,
            to_char(e.hire_date, 'YYYY-MM-DD') AS hire_date,
            e.employment_status,
            e.phone, 
            e.base_salary,
            e.salary_type, 
            e.sss_number, 
            e.philhealth_number, 
            e.pagibig_number, 
            e.tin, e.department_id,
            e.work_schedule_id,
            d.name AS department_name,
            ws.name AS schedule_name 
            FROM employee e
            INNER JOIN department d
                ON e.department_id = d.id
            INNER JOIN work_schedule ws
                ON e.work_schedule_id = ws.id
            WHERE e.id = $1`,
    [id],
  );

  const employee = employeeResult.rows[0];

  if (!employee) {
    return res.status(404).json({
      message: "Employee not found",
    });
  }

  return res.status(200).json({
    employee,
  });
};
