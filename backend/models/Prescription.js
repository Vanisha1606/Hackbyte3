const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    extractedText: { type: String, default: "" },
    medicines: { type: String, default: "" },
    details: { type: Object, default: {} },
    engine: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
