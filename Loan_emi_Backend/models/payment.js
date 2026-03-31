import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    default: null
  },

  emi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmiSchedule",
    default: null
  },

  paymentType: {
    type: String,
    enum: ["joining", "share", "emi", "insurance", "combined"],
    required: true
  },

  joiningFee: {
    type: Number,
    default: 0
  },

  shareAmount: {
    type: Number,
    default: 0
  },

  emiAmount: {
    type: Number,
    default: 0
  },

  insuranceAmount: {
    type: Number,
    default: 0
  },

  amount: {
    type: Number,
    required: true
  },

  paymentMode: {
    type: String,
    enum: ["cash", "upi", "bank", "card"],
    required: true
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);