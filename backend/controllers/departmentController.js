const Department = require("../models/Department");
const { createAuditLog } = require("../services/auditLogService");

const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        message: "Department name and code are required",
      });
    }

    const existingDepartment = await Department.findOne({
      $or: [{ name }, { code }],
    });

    if (existingDepartment) {
      return res.status(400).json({
        message: "Department with this name or code already exists",
      });
    }

    const department = await Department.create({
      name,
      code,
      description,
    });

    await createAuditLog({
      userId: req.user._id,
      action: "CREATE",
      entityType: "Department",
      entityId: department._id,
      description: `Created department ${department.name}`,
      metadata: {
        departmentName: department.name,
        departmentCode: department.code,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create department",
      error: error.message,
    });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    res.status(200).json({
      departments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.status(200).json({
      department,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch department",
      error: error.message,
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        description,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE",
      entityType: "Department",
      entityId: department._id,
      description: `Updated department ${department.name}`,
      metadata: {
        departmentName: department.name,
        departmentCode: department.code,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update department",
      error: error.message,
    });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    await createAuditLog({
      userId: req.user._id,
      action: "DELETE",
      entityType: "Department",
      entityId: department._id,
      description: `Deleted department ${department.name}`,
      metadata: {
        departmentName: department.name,
        departmentCode: department.code,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete department",
      error: error.message,
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};