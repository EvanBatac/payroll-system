export const PAYROLL_RATES = {
  sss: { employeeRate: 0.05, mscMin: 5000, mscMax: 35000, mscStep: 500 },
  philhealth: { rate: 0.05, floor: 10000, ceiling: 100000 },
  pagibig: {
    fundSalaryCap: 10000,
    lowRate: 0.01,
    lowRateMaxSalary: 1500,
    normalRate: 0.02,
  },
  // tax = base + rate * (taxable - over), using the last bracket where taxable >= over
  taxBrackets: [
    { over: 0, base: 0, rate: 0 },
    { over: 20833, base: 0, rate: 0.15 },
    { over: 33333, base: 1875, rate: 0.2 },
    { over: 66667, base: 8541.8, rate: 0.25 },
    { over: 166667, base: 33541.8, rate: 0.3 },
    { over: 666667, base: 183541.8, rate: 0.35 },
  ],
};