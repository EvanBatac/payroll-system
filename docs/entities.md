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

Notes:
- Login uses `Employee.email` via `employee_id`. The email is stored only in the Employee table to avoid duplication.

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

- id (INT, PK)
- period_start (DATE)
- period_end (DATE)
- pay_date (DATE)
- status (ENUM: draft, processing, completed, failed)
- processed_by (INT, FK → User.id, nullable)
- processed_at (DATETIME, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- Unique: (period_start, period_end)

Rules:

- Payroll is semi-monthly: 1st–15th and 16th–last day of the month.
- SSS, PhilHealth, and Pag-IBIG are computed monthly and split across both runs. The 1st run takes half (rounded); the 2nd run takes the remainder (monthly total minus what was already deducted), so the total always matches.
- Completed payroll runs and their payslips are locked and cannot be edited.
- Corrections to completed payroll are handled through a separate adjustment process (see Future Improvements).

## 9. Payslip

- id (INT, PK)
- payroll_run_id (INT, FK → PayrollRun.id)
- employee_id (INT, FK → Employee.id)
- base_salary (DECIMAL(10,2))
- salary_type (ENUM: monthly, daily)
- days_worked (DECIMAL(5,2))
- days_absent (DECIMAL(5,2))
- paid_leave_days (DECIMAL(5,2))
- unpaid_leave_days (DECIMAL(5,2))
- late_minutes (INT)
- gross_pay (DECIMAL(10,2))
- total_deductions (DECIMAL(10,2))
- net_pay (DECIMAL(10,2))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- Unique: (payroll_run_id, employee_id)

Notes:

- Snapshot: salary, attendance, and leave values are copied at processing time, so later changes never alter past payslips.
- Money totals are stored, not calculated: payslips are locked records, and recalculating them later could give different results if rules change.
- Absences are deducted when calculating gross_pay. The absent deduction must not be applied again through PayrollDeduction. Late deductions are applied separately after gross_pay.

## 10. PayrollDeduction

- id (INT, PK)
- payslip_id (INT, FK → Payslip.id)
- deduction_type (ENUM: sss, philhealth, pagibig, withholding_tax, late, absent)
- amount (DECIMAL(10,2))
- created_at (TIMESTAMP)
- Unique: (payslip_id, deduction_type)

Notes:
- One row per deduction type per payslip, so each payslip's breakdown can be shown line by line.
- Sum of amounts must equal Payslip.total_deductions.

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

### Phase 1: Core Employee Management and Scheduling
- Department
- WorkSchedule
- Employee
- User
- Attendance

### Phase 2: Leave Management
- LeaveType
- LeaveRequest
- LeaveBalance

### Phase 3: Payroll
- PayrollRun
- Payslip
- PayrollDeduction

## Future Improvements

- PayrollAdjustment entity: corrections to completed payrolls, applied as a line in the next run.
- EmployeeSchedule link table: keep schedule history, since past periods currently use the current schedule.
- Overtime, holiday pay, allowances, and 13th month pay.