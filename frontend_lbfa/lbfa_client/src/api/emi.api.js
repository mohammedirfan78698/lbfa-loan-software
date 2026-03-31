import axiosInstance from "./axios";

/**
 * GET EMIs BY LOAN
 */
export const getEmisByLoan = (loanId) => {
  return axiosInstance.get(`/emi/loan/${loanId}`);
};

/**
 * PAY EMI
 */
export const payEmi = (emiId, payload) => {
  return axiosInstance.put(`/emi/pay/${emiId}`, payload);
};

/**
 * GET PAYMENTS BY LOAN
 */
export const getLoanPayments = (loanId) => {
  return axiosInstance.get(`/emi/payments/loan/${loanId}`);
};

/**
 * GET EMI PAYMENTS
 */
export const getEmiPayments = (emiId) => {
  return axiosInstance.get(`/emi/payments/emi/${emiId}`);
};

/**
 * GET CUSTOMER PAYMENTS
 */
export const getCustomerPayments = (customerId) => {
  return axiosInstance.get(`/emi/payments/customer/${customerId}`);
};

/**
 * GET OVERDUE EMIs
 */
export const getOverdueEmis = () => {
  return axiosInstance.get(`/emi/overdue`);
};

/**
 * GET MEMBER LEDGER
 */
export const getMemberLedger = (customerId) => {
  return axiosInstance.get(`/emi/ledger/${customerId}`);
};

export const payMemberLedger = (customerId) => {
  return axiosInstance.post(`/emi/ledger/pay/${customerId}`);
};