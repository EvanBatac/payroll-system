import express from "express";
import cors from "cors";
import "dotenv/config";
import errorHandler from "./middleware/errorHandler.js";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workScheduleRoutes from "./routes/workScheduleRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveTypeRoutes from "./routes/leaveTypeRoutes.js";
import leaveBalanceRoutes from "./routes/leaveBalanceRoutes.js";
import leaveRequestRoutes from "./routes/leaveRequestRoutes.js";
import payrollRunRoutes from "./routes/payrollRunRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json());

const port = Number(process.env.PORT) || 3000;

app.get("/api/health", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({
    status: "ok",
    time: result.rows[0].now,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/work-schedules", workScheduleRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/leave-balances", leaveBalanceRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/payroll-runs", payrollRunRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
