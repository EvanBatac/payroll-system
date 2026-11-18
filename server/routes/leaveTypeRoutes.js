import express from "express";
import authenticate from "../middleware/authenticate.js";
import { getLeaveTypes } from "../controllers/leaveTypeController.js";

const router = express.Router();

router.get("/", authenticate, getLeaveTypes);

export default router;
