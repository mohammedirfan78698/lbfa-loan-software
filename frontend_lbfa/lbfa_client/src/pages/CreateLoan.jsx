import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createLoan } from "../api/loan.api";
import { getAllCustomers } from "../api/customers.api";
import Select from "react-select";
import axiosInstance from "../api/axios";

import {
  ArrowLeft,
  User,
  Landmark,
  Percent,
  CalendarDays,
  Wallet,
  CreditCard,
  FileText,
  Loader2,
  BadgeIndianRupee,
} from "lucide-react";

const CreateLoan = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    loanAmount: "",
    interestRate: "",
    durationMonths: "",
    startDate: "",
  });

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await getAllCustomers();

        if (Array.isArray(res)) {
          setCustomers(res);
        } else if (Array.isArray(res.data)) {
          setCustomers(res.data);
        } else if (Array.isArray(res.data?.data)) {
          setCustomers(res.data.data);
        } else if (Array.isArray(res.data?.customers)) {
          setCustomers(res.data.customers);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error("Error loading customers", err);
        setCustomers([]);
      }
    };

    loadCustomers();
  }, []);

  useEffect(() => {
    if (location.state?.customerId) {
      setFormData((prev) => ({
        ...prev,
        customerId: location.state.customerId,
      }));
      setSelectedCustomerName(location.state.customerName || "");
    }
  }, [location.state]);

  const handleCustomerSearch = async (inputValue = "") => {
    try {
      const res = await axiosInstance.get(
        `/customers/search?keyword=${encodeURIComponent(inputValue)}`
      );

      if (res.data?.success && Array.isArray(res.data.customers)) {
        setCustomers(res.data.customers);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert("Please select a customer");
      return;
    }

    const payload = {
      ...formData,
      loanAmount: Number(formData.loanAmount),
      interestRate: Number(formData.interestRate),
      durationMonths: Number(formData.durationMonths),
    };

    try {
      setLoading(true);
      await createLoan(payload);
      alert("Loan Created Successfully");
      navigate("/loans");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong";
      alert(msg);
      console.error("Loan create error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: "50px",
      borderRadius: "16px",
      borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.15)" : "none",
      backgroundColor: "#ffffff",
      paddingLeft: "6px",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#94a3b8",
      fontSize: "14px",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "16px",
      overflow: "hidden",
      zIndex: 20,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#eff6ff" : "#fff",
      color: "#0f172a",
      fontSize: "14px",
      padding: "12px 14px",
      cursor: "pointer",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#0f172a",
      fontSize: "14px",
    }),
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate("/loans")}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 md:text-3xl">
                <CreditCard size={28} />
                Create New Loan
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Add a new loan for a member with amount, interest, and duration
              </p>
            </div>
          </div>
        </div>

        {/* HERO */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-blue-700 p-6 text-white shadow-lg">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <p className="text-sm text-blue-100">Loan Creation</p>
              <h2 className="mt-1 text-2xl font-bold">New Loan Setup</h2>
              <p className="mt-3 max-w-lg text-sm text-blue-100">
                Select the member, enter the loan amount, interest rate,
                duration, and start date to create a new loan record.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
                  <FileText size={16} />
                  Loan Registration Form
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
                  <Landmark size={16} />
                  Easy Loan Creation
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="mb-2 text-sm text-blue-100">Required Fields</p>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-3xl font-bold">5</p>
                  <p className="text-xs text-blue-100">
                    Customer, amount, rate, duration, date
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="mb-2 text-sm text-blue-100">Action</p>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <BadgeIndianRupee size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold">Create Loan</p>
                  <p className="text-xs text-blue-100">
                    Save and generate loan details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Section
            title="Loan Information"
            subtitle="Enter customer and loan setup details"
          >
            <Field label="Customer" icon={<User size={16} />}>
              <Select
                placeholder="Search Customer..."
                value={
                  formData.customerId
                    ? {
                        value: String(formData.customerId),
                        label: String(
                          selectedCustomerName ||
                            customers.find(
                              (c) => String(c._id) === String(formData.customerId)
                            )?.name ||
                            ""
                        ),
                      }
                    : null
                }
                onInputChange={(inputValue) => {
                  if (!location.state?.customerId) {
                    handleCustomerSearch(inputValue);
                  }
                }}
                onChange={(selected) => {
                  setFormData({
                    ...formData,
                    customerId: selected ? String(selected.value) : "",
                  });

                  setSelectedCustomerName(
                    selected ? String(selected.label) : ""
                  );
                }}
                options={
                  Array.isArray(customers)
                    ? customers.map((c) => ({
                        value: String(c._id),
                        label: `${c.name}${c.mobile ? ` - ${c.mobile}` : ""}`,
                      }))
                    : []
                }
                filterOption={null}
                isClearable={!location.state?.customerId}
                isDisabled={!!location.state?.customerId}
                styles={customSelectStyles}
              />
            </Field>

            <Field label="Loan Amount" icon={<Wallet size={16} />}>
              <input
                type="number"
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleChange}
                placeholder="Enter amount"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </Field>

            <Field label="Interest Rate (%)" icon={<Percent size={16} />}>
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                placeholder="Enter interest rate"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </Field>

            <Field label="Duration (Months)" icon={<CreditCard size={16} />}>
              <input
                type="number"
                name="durationMonths"
                value={formData.durationMonths}
                onChange={handleChange}
                placeholder="Enter duration"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </Field>

            <Field label="Start Date" icon={<CalendarDays size={16} />}>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </Field>
          </Section>

          {/* SUBMIT */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <BadgeIndianRupee size={18} />
                  Create Loan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function Section({ title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-blue-700 px-6 py-4 text-white">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-blue-100">{subtitle}</p>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-blue-50">
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
        <span className="text-blue-700">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

export default CreateLoan;