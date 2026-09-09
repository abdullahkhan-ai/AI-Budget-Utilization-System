const mongoose = require("mongoose");

const thresholdConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "default",
    },

    underUtilizationThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 40,
    },

    highUtilizationThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 80,
    },

    criticalUtilizationThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },

    spendingSpikeThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },

    underUtilizationTimeThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 70,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ThresholdConfig",
  thresholdConfigSchema
);