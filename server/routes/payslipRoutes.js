import express from "express";
import authenticate from "../middleware/authenticate.js";
import { getPayslipById } from "../controllers/payslipController.js";

const router = express.Router();

router.get("/:id", authenticate, getPayslipById);

export default router;