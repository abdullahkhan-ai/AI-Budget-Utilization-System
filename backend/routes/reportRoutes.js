const express = require("express");

const {
  getReports,
} = require("../controllers/reportController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * Budget and expenditure reports
 *
 * GET /api/reports
 */
router.get(
  "/",
  protect,
  getReports
);

module.exports = router;