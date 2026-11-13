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

Stores employee clock-in and clock-out records.

## 5. LeaveRequest

Stores leave applications submitted by employees, including their approval status.

## 6. LeaveType

Stores the different types of leave available to employees, such as vacation leave and sick leave.

## 7. LeaveBalance

Tracks how many leave days an employee has available and how many they have used.

## 8. PayrollRun

Stores each payroll processing period and its overall processing status.

## 9. Payslip

Stores an employee's payroll breakdown, including earnings, deductions, and net salary.

## 10. PayrollDeduction

Stores deductions applied during payroll, including SSS, PhilHealth, Pag-IBIG, and withholding tax.

## 11. WorkSchedule

Stores employee work schedules, including expected working hours and workdays.

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
