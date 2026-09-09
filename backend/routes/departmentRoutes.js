const express = require("express");

const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getDepartments);

router.get("/:id", protect, getDepartmentById);

router.post(
  "/",
  protect,
  authorizeRoles("Admin"),
  createDepartment
);

router.put(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  updateDepartment
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  deleteDepartment
);

module.exports = router;