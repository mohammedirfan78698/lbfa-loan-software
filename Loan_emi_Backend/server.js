import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ================== CONFIG ==================
import connectDB from "./config/db.js";

// ================== ROUTES ==================
import customerRoutes from "./routes/customers.routes.js";
import loanRoutes from "./routes/loan.routes.js";
import emiRoutes from "./routes/emi.routes.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import reportRoutes from "./routes/report.routes.js";
import exportRoutes from "./routes/export.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";
import authRoutes from "./routes/auth.routes.js";
import insuranceRoutes from "./routes/insurance.routes.js";
import memberLedgerRoutes from "./routes/memberLedger.routes.js";
// import ledgerRoutes from "./routes/ledger.routes.js";

// ================== INIT ==================
dotenv.config();

const app = express();

// ================== DATABASE ==================
connectDB();

// ================== CORS ==================
const allowedOrigins = [
  "http://localhost:5173",
  "https://lbfa-loan-software.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

console.log("✅ Allowed CORS Origins:", allowedOrigins);

// Manual CORS headers first
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Keep cors middleware too
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LBFA backend is live",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Loan EMI Backend Running",
    clientUrl: process.env.CLIENT_URL || null,
  });
});

// ================== API ROUTES ==================
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/emi", emiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/insurance", insuranceRoutes);
app.use("/api/ledger", memberLedgerRoutes);
// app.use("/api/ledger", ledgerRoutes);

// ================== 404 HANDLER ==================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route not found",
  });
});

// ================== GLOBAL ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});