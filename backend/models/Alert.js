const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    alertType: {
      type: String,
      enum: [
        "Under-utilization",
        "Overspending",
        "Spending Spike",
        "Threshold Deviation",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    utilizationPercentage: {
      type: Number,
      default: null,
    },

    expenditureAmount: {
      type: Number,
      default: null,
    },

    thresholdPercentage: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Resolved"],
      default: "Active",
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", alertSchema);