import express from "express";
import { loanStatementPDF } from "../controllers/pdf.controllers.js";

const router = express.Router();

router.get("/loan/:loanId", loanStatementPDF);

export default router;
