import express from "express";
import {
  generateMonthlyLedger,
  getLedger,
  getLedgerById,
  getLedgerByCustomer,
  payLedger,
  getReceipt,
  getCustomerFinanceSummary,
} from "../controllers/memberLedger.controller.js";

const router = express.Router();

router.get("/", getLedger);
router.post("/generate", generateMonthlyLedger);
router.get("/customer/:customerId", getLedgerByCustomer);
router.get("/finance-summary/:customerId", getCustomerFinanceSummary);
router.get("/receipt/:ledgerId", getReceipt);
router.get("/:ledgerId", getLedgerById);
router.post("/pay/:ledgerId", payLedger);

export default router;