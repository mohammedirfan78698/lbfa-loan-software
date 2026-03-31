import Customer from "../models/customers.js";
import Loan from "../models/loan.js";
import Insurance from "../models/insurance.js";
import EmiSchedule from "../models/emischedule.js";
import MemberLedger from "../models/memberLedger.js";

/* =========================================================
   HELPERS
========================================================= */
const getMonthKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const monthNumber = d.getMonth() + 1;
  const month = `${year}-${String(monthNumber).padStart(2, "0")}`;

  return { year, monthNumber, month };
};

/* =========================================================
   CREATE CUSTOMER
========================================================= */
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      mobile,
      address,
      subgroupNo,
      sangamAccountNo,
      joinFee,
      dateOfJoin,
      dob,
      fatherName,
      aadhaarNo,
      phoneNo,
      nomineeName,
      nomineeRelation,
      nomineeAadhaar,
      nomineeMobile
    } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name and Mobile are required"
      });
    }

    const customer = await Customer.create({
      name,
      mobile,
      address,
      subgroupNo,
      sangamAccountNo,
      joinFee,
      dateOfJoin,
      dob,
      fatherName,
      aadhaarNo,
      phoneNo,
      nomineeName,
      nomineeRelation,
      nomineeAadhaar,
      nomineeMobile,
      insuranceDetails: [],
      isDeleted: false,
      paymentGenerationActive: true,
      paymentStoppedAt: null,
      totalSharePaid: 0,
      totalJoiningFeePaid: 0,
      totalInsurancePaid: 0,
      totalEmiPaid: 0,
      totalPaidAmount: 0
    });

    // ✅ create first ledger automatically with exact due date
    const baseDate = new Date(customer.dateOfJoin || new Date());
    baseDate.setHours(0, 0, 0, 0);

    const { year, monthNumber, month } = getMonthKey(baseDate);

    const shareAmount = 200;
    const joiningFee = Number(customer.joinFee) || 0;
    const insuranceAmount = 0;
    const emiAmount = 0;
    const totalAmount = shareAmount + joiningFee + insuranceAmount + emiAmount;

    const existingLedger = await MemberLedger.findOne({
      customer: customer._id,
      month,
      isDeleted: false
    });

    if (!existingLedger && customer.paymentGenerationActive) {
      await MemberLedger.create({
        customer: customer._id,
        loan: null,
        emi: null,
        dueDate: baseDate,
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
        isDeleted: false
      });
    }

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer
    });
  } catch (error) {
    console.error("Create Customer Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", ")
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];

      let message = `${duplicateField} already exists`;

      if (duplicateField === "mobile") {
        message = "Mobile number already exists";
      } else if (duplicateField === "aadhaarNo") {
        message = "Aadhaar number already exists";
      } else if (duplicateField === "sangamAccountNo") {
        message = "Sangam Account Number already exists";
      }

      return res.status(400).json({
        success: false,
        message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================================================
   TOGGLE CUSTOMER PAYMENT STATUS
========================================================= */
export const toggleCustomerPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentGenerationActive } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    if (typeof paymentGenerationActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "paymentGenerationActive must be true or false"
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    customer.paymentGenerationActive = paymentGenerationActive;
    customer.paymentStoppedAt = paymentGenerationActive ? null : new Date();

    await customer.save();

    return res.status(200).json({
      success: true,
      message: paymentGenerationActive
        ? "Customer payment reactivated successfully"
        : "Customer payment stopped successfully",
      data: customer
    });
  } catch (error) {
    console.error("Toggle Customer Payment Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * GET ALL CUSTOMERS (ONLY ACTIVE)
 */
export const getAllCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = req.query.search ? req.query.search.trim() : "";

    const skip = (page - 1) * limit;

    const query = {
      isDeleted: false
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { aadhaarNo: { $regex: search, $options: "i" } },
        { sangamAccountNo: { $regex: search, $options: "i" } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: customers,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Get Customers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * SEARCH CUSTOMERS FOR LOAN DROPDOWN
 */
export const searchCustomers = async (req, res) => {
  try {
    const keyword = req.query.keyword ? req.query.keyword.trim() : "";

    let query = {
      isDeleted: false
    };

    let customers;

    if (!keyword) {
      customers = await Customer.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .select("_id name mobile sangamAccountNo")
        .lean();
    } else {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { mobile: { $regex: keyword, $options: "i" } },
        { sangamAccountNo: { $regex: keyword, $options: "i" } }
      ];

      customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .select("_id name mobile sangamAccountNo")
        .lean();
    }

    return res.status(200).json({
      success: true,
      customers
    });
  } catch (error) {
    console.error("SEARCH CUSTOMERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * GET CUSTOMER BY ID (ONLY ACTIVE)
 */
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error("Get Customer By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * SOFT DELETE CUSTOMER (ADMIN)
 */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or already deleted"
      });
    }

    customer.isDeleted = true;
    customer.deletedAt = new Date();

    if (req.user?._id) {
      customer.deletedBy = req.user._id;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully (soft delete)"
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * UPDATE CUSTOMER (ADMIN)
 */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const restrictedFields = [
      "_id",
      "insuranceDetails",
      "isDeleted",
      "deletedAt"
    ];
    restrictedFields.forEach((field) => delete req.body[field]);

    Object.keys(req.body).forEach((key) => {
      customer[key] = req.body[key];
    });

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer
    });
  } catch (error) {
    console.error("Update Customer Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", ")
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];

      let message = `${duplicateField} already exists`;

      if (duplicateField === "mobile") {
        message = "Mobile number already exists";
      } else if (duplicateField === "aadhaarNo") {
        message = "Aadhaar number already exists";
      } else if (duplicateField === "sangamAccountNo") {
        message = "Sangam Account Number already exists";
      }

      return res.status(400).json({
        success: false,
        message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * ADD INSURANCE TO CUSTOMER
 */
export const addInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidDate, paidAmount, claimYear, claimAmount, notes } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    customer.insuranceDetails.push({
      paidDate,
      paidAmount,
      claimYear,
      claimAmount,
      notes
    });

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Insurance record added successfully",
      data: customer.insuranceDetails
    });
  } catch (error) {
    console.error("Add Insurance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * UPDATE INSURANCE RECORD
 */
export const updateInsurance = async (req, res) => {
  try {
    const { id, insuranceId } = req.params;

    if (
      !id.match(/^[0-9a-fA-F]{24}$/) ||
      !insuranceId.match(/^[0-9a-fA-F]{24}$/)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const insurance = customer.insuranceDetails.id(insuranceId);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: "Insurance record not found"
      });
    }

    Object.keys(req.body).forEach((key) => {
      insurance[key] = req.body[key];
    });

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Insurance updated successfully",
      data: insurance
    });
  } catch (error) {
    console.error("Update Insurance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * DELETE INSURANCE RECORD
 */
export const deleteInsurance = async (req, res) => {
  try {
    const { id, insuranceId } = req.params;

    if (
      !id.match(/^[0-9a-fA-F]{24}$/) ||
      !insuranceId.match(/^[0-9a-fA-F]{24}$/)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const insurance = customer.insuranceDetails.id(insuranceId);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: "Insurance record not found"
      });
    }

    insurance.deleteOne();

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Insurance deleted successfully"
    });
  } catch (error) {
    console.error("Delete Insurance Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * UPDATE PERSONAL DETAILS
 */
export const updatePersonalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      mobile,
      address,
      subgroupNo,
      sangamAccountNo,
      dateOfJoin,
      dob,
      fatherName,
      aadhaarNo,
      joinFee
    } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    if (sangamAccountNo) {
      const existing = await Customer.findOne({
        sangamAccountNo,
        _id: { $ne: id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Sangam Account Number already exists"
        });
      }

      customer.sangamAccountNo = sangamAccountNo;
    }

    if (name !== undefined) customer.name = name;
    if (mobile !== undefined) customer.mobile = mobile;
    if (address !== undefined) customer.address = address;
    if (subgroupNo !== undefined) customer.subgroupNo = subgroupNo;
    if (dateOfJoin !== undefined) customer.dateOfJoin = dateOfJoin;
    if (dob !== undefined) customer.dob = dob;
    if (fatherName !== undefined) customer.fatherName = fatherName;
    if (aadhaarNo !== undefined) customer.aadhaarNo = aadhaarNo;
    if (joinFee !== undefined) customer.joinFee = joinFee;

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Personal details updated successfully",
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value detected"
      });
    }

    console.error("Personal Update Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating personal details"
    });
  }
};

export const updateNomineeDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      {
        nomineeName: req.body.nomineeName,
        nomineeRelation: req.body.nomineeRelation,
        nomineeAadhaar: req.body.nomineeAadhaar,
        nomineeMobile: req.body.nomineeMobile
      },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      data: updatedCustomer
    });
  } catch (error) {
    console.error("Error updating nominee details:", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getAnnualStatement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await Customer.findOne({
      _id: id,
      isDeleted: false
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    const loans = await Loan.find({
      customer: id,
      isDeleted: false
    });

    const loanIds = loans.map((loan) => loan._id);

    const emis = await EmiSchedule.find({
      loan: { $in: loanIds },
      isDeleted: false
    });

    const insurances = await Insurance.find({
      customer: id,
      isDeleted: false
    });

    const totalInsurancePaid = insurances.reduce(
      (sum, ins) => sum + (ins.paidAmount || 0),
      0
    );

    const totalLoanTaken = loans.reduce(
      (sum, loan) => sum + (loan.loanAmount || 0),
      0
    );

    const totalLoanPayable = loans.reduce(
      (sum, loan) => sum + (loan.totalPayable || 0),
      0
    );

    const totalEmiPaid = emis.reduce((sum, emi) => {
      if (emi.status === "paid") {
        return sum + (emi.totalAmount || 0);
      }
      return sum;
    }, 0);

    const totalLoanBalance = totalLoanPayable - totalEmiPaid;

    res.status(200).json({
      success: true,
      data: {
        accountNumber: customer.sangamAccountNo ?? "",
        name: customer.name,
        joiningAmount: customer.joiningAmount ?? 0,
        shareAmount: customer.shareAmount ?? 0,
        bonusAmount: customer.bonusAmount ?? 0,
        totalInsurancePaid,
        totalLoanTaken,
        totalEmiPaid,
        totalLoanBalance: totalLoanBalance > 0 ? Math.round(totalLoanBalance) : 0
      }
    });
  } catch (error) {
    console.error("Annual Statement Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating annual statement"
    });
  }
};

/**
 * UPDATE FINANCIAL DETAILS
 */
export const updateFinancialDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { joiningAmount, shareAmount, bonusAmount } = req.body;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    customer.joiningAmount = joiningAmount ?? customer.joiningAmount;
    customer.shareAmount = shareAmount ?? customer.shareAmount;
    customer.bonusAmount = bonusAmount ?? customer.bonusAmount;

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Financial details updated successfully",
      data: customer
    });
  } catch (error) {
    console.error("Financial Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating financial details"
    });
  }
};