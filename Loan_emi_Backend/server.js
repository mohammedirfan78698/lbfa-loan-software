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

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests like Postman / server-to-server / same-origin with no origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ================== BODY PARSER ==================
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