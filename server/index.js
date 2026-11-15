import express from "express";
import cors from "cors";
import "dotenv/config";
import errorHandler from "./middleware/errorHandler.js";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";

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

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
