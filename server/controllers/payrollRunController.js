import pool from "../config/db.js";
import { isRealDate } from "../utils/dates.js";
import { isValidSemiMonthlyPeriod } from "../utils/payrollPeriod.js";
import { buildPayslips } from "../services/payrollService.js";

export const createPayrollRun = async (req, res) => {
  const { period_start, period_end, pay_date } = req.body ?? {};

  if (
    !isRealDate(period_start) ||
    !isRealDate(period_end) ||
    !isRealDate(pay_date)
  ) {
    return res.status(400).json({
      message:
        "period_start, period_end, and pay_date must be real dates (YYYY-MM-DD)",
    });
  }

  if (!isValidSemiMonthlyPeriod(period_start, period_end)) {
    return res.status(400).json({
      message:
        "Period must be the 1st to 15th or the 16th to the end of one month",
    });
  }

  if (pay_date < period_end) {
    return res.status(400).json({
      message: "pay_date cannot be before period_end",
    });
  }

  try {
    const payrollRunResult = await pool.query(
      `INSERT INTO payroll_run (period_start, period_end, pay_date)
     VALUES ( $1, $2, $3 ) 
     RETURNING id, 
               to_char(period_start, 'YYYY-MM-DD') AS period_start,
               to_char(period_end, 'YYYY-MM-DD') AS period_end,
               to_char(pay_date, 'YYYY-MM-DD') AS pay_date,
               status, created_at`,
      [period_start, period_end, pay_date],
    );

    return res.status(201).json({
      payrollRun: payrollRunResult.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A payroll run for this period already exists",
      });
    }
    throw error;
  }
};

export const previewPayrollRun = async (req, res) => {
  const { id } = req.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({ message: "Invalid payroll run id" });
  }

  const runResult = await pool.query(
    `SELECT id, status,
            to_char(period_start, 'YYYY-MM-DD') AS period_start,
            to_char(period_end, 'YYYY-MM-DD') AS period_end
     FROM payroll_run
     WHERE id = $1`,
    [id],
  );

  const run = runResult.rows[0];

  if (!run) {
    return res.status(404).json({ message: "Payroll run not found" });
  }

  if (run.status !== "draft") {
    return res
      .status(409)
      .json({ message: "Only draft payroll runs can be previewed" });
  }

  const payslips = await buildPayslips(pool, {
    periodStart: run.period_start,
    periodEnd: run.period_end,
  });

  return res.status(200).json({
    payrollRun: {
      id: run.id,
      periodStart: run.period_start,
      periodEnd: run.period_end,
    },
    payslips,
  });
};
