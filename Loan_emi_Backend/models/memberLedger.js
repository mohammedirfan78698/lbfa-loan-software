import mongoose from "mongoose";

const memberLedgerSchema = new mongoose.Schema(
  {
    /* =================================
       CUSTOMER REFERENCE
    ================================= */
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    /* =================================
       LOAN REFERENCE (OPTIONAL)
    ================================= */
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
    },

    /* =================================
       EMI REFERENCE (OPTIONAL)
    ================================= */
    emi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmiSchedule",
      default: null,
    },

    /* =================================
       DUE DATE INFORMATION
    ================================= */
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    month: {
      type: String, // Example: 2026-03
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    monthNumber: {
      type: Number,
      required: true,
    },

    paymentSequence: {
      type: Number,
      default: 1,
      min: 1,
    },

    isFirstPayment: {
      type: Boolean,
      default: false,
    },

    isInsuranceCycle: {
      type: Boolean,
      default: false,
    },

    /* =================================
       PAYMENT BREAKDOWN
    ================================= */
    shareAmount: {
      type: Number,
      default: 200,
    },

    emiAmount: {
      type: Number,
      default: 0,
    },

    insuranceAmount: {
      type: Number,
      default: 0,
    },

    joiningFee: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    /* =================================
       PAYMENT STATUS
    ================================= */
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank"],
      default: "cash",
    },

    /* =================================
       SOFT DELETE
    ================================= */
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

/* =================================
   INDEXES
================================= */
memberLedgerSchema.index({ customer: 1, month: 1 }, { unique: true });
memberLedgerSchema.index({ customer: 1, dueDate: 1 });
memberLedgerSchema.index({ status: 1, dueDate: 1, isDeleted: 1 });

export default mongoose.model("MemberLedger", memberLedgerSchema);