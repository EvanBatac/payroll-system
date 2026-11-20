import pool from "../config/db.js";
import { isRealDate } from "../utils/dates.js";
import { isValidSemiMonthlyPeriod } from "../utils/payrollPeriod.js";
import { buildPayslips } from "../services/payrollService.js";
import { round2 } from "../utils/deductions.js";

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

export const generatePayrollRun = async (req, res) => {
  const { id } = req.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      message: "Invalid payroll run id",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const runResult = await client.query(
      `SELECT id, status,
          to_char(period_start, 'YYYY-MM-DD') AS period_start,
          to_char(period_end, 'YYYY-MM-DD') AS period_end
          FROM payroll_run
          WHERE id = $1
          FOR UPDATE`,
      [id],
    );

    const run = runResult.rows[0];

    if (!run) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Payroll run not found",
      });
    }

    if (run.status !== "draft") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Only draft payroll runs can be generated",
      });
    }

    await client.query(
      `DELETE FROM payroll_deduction
       WHERE payslip_id IN (
       SELECT id FROM payslip
       WHERE payroll_run_id = $1)`,
      [id],
    );

    await client.query(
      `DELETE FROM payslip
       WHERE payroll_run_id = $1`,
      [id],
    );

    const payslips = await buildPayslips(client, {
      periodStart: run.period_start,
      periodEnd: run.period_end,
    });

    for (const entry of payslips) {
      const payslipResult = await client.query(
        `INSERT INTO payslip (
       payroll_run_id,
       employee_id,
       base_salary,
       salary_type,
       days_worked,
       days_absent,
       paid_leave_days,
       unpaid_leave_days,
       late_minutes,
       gross_pay,
       total_deductions,
       net_pay
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
        [
          id,
          entry.employeeId,
          entry.baseSalary,
          entry.salaryType,
          entry.summary.daysWorked,
          entry.summary.absentDays,
          entry.summary.paidLeaveDays,
          entry.summary.unpaidLeaveDays,
          entry.summary.lateMinutes,
          entry.payslip.grossPay,
          entry.payslip.totalDeductions,
          entry.payslip.netPay,
        ],
      );

      const payslipId = payslipResult.rows[0].id;

      for (const deduction of entry.payslip.deductions) {
        await client.query(
          `INSERT INTO payroll_deduction (
           payslip_id,
           deduction_type,
           amount )
           VALUES ($1, $2, $3)`,
          [payslipId, deduction.type, deduction.amount],
        );
      }
    }

    const totalGross = round2(
      payslips.reduce((sum, entry) => sum + entry.payslip.grossPay, 0),
    );

    const totalDeductions = round2(
      payslips.reduce((sum, entry) => sum + entry.payslip.totalDeductions, 0),
    );

    const totalNet = round2(
      payslips.reduce((sum, entry) => sum + entry.payslip.netPay, 0),
    );

    await client.query("COMMIT");

    return res.status(200).json({
      payrollRun: {
        id: run.id,
      },
      payslipCount: payslips.length,
      totalGross,
      totalDeductions,
      totalNet,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const finalizePayrollRun = async (req, res) => {
  const { id } = req.params;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({
      message: "Invalid payroll run id",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Find and lock the payroll run
    const runResult = await client.query(
      `SELECT id, status
       FROM payroll_run
       WHERE id = $1
       FOR UPDATE`,
      [id],
    );

    const run = runResult.rows[0];

    if (!run) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Payroll run not found",
      });
    }

    // 2. Only draft runs can be finalized
    if (run.status !== "draft") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Only draft payroll runs can be finalized",
      });
    }

    // 3. Check whether payslips have been generated
    const countResult = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM payslip
       WHERE payroll_run_id = $1`,
      [id],
    );

    if (countResult.rows[0].total === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Generate the payroll run before finalizing",
      });
    }

    // 4. Mark the payroll run as completed
    const updateResult = await client.query(
      `UPDATE payroll_run
       SET status = 'completed',
           processed_by = $1,
           processed_at = NOW(),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING
         id,
         to_char(period_start, 'YYYY-MM-DD') AS period_start,
         to_char(period_end, 'YYYY-MM-DD') AS period_end,
         to_char(pay_date, 'YYYY-MM-DD') AS pay_date,
         status,
         processed_by,
         processed_at`,
      [req.user.id, id],
    );

    const payrollRun = updateResult.rows[0];

    // 5. Commit transaction
    await client.query("COMMIT");

    return res.status(200).json({
      payrollRun,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
