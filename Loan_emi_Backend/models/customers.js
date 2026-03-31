import mongoose from "mongoose";

/* =========================================================
   🔹 INSURANCE SUB-SCHEMA
========================================================= */
const insuranceSchema = new mongoose.Schema(
  {
    paidDate: {
      type: Date,
    },

    paidAmount: {
      type: Number,
      min: [0, "Paid amount cannot be negative"],
    },

    claimYear: {
      type: Number,
      min: [2000, "Invalid claim year"],
    },

    claimAmount: {
      type: Number,
      min: [0, "Claim amount cannot be negative"],
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

/* =========================================================
   🔹 CUSTOMER MAIN SCHEMA
========================================================= */
const customerSchema = new mongoose.Schema(
  {
    /* ==============================
       🔹 BASIC DETAILS
    ============================== */
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      match: [/^[A-Za-z\s]+$/, "Name must contain only letters and spaces"],
    },

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"],
    },

    address: {
      type: String,
      trim: true,
    },

    /* ==============================
       🔹 PERSONAL DETAILS
    ============================== */
    subgroupNo: {
      type: String,
      trim: true,
    },

    sangamAccountNo: {
      type: String,
      trim: true,
    },

    joinFee: {
      type: Number,
      min: [0, "Join fee cannot be negative"],
      default: 0,
    },

    dateOfJoin: {
      type: Date,
    },

    dob: {
      type: Date,
    },

    fatherName: {
      type: String,
      trim: true,
    },

    aadhaarNo: {
      type: String,
      trim: true,
      match: [/^\d{12}$/, "Aadhaar number must be exactly 12 digits"],
    },

    /* ==============================
       🔹 FINANCIAL DETAILS
    ============================== */
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },

    joiningAmount: {
      type: Number,
      min: [0, "Joining amount cannot be negative"],
      default: 0,
    },

    shareAmount: {
      type: Number,
      min: [0, "Share amount cannot be negative"],
      default: 0,
    },

    bonusAmount: {
      type: Number,
      min: [0, "Bonus amount cannot be negative"],
      default: 0,
    },

    remainingAmount: {
      type: Number,
      min: [0, "Remaining amount cannot be negative"],
      default: 0,
    },

    /* ==============================
       🔹 PAYMENT CONTROL
    ============================== */
    paymentGenerationActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    paymentStoppedAt: {
      type: Date,
      default: null,
    },

    /* ==============================
       🔹 PAYMENT SUMMARY
    ============================== */
    totalSharePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalJoiningFeePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalInsurancePaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEmiPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ==============================
       🔹 NOMINEE DETAILS
    ============================== */
    nomineeName: {
      type: String,
      trim: true,
    },

    nomineeRelation: {
      type: String,
      trim: true,
    },

    nomineeAadhaar: {
      type: String,
      trim: true,
      match: [/^\d{12}$/, "Nominee Aadhaar must be exactly 12 digits"],
    },

    nomineeMobile: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "Nominee mobile must be exactly 10 digits"],
    },

    /* ==============================
       🔹 INSURANCE DETAILS
    ============================== */
    insuranceDetails: [insuranceSchema],

    /* ==============================
       🔹 SOFT DELETE SYSTEM
    ============================== */
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique Mobile
customerSchema.index({ mobile: 1 }, { unique: true });

// Unique Aadhaar (only if exists)
customerSchema.index({ aadhaarNo: 1 }, { unique: true, sparse: true });

// Unique Sangam Account (only if exists)
customerSchema.index({ sangamAccountNo: 1 }, { unique: true, sparse: true });

export default mongoose.model("Customer", customerSchema);