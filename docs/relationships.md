# HRIS Relationships

## 1. Department and Employee
- Department 1:N Employee (Employee.department_id)

## 2. WorkSchedule and Employee
- WorkSchedule 1:N Employee (Employee.work_schedule_id)

## 3. Employee and User
- Employee 1:1 User (User.employee_id)

## 4. Employee and Attendance
- Employee 1:N Attendance (Attendance.employee_id)

## 5. Employee and LeaveRequest
- Employee 1:N LeaveRequest (LeaveRequest.employee_id)

## 6. LeaveType and LeaveRequest
- LeaveType 1:N LeaveRequest (LeaveRequest.leave_type_id)

## 7. User and LeaveRequest
- User 1:N LeaveRequest (LeaveRequest.reviewed_by)

## 8. Employee and LeaveBalance
- Employee 1:N LeaveBalance (LeaveBalance.employee_id)

## 9. LeaveType and LeaveBalance
- LeaveType 1:N LeaveBalance (LeaveBalance.leave_type_id)

## 10. User and PayrollRun
- User 1:N PayrollRun (PayrollRun.processed_by)

## 11. PayrollRun and Payslip
- PayrollRun 1:N Payslip (Payslip.payroll_run_id)

## 12. Employee and Payslip
- Employee 1:N Payslip (Payslip.employee_id)

## 13. Payslip and PayrollDeduction
- Payslip 1:N PayrollDeduction (PayrollDeduction.payslip_id)

## Many-to-Many Relationships

There are two conceptual many-to-many relationships represented through associative entities:

- Employee N:N LeaveType through LeaveBalance. Each employee can have multiple leave types, and each leave type can belong to multiple employees. LeaveBalance connects them and tracks balances per year.
- PayrollRun N:N Employee through Payslip. Each payroll run contains payslips for multiple employees, and each employee can have payslips across multiple payroll runs.

There are no direct N:N foreign-key relationships. Both are implemented using associative entities.