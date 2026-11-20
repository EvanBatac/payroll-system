import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
  createPayrollRun,
  previewPayrollRun,
  generatePayrollRun,
} from "../controllers/payrollRunController.js";

const router = express.Router();

router.post("/", authenticate, authorize("hr", "admin"), createPayrollRun);
router.get(
  "/:id/preview",
  authenticate,
  authorize("hr", "admin"),
  previewPayrollRun,
);
router.post(
  "/:id/generate",
  authenticate,
  authorize("hr", "admin"),
  generatePayrollRun,
);

export default router;
