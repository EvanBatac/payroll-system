import express from "express";
import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";
import { createUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/", authenticate, authorize("hr", "admin"), createUser);

export default router;
