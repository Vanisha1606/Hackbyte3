const express = require("express");
const router = express.Router();
const {
  getAllMedicines,
  searchMedicine,
  addMedicine,
} = require("../controllers/medicinecontroller");

router.get("/", getAllMedicines);
router.get("/search", searchMedicine);
router.post("/", addMedicine);

module.exports = router;
