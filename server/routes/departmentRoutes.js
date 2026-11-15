import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

router.get("/", authenticate, getDepartments);
router.post("/", authenticate, authorize("hr", "admin"), createDepartment);
router.put("/:id", authenticate, authorize("hr", "admin"), updateDepartment);
router.delete("/:id", authenticate, authorize("admin"), deleteDepartment);

export default router;
