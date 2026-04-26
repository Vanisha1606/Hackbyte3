const fs = require("fs");
const FormData = require("form-data");
const Prescription = require("../models/Prescription");
const config = require("../config/env");
const { cloudinary, isConfigured: cloudinaryConfigured } = require("../config/cloudinary");

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const callAi = async (path, opts = {}) => {
  const url = `${config.AI_API_URL}${path}`;
  const r = await fetch(url, opts);
  const text = await r.text();
  if (!r.ok) {
    throw new Error(`AI service ${r.status}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const buildImagePayload = (file) => {
  if (!file) return null;
  if (file.path && file.filename && file.path.startsWith("http")) {
    // multer-storage-cloudinary: file.path is the Cloudinary URL
    return {
      url: file.path,
      publicId: file.filename,
      buffer: null,
      mime: file.mimetype || "image/png",
      originalName: file.originalname,
    };
  }
  return {
    url: "",
    publicId: "",
    buffer: file.buffer || null,
    mime: file.mimetype || "image/png",
    originalName: file.originalname,
  };
};

const uploadAndAnalyze = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const inputText = (req.body?.text || "").trim();
    const file = req.file;

    if (!file && !inputText) {
      return res.status(400).json({
        message: "Provide either an image (field 'file') or 'text' body.",
      });
    }

    const image = buildImagePayload(file);
    let extractedText = "";
    let engine = "manual-text";

    // 1. Run OCR via FastAPI when an image was uploaded
    if (image && (image.buffer || image.url)) {
      let buffer = image.buffer;
      if (!buffer && image.url) {
        // Cloudinary stored the image; fetch back the bytes for OCR
        const r = await fetch(image.url);
        buffer = Buffer.from(await r.arrayBuffer());
      }
      const fd = new FormData();
      fd.append("file", buffer, {
        filename: image.originalName || "prescription.png",
        contentType: image.mime,
      });
      const ocr = await callAi("/extract_text/", {
        method: "POST",
        body: fd,
        headers: fd.getHeaders(),
      });
      extractedText = ocr.extracted_text || "";
      engine = ocr.engine || "ocr";
    } else {
      extractedText = inputText;
    }

    // 2. Validate / extract medicine list + details via Gemini
    const validation = await callAi("/validate_prescription/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: extractedText }),
    });

    // 3. Persist to Mongo
    const created = await Prescription.create({
      userId,
      imageUrl: image?.url || "",
      imagePublicId: image?.publicId || "",
      extractedText,
      medicines: validation.validated || "",
      items: Array.isArray(validation.medicines) ? validation.medicines : [],
      details: validation.details || {},
      engine,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("uploadAndAnalyze error:", err);
    res.status(500).json({
      message: err.message || "Failed to analyze prescription",
    });
  }
};

const listMyPrescriptions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const items = await Prescription.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (err) {
    console.error("listMyPrescriptions error:", err);
    res.status(500).json({ message: "Failed to load prescriptions" });
  }
};

const deletePrescription = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const item = await Prescription.findOneAndDelete({
      _id: req.params.id,
      userId,
    });
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.imagePublicId && cloudinaryConfigured) {
      cloudinary.uploader
        .destroy(item.imagePublicId)
        .catch((e) => console.warn("Cloudinary delete failed:", e.message));
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete" });
  }
};

module.exports = {
  uploadAndAnalyze,
  listMyPrescriptions,
  deletePrescription,
};
