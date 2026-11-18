import express from "express";
import authenticate from "../middleware/authenticate.js";
import { clockIn } from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/clock-in", authenticate, clockIn);
export default router;
