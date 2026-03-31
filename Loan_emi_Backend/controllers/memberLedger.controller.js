import MemberLedger from "../models/memberLedger.js";
import Customer from "../models/customers.js";
import Loan from "../models/loan.js";
import EmiSchedule from "../models/emischedule.js";
import Payment from "../models/payment.js";

/* =========================================================
   HELPERS
========================================================= */

const normalizeDateOnly = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMonthKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const monthNumber = d.getMonth() + 1;
  const month = `${year}-${String(monthNumber).padStart(2, "0")}`;

  return { year, monthNumber, month };
};

const addOneMonthSameDay = (dateInput) => {
  const current = new Date(dateInput);
  const originalDay = current.getDate();

  const next = new Date(current);
  next.setMonth(next.getMonth() + 1);

  if (next.getDate() !== originalDay) {
    next.setDate(0);
  }

  next.setHours(0, 0, 0, 0);
  return next;
};

const getCustomerPaidCount = async (customerId) => {
  return await MemberLedger.countDocuments({
    customer: customerId,
    status: "paid",
    isDeleted: false,
  });
};

const getActiveLoanAndNextEmi = async (customerId) => {
  const activeLoan = await Loan.findOne({
    customer: customerId,
    status: "active",
    isDeleted: false,
  }).sort({ createdAt: -1 });

  if (!activeLoan) {
    return {
      loan: null,
      emi: null,
      emiAmount: 0,
    };
  }

  const nextEmi = await EmiSchedule.findOne({
    loan: activeLoan._id,
    status: "pending",
    isDeleted: false,
  }).sort({ installmentNumber: 1, dueDate: 1, createdAt: 1 });

  if (!nextEmi) {
    return {
      loan: activeLoan,
      emi: null,
      emiAmount: 0,
    };
  }

  return {
    loan: activeLoan,
    emi: nextEmi,
    emiAmount: Number(nextEmi.totalAmount || 0),
  };
};

const buildLedgerAmounts = async (customerId, sequence) => {
  const customer = await Customer.findById(customerId);

  if (!customer || customer.isDeleted) return null;

  const { loan, emi, emiAmount } = await getActiveLoanAndNextEmi(customerId);

  const shareAmount = 200;
  const joiningFee = sequence === 1 ? Number(customer.joinFee || 0) : 0;
  const insuranceAmount = sequence % 12 === 0 ? 1000 : 0;

  const totalAmount =
    Number(shareAmount) +
    Number(joiningFee) +
    Number(insuranceAmount) +
    Number(emiAmount);

  return {
    loan: loan?._id || null,
    emi: emi?._id || null,
    shareAmount,
    joiningFee,
    insuranceAmount,
    emiAmount,
    totalAmount,
    isFirstPayment: sequence === 1,
    isInsuranceCycle: sequence % 12 === 0,
  };
};

const enrichLedgerStatus = (row) => {
  const plain = row.toObject ? row.toObject() : row;
  const today = normalizeDateOnly(new Date());
  const dueDate = plain.dueDate ? normalizeDateOnly(plain.dueDate) : null;

  return {
    ...plain,
    isOverdue:
      plain.status === "pending" && dueDate ? dueDate < today : false,
  };
};

const repairLedgerRow = async (ledgerDoc) => {
  if (!ledgerDoc) return null;

  const sequence = Number(ledgerDoc.paymentSequence || 1);
  const amounts = await buildLedgerAmounts(ledgerDoc.customer, sequence);

  if (!amounts) return ledgerDoc;

  if (!ledgerDoc.dueDate) {
    const fallbackBase =
      ledgerDoc.createdAt ||
      new Date(`${ledgerDoc.year}-${String(ledgerDoc.monthNumber).padStart(2, "0")}-01`);

    ledgerDoc.dueDate = normalizeDateOnly(fallbackBase);
  }

  ledgerDoc.loan = amounts.loan;
  ledgerDoc.emi = amounts.emi;
  ledgerDoc.shareAmount = amounts.shareAmount;
  ledgerDoc.joiningFee = amounts.joiningFee;
  ledgerDoc.insuranceAmount = amounts.insuranceAmount;
  ledgerDoc.emiAmount = amounts.emiAmount;
  ledgerDoc.totalAmount = amounts.totalAmount;
  ledgerDoc.isFirstPayment = amounts.isFirstPayment;
  ledgerDoc.isInsuranceCycle = amounts.isInsuranceCycle;

  await ledgerDoc.save();
  return ledgerDoc;
};

const createFirstLedgerIfNeeded = async (customer) => {
  const baseDate = normalizeDateOnly(customer.dateOfJoin || new Date());
  const { year, monthNumber, month } = getMonthKey(baseDate);

  const existing = await MemberLedger.findOne({
    customer: customer._id,
    month,
    isDeleted: false,
  });

  if (existing) {
    if (!existing.dueDate) {
      existing.dueDate = baseDate;
      await existing.save();
    }

    await repairLedgerRow(existing);

    return await MemberLedger.findById(existing._id)
      .populate("customer")
      .populate("loan")
      .populate("emi");
  }

  const amounts = await buildLedgerAmounts(customer._id, 1);
  if (!amounts) return null;

  const created = await MemberLedger.create({
    customer: customer._id,
    loan: amounts.loan,
    emi: amounts.emi,
    dueDate: baseDate,
    month,
    year,
    monthNumber,
    paymentSequence: 1,
    isFirstPayment: true,
    isInsuranceCycle: false,
    shareAmount: amounts.shareAmount,
    joiningFee: amounts.joiningFee,
    insuranceAmount: amounts.insuranceAmount,
    emiAmount: amounts.emiAmount,
    totalAmount: amounts.totalAmount,
    status: "pending",
    paymentMode: "cash",
    isDeleted: false,
  });

  return await MemberLedger.findById(created._id)
    .populate("customer")
    .populate("loan")
    .populate("emi");
};

const createNextLedgerIfNeeded = async (customerId, currentLedger) => {
  const customer = await Customer.findById(customerId);

  if (!customer || customer.isDeleted) return null;
  if (customer.paymentGenerationActive === false) return null;

  const currentDueDate = normalizeDateOnly(
    currentLedger.dueDate ||
      new Date(`${currentLedger.year}-${String(currentLedger.monthNumber).padStart(2, "0")}-01`)
  );

  const nextDueDate = addOneMonthSameDay(currentDueDate);
  const { year: nextYear, monthNumber: nextMonthNumber, month: nextMonth } =
    getMonthKey(nextDueDate);

  const paidCount = await getCustomerPaidCount(customerId);
  const nextSequence = paidCount + 1;

  const existingNextLedger = await MemberLedger.findOne({
    customer: customerId,
    month: nextMonth,
    isDeleted: false,
  });

  if (existingNextLedger) {
    if (!existingNextLedger.dueDate) {
      existingNextLedger.dueDate = nextDueDate;
      await existingNextLedger.save();
    }

    if (existingNextLedger.status === "pending") {
      await repairLedgerRow(existingNextLedger);
    }

    return await MemberLedger.findById(existingNextLedger._id)
      .populate("customer")
      .populate("loan")
      .populate("emi");
  }

  const amounts = await buildLedgerAmounts(customerId, nextSequence);
  if (!amounts) return null;

  const newLedger = await MemberLedger.create({
    customer: customerId,
    loan: amounts.loan,
    emi: amounts.emi,
    dueDate: nextDueDate,
    month: nextMonth,
    year: nextYear,
    monthNumber: nextMonthNumber,
    paymentSequence: nextSequence,
    isFirstPayment: amounts.isFirstPayment,
    isInsuranceCycle: amounts.isInsuranceCycle,
    shareAmount: amounts.shareAmount,
    joiningFee: amounts.joiningFee,
    insuranceAmount: amounts.insuranceAmount,
    emiAmount: amounts.emiAmount,
    totalAmount: amounts.totalAmount,
    status: "pending",
    paymentMode: "cash",
    isDeleted: false,
  });

  return await MemberLedger.findById(newLedger._id)
    .populate("customer")
    .populate("loan")
    .populate("emi");
};

const buildCustomerLedgerResponse = async (customerId) => {
  let ledger = await MemberLedger.find({
    customer: customerId,
    isDeleted: false,
  })
    .populate("customer")
    .populate("loan")
    .populate("emi")
    .sort({ dueDate: 1, paymentSequence: 1, createdAt: 1 });

  for (const row of ledger) {
    if (row.status === "pending") {
      await repairLedgerRow(row);
    }
  }

  ledger = await MemberLedger.find({
    customer: customerId,
    isDeleted: false,
  })
    .populate("customer")
    .populate("loan")
    .populate("emi")
    .sort({ dueDate: 1, paymentSequence: 1, createdAt: 1 });

  const enrichedLedger = ledger.map(enrichLedgerStatus);

  const paidRows = enrichedLedger.filter((row) => row.status === "paid");

  const pendingRows = [...enrichedLedger]
    .filter((row) => row.status === "pending")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const latestPending = pendingRows[0] || null;

  const summary = {
    totalRecords: enrichedLedger.length,
    paidCount: paidRows.length,
    pendingCount: pendingRows.length,
    overdueCount: pendingRows.filter((row) => row.isOverdue).length,
    totalPaid: paidRows.reduce(
      (sum, row) => sum + Number(row.totalAmount || 0),
      0
    ),
    totalSharePaid: paidRows.reduce(
      (sum, row) => sum + Number(row.shareAmount || 0),
      0
    ),
    totalJoiningFeePaid: paidRows.reduce(
      (sum, row) => sum + Number(row.joiningFee || 0),
      0
    ),
    totalInsurancePaid: paidRows.reduce(
      (sum, row) => sum + Number(row.insuranceAmount || 0),
      0
    ),
    totalEmiPaid: paidRows.reduce(
      (sum, row) => sum + Number(row.emiAmount || 0),
      0
    ),
    pendingShareAmount: pendingRows.reduce(
      (sum, row) => sum + Number(row.shareAmount || 0),
      0
    ),
    pendingInsuranceAmount: pendingRows.reduce(
      (sum, row) => sum + Number(row.insuranceAmount || 0),
      0
    ),
    pendingEmiAmount: pendingRows.reduce(
      (sum, row) => sum + Number(row.emiAmount || 0),
      0
    ),
    activeLoan: enrichedLedger.some((row) => row.loan),
  };

  return {
    ledger: enrichedLedger,
    latestPending,
    summary,
  };
};

/* =========================================================
   GENERATE MONTHLY LEDGER
========================================================= */

export const generateMonthlyLedger = async (req, res) => {
  try {
    const customers = await Customer.find({
      isDeleted: false,
      paymentGenerationActive: { $ne: false },
    });

    let created = 0;
    let repaired = 0;

    for (const customer of customers) {
      let pendingLedger = await MemberLedger.findOne({
        customer: customer._id,
        status: "pending",
        isDeleted: false,
      }).sort({ dueDate: 1, paymentSequence: 1, createdAt: 1 });

      if (pendingLedger) {
        await repairLedgerRow(pendingLedger);
        repaired++;
        continue;
      }

      const lastLedger = await MemberLedger.findOne({
        customer: customer._id,
        isDeleted: false,
      }).sort({ dueDate: -1, paymentSequence: -1, createdAt: -1 });

      if (lastLedger) {
        const generated = await createNextLedgerIfNeeded(customer._id, lastLedger);
        if (generated) created++;
      } else {
        const first = await createFirstLedgerIfNeeded(customer);
        if (first) created++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Monthly ledger generated successfully",
      created,
      repaired,
    });
  } catch (error) {
    console.error("generateMonthlyLedger error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* =========================================================
   INTERNAL GENERATE
========================================================= */

const generateLedgerInternal = async () => {
  try {
    const customers = await Customer.find({
      isDeleted: false,
      paymentGenerationActive: { $ne: false },
    });

    for (const customer of customers) {
      let pendingLedger = await MemberLedger.findOne({
        customer: customer._id,
        status: "pending",
        isDeleted: false,
      }).sort({ dueDate: 1, paymentSequence: 1, createdAt: 1 });

      if (pendingLedger) {
        await repairLedgerRow(pendingLedger);
        continue;
      }

      const lastLedger = await MemberLedger.findOne({
        customer: customer._id,
        isDeleted: false,
      }).sort({ dueDate: -1, paymentSequence: -1, createdAt: -1 });

      if (lastLedger) {
        await createNextLedgerIfNeeded(customer._id, lastLedger);
      } else {
        await createFirstLedgerIfNeeded(customer);
      }
    }
  } catch (err) {
    console.error("generateLedgerInternal error:", err);
  }
};

/* =========================================================
   GET LEDGER LIST
========================================================= */

export const getLedger = async (req, res) => {
  try {
    await generateLedgerInternal();

    const ledgers = await MemberLedger.find({ isDeleted: false })
      .populate("customer", "name mobile paymentGenerationActive")
      .populate("loan")
      .populate("emi")
      .sort({ dueDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: ledgers.map(enrichLedgerStatus),
    });
  } catch (error) {
    console.error("getLedger error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE LEDGER
========================================================= */

export const getLedgerById = async (req, res) => {
  try {
    const ledger = await MemberLedger.findById(req.params.ledgerId)
      .populate("customer")
      .populate("loan")
      .populate("emi");

    if (!ledger || ledger.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found",
      });
    }

    if (ledger.status === "pending") {
      await repairLedgerRow(ledger);
    }

    const freshLedger = await MemberLedger.findById(req.params.ledgerId)
      .populate("customer")
      .populate("loan")
      .populate("emi");

    return res.status(200).json({
      success: true,
      data: enrichLedgerStatus(freshLedger),
    });
  } catch (error) {
    console.error("getLedgerById error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* =========================================================
   GET LEDGER BY CUSTOMER
========================================================= */

export const getLedgerByCustomer = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const customer = await Customer.findOne({
      _id: customerId,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await generateLedgerInternal();

    const { ledger, latestPending, summary } =
      await buildCustomerLedgerResponse(customerId);

    return res.status(200).json({
      success: true,
      customer,
      data: ledger,
      ledger,
      latestPending,
      summary,
    });
  } catch (error) {
    console.error("getLedgerByCustomer error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* =========================================================
   PAY LEDGER
========================================================= */

export const payLedger = async (req, res) => {
  try {
    const ledgerId = req.params.ledgerId;
    const { paymentMode, paymentDate } = req.body;

    const ledger = await MemberLedger.findById(ledgerId)
      .populate("customer")
      .populate("loan")
      .populate("emi");

    if (!ledger || ledger.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found",
      });
    }

    if (ledger.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Already paid",
      });
    }

    await repairLedgerRow(ledger);

    const payableLedger = await MemberLedger.findById(ledgerId)
      .populate("customer")
      .populate("loan")
      .populate("emi");

    const finalPaymentDate = paymentDate
      ? normalizeDateOnly(new Date(paymentDate))
      : normalizeDateOnly(new Date());

    const customerId = payableLedger.customer?._id || payableLedger.customer;

    if (payableLedger.emi) {
      const emiDoc = await EmiSchedule.findById(
        payableLedger.emi?._id || payableLedger.emi
      );

      if (emiDoc && emiDoc.status === "pending") {
        emiDoc.status = "paid";
        emiDoc.paymentDate = finalPaymentDate;
        await emiDoc.save();
      }
    }

    if (payableLedger.loan) {
      const loanId = payableLedger.loan?._id || payableLedger.loan;

      const pendingCount = await EmiSchedule.countDocuments({
        loan: loanId,
        status: "pending",
        isDeleted: false,
      });

      if (pendingCount === 0) {
        await Loan.findByIdAndUpdate(loanId, {
          status: "closed",
          closedAt: finalPaymentDate,
        });
      }
    }

    await Payment.create({
      customer: customerId,
      loan: payableLedger.loan?._id || payableLedger.loan || null,
      emi: payableLedger.emi?._id || payableLedger.emi || null,
      paymentType: "combined",
      joiningFee: Number(payableLedger.joiningFee || 0),
      shareAmount: Number(payableLedger.shareAmount || 0),
      emiAmount: Number(payableLedger.emiAmount || 0),
      insuranceAmount: Number(payableLedger.insuranceAmount || 0),
      amount: Number(payableLedger.totalAmount || 0),
      paymentMode: paymentMode || "cash",
      paymentDate: finalPaymentDate,
    });

    payableLedger.status = "paid";
    payableLedger.paymentMode = paymentMode || "cash";
    payableLedger.paymentDate = finalPaymentDate;
    await payableLedger.save();

    const nextLedger = await createNextLedgerIfNeeded(customerId, payableLedger);

    const paidLedger = await MemberLedger.findById(ledgerId)
      .populate("customer")
      .populate("loan")
      .populate("emi");

    const { ledger: fullLedger, latestPending, summary } =
      await buildCustomerLedgerResponse(customerId);

    const history = [...fullLedger].sort(
      (a, b) => new Date(b.dueDate) - new Date(a.dueDate)
    );

    return res.status(200).json({
      success: true,
      message: "Payment completed successfully",
      data: enrichLedgerStatus(paidLedger),
      receiptData: enrichLedgerStatus(paidLedger),
      nextLedger: nextLedger ? enrichLedgerStatus(nextLedger) : latestPending,
      latestPending: nextLedger ? enrichLedgerStatus(nextLedger) : latestPending,
      history,
      summary,
    });
  } catch (error) {
    console.error("payLedger error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/* =========================================================
   GET RECEIPT
========================================================= */

export const getReceipt = async (req, res) => {
  try {
    const { ledgerId } = req.params;

    const ledger = await MemberLedger.findById(ledgerId)
      .populate("customer")
      .populate("loan")
      .populate("emi");

    if (!ledger || ledger.isDeleted || ledger.status !== "paid") {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        receiptNo: ledger._id.toString().slice(-6),
        date: ledger.paymentDate,
        dueDate: ledger.dueDate,
        customerName: ledger.customer?.name || "",
        shareAmount: Number(ledger.shareAmount || 0),
        joiningFee: Number(ledger.joiningFee || 0),
        emiAmount: Number(ledger.emiAmount || 0),
        insuranceAmount: Number(ledger.insuranceAmount || 0),
        totalPaid: Number(ledger.totalAmount || 0),
        loanAmount: ledger.loan?.loanAmount || 0,
        paymentMode: ledger.paymentMode || "cash",
      },
    });
  } catch (err) {
    console.error("getReceipt error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

/* =========================================================
   CUSTOMER FINANCIAL SUMMARY
========================================================= */

export const getCustomerFinanceSummary = async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const paidLedgers = await MemberLedger.find({
      customer: customerId,
      status: "paid",
      isDeleted: false,
    }).sort({ dueDate: 1, paymentDate: 1 });

    const totalShare = paidLedgers.reduce(
      (sum, row) => sum + Number(row.shareAmount || 0),
      0
    );

    const totalInsurance = paidLedgers.reduce(
      (sum, row) => sum + Number(row.insuranceAmount || 0),
      0
    );

    const totalEmi = paidLedgers.reduce(
      (sum, row) => sum + Number(row.emiAmount || 0),
      0
    );

    const totalJoiningFee = paidLedgers.reduce(
      (sum, row) => sum + Number(row.joiningFee || 0),
      0
    );

    let lastShareDate = null;
    let lastInsuranceDate = null;
    let lastEmiDate = null;

    for (const row of paidLedgers) {
      if (Number(row.shareAmount || 0) > 0) lastShareDate = row.paymentDate;
      if (Number(row.insuranceAmount || 0) > 0) lastInsuranceDate = row.paymentDate;
      if (Number(row.emiAmount || 0) > 0) lastEmiDate = row.paymentDate;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalShare,
        totalInsurance,
        totalEmi,
        totalJoiningFee,
        lastShareDate,
        lastInsuranceDate,
        lastEmiDate,
      },
    });
  } catch (err) {
    console.error("getCustomerFinanceSummary error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};