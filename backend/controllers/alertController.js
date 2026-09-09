const Alert = require("../models/Alert");
const Budget = require("../models/Budget");
const Expenditure = require("../models/Expenditure");
const ThresholdConfig = require("../models/ThresholdConfig");


const DEFAULT_THRESHOLDS = {
  underUtilizationThreshold: 40,
  highUtilizationThreshold: 80,
  criticalUtilizationThreshold: 100,
  spendingSpikeThreshold: 50,
  underUtilizationTimeThreshold: 70,
};


const getActiveThresholds = async () => {
  let config =
    await ThresholdConfig.findOne({
      key: "default",
    });

  if (!config) {
    config =
      await ThresholdConfig.create({
        key: "default",
        ...DEFAULT_THRESHOLDS,
      });
  }

  return config;
};


const calculateTimeElapsedPercentage = (
  allocationDate,
  financialYear
) => {
  const startYear = Number(
    financialYear.split("-")[0]
  );

  const financialYearStart = new Date(
    Date.UTC(
      startYear,
      3,
      1,
      0,
      0,
      0,
      0
    )
  );

  const financialYearEnd = new Date(
    Date.UTC(
      startYear + 1,
      2,
      31,
      23,
      59,
      59,
      999
    )
  );

  const now = new Date();

  const totalDuration =
    financialYearEnd.getTime() -
    financialYearStart.getTime();

  const elapsedDuration =
    now.getTime() -
    financialYearStart.getTime();

  if (totalDuration <= 0) {
    return 0;
  }

  const percentage =
    (elapsedDuration / totalDuration) *
    100;

  return Number(
    Math.min(
      100,
      Math.max(0, percentage)
    ).toFixed(2)
  );
};


const calculateBudgetData = async (
  budgetId
) => {
  const budget =
    await Budget.findById(
      budgetId
    );

  if (!budget) {
    return null;
  }

  const expenditureResult =
    await Expenditure.aggregate([
      {
        $match: {
          budgetId:
            budget._id.toString(),
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

  const totalExpenditure =
    expenditureResult.length > 0
      ? expenditureResult[0]
          .totalExpenditure
      : 0;

  const utilizationPercentage =
    budget.allocatedAmount > 0
      ? (totalExpenditure /
          budget.allocatedAmount) *
        100
      : 0;

  const timeElapsedPercentage =
    calculateTimeElapsedPercentage(
      budget.allocationDate,
      budget.financialYear
    );

  return {
    budget,
    totalExpenditure,
    utilizationPercentage:
      Number(
        utilizationPercentage.toFixed(2)
      ),
    timeElapsedPercentage,
  };
};


const detectAlertsForBudget = async (
  budgetId,
  thresholds
) => {
  const data =
    await calculateBudgetData(
      budgetId
    );

  if (!data) {
    return [];
  }

  const {
    budget,
    totalExpenditure,
    utilizationPercentage,
    timeElapsedPercentage,
  } = data;

  const generatedAlerts = [];


  await Alert.deleteMany({
    budgetId: budget._id,
    status: "Active",
  });


  // Under-utilization

  if (
    timeElapsedPercentage >=
      thresholds.underUtilizationTimeThreshold &&
    utilizationPercentage <
      thresholds.underUtilizationThreshold
  ) {
    generatedAlerts.push({
      budgetId:
        budget._id,
      departmentId:
        budget.departmentId,
      alertType:
        "Under-utilization",
      severity:
        "Medium",
      message:
        `Budget utilization is below ` +
        `${thresholds.underUtilizationThreshold}% ` +
        `after ${thresholds.underUtilizationTimeThreshold}% ` +
        `of the financial period has elapsed`,
      utilizationPercentage,
      expenditureAmount:
        totalExpenditure,
      thresholdPercentage:
        thresholds.underUtilizationThreshold,
    });
  }


  // High utilization / threshold deviation

  if (
    utilizationPercentage >=
    thresholds.highUtilizationThreshold
  ) {
    generatedAlerts.push({
      budgetId:
        budget._id,
      departmentId:
        budget.departmentId,
      alertType:
        "Threshold Deviation",
      severity:
        utilizationPercentage >=
        thresholds.criticalUtilizationThreshold
          ? "Critical"
          : "High",
      message:
        `Budget utilization has reached ` +
        `${utilizationPercentage}%`,
      utilizationPercentage,
      expenditureAmount:
        totalExpenditure,
      thresholdPercentage:
        thresholds.highUtilizationThreshold,
    });
  }


  // Overspending

  if (
    totalExpenditure >
    budget.allocatedAmount
  ) {
    generatedAlerts.push({
      budgetId:
        budget._id,
      departmentId:
        budget.departmentId,
      alertType:
        "Overspending",
      severity:
        "Critical",
      message:
        "Expenditure has exceeded the approved budget allocation",
      utilizationPercentage,
      expenditureAmount:
        totalExpenditure,
      thresholdPercentage:
        thresholds.criticalUtilizationThreshold,
    });
  }


  // Spending spike

  const expenditures =
    await Expenditure.find({
      budgetId:
        budget._id.toString(),
    }).sort({
      date: 1,
      createdAt: 1,
    });


  if (expenditures.length >= 2) {
    const previousExpenditure =
      expenditures[
        expenditures.length - 2
      ].amountSpent;

    const latestExpenditure =
      expenditures[
        expenditures.length - 1
      ].amountSpent;

    if (previousExpenditure > 0) {
      const increasePercentage =
        ((latestExpenditure -
          previousExpenditure) /
          previousExpenditure) *
        100;

      if (
        increasePercentage >=
        thresholds.spendingSpikeThreshold
      ) {
        generatedAlerts.push({
          budgetId:
            budget._id,
          departmentId:
            budget.departmentId,
          alertType:
            "Spending Spike",
          severity:
            "High",
          message:
            `Latest expenditure increased by ` +
            `${Number(
              increasePercentage.toFixed(2)
            )}% compared with the previous transaction`,
          utilizationPercentage,
          expenditureAmount:
            latestExpenditure,
          thresholdPercentage:
            thresholds.spendingSpikeThreshold,
        });
      }
    }
  }


  if (
    generatedAlerts.length > 0
  ) {
    return await Alert.insertMany(
      generatedAlerts
    );
  }

  return [];
};


const scanAllBudgets = async (
  req,
  res
) => {
  try {
    const thresholds =
      await getActiveThresholds();

    const budgets =
      await Budget.find();

    let alertsGenerated = 0;

    for (const budget of budgets) {
      const alerts =
        await detectAlertsForBudget(
          budget._id,
          thresholds
        );

      alertsGenerated +=
        alerts.length;
    }

    const activeAlerts =
      await Alert.find({
        status: "Active",
      })
        .populate(
          "budgetId",
          "financialYear project allocatedAmount"
        )
        .populate(
          "departmentId",
          "name code"
        )
        .sort({
          detectedAt: -1,
        });

    res.status(200).json({
      message:
        "Anomaly scan completed successfully",
      alertsGenerated,
      activeAlerts,
      thresholds,
    });
  } catch (error) {
    console.error(
      "Scan budgets error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to scan budgets for anomalies",
      error: error.message,
    });
  }
};


const getAlerts = async (
  req,
  res
) => {
  try {
    const alerts =
      await Alert.find()
        .populate(
          "budgetId",
          "financialYear project allocatedAmount"
        )
        .populate(
          "departmentId",
          "name code"
        )
        .sort({
          detectedAt: -1,
        });

    res.status(200).json({
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error(
      "Get alerts error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch alerts",
      error: error.message,
    });
  }
};


const resolveAlert = async (
  req,
  res
) => {
  try {
    const alert =
      await Alert.findByIdAndUpdate(
        req.params.id,
        {
          status: "Resolved",
        },
        {
          new: true,
        }
      )
        .populate(
          "budgetId",
          "financialYear project allocatedAmount"
        )
        .populate(
          "departmentId",
          "name code"
        );

    if (!alert) {
      return res.status(404).json({
        message:
          "Alert not found",
      });
    }

    res.status(200).json({
      message:
        "Alert resolved successfully",
      alert,
    });
  } catch (error) {
    console.error(
      "Resolve alert error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to resolve alert",
      error: error.message,
    });
  }
};


const deleteAlert = async (
  req,
  res
) => {
  try {
    const alert =
      await Alert.findByIdAndDelete(
        req.params.id
      );

    if (!alert) {
      return res.status(404).json({
        message:
          "Alert not found",
      });
    }

    res.status(200).json({
      message:
        "Alert deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete alert error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete alert",
      error: error.message,
    });
  }
};


module.exports = {
  scanAllBudgets,
  getAlerts,
  resolveAlert,
  deleteAlert,
};