const express = require("express");

const {
  getAuditLogs,
} = require("../controllers/auditLogController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("Admin"),
  getAuditLogs
);

module.exports = router;