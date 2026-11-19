import express from "express";
import authenticate from "../middleware/authenticate.js";
import { createLeaveRequest } from "../controllers/leaveRequestController.js";

const router = express.Router();

router.post("/", authenticate, createLeaveRequest);
export default router;
