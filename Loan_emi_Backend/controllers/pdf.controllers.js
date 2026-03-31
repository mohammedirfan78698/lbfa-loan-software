import PDFDocument from "pdfkit";
import Loan from "../models/loan.js";
import EmiSchedule from "../models/emischedule.js";
import Payment from "../models/payment.js";

/**
 * =====================================
 * LOAN STATEMENT PDF (SOFT DELETE SAFE)
 * GET /api/pdf/loan/:loanId
 * =====================================
 */
export const loanStatementPDF = async (req, res) => {
  try {
    const { loanId } = req.params;

    // 1️⃣ Get Loan (NOT deleted)
    const loan = await Loan.findOne({
      _id: loanId,
      isDeleted: false
    }).populate("customer");

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found"
      });
    }

    // 2️⃣ Get EMI schedule (NOT deleted)
    const emis = await EmiSchedule.find({
      loan: loanId,
      isDeleted: false
    }).sort({ installmentNumber: 1 });

    // 3️⃣ Get payments (NOT deleted)
    const payments = await Payment.find({
      loan: loanId,
      isDeleted: false
    }).sort({ createdAt: 1 });

    // 4️⃣ Response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Loan_Statement_${loanId}.pdf`
    );

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // 🔹 Header
    doc.fontSize(18).text("Loan Statement", { align: "center" });
    doc.moveDown();

    // 🔹 Customer & Loan Info
    doc.fontSize(11);
    doc.text(`Customer Name: ${loan.customer?.name || "-"}`);
    doc.text(`Loan Amount: ₹${loan.loanAmount}`);
    doc.text(`Interest Rate: ${loan.interestRate}%`);
    doc.text(`Duration: ${loan.durationMonths} months`);
    doc.text(`Status: ${loan.status.toUpperCase()}`);
    doc.moveDown();

    // 🔹 EMI Schedule
    doc.fontSize(13).text("EMI Schedule", { underline: true });
    doc.moveDown(0.5);

    if (emis.length === 0) {
      doc.fontSize(10).text("No EMI records found");
    }

    emis.forEach(emi => {
      doc
        .fontSize(10)
        .text(
          `#${emi.installmentNumber} | ₹${emi.amount} | ${emi.status.toUpperCase()} | Due: ${
            emi.dueDate
              ? emi.dueDate.toISOString().split("T")[0]
              : "-"
          }`
        );
    });

    doc.moveDown();

    // 🔹 Payments Summary
    doc.fontSize(13).text("Payments Summary", { underline: true });
    doc.moveDown(0.5);

    if (payments.length === 0) {
      doc.fontSize(10).text("No payment records found");
    }

    payments.forEach(p => {
      doc
        .fontSize(10)
        .text(
          `₹${p.amount} | ${p.paymentMode.toUpperCase()} | ${
            p.createdAt
              ? p.createdAt.toISOString().split("T")[0]
              : "-"
          }`
        );
    });

    doc.end();

  } catch (error) {
    console.error("PDF error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
