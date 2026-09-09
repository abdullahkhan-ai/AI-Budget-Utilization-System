const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Department = require("../models/Department");

const getReports = async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate("departmentId", "name code")
      .sort({ allocationDate: -1 });

    const expenditures = await Expenditure.find()
      .sort({ date: -1 });

    const departments = await Department.find()
      .sort({ name: 1 });

    let totalAllocated = 0;
    let totalExpenditure = 0;

    const budgetReports = [];

    for (const budget of budgets) {
      const budgetId = budget._id.toString();

      const budgetExpenditures = expenditures.filter(
        (expenditure) =>
          expenditure.budgetId === budgetId
      );

      const expenditureAmount =
        budgetExpenditures.reduce(
          (total, expenditure) =>
            total + Number(expenditure.amountSpent || 0),
          0
        );

      const allocatedAmount =
        Number(budget.allocatedAmount || 0);

      const remainingAmount =
        allocatedAmount - expenditureAmount;

      const utilizationPercentage =
        allocatedAmount > 0
          ? (expenditureAmount / allocatedAmount) * 100
          : 0;

      totalAllocated += allocatedAmount;
      totalExpenditure += expenditureAmount;

      budgetReports.push({
        budgetId: budget._id,
        financialYear: budget.financialYear,
        department: budget.departmentId,
        project: budget.project,
        allocatedAmount,
        expenditureAmount,
        remainingAmount,
        utilizationPercentage: Number(
          utilizationPercentage.toFixed(2)
        ),
        expenditureCount: budgetExpenditures.length,
      });
    }

    const totalRemaining =
      totalAllocated - totalExpenditure;

    const overallUtilization =
      totalAllocated > 0
        ? (totalExpenditure / totalAllocated) * 100
        : 0;

    const departmentReports = departments.map(
      (department) => {
        const departmentBudgets =
          budgetReports.filter(
            (budget) =>
              budget.department &&
              budget.department._id.toString() ===
                department._id.toString()
          );

        const allocatedAmount =
          departmentBudgets.reduce(
            (total, budget) =>
              total + budget.allocatedAmount,
            0
          );

        const expenditureAmount =
          departmentBudgets.reduce(
            (total, budget) =>
              total + budget.expenditureAmount,
            0
          );

        const remainingAmount =
          allocatedAmount - expenditureAmount;

        const utilizationPercentage =
          allocatedAmount > 0
            ? (expenditureAmount / allocatedAmount) * 100
            : 0;

        return {
          departmentId: department._id,
          departmentName: department.name,
          departmentCode: department.code,
          allocatedAmount,
          expenditureAmount,
          remainingAmount,
          utilizationPercentage: Number(
            utilizationPercentage.toFixed(2)
          ),
          budgetCount: departmentBudgets.length,
        };
      }
    );

    res.status(200).json({
      summary: {
        totalBudgets: budgets.length,
        totalAllocated,
        totalExpenditure,
        totalRemaining,
        overallUtilizationPercentage: Number(
          overallUtilization.toFixed(2)
        ),
        totalExpenditures: expenditures.length,
      },

      budgets: budgetReports,

      departments: departmentReports,

      expenditures,
    });
  } catch (error) {
    console.error(
      "Reports error:",
      error
    );

    res.status(500).json({
      message: "Failed to generate reports",
      error: error.message,
    });
  }
};

module.exports = {
  getReports,
};