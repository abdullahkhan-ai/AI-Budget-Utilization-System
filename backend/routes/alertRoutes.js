const express = require("express");

const {
  scanAllBudgets,
  getAlerts,
  resolveAlert,
  deleteAlert,
} = require("../controllers/alertController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/scan",
  protect,
  authorizeRoles("Admin", "Finance Officer"),
  scanAllBudgets
);

router.get(
  "/",
  protect,
  getAlerts
);

router.put(
  "/:id/resolve",
  protect,
  authorizeRoles(
    "Admin",
    "Finance Officer",
    "Department Head"
  ),
  resolveAlert
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  deleteAlert
);

module.exports = router;