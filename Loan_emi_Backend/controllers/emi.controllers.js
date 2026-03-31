import EmiSchedule from "../models/emischedule.js";
import Loan from "../models/loan.js";
import Payment from "../models/payment.js";
import mongoose from "mongoose";

/**
 * =====================================
 * PAY EMI
 * =====================================
 */
export const payEmi = async (req, res) => {
  try {
    const emiId = String(req.params.emiId).trim();

    if (!mongoose.Types.ObjectId.isValid(emiId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid EMI ID",
      });
    }

    const emi = await EmiSchedule.findOne({
      _id: emiId,
      isDeleted: false,
    });

    if (!emi) {
      return res.status(404).json({
        success: false,
        message: "EMI not found",
      });
    }

    if (emi.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "EMI already paid",
      });
    }

    const loan = await Loan.findOne({
      _id: emi.loan,
      isDeleted: false,
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    await Payment.create({
      customer: loan.customer,
      loan: loan._id,
      emi: emi._id,
      amount: req.body.amount || emi.totalAmount || emi.amount || 0,
      paymentType: "emi",
      paymentMode: (req.body?.paymentMode || "cash").toLowerCase(),
      paymentDate: req.body?.paymentDate ? new Date(req.body.paymentDate) : new Date(),
    });

    emi.status = "paid";
    emi.paymentDate = req.body?.paymentDate ? new Date(req.body.paymentDate) : new Date();
    await emi.save();

    const pendingEmis = await EmiSchedule.countDocuments({
      loan: loan._id,
      status: "pending",
      isDeleted: false,
    });

    let message = "EMI paid successfully";

    if (pendingEmis === 0) {
      loan.status = "closed";
      loan.closedAt = new Date();
      await loan.save();

      message = "🎉 Last EMI paid. Loan closed successfully!";
    }

    return res.status(200).json({
      success: true,
      message,
      pendingEmis,
    });
  } catch (error) {
    console.error("🔥 PAY EMI ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * =====================================
 * GET PAYMENTS BY LOAN
 * =====================================
 */
export const getLoanPayments = async (req, res) => {
  try {
    const { loanId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Loan ID",
      });
    }

    const payments = await Payment.find({
      loan: new mongoose.Types.ObjectId(loanId),
      isDeleted: false,
    })
      .populate("customer", "name mobile")
      .populate("loan")
      .populate("emi")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("🔥 GET LOAN PAYMENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =====================================
 * GET PAYMENTS BY EMI
 * =====================================
 */
export const getEmiPayments = async (req, res) => {
  try {
    const { emiId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(emiId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid EMI ID",
      });
    }

    const payments = await Payment.find({
      emi: emiId,
      isDeleted: false,
    })
      .populate("customer", "name mobile")
      .populate("loan")
      .populate("emi")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("🔥 GET EMI PAYMENTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =====================================
 * GET EMIs BY LOAN
 * =====================================
 */
export const getEmisByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { status, type, page = 1, limit } = req.query;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "Loan ID is required",
      });
    }

    let query = {
      loan: loanId,
      isDeleted: false,
    };

    if (status) {
      query.status = status;
    }

    const today = new Date();

    if (type === "overdue") {
      query.status = "pending";
      query.dueDate = { $lt: today };
    }

    if (type === "upcoming") {
      query.status = "pending";
      query.dueDate = { $gte: today };
    }

    const pageNumber = Number(page) || 1;
    const limitNumber = limit ? Number(limit) : null;
    const skip = limitNumber ? (pageNumber - 1) * limitNumber : 0;

    let emiQuery = EmiSchedule.find(query).sort({ installmentNumber: 1 });

    if (limitNumber) {
      emiQuery = emiQuery.skip(skip).limit(limitNumber);
    }

    const emis = await emiQuery;
    const total = await EmiSchedule.countDocuments(query);

    return res.status(200).json({
      success: true,
      page: pageNumber,
      limit: limitNumber,
      totalPages: limitNumber ? Math.ceil(total / limitNumber) : 1,
      total,
      count: emis.length,
      data: emis,
    });
  } catch (error) {
    console.error("🔥 GET EMIS BY LOAN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =====================================
 * GET ALL EMIs
 * =====================================
 */
export const getAllEmis = async (req, res) => {
  try {
    let { status, page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const skip = (page - 1) * limit;

    let query = { isDeleted: false };

    if (status) {
      query.status = status;
    }

    const emis = await EmiSchedule.find(query)
      .populate({
        path: "loan",
        populate: {
          path: "customer",
          select: "name mobile",
        },
      })
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await EmiSchedule.countDocuments(query);

    return res.status(200).json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      count: emis.length,
      total,
      data: emis,
    });
  } catch (error) {
    console.error("🔥 GET ALL EMIS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =====================================
 * GET PAYMENTS BY CUSTOMER
 * =====================================
 */
export const getCustomerPayments = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer ID",
      });
    }

    const payments = await Payment.find({
      customer: customerId,
      isDeleted: false,
    })
      .populate("loan")
      .populate("emi")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("🔥 GET CUSTOMER PAYMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =====================================
 * GET OVERDUE EMIs
 * =====================================
 */
export const getOverdueEmis = async (req, res) => {
  try {
    const today = new Date();

    const overdueEmis = await EmiSchedule.find({
      status: "pending",
      dueDate: { $lt: today },
      isDeleted: false,
    })
      .populate({
        path: "loan",
        populate: {
          path: "customer",
          select: "name mobile",
        },
      })
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: overdueEmis.length,
      data: overdueEmis,
    });
  } catch (error) {
    console.error("🔥 GET OVERDUE EMIS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * =====================================
 * MEMBER LEDGER
 * =====================================
 * Keeping this safe/minimal so backend does not break.
 * Proper ledger logic should come from MemberLedger controller/model,
 * not from EMI + Insurance guessing here.
 */
export const getMemberLedger = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Customer ID",
      });
    }

    const activeLoan = await Loan.findOne({
      customer: customerId,
      status: "active",
      isDeleted: false,
    });

    let nextPendingEmi = null;

    if (activeLoan) {
      nextPendingEmi = await EmiSchedule.findOne({
        loan: activeLoan._id,
        status: "pending",
        isDeleted: false,
      }).sort({ installmentNumber: 1 });
    }

    const shareAmount = 200;
    const emiDue = nextPendingEmi ? nextPendingEmi.totalAmount || 0 : 0;
    const insuranceDue = 0;
    const totalPayable = shareAmount + emiDue + insuranceDue;

    return res.status(200).json({
      success: true,
      shareAmount,
      emiDue,
      insuranceDue,
      totalPayable,
      activeLoan: activeLoan || null,
      nextPendingEmi: nextPendingEmi || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};