const express = require("express");

const {
  createExpenditure,
  getExpenditures,
  updateExpenditure,
  deleteExpenditure,
} = require("../controllers/expenditureController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const upload =
  require("../middleware/uploadMiddleware");


const router = express.Router();


router.post(
  "/",
  protect,
  authorizeRoles(
    "Admin",
    "Finance Officer",
    "Department Head"
  ),
  upload.single(
    "supportingDocument"
  ),
  createExpenditure
);


router.get(
  "/",
  protect,
  getExpenditures
);


router.put(
  "/:id",
  protect,
  authorizeRoles(
    "Admin",
    "Finance Officer",
    "Department Head"
  ),
  upload.single(
    "supportingDocument"
  ),
  updateExpenditure
);


router.delete(
  "/:id",
  protect,
  authorizeRoles(
    "Admin",
    "Finance Officer"
  ),
  deleteExpenditure
);


module.exports = router;