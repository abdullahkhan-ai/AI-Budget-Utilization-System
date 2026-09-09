const express = require("express");

const {
  getDashboardSummary,
} = require("../controllers/dashboardController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * Dashboard summary
 *
 * GET /api/dashboard
 */
router.get(
  "/",
  protect,
  getDashboardSummary
);

/*
 * Keep /summary available as well.
 *
 * GET /api/dashboard/summary
 */
router.get(
  "/summary",
  protect,
  getDashboardSummary
);

module.exports = router;