// config/env.js - Environment variables configuration
require("dotenv").config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/pharmahub",
  JWT_SECRET: process.env.JWT_SECRET || "pharmahub_dev_secret_change_me",
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || "7d",
  PORT: process.env.PORT || 5001,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  AI_API_URL: process.env.AI_API_URL || "http://localhost:8000",
};
