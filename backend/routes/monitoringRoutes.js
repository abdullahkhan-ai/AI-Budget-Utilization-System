const express = require("express");

const {
  calculateBudgetUtilization,
  getBudgetMonitoring,
} = require("../controllers/monitoringController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/budget/:id",
  protect,
  calculateBudgetUtilization
);

router.get(
  "/",
  protect,
  getBudgetMonitoring
);

module.exports = router;