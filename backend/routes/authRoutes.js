const express = require("express");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    message: "Authenticated user profile",
    user: req.user,
  });
});

router.get(
  "/admin-test",
  protect,
  authorizeRoles("Admin"),
  (req, res) => {
    res.status(200).json({
      message: "Admin access granted",
      user: req.user,
    });
  }
);

module.exports = router;