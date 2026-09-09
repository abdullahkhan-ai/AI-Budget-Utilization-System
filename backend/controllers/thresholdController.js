const ThresholdConfig = require("../models/ThresholdConfig");
const { createAuditLog } = require("../services/auditLogService");

const DEFAULT_THRESHOLDS = {
  underUtilizationThreshold: 40,
  highUtilizationThreshold: 80,
  criticalUtilizationThreshold: 100,
  spendingSpikeThreshold: 50,
  underUtilizationTimeThreshold: 70,
};


const getThresholdConfig = async (
  req,
  res
) => {
  try {
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

    res.status(200).json({
      thresholds: config,
    });
  } catch (error) {
    console.error(
      "Get threshold configuration error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch threshold configuration",
      error: error.message,
    });
  }
};


const updateThresholdConfig = async (
  req,
  res
) => {
  try {
    const {
      underUtilizationThreshold,
      highUtilizationThreshold,
      criticalUtilizationThreshold,
      spendingSpikeThreshold,
      underUtilizationTimeThreshold,
    } = req.body;


    const values = {
      underUtilizationThreshold,
      highUtilizationThreshold,
      criticalUtilizationThreshold,
      spendingSpikeThreshold,
      underUtilizationTimeThreshold,
    };


    for (const [key, value] of Object.entries(values)) {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        !Number.isFinite(Number(value))
      ) {
        return res.status(400).json({
          message:
            `${key} must be a valid number.`,
        });
      }

      if (
        Number(value) < 0 ||
        Number(value) > 100
      ) {
        return res.status(400).json({
          message:
            `${key} must be between 0 and 100.`,
        });
      }
    }


    if (
      Number(underUtilizationThreshold) >=
      Number(highUtilizationThreshold)
    ) {
      return res.status(400).json({
        message:
          "Under-utilization threshold must be lower than high utilization threshold.",
      });
    }


    if (
      Number(highUtilizationThreshold) >=
      Number(criticalUtilizationThreshold)
    ) {
      return res.status(400).json({
        message:
          "High utilization threshold must be lower than critical utilization threshold.",
      });
    }


    let config =
      await ThresholdConfig.findOne({
        key: "default",
      });


    if (!config) {
      config =
        await ThresholdConfig.create({
          key: "default",
          underUtilizationThreshold:
            Number(
              underUtilizationThreshold
            ),
          highUtilizationThreshold:
            Number(
              highUtilizationThreshold
            ),
          criticalUtilizationThreshold:
            Number(
              criticalUtilizationThreshold
            ),
          spendingSpikeThreshold:
            Number(
              spendingSpikeThreshold
            ),
          underUtilizationTimeThreshold:
            Number(
              underUtilizationTimeThreshold
            ),
        });
    } else {
      config.underUtilizationThreshold =
        Number(
          underUtilizationThreshold
        );

      config.highUtilizationThreshold =
        Number(
          highUtilizationThreshold
        );

      config.criticalUtilizationThreshold =
        Number(
          criticalUtilizationThreshold
        );

      config.spendingSpikeThreshold =
        Number(
          spendingSpikeThreshold
        );

      config.underUtilizationTimeThreshold =
        Number(
          underUtilizationTimeThreshold
        );

      await config.save();
    }


    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE",
      entityType: "ThresholdConfig",
      entityId: config._id,
      description:
        "Updated budget monitoring threshold configuration",
      metadata: {
        underUtilizationThreshold:
          config.underUtilizationThreshold,
        highUtilizationThreshold:
          config.highUtilizationThreshold,
        criticalUtilizationThreshold:
          config.criticalUtilizationThreshold,
        spendingSpikeThreshold:
          config.spendingSpikeThreshold,
        underUtilizationTimeThreshold:
          config.underUtilizationTimeThreshold,
      },
      ipAddress: req.ip,
    });


    res.status(200).json({
      message:
        "Threshold configuration updated successfully",
      thresholds: config,
    });
  } catch (error) {
    console.error(
      "Update threshold configuration error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update threshold configuration",
      error: error.message,
    });
  }
};


module.exports = {
  getThresholdConfig,
  updateThresholdConfig,
};