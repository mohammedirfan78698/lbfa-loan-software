import express from "express";

import {
  payEmi,
  getLoanPayments,
  getEmiPayments,
  getEmisByLoan,
  getAllEmis,
  getCustomerPayments,
  getOverdueEmis,
  getMemberLedger
} from "../controllers/emi.controllers.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * =====================================
 * EMI ROUTES
 * =====================================
 */

// Get all EMIs
router.get("/", protect, getAllEmis);

// Pay EMI
router.put("/pay/:emiId", protect, payEmi);

// Get payments by Loan
router.get("/payments/loan/:loanId", protect, getLoanPayments);

// Get payments by EMI
router.get("/payments/emi/:emiId", protect, getEmiPayments);

// Get EMIs by Loan
router.get("/loan/:loanId", protect, getEmisByLoan);

// Get payments by Customer
router.get("/payments/customer/:customerId", protect, getCustomerPayments);

// Get overdue EMIs
router.get("/overdue", protect, getOverdueEmis);

// Get Member Ledger
router.get("/ledger/:customerId", protect, getMemberLedger);

export default router;