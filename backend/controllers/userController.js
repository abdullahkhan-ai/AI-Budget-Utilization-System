const User = require("../models/User");
const Department = require("../models/Department");
const bcrypt = require("bcryptjs");
const { createAuditLog } = require("../services/auditLogService");

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("departmentId", "name code")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("departmentId", "name code");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      departmentId,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (departmentId) {
      const department = await Department.findById(departmentId);

      if (!department) {
        return res.status(404).json({
          message: "Department not found",
        });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Another user already uses this email",
        });
      }
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      user.email = email;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (departmentId !== undefined) {
      user.departmentId = departmentId || null;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("departmentId", "name code");

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE",
      entityType: "User",
      entityId: user._id,
      description: `Updated user ${user.email}`,
      metadata: {
        updatedUserId: user._id,
        role: user.role,
        departmentId: user.departmentId,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        message: "Admin cannot delete their own account",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await createAuditLog({
      userId: req.user._id,
      action: "DELETE",
      entityType: "User",
      entityId: user._id,
      description: `Deleted user ${user.email}`,
      metadata: {
        deletedUserId: user._id,
        role: user.role,
        departmentId: user.departmentId,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};