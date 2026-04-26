const express = require("express");
const cors = require("cors");
require("dotenv").config();

const config = require("./config/env");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const paymentRoutes = require("./routes/stripe");
const prescriptionRoutes = require("./routes/prescriptionRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get("/", (_req, res) =>
  res.json({ status: "ok", service: "PharmaHub Node API" })
);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/stripe", paymentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(config.PORT, () =>
  console.log(`PharmaHub Node API running on http://localhost:${config.PORT}`)
);
