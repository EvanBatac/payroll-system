import express from "express";
import authenticate from "../middleware/authenticate.js";
import {
  getPayslipById,
  getMyPayslips,
} from "../controllers/payslipController.js";

const router = express.Router();

router.get("/me", authenticate, getMyPayslips);
router.get("/:id", authenticate, getPayslipById);

export default router;
