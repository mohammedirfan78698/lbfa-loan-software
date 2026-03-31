import mongoose from "mongoose";

const insuranceSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    paidDate: {
      type: Date,
      required: true,
    },

    paidAmount: {
      type: Number,
      required: true,
    },

    claimYear: {
      type: Number,
    },

    claimAmount: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Insurance", insuranceSchema);