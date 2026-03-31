import Insurance from "../models/insurance.js";

/* =========================================
   CREATE INSURANCE
========================================= */
export const createInsurance = async (req, res) => {
  try {
    const { paidDate, paidAmount, claimYear } = req.body;
    const { customerId } = req.params; // get from URL instead

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const insurance = await Insurance.create({
      customer: customerId,
      paidDate,
      paidAmount,
      claimYear,
    });

    res.status(201).json({
      success: true,
      data: insurance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET CUSTOMER INSURANCES
========================================= */
export const getCustomerInsurances = async (req, res) => {
  try {
    const { customerId } = req.params;

    const insurances = await Insurance.find({
      customer: customerId,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: insurances,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   UPDATE INSURANCE
========================================= */
export const updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedInsurance = await Insurance.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedInsurance) {
      return res.status(404).json({
        success: false,
        message: "Insurance not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedInsurance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   SOFT DELETE INSURANCE
========================================= */
export const deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    const insurance = await Insurance.findById(id);

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: "Insurance not found",
      });
    }

    insurance.isDeleted = true;
    insurance.deletedAt = new Date();
    insurance.deletedBy = req.user?._id;

    await insurance.save();

    res.status(200).json({
      success: true,
      message: "Insurance deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};