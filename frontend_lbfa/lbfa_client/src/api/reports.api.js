import axiosInstance from "./axios";

/**
 * 📄 Loan Statement PDF
 */
export const downloadLoanPDF = async (loanId) => {
  const response = await axiosInstance.get(
    `/pdf/loan/${loanId}`,
    { responseType: "blob" }   // VERY IMPORTANT
  );

  return response.data;
};

/**
 * 📊 Export EMI Excel
 */
export const exportEmiExcel = async (loanId) => {
  const response = await axiosInstance.get(
    `/export/emi/${loanId}`,
    { responseType: "blob" }
  );

  return response.data;
};

/**
 * 📊 Export Payment Excel
 */
export const exportPaymentExcel = async (loanId) => {
  const response = await axiosInstance.get(
    `/export/payments/${loanId}`,
    { responseType: "blob" }
  );

  return response.data;
};

/**
 * 📈 Monthly Collection Report
 */
import axios from "axios";

export const getMonthlyReport = async (month, year) => {
  if (!month || !year) {
    const today = new Date();
    month = month || today.getMonth() + 1;
    year = year || today.getFullYear();
  }

  const res = await axios.get(`/api/reports/monthly?month=${month}&year=${year}`);
  return res.data;
};


