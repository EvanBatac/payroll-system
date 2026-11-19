import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
  createLeaveRequest,
  getLeaveRequests,
  reviewLeaveRequest,
} from "../controllers/leaveRequestController.js";

const router = express.Router();

router.post("/", authenticate, createLeaveRequest);
router.get("/", authenticate, getLeaveRequests);
router.patch(
  "/:id/review",
  authenticate,
  authorize("hr", "admin"),
  reviewLeaveRequest,
);
export default router;
