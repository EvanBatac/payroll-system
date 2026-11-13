# HRIS Entities

## 1. Employee
Stores personal and employment information about each employee.

## 2. Department
Stores the different departments within the company.

## 3. User
Stores login credentials and authentication information for employees and administrators.

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