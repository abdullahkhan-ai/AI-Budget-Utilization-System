const express = require("express");

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles("Admin"),
  getUsers
);

router.get(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  getUserById
);

router.put(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  updateUser
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  deleteUser
);

module.exports = router;