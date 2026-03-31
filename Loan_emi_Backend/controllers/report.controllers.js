import Payment from "../models/payment.js";

/**
 * 📊 Monthly Collection Report
 * GET /api/reports/monthly?month=2&year=2026
 */
export const monthlyCollectionReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const payments = await Payment.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let totalAmount = 0;
    let upi = 0;
    let cash = 0;

    payments.forEach(p => {
      totalAmount += p.amount;

      if (p.paymentMode === "upi") upi += p.amount;
      if (p.paymentMode === "cash") cash += p.amount;
    });

    res.status(200).json({
      success: true,
      month,
      year,
      totalEmisPaid: payments.length,
      totalAmountCollected: totalAmount,
      paymentModes: {
        upi,
        cash
      }
    });

  } catch (error) {
    console.error("Monthly report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
