const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const Alert = require("../models/Alert");

const getDashboardSummary = async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate("departmentId", "name code")
      .sort({ allocationDate: -1 });

    const activeAlerts = await Alert.countDocuments({
      status: "Active",
    });

    let totalAllocated = 0;
    let totalExpenditure = 0;

    const budgetSummary = await Promise.all(
      budgets.map(async (budget) => {
        const expenditureResult =
          await Expenditure.aggregate([
            {
              $match: {
                budgetId: budget._id.toString(),
              },
            },
            {
              $group: {
                _id: null,
                totalExpenditure: {
                  $sum: "$amountSpent",
                },
              },
            },
          ]);

        const expenditure =
          expenditureResult.length > 0
            ? expenditureResult[0].totalExpenditure
            : 0;

        const utilizationPercentage =
          budget.allocatedAmount > 0
            ? (expenditure /
                budget.allocatedAmount) *
              100
            : 0;

        totalAllocated += budget.allocatedAmount;
        totalExpenditure += expenditure;

        return {
          budgetId: budget._id,
          financialYear: budget.financialYear,
          department: budget.departmentId,
          project: budget.project,
          allocatedAmount: budget.allocatedAmount,
          expenditure,
          remainingAmount:
            budget.allocatedAmount - expenditure,
          utilizationPercentage: Number(
            utilizationPercentage.toFixed(2)
          ),
        };
      })
    );

    const overallUtilization =
      totalAllocated > 0
        ? (totalExpenditure /
            totalAllocated) *
          100
        : 0;

    const totalRemaining =
      totalAllocated - totalExpenditure;

    res.status(200).json({
      summary: {
        totalBudgets: budgets.length,
        totalAllocated,
        totalExpenditure,
        totalRemaining,
        overallUtilizationPercentage:
          Number(
            overallUtilization.toFixed(2)
          ),
        activeAlerts,
      },

      budgets: budgetSummary,
    });
  } catch (error) {
    console.error(
      "Dashboard summary error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load dashboard summary",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
};