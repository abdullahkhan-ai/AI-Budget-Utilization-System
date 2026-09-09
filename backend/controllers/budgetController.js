const Budget = require("../models/Budget");
const Department = require("../models/Department");
const { createAuditLog } = require("../services/auditLogService");

const createBudget = async (req, res) => {
  try {
    const {
      financialYear,
      periodType,
      quarter,
      departmentId,
      project,
      allocatedAmount,
      allocationDate,
      description,
    } = req.body;

    if (
      !financialYear ||
      !periodType ||
      !departmentId ||
      !project ||
      allocatedAmount === undefined ||
      !allocationDate
    ) {
      return res.status(400).json({
        message: "Required budget fields are missing",
      });
    }

    if (periodType === "Quarterly" && !quarter) {
      return res.status(400).json({
        message: "Quarter is required for quarterly budgets",
      });
    }

    if (periodType === "Annual" && quarter) {
      return res.status(400).json({
        message: "Quarter should not be provided for annual budgets",
      });
    }

    if (allocatedAmount < 0) {
      return res.status(400).json({
        message: "Allocated amount cannot be negative",
      });
    }

    const department = await Department.findById(departmentId);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    const budget = await Budget.create({
      financialYear,
      periodType,
      quarter: periodType === "Quarterly" ? quarter : null,
      departmentId,
      project,
      allocatedAmount,
      allocationDate,
      description,
    });

    const populatedBudget = await Budget.findById(budget._id).populate(
      "departmentId",
      "name code"
    );

    await createAuditLog({
      userId: req.user._id,
      action: "CREATE",
      entityType: "Budget",
      entityId: budget._id,
      description: `Created budget for ${budget.project}`,
      metadata: {
        financialYear: budget.financialYear,
        allocatedAmount: budget.allocatedAmount,
        departmentId: budget.departmentId,
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: "Budget created successfully",
      budget: populatedBudget,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create budget",
      error: error.message,
    });
  }
};

const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate("departmentId", "name code")
      .sort({ allocationDate: -1 });

    res.status(200).json({
      budgets,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch budgets",
      error: error.message,
    });
  }
};

const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id).populate(
      "departmentId",
      "name code"
    );

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    res.status(200).json({
      budget,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch budget",
      error: error.message,
    });
  }
};

const updateBudget = async (req, res) => {
  try {
    const {
      financialYear,
      periodType,
      quarter,
      departmentId,
      project,
      allocatedAmount,
      allocationDate,
      description,
      status,
    } = req.body;

    if (periodType === "Quarterly" && !quarter) {
      return res.status(400).json({
        message: "Quarter is required for quarterly budgets",
      });
    }

    if (periodType === "Annual" && quarter) {
      return res.status(400).json({
        message: "Quarter should not be provided for annual budgets",
      });
    }

    if (allocatedAmount !== undefined && allocatedAmount < 0) {
      return res.status(400).json({
        message: "Allocated amount cannot be negative",
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

    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      {
        financialYear,
        periodType,
        quarter: periodType === "Quarterly" ? quarter : null,
        departmentId,
        project,
        allocatedAmount,
        allocationDate,
        description,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("departmentId", "name code");

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE",
      entityType: "Budget",
      entityId: budget._id,
      description: `Updated budget for ${budget.project}`,
      metadata: {
        financialYear: budget.financialYear,
        allocatedAmount: budget.allocatedAmount,
        departmentId: budget.departmentId,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "Budget updated successfully",
      budget,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update budget",
      error: error.message,
    });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);

    if (!budget) {
      return res.status(404).json({
        message: "Budget not found",
      });
    }

    await createAuditLog({
      userId: req.user._id,
      action: "DELETE",
      entityType: "Budget",
      entityId: budget._id,
      description: `Deleted budget for ${budget.project}`,
      metadata: {
        financialYear: budget.financialYear,
        allocatedAmount: budget.allocatedAmount,
        departmentId: budget.departmentId,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      message: "Budget deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete budget",
      error: error.message,
    });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
};