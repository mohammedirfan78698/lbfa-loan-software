import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  deleteCustomer,
  updateCustomer,
  addInsurance,
  updateInsurance,
  deleteInsurance,
  updatePersonalDetails,
  updateNomineeDetails,
  getAnnualStatement,
  updateFinancialDetails,
  toggleCustomerPaymentStatus
} from "../controllers/customers.controllers.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===============================
   CUSTOMER CRUD
================================= */
router.post("/", protect, adminOnly, createCustomer);
router.get("/", protect, getAllCustomers);
router.get("/search", protect, searchCustomers);
router.get("/:id/annual-statement", protect, getAnnualStatement);
router.get("/:id", protect, getCustomerById);
router.put("/:id", protect, adminOnly, updateCustomer);
router.delete("/:id", protect, adminOnly, deleteCustomer);

/* ===============================
   PAYMENT CONTROL
================================= */
router.put("/:id/payment-status", protect, adminOnly, toggleCustomerPaymentStatus);

/* ===============================
   UPDATE SECTIONS
================================= */
router.put("/:id/personal", protect, updatePersonalDetails);
router.put("/:id/nominee", protect, updateNomineeDetails);
router.put("/:id/financial-details", protect, adminOnly, updateFinancialDetails);

/* ===============================
   INSURANCE ROUTES
================================= */
router.post("/:id/insurance", protect, adminOnly, addInsurance);
router.put("/:id/insurance/:insuranceId", protect, adminOnly, updateInsurance);
router.delete("/:id/insurance/:insuranceId", protect, adminOnly, deleteInsurance);

export default router;