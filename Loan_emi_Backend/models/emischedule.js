import mongoose from "mongoose";

const emiScheduleSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true
    },
    installmentNumber: Number,
    dueDate: Date,
    amount: Number,
    principalAmount: Number,
    interestAmount: Number,
    totalAmount: Number,

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    paymentDate: {
      type: Date,
      default: null
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("EmiSchedule", emiScheduleSchema);
