const fs = require("fs");
const path = require("path");

const Expenditure = require("../models/Expenditure");


const UPLOAD_DIRECTORY = path.join(
  __dirname,
  "..",
  "uploads",
  "expenditures"
);


const deleteUploadedFile = (
  fileName
) => {
  if (!fileName) {
    return;
  }

  const filePath = path.join(
    UPLOAD_DIRECTORY,
    fileName
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};


const generateTransactionId = async () => {
  let transactionId;
  let exists = true;

  while (exists) {
    const randomPart =
      Math.floor(
        100000 +
        Math.random() * 900000
      );

    transactionId =
      `EXP-${new Date().getFullYear()}-${randomPart}`;

    exists =
      await Expenditure.exists({
        transactionId,
      });
  }

  return transactionId;
};


/*
 * CREATE EXPENDITURE
 *
 * POST /api/expenditures
 */
const createExpenditure = async (
  req,
  res
) => {
  try {
    const {
      budgetId,
      amountSpent,
      expenseCategory,
      date,
      supportingDocumentReference,
    } = req.body;


    if (!budgetId) {
      return res.status(400).json({
        message:
          "Budget selection is required.",
      });
    }


    if (
      amountSpent === undefined ||
      amountSpent === null ||
      Number(amountSpent) <= 0
    ) {
      return res.status(400).json({
        message:
          "Amount spent must be greater than zero.",
      });
    }


    if (!expenseCategory) {
      return res.status(400).json({
        message:
          "Expense category is required.",
      });
    }


    if (!date) {
      return res.status(400).json({
        message:
          "Expenditure date is required.",
      });
    }


    const transactionId =
      await generateTransactionId();


    const documentReference =
      supportingDocumentReference
        ? String(
            supportingDocumentReference
          ).trim()
        : "";


    const supportingDocument =
      req.file
        ? {
            originalName:
              req.file.originalname,

            fileName:
              req.file.filename,

            fileUrl:
              `/uploads/expenditures/${req.file.filename}`,

            mimeType:
              req.file.mimetype,

            size:
              req.file.size,
          }
        : undefined;


    const expenditure =
      await Expenditure.create({
        transactionId,

        budgetId:
          String(budgetId).trim(),

        amountSpent:
          Number(amountSpent),

        expenseCategory:
          String(
            expenseCategory
          ).trim(),

        date,

        supportingDocumentReference:
          documentReference,

        supportingDocument,
      });


    return res.status(201).json({
      message:
        "Expenditure recorded successfully.",

      expenditure,
    });

  } catch (error) {

    if (req.file) {
      try {
        deleteUploadedFile(
          req.file.filename
        );
      } catch (cleanupError) {
        console.error(
          "Uploaded file cleanup failed:",
          cleanupError
        );
      }
    }


    console.error(
      "Create expenditure error:",
      error
    );


    return res.status(500).json({
      message:
        "Failed to record expenditure.",

      error: error.message,
    });
  }
};


/*
 * GET EXPENDITURES
 *
 * GET /api/expenditures
 */
const getExpenditures = async (
  req,
  res
) => {
  try {

    const expenditures =
      await Expenditure.find()
        .sort({
          date: -1,
          createdAt: -1,
        });


    return res.status(200).json({
      expenditures,
    });

  } catch (error) {

    console.error(
      "Get expenditures error:",
      error
    );


    return res.status(500).json({
      message:
        "Failed to load expenditure records.",

      error: error.message,
    });
  }
};


/*
 * UPDATE EXPENDITURE
 *
 * PUT /api/expenditures/:id
 */
const updateExpenditure = async (
  req,
  res
) => {
  try {

    const { id } =
      req.params;


    const {
      budgetId,
      amountSpent,
      expenseCategory,
      date,
      supportingDocumentReference,
    } = req.body;


    if (!budgetId) {
      return res.status(400).json({
        message:
          "Budget selection is required.",
      });
    }


    if (
      amountSpent === undefined ||
      amountSpent === null ||
      Number(amountSpent) <= 0
    ) {
      return res.status(400).json({
        message:
          "Amount spent must be greater than zero.",
      });
    }


    if (!expenseCategory) {
      return res.status(400).json({
        message:
          "Expense category is required.",
      });
    }


    if (!date) {
      return res.status(400).json({
        message:
          "Expenditure date is required.",
      });
    }


    const existingExpenditure =
      await Expenditure.findById(id);


    if (!existingExpenditure) {
      if (req.file) {
        deleteUploadedFile(
          req.file.filename
        );
      }

      return res.status(404).json({
        message:
          "Expenditure record not found.",
      });
    }


    const updateData = {

      budgetId:
        String(budgetId).trim(),

      amountSpent:
        Number(amountSpent),

      expenseCategory:
        String(
          expenseCategory
        ).trim(),

      date,
    };


    if (req.file) {

      updateData.supportingDocumentReference =
        supportingDocumentReference
          ? String(
              supportingDocumentReference
            ).trim()
          : "";


      updateData.supportingDocument = {
        originalName:
          req.file.originalname,

        fileName:
          req.file.filename,

        fileUrl:
          `/uploads/expenditures/${req.file.filename}`,

        mimeType:
          req.file.mimetype,

        size:
          req.file.size,
      };

    } else if (
      supportingDocumentReference !==
      undefined
    ) {

      updateData.supportingDocumentReference =
        supportingDocumentReference
          ? String(
              supportingDocumentReference
            ).trim()
          : "";
    }


    const expenditure =
      await Expenditure.findByIdAndUpdate(
        id,

        updateData,

        {
          new: true,
          runValidators: true,
        }
      );


    if (
      req.file &&
      existingExpenditure.supportingDocument?.fileName
    ) {
      try {
        deleteUploadedFile(
          existingExpenditure
            .supportingDocument
            .fileName
        );
      } catch (cleanupError) {
        console.error(
          "Old uploaded file cleanup failed:",
          cleanupError
        );
      }
    }


    return res.status(200).json({
      message:
        "Expenditure updated successfully.",

      expenditure,
    });

  } catch (error) {

    if (req.file) {
      try {
        deleteUploadedFile(
          req.file.filename
        );
      } catch (cleanupError) {
        console.error(
          "Uploaded file cleanup failed:",
          cleanupError
        );
      }
    }


    console.error(
      "Update expenditure error:",
      error
    );


    return res.status(500).json({
      message:
        "Failed to update expenditure.",

      error: error.message,
    });
  }
};


/*
 * DELETE EXPENDITURE
 *
 * DELETE /api/expenditures/:id
 */
const deleteExpenditure = async (
  req,
  res
) => {
  try {

    const { id } =
      req.params;


    const expenditure =
      await Expenditure.findByIdAndDelete(
        id
      );


    if (!expenditure) {
      return res.status(404).json({
        message:
          "Expenditure record not found.",
      });
    }


    if (
      expenditure.supportingDocument?.fileName
    ) {
      try {
        deleteUploadedFile(
          expenditure
            .supportingDocument
            .fileName
        );
      } catch (cleanupError) {
        console.error(
          "Uploaded file cleanup failed:",
          cleanupError
        );
      }
    }


    return res.status(200).json({
      message:
        "Expenditure deleted successfully.",
    });

  } catch (error) {

    console.error(
      "Delete expenditure error:",
      error
    );


    return res.status(500).json({
      message:
        "Failed to delete expenditure.",

      error: error.message,
    });
  }
};


module.exports = {
  createExpenditure,
  getExpenditures,
  updateExpenditure,
  deleteExpenditure,
};