import axiosInstance from "./axios";

/**
 * GET LEDGER LIST
 */
export const getLedger = () => {
  return axiosInstance.get("/ledger");
};

/**
 * GENERATE MONTHLY LEDGER
 */
export const generateLedger = () => {
  return axiosInstance.post("/ledger/generate");
};

/**
 * PAY LEDGER
 */
export const payLedger = (ledgerId, data) => {
  return axiosInstance.post(`/ledger/pay/${ledgerId}`, data);
};

/**
 * GET SINGLE LEDGER
 */
export const getLedgerById = (ledgerId) => {
  return axiosInstance.get(`/ledger/${ledgerId}`);
};

/**
 * GET LEDGER BY CUSTOMER
 */
export const getLedgerByCustomer = (customerId) => {
  return axiosInstance.get(`/ledger/customer/${customerId}`);
};

/**
 * PAY WITH DETAILS
 */
export const payLedgerWithDetails = (ledgerId, data) => {
  return axiosInstance.post(`/ledger/pay/${ledgerId}`, data);
};

/**
 * STOP / ACTIVATE CUSTOMER PAYMENT
 */
export const updateCustomerPaymentStatus = (
  customerId,
  paymentGenerationActive
) => {
  return axiosInstance.put(`/customers/${customerId}/payment-status`, {
    paymentGenerationActive,
  });
};