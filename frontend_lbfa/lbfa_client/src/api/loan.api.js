import api from "./axios";

/*
========================================
LOANS
========================================
*/

// Get All Loans (Pagination + Search)
export const getLoans = async (page = 1, search = "") => {
  const res = await api.get(
    `/loans?page=${page}&limit=10&search=${encodeURIComponent(search)}`
  );
  return res.data;
};

// Alias
export const getAllLoans = getLoans;

// Create Loan
export const createLoan = async (data) => {
  try {
    const res = await api.post("/loans/create", {
      ...data,
      loanAmount: Number(data.loanAmount),
      interestRate: Number(data.interestRate),
      durationMonths: Number(data.durationMonths),
    });

    return res.data;
  } catch (error) {
    console.error("CREATE LOAN ERROR:", error.response?.data);
    throw error;
  }
};

// Delete Loan
export const deleteLoan = async (id) => {
  const res = await api.delete(`/loans/${id}`);
  return res.data;
};

// Get Loan By ID
export const getLoanById = async (id) => {
  const res = await api.get(`/loans/${id}`);
  return res.data;
};

// Get All Loans Of One Customer
export const getLoansByCustomer = async (customerId) => {
  const res = await api.get(`/loans/customer/${customerId}`);
  return res.data;
};

/*
========================================
EMI
========================================
*/

// Get All EMIs
export const getEmis = async () => {
  const res = await api.get("/emi");
  return res.data;
};

// Get EMIs By Loan
export const getEmisByLoan = async (loanId) => {
  const res = await api.get(`/emi/loan/${loanId}`);
  return res.data;
};

// Pay EMI
export const payEmi = async (emiId) => {
  const res = await api.put(`/emi/pay/${emiId}`);
  return res.data;
};

// Get Payments By Loan
export const getLoanPayments = async (loanId) => {
  const res = await api.get(`/emi/payments/loan/${loanId}`);
  return res.data;
};

// Get Payments By EMI
export const getEmiPayments = async (emiId) => {
  const res = await api.get(`/emi/payments/emi/${emiId}`);
  return res.data;
};