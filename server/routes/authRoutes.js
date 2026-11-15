import express from "express";

const router = express.Router();

router.post("/login", (req, res) => {
  res.json({
    message: "login route works",
    email: req.body.email,
  });
});
export default router;
