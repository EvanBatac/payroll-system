import { PAYROLL_RATES } from "../config/payrollRates.js";
import { calculateMonthlyDeductions, round2 } from "./deductions.js";

export const computePayslip = ({
  baseSalary,
  salaryType,
  scheduledDays,
  absentDays,
  unpaidLeaveDays,
  lateMinutes,
  half,
}) => {
  if (half !== "first" && half !== "second") {
    throw new Error("half must be either 'first' or 'second'");
  }

  const dailyRate =
    salaryType === "monthly" 
      ? baseSalary / PAYROLL_RATES.schedule.workingDaysPerMonth
      : baseSalary;

  const grossPay = round2(
    salaryType === "monthly" ? baseSalary / 2 : dailyRate * scheduledDays,
  );

  const absentDeduction = round2(dailyRate * (absentDays + unpaidLeaveDays));

  const lateDeduction = round2(
    (lateMinutes * dailyRate) / (PAYROLL_RATES.schedule.hoursPerDay * 60),
  );

  const monthlySalary =
    salaryType === "monthly"
      ? baseSalary
      : dailyRate * PAYROLL_RATES.schedule.workingDaysPerMonth;

  const monthlyDeductions = calculateMonthlyDeductions(monthlySalary);

  const splitAmount = (amount) => {
    const firstHalf = round2(amount / 2);

    return half === "first" ? firstHalf : round2(amount - firstHalf);
  };

  const deductions = [
    { type: "sss", amount: splitAmount(monthlyDeductions.sss) },
    {
      type: "philhealth",
      amount: splitAmount(monthlyDeductions.philhealth),
    },
    { type: "pagibig", amount: splitAmount(monthlyDeductions.pagibig) },
    {
      type: "withholding_tax",
      amount: splitAmount(monthlyDeductions.withholdingTax),
    },
    { type: "late", amount: lateDeduction },
    { type: "absent", amount: absentDeduction },
  ].filter((deduction) => deduction.amount > 0);

  const totalDeductions = round2(
    deductions.reduce((total, deduction) => total + deduction.amount, 0),
  );

  const netPay = round2(grossPay - totalDeductions);

  return {
    grossPay,
    deductions,
    totalDeductions,
    netPay,
  };
};
