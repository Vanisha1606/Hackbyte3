const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const config = require("./env");

const isConfigured = Boolean(
  config.CLOUDINARY_CLOUD_NAME &&
    config.CLOUDINARY_API_KEY &&
    config.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const storage = isConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "pharmahub/prescriptions",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "heic"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  cloudinary,
  upload,
  isConfigured,
};
