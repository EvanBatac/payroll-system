import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import { createPayrollRun } from "../controllers/payrollRunController.js";

const router = express.Router();

router.post("/", authenticate, authorize("hr", "admin"), createPayrollRun);

export default router;
