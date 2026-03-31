import express from "express";
import {
  getAllLedger,
  getLedgerById,
  getLedgerByCustomer,
  payLedger,
  generateLedger
} from "../controllers/ledger.controller.js";

const router = express.Router();

router.get("/", getAllLedger);
router.get("/customer/:customerId", getLedgerByCustomer);
router.get("/:ledgerId", getLedgerById);
router.post("/generate", generateLedger);
router.post("/pay/:ledgerId", payLedger);

export default router;