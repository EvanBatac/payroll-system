import express from "express";
import authenticate from "../middleware/authenticate.js";
import { getMyLeaveBalances } from "../controllers/leaveBalanceController.js";

const router = express.Router();

router.get("/me", authenticate, getMyLeaveBalances);

export default router;
