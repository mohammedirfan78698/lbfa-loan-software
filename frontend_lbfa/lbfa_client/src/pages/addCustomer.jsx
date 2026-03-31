import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomer } from "../api/customers.api";

import {
  FaUser,
  FaIdCard,
  FaUsers,
  FaPlus,
} from "react-icons/fa";

import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Wallet,
  Users,
  CreditCard,
  FileText,
  Loader2,
  Sparkles,
  BadgeCheck,
} from "lucide-react";

export default function AddCustomer() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",

    subgroupNo: "",
    sangamAccountNo: "",
    joinFee: "",
    dateOfJoin: "",
    dob: "",
    fatherName: "",
    aadhaarNo: "",

    nomineeName: "",
    nomineeRelation: "",
    nomineeAadhaar: "",
    nomineeMobile: "",
  });

  const [loading, setLoading] = useState(false);

  /* =========================================
      HANDLE INPUT CHANGE
  ========================================= */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /* =========================================
      MOBILE LIMIT (10 digits)
  ========================================= */
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 10) {
      setFormData({ ...formData, mobile: value });
    }
  };

  /* =========================================
      AADHAAR LIMIT (12 digits)
  ========================================= */
  const handleAadhaarChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 12) {
      setFormData({ ...formData, aadhaarNo: value });
    }
  };

  const handleNomineeMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 10) {
      setFormData({ ...formData, nomineeMobile: value });
    }
  };

  const handleNomineeAadhaarChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 12) {
      setFormData({ ...formData, nomineeAadhaar: value });
    }
  };

  /* =========================================
      SUBMIT FORM
  ========================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createCustomer(formData);

      alert("Customer Added Successfully");
      navigate("/customers");
    } catch (error) {
      console.error(error);

      alert(error?.response?.data?.message || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Sparkles size={14} />
                Customer Management
              </div>

              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                  <User size={20} />
                </div>
                Add Customer
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Create a clean and complete customer profile with personal and
                nominee information in one place.
              </p>
            </div>
          </div>
        </div>

        {/* HERO */}
        <div className="relative mb-6 overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-8 translate-y-8 rounded-full bg-cyan-300/10 blur-2xl" />

          <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <p className="text-sm font-medium text-blue-100">
                Member Registration
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                New Customer Entry Form
              </h2>
              <p className="mt-3 text-sm leading-6 text-blue-100">
                Add the customer’s basic profile, account details, and nominee
                information with a simple and structured form layout.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  <FileText size={16} />
                  Full Form
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  <BadgeCheck size={16} />
                  Secure Details
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
              <p className="mb-3 text-sm font-medium text-blue-100">
                Required Sections
              </p>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <Users size={26} />
                </div>

                <div>
                  <p className="text-3xl font-bold">3</p>
                  <p className="text-sm text-blue-100">
                    Basic, Personal, Nominee
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
              <p className="mb-3 text-sm font-medium text-blue-100">
                Main Action
              </p>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <FaPlus size={20} />
                </div>

                <div>
                  <p className="text-2xl font-bold">Add Customer</p>
                  <p className="text-sm text-blue-100">
                    Save member into system
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC DETAILS */}
          <Section
            title="Basic Details"
            icon={<FaUser />}
            subtitle="Enter main customer identity and contact details"
            headerClass="from-sky-500 to-blue-600"
          >
            <InputField
              label="Customer Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter customer name"
              required
              icon={<User size={16} />}
              iconBg="bg-blue-100 text-blue-700"
            />

            <InputField
              label="Mobile Number"
              name="mobile"
              value={formData.mobile}
              onChange={handleMobileChange}
              placeholder="Enter mobile number"
              maxLength={10}
              required
              icon={<Phone size={16} />}
              iconBg="bg-emerald-100 text-emerald-700"
            />

            <InputField
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address"
              icon={<MapPin size={16} />}
              iconBg="bg-rose-100 text-rose-700"
            />
          </Section>

          {/* PERSONAL DETAILS */}
          <Section
            title="Personal Details"
            icon={<FaIdCard />}
            subtitle="Enter member account, joining, and identity details"
            headerClass="from-violet-500 to-indigo-600"
          >
            <InputField
              label="Subgroup No"
              name="subgroupNo"
              value={formData.subgroupNo}
              onChange={handleChange}
              placeholder="Enter subgroup number"
              icon={<CreditCard size={16} />}
              iconBg="bg-violet-100 text-violet-700"
            />

            <InputField
              label="Sangam Account No"
              name="sangamAccountNo"
              value={formData.sangamAccountNo}
              onChange={handleChange}
              placeholder="Enter Sangam account number"
              icon={<ShieldCheck size={16} />}
              iconBg="bg-cyan-100 text-cyan-700"
            />

            <InputField
              label="Join Fee"
              name="joinFee"
              type="number"
              value={formData.joinFee}
              onChange={handleChange}
              placeholder="Enter join fee"
              icon={<Wallet size={16} />}
              iconBg="bg-amber-100 text-amber-700"
            />

            <InputField
              label="Date Of Join"
              name="dateOfJoin"
              type="date"
              value={formData.dateOfJoin}
              onChange={handleChange}
              icon={<CalendarDays size={16} />}
              iconBg="bg-blue-100 text-blue-700"
            />

            <InputField
              label="DOB"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              icon={<CalendarDays size={16} />}
              iconBg="bg-pink-100 text-pink-700"
            />

            <InputField
              label="Father Name"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              placeholder="Enter father name"
              icon={<User size={16} />}
              iconBg="bg-slate-100 text-slate-700"
            />

            <InputField
              label="Aadhaar Number"
              name="aadhaarNo"
              value={formData.aadhaarNo}
              onChange={handleAadhaarChange}
              placeholder="Enter Aadhaar number"
              maxLength={12}
              icon={<ShieldCheck size={16} />}
              iconBg="bg-indigo-100 text-indigo-700"
            />
          </Section>

          {/* NOMINEE DETAILS */}
          <Section
            title="Nominee Details"
            icon={<FaUsers />}
            subtitle="Enter nominee profile and relation details"
            headerClass="from-emerald-500 to-teal-600"
          >
            <InputField
              label="Nominee Name"
              name="nomineeName"
              value={formData.nomineeName}
              onChange={handleChange}
              placeholder="Enter nominee name"
              icon={<User size={16} />}
              iconBg="bg-emerald-100 text-emerald-700"
            />

            <InputField
              label="Relation"
              name="nomineeRelation"
              value={formData.nomineeRelation}
              onChange={handleChange}
              placeholder="Enter relation"
              icon={<Users size={16} />}
              iconBg="bg-teal-100 text-teal-700"
            />

            <InputField
              label="Nominee Aadhaar"
              name="nomineeAadhaar"
              value={formData.nomineeAadhaar}
              onChange={handleNomineeAadhaarChange}
              placeholder="Enter nominee Aadhaar"
              maxLength={12}
              icon={<ShieldCheck size={16} />}
              iconBg="bg-lime-100 text-lime-700"
            />

            <InputField
              label="Nominee Mobile"
              name="nomineeMobile"
              value={formData.nomineeMobile}
              onChange={handleNomineeMobileChange}
              placeholder="Enter nominee mobile"
              maxLength={10}
              icon={<Phone size={16} />}
              iconBg="bg-orange-100 text-orange-700"
            />
          </Section>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:from-blue-800 hover:to-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FaPlus />
                  Add Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* SECTION COMPONENT */
function Section({ title, icon, subtitle, children, headerClass = "from-blue-600 to-blue-700" }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:shadow-md">
      <div className={`bg-gradient-to-r ${headerClass} px-6 py-5 text-white`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
            {icon}
          </div>

          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-1 text-sm text-white/85">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

/* INPUT FIELD COMPONENT */
function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  required = false,
  icon,
  iconBg = "bg-blue-100 text-blue-700",
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition duration-200 hover:border-blue-200 hover:bg-white hover:shadow-sm">
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </span>
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}