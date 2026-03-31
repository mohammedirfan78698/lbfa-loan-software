import Loan from "../models/loan.js";
import Customer from "../models/customers.js";
import EmiSchedule from "../models/emischedule.js";
import { logActivity } from "../middleware/activity.middleware.js";
import MemberLedger from "../models/memberLedger.js";

const calculateEMISchedule = (principal, monthlyRate, months) => {
  const P = Number(principal);
  const R = Number(monthlyRate);
  const N = Number(months);

  if (!P || !N) return [];

  const fixedPrincipalPayment = Math.floor(P / N);
  let remainingBalance = P;

  const schedule = [];

  for (let month = 1; month <= N; month++) {
    const principalPaid = month === N ? remainingBalance : fixedPrincipalPayment;
    const interestAmount = Math.round((remainingBalance * R) / 100);
    const totalPayment = principalPaid + interestAmount;
    const newBalance = remainingBalance - principalPaid;

    schedule.push({
      month,
      principalPaid,
      interestPaid: interestAmount,
      totalPayment,
      remainingBalance: newBalance,
    });

    remainingBalance = newBalance;
  }

  return schedule;
};

const getDetailedEMIInfo = (principal, interestRate, months) => {
  const P = Number(principal);
  const R = Number(interestRate);
  const N = Number(months);

  const schedule = calculateEMISchedule(P, R, N);

  let totalPayments = 0;
  let totalInterest = 0;

  schedule.forEach((item) => {
    totalPayments += item.totalPayment;
    totalInterest += item.interestPaid;
  });

  const firstMonth = schedule[0] || {};
  const lastMonth = schedule[schedule.length - 1] || {};

  return {
    fixedPrincipalPayment: Math.floor(P / N),
    monthlyInterestRate: R,
    totalPayments,
    totalInterest,
    totalAmount: totalPayments,
    firstMonthBreakdown: {
      month: 1,
      remainingBalanceAtStart: P,
      principalAmount: firstMonth.principalPaid || 0,
      interestAmount: firstMonth.interestPaid || 0,
      totalPayment: firstMonth.totalPayment || 0,
      remainingBalanceAfter: firstMonth.remainingBalance || 0,
    },
    lastMonthBreakdown: {
      month: N,
      remainingBalanceAtStart:
        (lastMonth.remainingBalance || 0) + (lastMonth.principalPaid || 0),
      principalAmount: lastMonth.principalPaid || 0,
      interestAmount: lastMonth.interestPaid || 0,
      totalPayment: lastMonth.totalPayment || 0,
      remainingBalanceAfter: lastMonth.remainingBalance || 0,
    },
    fullSchedule: schedule,
  };
};

const getMonthKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const monthNumber = d.getMonth() + 1;
  const month = `${year}-${String(monthNumber).padStart(2, "0")}`;
  return { year, monthNumber, month };
};

export const createLoan = async (req, res) => {
  try {
    const {
      customerId,
      loanAmount,
      interestRate,
      durationMonths,
      startDate,
    } = req.body;

    if (
      !customerId ||
      loanAmount === undefined ||
      interestRate === undefined ||
      durationMonths === undefined ||
      !startDate
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
        received: req.body,
      });
    }

    const customerExists = await Customer.findOne({
      _id: customerId,
      isDeleted: false,
    });

    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const existingLoan = await Loan.findOne({
      customer: customerId,
      status: "active",
      isDeleted: false,
    });

    if (existingLoan) {
      return res.status(400).json({
        success: false,
        message: "Customer already has an active loan.",
      });
    }

    const emiInfo = getDetailedEMIInfo(
      loanAmount,
      interestRate,
      durationMonths
    );

    const loan = await Loan.create({
      customer: customerId,
      loanAmount,
      interestRate,
      durationMonths,
      startDate,
      emi: emiInfo.firstMonthBreakdown.totalPayment,
      totalInterest: emiInfo.totalInterest,
      totalPayable: emiInfo.totalAmount,
      status: "active",
      isDeleted: false,
    });

    const schedules = [];

    for (let i = 1; i <= durationMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      const scheduleItem = emiInfo.fullSchedule[i - 1];

      schedules.push({
        loan: loan._id,
        installmentNumber: i,
        dueDate,
        principalAmount: scheduleItem.principalPaid,
        interestAmount: scheduleItem.interestPaid,
        totalAmount: scheduleItem.totalPayment,
        status: "pending",
        isDeleted: false,
      });
    }

    const insertedEMIs = await EmiSchedule.insertMany(schedules);

    // ✅ Update current pending ledger of loan start month if exists
    const { year, monthNumber, month } = getMonthKey(startDate);
    const firstEMI = insertedEMIs[0] || null;

    const pendingLedger = await MemberLedger.findOne({
      customer: customerId,
      month,
      status: "pending",
      isDeleted: false,
    });

    if (pendingLedger) {
      const emiAmount = firstEMI ? firstEMI.totalAmount || 0 : 0;
      pendingLedger.loan = loan._id;
      pendingLedger.emi = firstEMI?._id || null;
      pendingLedger.emiAmount = emiAmount;
      pendingLedger.totalAmount =
        (pendingLedger.shareAmount || 0) +
        (pendingLedger.joiningFee || 0) +
        (pendingLedger.insuranceAmount || 0) +
        emiAmount;

      await pendingLedger.save();
    } else if (customerExists.paymentGenerationActive) {
      const alreadyExists = await MemberLedger.findOne({
        customer: customerId,
        month,
        isDeleted: false,
      });

      if (!alreadyExists) {
        const paidCount = await MemberLedger.countDocuments({
          customer: customerId,
          status: "paid",
          isDeleted: false,
        });

        const sequence = paidCount + 1;
        const shareAmount = 200;
        const joiningFee = sequence === 1 ? Number(customerExists.joinFee || 0) : 0;
        const insuranceAmount = sequence % 12 === 0 ? 1000 : 0;
        const emiAmount = firstEMI ? firstEMI.totalAmount || 0 : 0;

        await MemberLedger.create({
          customer: customerId,
          loan: loan._id,
          emi: firstEMI?._id || null,
          month,
          year,
          monthNumber,
          paymentSequence: sequence,
          isFirstPayment: sequence === 1,
          isInsuranceCycle: sequence % 12 === 0,
          shareAmount,
          joiningFee,
          insuranceAmount,
          emiAmount,
          totalAmount: shareAmount + joiningFee + insuranceAmount + emiAmount,
          status: "pending",
          paymentMode: "cash",
          isDeleted: false,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Loan + EMI + Ledger synced successfully",
      data: loan,
    });
  } catch (error) {
    console.error("Loan create error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getEmiByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    const emis = await EmiSchedule.find({
      loan: loanId,
      isDeleted: false,
    }).sort({ installmentNumber: 1 });

    res.status(200).json({
      success: true,
      count: emis.length,
      data: emis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    const updatedLoan = await Loan.findOneAndUpdate(
      { _id: loanId, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedLoan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: updatedLoan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const skip = (page - 1) * limit;

    let searchFilter = { isDeleted: false };

    if (search) {
      const customers = await Customer.find({
        name: { $regex: search, $options: "i" },
        isDeleted: false,
      }).select("_id");

      const customerIds = customers.map((c) => c._id);
      searchFilter.customer = { $in: customerIds };
    }

    const loans = await Loan.find(searchFilter)
      .populate("customer", "name mobile")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Loan.countDocuments(searchFilter);

    res.status(200).json({
      success: true,
      data: loans,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get Loans Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate("customer");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const emis = await EmiSchedule.find({
      loan: loan._id,
      isDeleted: false
    }).sort({ installmentNumber: 1 });

    const totalLoanAmount = loan.totalPayable;

    const totalPaid = emis
      .filter(e => e.status === "paid")
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const totalRemaining = totalLoanAmount - totalPaid;

    const nextPendingEmi = emis.find(e => e.status === "pending");

    const currentEmiAmount = nextPendingEmi
      ? nextPendingEmi.totalAmount
      : 0;

    const progress =
      totalLoanAmount > 0
        ? ((totalPaid / totalLoanAmount) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        ...loan.toObject(),
        emiSchedule: emis,
        summary: {
          principalAmount: loan.loanAmount,
          totalLoanAmount,
          totalPaid,
          totalRemaining,
          currentEmiAmount,
          progress
        }
      }
    });
  } catch (error) {
    console.error("Error fetching loan:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching loan",
      error: error.message
    });
  }
};

export const getLoanEMIBreakdown = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findOne({
      _id: loanId,
      isDeleted: false,
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    const emiInfo = getDetailedEMIInfo(
      loan.loanAmount,
      loan.interestRate,
      loan.durationMonths
    );

    res.status(200).json({
      success: true,
      loanId: loan._id,
      loanAmount: loan.loanAmount,
      monthlyInterestRate: `${emiInfo.monthlyInterestRate}%`,
      durationMonths: loan.durationMonths,
      fixedPrincipalPayment: emiInfo.fixedPrincipalPayment,
      summary: {
        totalInterest: emiInfo.totalInterest,
        totalPayable: emiInfo.totalAmount,
      },
      firstMonthBreakdown: {
        month: 1,
        loanBalance: emiInfo.firstMonthBreakdown.remainingBalanceAtStart,
        principalPayment: emiInfo.firstMonthBreakdown.principalAmount,
        interestPayment: `${emiInfo.monthlyInterestRate}% of ${emiInfo.firstMonthBreakdown.remainingBalanceAtStart} = ${emiInfo.firstMonthBreakdown.interestAmount}`,
        totalPayment: emiInfo.firstMonthBreakdown.totalPayment,
        balanceAfterPayment: emiInfo.firstMonthBreakdown.remainingBalanceAfter,
      },
      secondMonthBreakdown: emiInfo.fullSchedule[1] ? {
        month: 2,
        loanBalance: emiInfo.fullSchedule[1].remainingBalance + emiInfo.fullSchedule[1].principalPaid,
        principalPayment: emiInfo.fullSchedule[1].principalPaid,
        interestPayment: `${emiInfo.monthlyInterestRate}% of ${emiInfo.fullSchedule[1].remainingBalance + emiInfo.fullSchedule[1].principalPaid} = ${emiInfo.fullSchedule[1].interestPaid}`,
        totalPayment: emiInfo.fullSchedule[1].totalPayment,
        balanceAfterPayment: emiInfo.fullSchedule[1].remainingBalance,
      } : null,
      fullSchedule: emiInfo.fullSchedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const closeLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findOne({
      _id: loanId,
      isDeleted: false,
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    if (loan.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Loan is already closed",
      });
    }

    loan.status = "closed";
    loan.closedAt = new Date();
    await loan.save();

    res.status(200).json({
      success: true,
      message: "Loan closed successfully",
      data: loan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const softDeleteLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findOneAndUpdate(
      { _id: loanId, isDeleted: false },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    if (req.user?.id) {
      await logActivity({
        action: "SOFT_DELETE",
        entityType: "Loan",
        entityId: loan._id,
        user: req.user.id,
        description: "Loan soft deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan soft deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLoansByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const loans = await Loan.find({
      customer: customerId,
      isDeleted: false,
    })
      .populate("customer", "name mobile")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: loans.length,
      data: loans,
    });
  } catch (error) {
    console.error("Get Loans By Customer Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch customer loan history",
    });
  }
};