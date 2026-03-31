import ExcelJS from "exceljs";
import EmiSchedule from "../models/emischedule.js";
import Loan from "../models/loan.js";
import Payment from "../models/payment.js";

/**
 * 📥 Export EMI Schedule to Excel
 * GET /api/export/emi/:loanId
 */
export const exportEmiScheduleExcel = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findOne({
      _id: loanId,
      isDeleted: false
    }).populate("customer");

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found or deleted"
      });
    }

    const emis = await EmiSchedule.find({
      loan: loanId,
      isDeleted: false
    }).sort({ installmentNumber: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("EMI Schedule");

    sheet.columns = [
      { header: "Installment No", key: "installmentNumber", width: 18 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Payment Date", key: "paymentDate", width: 20 }
    ];

    emis.forEach(emi => {
      sheet.addRow({
        installmentNumber: emi.installmentNumber,
        dueDate: emi.dueDate?.toISOString().split("T")[0],
        amount: emi.amount,
        status: emi.status,
        paymentDate: emi.paymentDate
          ? emi.paymentDate.toISOString().split("T")[0]
          : "-"
      });
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=EMI_Schedule_${loanId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Export EMI Excel error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * 📥 Export Payment History to Excel
 * GET /api/export/payments/:loanId
 */
export const exportPaymentExcel = async (req, res) => {
  try {
    const { loanId } = req.params;

    const payments = await Payment.find({
      loan: loanId,
      isDeleted: false
    })
      .populate("emi", "installmentNumber")
      .sort({ createdAt: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payments");

    sheet.columns = [
      { header: "Installment No", key: "emi", width: 18 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment Mode", key: "paymentMode", width: 15 },
      { header: "Payment Date", key: "createdAt", width: 20 }
    ];

    payments.forEach(p => {
      sheet.addRow({
        emi: p.emi?.installmentNumber || "-",
        amount: p.amount,
        paymentMode: p.paymentMode,
        createdAt: p.createdAt.toISOString().split("T")[0]
      });
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Payments_${loanId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Export payment Excel error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
