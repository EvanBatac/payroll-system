import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
  getEmployees,
  createEmployee,
} from "../controllers/employeeController.js";
const router = express.Router();

router.get("/", authenticate, authorize("hr", "admin"), getEmployees);
router.post("/", authenticate, authorize("hr", "admin"), createEmployee);
export default router;
