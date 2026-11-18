import express from "express";
import authenticate from "../middleware/authenticate.js";
import {
  clockIn,
  clockOut,
  getMyAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/clock-in", authenticate, clockIn);
router.post("/clock-out", authenticate, clockOut);
router.get("/me", authenticate, getMyAttendance);
export default router;
