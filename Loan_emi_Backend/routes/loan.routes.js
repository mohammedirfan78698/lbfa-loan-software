console.log("✅ loan.routes.js file loaded");

import express from "express";
import {
  createLoan,
  updateLoan,
  getAllLoans,
  getEmiByLoan,
  getLoanById,
  closeLoan,
  getLoanEMIBreakdown,
  getLoansByCustomer,
} from "../controllers/loan.controllers.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", protect, adminOnly, createLoan);
router.put("/:loanId", protect, adminOnly, updateLoan);

router.get("/", protect, getAllLoans);
router.get("/customer/:customerId", protect, getLoansByCustomer);

router.put("/:loanId/close", protect, adminOnly, closeLoan);
router.get("/emis/:loanId", protect, getEmiByLoan);
router.get("/:loanId/breakdown", protect, getLoanEMIBreakdown);
router.get("/:id", protect, getLoanById);

export default router;