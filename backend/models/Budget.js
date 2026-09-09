const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    financialYear: {
      type: String,
      required: true,
      trim: true,
    },

    periodType: {
      type: String,
      enum: ["Annual", "Quarterly"],
      required: true,
    },

    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4", null],
      default: null,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    project: {
      type: String,
      required: true,
      trim: true,
    },

    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    allocationDate: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Budget", budgetSchema);