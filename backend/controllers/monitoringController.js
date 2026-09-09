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


const calculateUtilization = (
  allocatedAmount,
  totalExpenditure
) => {
  const remainingAmount =
    allocatedAmount -
    totalExpenditure;

  const utilizationPercentage =
    allocatedAmount > 0
      ? (totalExpenditure /
          allocatedAmount) *
        100
      : 0;

  return {
    remainingAmount,
    utilizationPercentage:
      Number(
        utilizationPercentage.toFixed(2)
      ),
  };
};


const calculateTimeElapsedPercentage = (
  allocationDate,
  financialYear
) => {
  const startYear = Number(
    financialYear.split("-")[0]
  );

  const financialYearStart =
    new Date(
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

  const financialYearEnd =
    new Date(
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
    (elapsedDuration /
      totalDuration) *
    100;

  return Number(
    Math.min(
      100,
      Math.max(0, percentage)
    ).toFixed(2)
  );
};


const getMonitoringStatus = (
  utilizationPercentage,
  timeElapsedPercentage,
  totalExpenditure,
  allocatedAmount,
  thresholds
) => {
  if (
    totalExpenditure >
    allocatedAmount
  ) {
    return "Overspending";
  }

  if (
    timeElapsedPercentage >=
      thresholds.underUtilizationTimeThreshold &&
    utilizationPercentage <
      thresholds.underUtilizationThreshold
  ) {
    return "Under-utilized";
  }

  if (
    utilizationPercentage >=
    thresholds.criticalUtilizationThreshold
  ) {
    return "Overspending";
  }

  if (
    utilizationPercentage >=
    thresholds.highUtilizationThreshold
  ) {
    return "Threshold Deviation";
  }

  return "Normal";
};


const getExpenditureTotal = async (
  budgetId
) => {
  const expenditureResult =
    await Expenditure.aggregate([
      {
        $match: {
          budgetId:
            budgetId.toString(),
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

  return expenditureResult.length >
    0
    ? expenditureResult[0]
        .totalExpenditure
    : 0;
};


const calculateBudgetUtilization =
  async (req, res) => {
    try {
      const thresholds =
        await getActiveThresholds();

      const budget =
        await Budget.findById(
          req.params.id
        ).populate(
          "departmentId",
          "name code"
        );

      if (!budget) {
        return res.status(404).json({
          message:
            "Budget not found",
        });
      }

      const totalExpenditure =
        await getExpenditureTotal(
          budget._id
        );

      const allocatedAmount =
        budget.allocatedAmount;

      const {
        remainingAmount,
        utilizationPercentage,
      } =
        calculateUtilization(
          allocatedAmount,
          totalExpenditure
        );

      const timeElapsedPercentage =
        calculateTimeElapsedPercentage(
          budget.allocationDate,
          budget.financialYear
        );

      const status =
        getMonitoringStatus(
          utilizationPercentage,
          timeElapsedPercentage,
          totalExpenditure,
          allocatedAmount,
          thresholds
        );

      res.status(200).json({
        budget: {
          id: budget._id,
          financialYear:
            budget.financialYear,
          periodType:
            budget.periodType,
          quarter:
            budget.quarter,
          project:
            budget.project,
          department:
            budget.departmentId,
          allocatedAmount,
        },

        utilization: {
          totalExpenditure,
          remainingAmount,
          utilizationPercentage,
          timeElapsedPercentage,
          status,
        },

        thresholds,
      });
    } catch (error) {
      console.error(
        "Calculate budget utilization error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to calculate budget utilization",
        error: error.message,
      });
    }
  };


const getBudgetMonitoring =
  async (req, res) => {
    try {
      const thresholds =
        await getActiveThresholds();

      const budgets =
        await Budget.find()
          .populate(
            "departmentId",
            "name code"
          )
          .sort({
            allocationDate: -1,
          });

      const monitoringData =
        await Promise.all(
          budgets.map(
            async (budget) => {
              const totalExpenditure =
                await getExpenditureTotal(
                  budget._id
                );

              const allocatedAmount =
                budget.allocatedAmount;

              const {
                remainingAmount,
                utilizationPercentage,
              } =
                calculateUtilization(
                  allocatedAmount,
                  totalExpenditure
                );

              const timeElapsedPercentage =
                calculateTimeElapsedPercentage(
                  budget.allocationDate,
                  budget.financialYear
                );

              const status =
                getMonitoringStatus(
                  utilizationPercentage,
                  timeElapsedPercentage,
                  totalExpenditure,
                  allocatedAmount,
                  thresholds
                );

              return {
                budgetId:
                  budget._id,
                financialYear:
                  budget.financialYear,
                periodType:
                  budget.periodType,
                quarter:
                  budget.quarter,
                project:
                  budget.project,
                department:
                  budget.departmentId,
                allocatedAmount,
                totalExpenditure,
                remainingAmount,
                utilizationPercentage,
                timeElapsedPercentage,
                status,
              };
            }
          )
        );

      res.status(200).json({
        count:
          monitoringData.length,
        monitoringData,
        thresholds,
      });
    } catch (error) {
      console.error(
        "Get budget monitoring error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch budget monitoring data",
        error: error.message,
      });
    }
  };


module.exports = {
  calculateBudgetUtilization,
  getBudgetMonitoring,
};