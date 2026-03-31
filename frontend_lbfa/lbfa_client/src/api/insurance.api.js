import api from "./axios";

/* =========================================
   GET INSURANCE BY CUSTOMER
========================================= */
export const getCustomerInsurances = async (customerId) => {
  return await api.get(`/insurance/customer/${customerId}`);
};

/* =========================================
   CREATE INSURANCE
========================================= */
export const createInsurance = (customerId, data) => {
  return api.post(`/insurance/customer/${customerId}`, data);
};

/* =========================================
   DELETE INSURANCE
========================================= */
export const deleteInsurance = async (id) => {
  return await api.delete(`/insurance/delete/${id}`);
};

/* =========================================
   UPDATE INSURANCE
========================================= */

export const updateInsurance = (insuranceId, data) => {
  return api.put(`/insurance/${insuranceId}`, data);
};