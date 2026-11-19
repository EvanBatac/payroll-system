import express from "express";
import authenticate from "../middleware/authenticate.js";
import {
  createLeaveRequest,
  getLeaveRequests,
} from "../controllers/leaveRequestController.js";

const router = express.Router();

router.post("/", authenticate, createLeaveRequest);
router.get("/", authenticate, getLeaveRequests);
export default router;
