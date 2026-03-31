import express from "express";
import {
  getLoanDashboard,
  getCustomerDashboard,
  getDashboardStats
} from "../controllers/dashboard.controllers.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * 📊 Admin dashboard stats (ADMIN ONLY)
 */
router.get("/stats", protect, adminOnly, getDashboardStats);

/**
 * 📊 Single loan dashboard
 */
router.get("/loan/:loanId", protect, getLoanDashboard);

/**
 * 📊 Single customer dashboard
 */
router.get("/customer/:customerId", protect, getCustomerDashboard);

export default router;
