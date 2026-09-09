const express = require("express");

const {
  getThresholdConfig,
  updateThresholdConfig,
} = require("../controllers/thresholdController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();


router.get(
  "/",
  protect,
  getThresholdConfig
);


router.put(
  "/",
  protect,
  authorizeRoles("Admin"),
  updateThresholdConfig
);


module.exports = router;