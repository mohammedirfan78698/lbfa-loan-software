import api from "./axios";
import axios from "axios";

const ROOT = "http://localhost:5000";

/* =========================================
   GET ALL CUSTOMERS (Pagination + Search)
========================================= */
export const getAllCustomers = async (page = 1, search = "") => {
  const encodedSearch = encodeURIComponent(search);

  const candidates = [
    `${ROOT}/api/customers?page=${page}&limit=10&search=${encodedSearch}`,
    `${ROOT}/customers?page=${page}&limit=10&search=${encodedSearch}`,
    `${ROOT}/api/v1/customers?page=${page}&limit=10&search=${encodedSearch}`,
    `${ROOT}/v1/customers?page=${page}&limit=10&search=${encodedSearch}`,
  ];

  try {
    return await api.get(
      `/customers?page=${page}&limit=10&search=${encodedSearch}`
    );
  } catch (err) {
    for (const url of candidates) {
      try {
        const res = await axios.get(url);
        return res;
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
      }
    }
    throw err;
  }
};

/* =========================================
   GET CUSTOMER BY ID
========================================= */
export const getCustomerById = async (id) => {
  const candidates = [
    `${ROOT}/api/customers/${id}`,
    `${ROOT}/customers/${id}`,
    `${ROOT}/api/v1/customers/${id}`,
    `${ROOT}/v1/customers/${id}`,
  ];

  try {
    return await api.get(`/customers/${id}`);
  } catch (err) {
    for (const url of candidates) {
      try {
        const res = await axios.get(url);
        return res;
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
      }
    }
    throw err;
  }
};

/* =========================================
   SIMPLE GET CUSTOMERS (No Pagination)
========================================= */
export const getCustomers = async () => {
  const candidates = [
    `${ROOT}/api/customers`,
    `${ROOT}/customers`,
    `${ROOT}/api/v1/customers`,
    `${ROOT}/v1/customers`,
  ];

  try {
    const res = await api.get("/customers");
    return res;
  } catch (err) {
    for (const url of candidates) {
      try {
        const r = await axios.get(url);
        return r;
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
      }
    }
    throw err;
  }
};

/* =========================================
   CREATE CUSTOMER
========================================= */
export const createCustomer = async (data) => {
  const candidates = [
    `${ROOT}/api/customers`,
    `${ROOT}/customers`,
    `${ROOT}/api/v1/customers`,
    `${ROOT}/v1/customers`,
  ];

  try {
    return await api.post("/customers", data);
  } catch (err) {
    for (const url of candidates) {
      try {
        return await axios.post(url, data);
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
      }
    }
    throw err;
  }
};

/* =========================================
   UPDATE CUSTOMER
========================================= */
export const updateCustomer = async (customerId, data) => {
  const candidates = [
    `${ROOT}/api/customers/${customerId}`,
    `${ROOT}/customers/${customerId}`,
    `${ROOT}/api/v1/customers/${customerId}`,
    `${ROOT}/v1/customers/${customerId}`,
  ];

  try {
    return await api.put(`/customers/${customerId}`, data);
  } catch (err) {
    for (const url of candidates) {
      try {
        return await axios.put(url, data);
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
      }
    }
    throw err;
  }
};

/* =========================================
   UPDATE PERSONAL DETAILS
========================================= */
export const updatePersonalDetails = async (customerId, data) => {
  try {
    const response = await api.put(`/customers/${customerId}/personal`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/* =========================================
   UPDATE NOMINEE DETAILS
========================================= */
export const updateNomineeDetails = async (customerId, data) => {
  try {
    const response = await api.put(`/customers/${customerId}/nominee`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/* =========================================
   UPDATE FINANCIAL DETAILS
========================================= */
export const updateFinancialDetails = async (customerId, data) => {
  const candidates = [
    `${ROOT}/api/customers/${customerId}/financial-details`,
    `${ROOT}/customers/${customerId}/financial-details`,
    `${ROOT}/api/v1/customers/${customerId}/financial-details`,
    `${ROOT}/v1/customers/${customerId}/financial-details`,
  ];

  try {
    const response = await api.put(
      `/customers/${customerId}/financial-details`,
      data
    );
    return response.data;
  } catch (err) {
    for (const url of candidates) {
      try {
        const res = await axios.put(url, data);
        return res.data;
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
      }
    }
    throw err.response?.data || err.message;
  }
};

/* =========================================
   GET ANNUAL STATEMENT
========================================= */
export const getAnnualStatement = async (id) => {
  const urls = [
    `/customers/${id}/annual-statement`,
    `/api/customers/${id}/annual-statement`,
    `/v1/customers/${id}/annual-statement`,
    `/api/v1/customers/${id}/annual-statement`,
  ];

  for (const url of urls) {
    try {
      const res = await api.get(url);
      return res;
    } catch (err) {
      if (err?.response?.status === 404) continue;
      throw err;
    }
  }

  throw new Error("Annual statement not found");
};

/* =========================================
   STOP / ACTIVATE CUSTOMER PAYMENT
========================================= */
export const updateCustomerPaymentStatus = async (
  customerId,
  paymentGenerationActive
) => {
  const candidates = [
    `${ROOT}/api/customers/${customerId}/payment-status`,
    `${ROOT}/customers/${customerId}/payment-status`,
    `${ROOT}/api/v1/customers/${customerId}/payment-status`,
    `${ROOT}/v1/customers/${customerId}/payment-status`,
  ];

  try {
    const res = await api.put(`/customers/${customerId}/payment-status`, {
      paymentGenerationActive,
    });
    return res.data;
  } catch (err) {
    for (const url of candidates) {
      try {
        const res = await axios.put(url, {
          paymentGenerationActive,
        });
        return res.data;
      } catch (e) {
        if (e?.response?.status !== 404) throw e;
      }
    }
    throw err.response?.data || err.message;
  }
};