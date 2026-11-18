import express from "express";
import authenticate from "../middleware/authenticate.js";
import { getWorkSchedules } from "../controllers/workScheduleController.js";

const router = express.Router();
router.get("/", authenticate, getWorkSchedules);

export default router;
