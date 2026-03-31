import express from "express";
import { monthlyCollectionReport } from "../controllers/report.controllers.js";

const router = express.Router();

router.get("/monthly", monthlyCollectionReport);

export default router;
