import express from "express";
import authenticate from "../middleware/authenticate.js";
import { getDepartments } from "../controllers/departmentController.js";

const router = express.Router();

router.get("/", authenticate, getDepartments);

export default router;
