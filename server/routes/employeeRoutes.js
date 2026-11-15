import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import { getEmployees } from "../controllers/employeeController.js";
const router = express.Router();

router.get("/", authenticate, authorize("hr", "admin"), getEmployees);
export default router;
