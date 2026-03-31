import express from "express";
import {
  exportEmiScheduleExcel,
  exportPaymentExcel
} from "../controllers/export.controllers.js";

const router = express.Router();

router.get("/emi/:loanId", exportEmiScheduleExcel);
router.get("/payments/:loanId", exportPaymentExcel);

export default router;
