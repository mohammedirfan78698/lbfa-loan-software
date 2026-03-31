import Loan from "../models/loan.js";
import EmiSchedule from "../models/emischedule.js";
import Customer from "../models/customers.js";
import Payment from "../models/payment.js";
import MemberLedger from "../models/memberLedger.js";

/**
 * 📊 ADMIN DASHBOARD STATS (ONLY ACTIVE DATA)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const firstDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // -------------------------------
    // OVERDUE > 30 DAYS
    // -------------------------------
    const overdue30Days = await EmiSchedule.countDocuments({
      status: "pending",
      dueDate: { $lte: thirtyDaysAgo },
      isDeleted: false,
    });

    // -------------------------------
    // BASIC COUNTS
    // -------------------------------
    const totalCustomers = await Customer.countDocuments({
      isDeleted: false,
    });

    const totalLoans = await Loan.countDocuments({
      isDeleted: false,
    });

    const activeLoans = await Loan.countDocuments({
      status: "active",
      isDeleted: false,
    });

    // -------------------------------
    // EMI STATS
    // -------------------------------
    const emisDueThisMonth = await EmiSchedule.countDocuments({
      status: "pending",
      dueDate: {
        $gte: firstDayOfMonth,
        $lte: lastDayOfMonth,
      },
      isDeleted: false,
    });

    const totalPendingEmis = await EmiSchedule.countDocuments({
      status: "pending",
      dueDate: { $lte: endOfToday },
      isDeleted: false,
    });

    // -------------------------------
    // TOTAL OUTSTANDING EMI AMOUNT
    // -------------------------------
    const outstanding = await EmiSchedule.aggregate([
      {
        $match: {
          status: "pending",
          dueDate: { $lte: endOfToday },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalOutstandingAmount =
      outstanding.length > 0 ? outstanding[0].total : 0;

    // -------------------------------
    // PENDING LEDGER TOTALS
    // -------------------------------
    const pendingLedgerAgg = await MemberLedger.aggregate([
      {
        $match: {
          status: "pending",
          isDeleted: false,
          dueDate: { $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: null,
          pendingShareAmount: { $sum: "$shareAmount" },
          pendingInsuranceAmount: { $sum: "$insuranceAmount" },
          pendingEmiAmount: { $sum: "$emiAmount" },
          totalPendingLedgerAmount: { $sum: "$totalAmount" },
          pendingLedgerCount: { $sum: 1 },
        },
      },
    ]);

    const pendingLedgerStats = pendingLedgerAgg[0] || {
      pendingShareAmount: 0,
      pendingInsuranceAmount: 0,
      pendingEmiAmount: 0,
      totalPendingLedgerAmount: 0,
      pendingLedgerCount: 0,
    };

    // -------------------------------
    // DUE MEMBERS LIST (GROUPED BY CUSTOMER)
    // -------------------------------
    const dueLedgers = await MemberLedger.find({
      status: "pending",
      dueDate: { $lte: endOfToday },
      isDeleted: false,
    })
      .populate("customer", "name mobile")
      .sort({ dueDate: 1 });

    const customerMap = new Map();

    dueLedgers.forEach((ledger) => {
      const customer = ledger.customer;
      if (!customer) return;

      const customerId = customer._id.toString();

      const dueDate = new Date(ledger.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const daysLate = Math.max(
        0,
        Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
      );

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName: customer.name,
          mobile: customer.mobile,
          totalOverdueAmount: Number(ledger.totalAmount || 0),
          pendingRows: 1,
          latestDueDate: ledger.dueDate,
          maxDaysLate: daysLate,
          pendingShareAmount: Number(ledger.shareAmount || 0),
          pendingInsuranceAmount: Number(ledger.insuranceAmount || 0),
          pendingEmiAmount: Number(ledger.emiAmount || 0),
        });
      } else {
        const existing = customerMap.get(customerId);

        existing.totalOverdueAmount += Number(ledger.totalAmount || 0);
        existing.pendingRows += 1;
        existing.pendingShareAmount += Number(ledger.shareAmount || 0);
        existing.pendingInsuranceAmount += Number(ledger.insuranceAmount || 0);
        existing.pendingEmiAmount += Number(ledger.emiAmount || 0);

        if (daysLate > existing.maxDaysLate) {
          existing.maxDaysLate = daysLate;
          existing.latestDueDate = ledger.dueDate;
        }

        customerMap.set(customerId, existing);
      }
    });

    const dueMembers = Array.from(customerMap.values());

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalLoans,
        activeLoans,
        emisDueThisMonth,
        totalPendingEmis,
        overdue30Days,
        totalOutstandingAmount,
        pendingShareAmount: pendingLedgerStats.pendingShareAmount || 0,
        pendingInsuranceAmount: pendingLedgerStats.pendingInsuranceAmount || 0,
        pendingEmiAmount: pendingLedgerStats.pendingEmiAmount || 0,
        totalPendingLedgerAmount: pendingLedgerStats.totalPendingLedgerAmount || 0,
        pendingLedgerCount: pendingLedgerStats.pendingLedgerCount || 0,
        dueMembers,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * 📄 SINGLE LOAN DASHBOARD
 */
export const getLoanDashboard = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findOne({
      _id: loanId,
      isDeleted: false,
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found or deleted",
      });
    }

    const emis = await EmiSchedule.find({
      loan: loanId,
      isDeleted: false,
    }).sort({ installmentNumber: 1, dueDate: 1 });

    const totalEmis = emis.length;
    const paidEmis = emis.filter((e) => e.status === "paid").length;
    const pendingEmis = totalEmis - paidEmis;

    const totalPaidAmount = emis
      .filter((e) => e.status === "paid")
      .reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);

    const totalPayable = emis.reduce(
      (sum, e) => sum + Number(e.totalAmount || 0),
      0
    );

    const pendingAmount = totalPayable - totalPaidAmount;

    const nextEmi = emis.find((e) => e.status === "pending");

    res.status(200).json({
      success: true,
      loan: {
        loanAmount: loan.loanAmount,
        interestRate: loan.interestRate,
        durationMonths: loan.durationMonths,
        status: loan.status,
        startDate: loan.startDate,
        closedAt: loan.closedAt || null,
      },
      summary: {
        totalEmis,
        paidEmis,
        pendingEmis,
        totalPayable,
        totalPaidAmount,
        pendingAmount,
        nextEmiDate: nextEmi ? nextEmi.dueDate : null,
      },
    });
  } catch (error) {
    console.error("Loan dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * 👤 CUSTOMER DASHBOARD
 */
export const getCustomerDashboard = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findOne({
      _id: customerId,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or deleted",
      });
    }

    const loans = await Loan.find({
      customer: customerId,
      isDeleted: false,
    });

    const loanIds = loans.map((l) => l._id);

    const emis = await EmiSchedule.find({
      loan: { $in: loanIds },
      isDeleted: false,
    });

    let totalLoanAmount = 0;
    let totalPayable = 0;
    let totalPaid = 0;

    const loanCards = loans.map((loan) => {
      const loanEmis = emis.filter(
        (e) => String(e.loan) === String(loan._id)
      );

      const paidEmis = loanEmis.filter((e) => e.status === "paid");
      const pendingEmis = loanEmis.filter((e) => e.status === "pending");

      const paidAmount = paidEmis.reduce(
        (s, e) => s + Number(e.totalAmount || 0),
        0
      );

      const payable = loanEmis.reduce(
        (s, e) => s + Number(e.totalAmount || 0),
        0
      );

      totalLoanAmount += Number(loan.loanAmount || 0);
      totalPayable += payable;
      totalPaid += paidAmount;

      const nextEmi = pendingEmis.sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
      )[0];

      return {
        loanId: loan._id,
        loanAmount: loan.loanAmount,
        status: loan.status,
        pendingEmis: pendingEmis.length,
        nextEmiDate: nextEmi ? nextEmi.dueDate : null,
      };
    });

    res.status(200).json({
      success: true,
      customer: {
        name: customer.name,
        mobile: customer.mobile,
      },
      summary: {
        totalLoans: loans.length,
        activeLoans: loans.filter((l) => l.status === "active").length,
        closedLoans: loans.filter((l) => l.status === "closed").length,
        totalLoanAmount,
        totalPayable,
        totalPaid,
        totalPending: totalPayable - totalPaid,
      },
      loans: loanCards,
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};