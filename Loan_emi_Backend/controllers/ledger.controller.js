import MemberLedger from "../models/memberLedger.js";
import Loan from "../models/loan.js";
import EmiSchedule from "../models/emischedule.js";
import Customer from "../models/customers.js";

/*
========================================
HELPERS
========================================
*/
const getMonthKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const monthNumber = d.getMonth() + 1;
  const month = `${year}-${String(monthNumber).padStart(2, "0")}`;
  return { year, monthNumber, month };
};

const getNextMonthKey = (year, monthNumber) => {
  let nextMonthNumber = monthNumber + 1;
  let nextYear = year;

  if (nextMonthNumber > 12) {
    nextMonthNumber = 1;
    nextYear += 1;
  }

  const nextMonth = `${nextYear}-${String(nextMonthNumber).padStart(2, "0")}`;

  return {
    nextYear,
    nextMonthNumber,
    nextMonth,
  };
};

const getCustomerPaidCount = async (customerId) => {
  return await MemberLedger.countDocuments({
    customer: customerId,
    status: "paid",
    isDeleted: false,
  });
};

const getNextPendingLoanEmi = async (customerId) => {
  const activeLoan = await Loan.findOne({
    customer: customerId,
    status: "active",
    isDeleted: false,
  });

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
  }).sort({ installmentNumber: 1, dueDate: 1 });

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

  const { loan, emi, emiAmount } = await getNextPendingLoanEmi(customerId);

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

const repairLedgerRow = async (ledgerDoc) => {
  if (!ledgerDoc) return null;

  const sequence = Number(ledgerDoc.paymentSequence || 1);
  const amounts = await buildLedgerAmounts(ledgerDoc.customer, sequence);

  if (!amounts) return ledgerDoc;

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

const createNextLedgerIfNeeded = async (customerId, currentLedger) => {
  const customer = await Customer.findById(customerId);

  if (!customer || customer.isDeleted) return null;
  if (!customer.paymentGenerationActive) return null;

  const { nextYear, nextMonthNumber, nextMonth } = getNextMonthKey(
    currentLedger.year,
    currentLedger.monthNumber
  );

  const paidCount = await getCustomerPaidCount(customerId);
  const nextSequence = paidCount + 1;

  const existingNextLedger = await MemberLedger.findOne({
    customer: customerId,
    month: nextMonth,
    isDeleted: false,
  });

  if (existingNextLedger) {
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

/*
========================================
GET ALL LEDGER
========================================
*/
export const getAllLedger = async (req, res) => {
  try {
    const data = await MemberLedger.find({ isDeleted: false })
      .populate("customer")
      .populate("loan")
      .populate("emi")
      .sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/*
========================================
GET SINGLE LEDGER
========================================
*/
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

    res.json({ success: true, data: ledger });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/*
========================================
GET BY CUSTOMER
========================================
*/
export const getLedgerByCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.customerId,
      isDeleted: false,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    let ledger = await MemberLedger.find({
      customer: req.params.customerId,
      isDeleted: false,
    })
      .populate("customer")
      .populate("loan")
      .populate("emi")
      .sort({ year: 1, monthNumber: 1, paymentSequence: 1 });

    for (const row of ledger) {
      if (row.status === "pending") {
        await repairLedgerRow(row);
      }
    }

    ledger = await MemberLedger.find({
      customer: req.params.customerId,
      isDeleted: false,
    })
      .populate("customer")
      .populate("loan")
      .populate("emi")
      .sort({ year: 1, monthNumber: 1, paymentSequence: 1 });

    const paidRows = ledger.filter((row) => row.status === "paid");
    const latestPending = ledger.find((row) => row.status === "pending") || null;

    const summary = {
      totalRecords: ledger.length,
      paidCount: paidRows.length,
      pendingCount: ledger.filter((row) => row.status === "pending").length,
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
      activeLoan: ledger.some((row) => row.loan),
    };

    res.json({
      success: true,
      data: ledger,
      customer,
      ledger,
      latestPending,
      summary,
    });
  } catch (err) {
    console.error("Get Ledger By Customer Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/*
========================================
PAY LEDGER
========================================
*/
export const payLedger = async (req, res) => {
  try {
    const { paymentMode, paymentDate } = req.body;
    const { ledgerId } = req.params;

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
        message: "This payment is already completed",
      });
    }

    // always repair pending row before payment
    await repairLedgerRow(ledger);

    // reload repaired row
    const payableLedger = await MemberLedger.findById(ledgerId)
      .populate("customer")
      .populate("loan")
      .populate("emi");

    // pay attached EMI if exists
    if (payableLedger?.emi) {
      const emiDoc = await EmiSchedule.findById(payableLedger.emi);

      if (emiDoc && emiDoc.status === "pending") {
        emiDoc.status = "paid";
        emiDoc.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
        await emiDoc.save();
      }
    }

    // close loan if all emis are paid
    if (payableLedger?.loan) {
      const pendingEmiCount = await EmiSchedule.countDocuments({
        loan: payableLedger.loan._id || payableLedger.loan,
        status: "pending",
        isDeleted: false,
      });

      if (pendingEmiCount === 0) {
        await Loan.findByIdAndUpdate(payableLedger.loan._id || payableLedger.loan, {
          status: "closed",
          closedAt: new Date(),
        });
      }
    }

    // mark ledger paid
    payableLedger.status = "paid";
    payableLedger.paymentMode = paymentMode || "cash";
    payableLedger.paymentDate = paymentDate ? new Date(paymentDate) : new Date();

    await payableLedger.save();

    const customerId = payableLedger.customer?._id || payableLedger.customer;

    // create next payment row in month-based system
    const nextLedger = await createNextLedgerIfNeeded(customerId, payableLedger);

    // fresh paid ledger for receipt
    const paidLedger = await MemberLedger.findById(ledgerId)
      .populate("customer")
      .populate("loan")
      .populate("emi");

    const history = await MemberLedger.find({
      customer: customerId,
      isDeleted: false,
    })
      .populate("customer")
      .populate("loan")
      .populate("emi")
      .sort({ year: -1, monthNumber: -1, paymentSequence: -1 });

    return res.status(200).json({
      success: true,
      message: "Payment completed successfully",
      data: paidLedger,
      receiptData: paidLedger,
      nextLedger,
      history,
    });
  } catch (error) {
    console.error("payLedger error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process payment",
      error: error.message,
    });
  }
};

/*
========================================
GENERATE LEDGER
========================================
*/
export const generateLedger = async (req, res) => {
  try {
    const customers = await Customer.find({
      isDeleted: false,
      paymentGenerationActive: true,
    });

    let created = 0;
    let repaired = 0;

    for (const customer of customers) {
      let pendingLedger = await MemberLedger.findOne({
        customer: customer._id,
        status: "pending",
        isDeleted: false,
      }).sort({ year: 1, monthNumber: 1, paymentSequence: 1 });

      if (pendingLedger) {
        await repairLedgerRow(pendingLedger);
        repaired++;
        continue;
      }

      const lastLedger = await MemberLedger.findOne({
        customer: customer._id,
        isDeleted: false,
      }).sort({ year: -1, monthNumber: -1, paymentSequence: -1 });

      if (lastLedger) {
        const generated = await createNextLedgerIfNeeded(customer._id, lastLedger);
        if (generated) created++;
      } else {
        const baseDate = customer.dateOfJoin || new Date();
        const { year, monthNumber, month } = getMonthKey(baseDate);

        const alreadyExists = await MemberLedger.findOne({
          customer: customer._id,
          month,
          isDeleted: false,
        });

        if (alreadyExists) {
          await repairLedgerRow(alreadyExists);
          repaired++;
        } else {
          const shareAmount = 200;
          const joiningFee = Number(customer.joinFee || 0);
          const insuranceAmount = 0;
          const emiAmount = 0;
          const totalAmount =
            Number(shareAmount) +
            Number(joiningFee) +
            Number(insuranceAmount) +
            Number(emiAmount);

          await MemberLedger.create({
            customer: customer._id,
            loan: null,
            emi: null,
            month,
            year,
            monthNumber,
            paymentSequence: 1,
            isFirstPayment: true,
            isInsuranceCycle: false,
            shareAmount,
            joiningFee,
            insuranceAmount,
            emiAmount,
            totalAmount,
            status: "pending",
            paymentMode: "cash",
            isDeleted: false,
          });
          created++;
        }
      }
    }

    res.json({
      success: true,
      message: "Ledger generation completed successfully",
      created,
      repaired,
    });
  } catch (err) {
    console.error("Generate Ledger Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};