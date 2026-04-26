const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const {
  uploadAndAnalyze,
  listMyPrescriptions,
  deletePrescription,
} = require("../controllers/prescriptionController");

router.get("/", auth, listMyPrescriptions);
router.post("/", auth, upload.single("file"), uploadAndAnalyze);
router.delete("/:id", auth, deletePrescription);

module.exports = router;
