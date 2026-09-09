const express = require("express");

const {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getBudgets);

router.get("/:id", protect, getBudgetById);

router.post(
  "/",
  protect,
  authorizeRoles("Admin", "Finance Officer"),
  createBudget
);

router.put(
  "/:id",
  protect,
  authorizeRoles("Admin", "Finance Officer"),
  updateBudget
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  deleteBudget
);

module.exports = router;