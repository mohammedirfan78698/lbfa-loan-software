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

// ================== MIDDLEWARE ==================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================== DATABASE ==================
connectDB();

// ================== HEALTH CHECK ==================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Loan EMI Backend Running",
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
  console.error("🔥 SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});