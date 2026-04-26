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

// Bulletproof CORS - works reliably under Express 5 / older path-to-regexp.
// Echo the caller's Origin so credentialed requests also work, and short-circuit
// the OPTIONS preflight ourselves (some setups don't reach the cors() middleware).
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Vary", "Origin");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
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
