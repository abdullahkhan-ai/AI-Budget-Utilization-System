const mongoose = require("mongoose");

const expenditureSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: true,
    },

    amountSpent: {
      type: Number,
      required: true,
      min: 0,
    },

    expenseCategory: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    supportingDocumentReference: {
      type: String,
      trim: true,
      default: "",
    },

    supportingDocument: {
      originalName: {
        type: String,
        default: "",
      },

      fileName: {
        type: String,
        default: "",
      },

      fileUrl: {
        type: String,
        default: "",
      },

      mimeType: {
        type: String,
        default: "",
      },

      size: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Expenditure",
  expenditureSchema
);