import express from "express";
import {
  createInsurance,
  getCustomerInsurances,
  updateInsurance,
  deleteInsurance,
} from "../controllers/insurance.controllers.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* Create Insurance */
router.post("/customer/:customerId", protect, createInsurance);

/* Get All Insurance For Customer */
router.get("/customer/:customerId", protect, getCustomerInsurances);

/* Update Insurance */
router.put("/:id", protect, updateInsurance);

/* Delete Insurance */
router.delete("/:id", protect, deleteInsurance);

export default router;