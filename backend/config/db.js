const mongoose = require("mongoose");
const config = require("./env");

let attempt = 0;

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    attempt = 0;
    console.log(`✔ MongoDB connected: ${config.MONGO_URI}`);
  } catch (err) {
    attempt += 1;
    console.error(
      `✖ MongoDB connection error (attempt ${attempt}): ${err.message}`
    );
    if (attempt === 1) {
      console.error(
        "  Tip: ensure MongoDB is running locally, or set MONGO_URI in backend/.env."
      );
      console.error(
        "  Quick start with Docker:  docker run -d --name pharmahub-mongo -p 27017:27017 mongo:7"
      );
    }
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠ MongoDB disconnected. Reconnecting…");
});

module.exports = connectDB;
