import { PAYROLL_RATES } from "../config/payrollRates.js";

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function calculateSss(monthlySalary) {
  const { employeeRate, mscMin, mscMax, mscStep } = PAYROLL_RATES.sss;

  // round the salary to the nearest step (halves round up), then keep it in range
  const rounded = Math.floor((monthlySalary + mscStep / 2) / mscStep) * mscStep;
  const msc = clamp(rounded, mscMin, mscMax);

  return round2(msc * employeeRate);
}

export function calculatePhilhealth(monthlySalary) {
  const { rate, floor, ceiling } = PAYROLL_RATES.philhealth;

  const base = clamp(monthlySalary, floor, ceiling);

  // the total premium is split 50/50, so the employee pays half
  return round2((base * rate) / 2);
}

export function calculatePagibig(monthlySalary) {
  const { fundSalaryCap, lowRate, lowRateMaxSalary, normalRate } =
    PAYROLL_RATES.pagibig;

  const fundSalary = Math.min(monthlySalary, fundSalaryCap);
  const employeeRate =
    monthlySalary <= lowRateMaxSalary ? lowRate : normalRate;

  return round2(fundSalary * employeeRate);
}

export function calculateWithholdingTax(monthlyTaxable) {
  if (monthlyTaxable <= 0) {
    return 0;
  }

  // copy before reversing, because reverse() changes the original array
  const bracket = [...PAYROLL_RATES.taxBrackets]
    .reverse()
    .find((b) => monthlyTaxable >= b.over);

  return round2(bracket.base + bracket.rate * (monthlyTaxable - bracket.over));
}

export function calculateMonthlyDeductions(monthlySalary) {
  const sss = calculateSss(monthlySalary);
  const philhealth = calculatePhilhealth(monthlySalary);
  const pagibig = calculatePagibig(monthlySalary);

  const taxable = monthlySalary - (sss + philhealth + pagibig);
  const withholdingTax = calculateWithholdingTax(taxable);

  return {
    sss,
    philhealth,
    pagibig,
    withholdingTax,
    total: round2(sss + philhealth + pagibig + withholdingTax),
  };
}