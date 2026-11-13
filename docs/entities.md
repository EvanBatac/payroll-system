# HRIS Entities

## 1. Employee

- id (INT, PK)
- employee_number (VARCHAR(50), unique)
- first_name (VARCHAR(100))
- last_name (VARCHAR(100))
- email (VARCHAR(255), unique)
- phone (VARCHAR(20))
- position (VARCHAR(100))
- hire_date (DATE)
- employment_status (ENUM: active, inactive, resigned)
- base_salary (DECIMAL(10,2))
- salary_type (ENUM: monthly, daily)
- sss_number (VARCHAR(30), nullable, unique)
- philhealth_number (VARCHAR(30), nullable, unique)
- pagibig_number (VARCHAR(30), nullable, unique)
- tin (VARCHAR(30), nullable, unique)
- department_id (INT, FK → Department.id)
- work_schedule_id (INT, FK → WorkSchedule.id, NOT NULL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 2. Department

- id (INT, PK)
- name (VARCHAR(100), unique)
- description (TEXT, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 3. User

- id (INT, PK)
- employee_id (INT, FK → Employee.id, unique)
- password_hash (VARCHAR(255))
- role (ENUM: employee, hr, admin)
- is_active (BOOLEAN, default: true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 4. Attendance

- id (INT, PK)
- employee_id (INT, FK → Employee.id)
- attendance_date (DATE)
- clock_in (DATETIME, nullable)
- clock_out (DATETIME, nullable)
- status (ENUM: present, late, absent, half_day)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- Unique: (employee_id, attendance_date)

## 5. LeaveType

- id (INT, PK)
- name (VARCHAR(100), unique)
- description (TEXT, nullable)
- default_days (DECIMAL(5,2))
- is_paid (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 6. LeaveRequest

- id (INT, PK)
- employee_id (INT, FK → Employee.id)
- leave_type_id (INT, FK → LeaveType.id)
- start_date (DATE)
- end_date (DATE)
- total_days (DECIMAL(5,2), calculated on submission)
- reason (TEXT)
- status (ENUM: pending, approved, rejected)
- reviewed_by (INT, FK → User.id, nullable)
- reviewed_at (DATETIME, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 7. LeaveBalance

- id (INT, PK)
- employee_id (INT, FK → Employee.id)
- leave_type_id (INT, FK → LeaveType.id)
- year (YEAR)
- allocated_days (DECIMAL(5,2))
- used_days (DECIMAL(5,2), default: 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- Unique: (employee_id, leave_type_id, year)

## 8. PayrollRun

Stores each payroll processing period and its overall processing status.

## 9. Payslip

Stores an employee's payroll breakdown, including earnings, deductions, and net salary.

## 10. PayrollDeduction

Stores deductions applied during payroll, including SSS, PhilHealth, Pag-IBIG, and withholding tax.

## 11. WorkSchedule

- id (INT, PK)
- name (VARCHAR(100), unique)
- work_days (JSON, example: ["Mon", "Tue", "Wed", "Thu", "Fri"])
- start_time (TIME)
- end_time (TIME)
- grace_period_minutes (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

---

## Build Order

### Phase 1: Core Employee Management

- Employee
- Department
- User
- Attendance

### Phase 2: Leave and Scheduling

- LeaveType
- LeaveRequest
- LeaveBalance
- WorkSchedule

### Phase 3: Payroll

- PayrollRun
- Payslip
- PayrollDeduction
