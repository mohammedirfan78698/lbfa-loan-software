import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";

import {
  FaUser,
  FaIdCard,
  FaMoneyBillWave,
  FaUsers,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaShieldAlt,
} from "react-icons/fa";

import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck,
  CreditCard,
  Wallet,
  Users,
  AlertCircle,
  FileText,
  BadgeCheck,
  Sparkles,
} from "lucide-react";

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);

        const res = await API.get(`/customers/${id}`);

        console.log("Customer API Response:", res.data);

        const customerData = res.data?.data || res.data?.customer || res.data;
        setCustomer(customerData);
      } catch (error) {
        console.error("Error fetching customer:", error);
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCustomer();
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-5">
            <div className="h-24 rounded-2xl bg-white border border-slate-200 shadow-sm" />
            <div className="h-36 rounded-2xl bg-white border border-slate-200 shadow-sm" />
            <div className="h-24 rounded-2xl bg-white border border-slate-200 shadow-sm" />
            <div className="grid grid-cols-1 gap-5">
              <div className="h-56 rounded-2xl bg-white border border-slate-200 shadow-sm" />
              <div className="h-56 rounded-2xl bg-white border border-slate-200 shadow-sm" />
              <div className="h-56 rounded-2xl bg-white border border-slate-200 shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                <AlertCircle size={13} />
                Unable to load
              </div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Customer Details
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Customer details not found
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              Customer not found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              The selected customer record could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Sparkles size={13} />
                Customer Profile
              </div>

              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 md:text-3xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <User size={18} />
                </div>
                Customer Details
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View complete customer profile and nominee information
              </p>
            </div>
          </div>
        </div>

        {/* TOP SUMMARY */}
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-4">
          <div className="xl:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
              <p className="text-sm text-blue-100">Customer Dashboard</p>
              <h2 className="mt-1 text-xl font-bold">Profile Overview</h2>
              <p className="mt-2 max-w-lg text-sm text-blue-100">
                View member profile, contact details, personal details, and nominee information in one clean page.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  <User size={14} />
                  {customer.name || "Customer"}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  <Phone size={14} />
                  {customer.mobile || "-"}
                </span>
              </div>
            </div>
          </div>

          <MiniStatCard
            title="Subgroup No"
            value={customer.subgroupNo || "-"}
            subtitle="Customer subgroup"
            icon={<CreditCard size={18} />}
            iconWrap="bg-violet-100 text-violet-700"
          />

          <MiniStatCard
            title="Join Fee"
            value={`₹ ${customer.joinFee || 0}`}
            subtitle="Joining payment"
            icon={<Wallet size={18} />}
            iconWrap="bg-amber-100 text-amber-700"
          />
        </div>

        {/* PROFILE CARD */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-18 w-18 min-h-[72px] min-w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-bold text-blue-700">
              {customer.name ? customer.name.charAt(0).toUpperCase() : "C"}
            </div>

            <div className="flex-1">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {customer.name || "-"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {customer.mobile || "-"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    <CalendarDays size={14} />
                    Joined: {formatDate(customer.dateOfJoin)}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={14} />
                    Sangam A/C: {customer.sangamAccountNo || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BASIC DETAILS */}
        <Section
          title="Basic Details"
          icon={<FaUser />}
          subtitle="Main customer identity and contact details"
          headerClass="from-sky-500 to-blue-600"
        >
          <Info
            label="Name"
            value={customer.name}
            icon={<FaUser />}
            color="text-blue-700"
            bg="bg-blue-100"
          />
          <Info
            label="Mobile"
            value={customer.mobile}
            icon={<FaPhone />}
            color="text-emerald-700"
            bg="bg-emerald-100"
          />
          <Info
            label="Address"
            value={customer.address}
            icon={<FaMapMarkerAlt />}
            color="text-rose-700"
            bg="bg-rose-100"
          />
        </Section>

        {/* PERSONAL DETAILS */}
        <Section
          title="Personal Details"
          icon={<FaIdCard />}
          subtitle="Membership and personal profile information"
          headerClass="from-violet-500 to-indigo-600"
        >
          <Info
            label="Subgroup No"
            value={customer.subgroupNo}
            icon={<FaIdCard />}
            color="text-violet-700"
            bg="bg-violet-100"
          />

          <Info
            label="Sangam Account No"
            value={customer.sangamAccountNo}
            icon={<FaShieldAlt />}
            color="text-cyan-700"
            bg="bg-cyan-100"
          />

          <Info
            label="Join Fee"
            value={`₹ ${customer.joinFee || 0}`}
            icon={<FaMoneyBillWave />}
            color="text-amber-700"
            bg="bg-amber-100"
          />

          <Info
            label="Date Of Join"
            value={formatDate(customer.dateOfJoin)}
            icon={<FaCalendarAlt />}
            color="text-blue-700"
            bg="bg-blue-100"
          />

          <Info
            label="DOB"
            value={formatDate(customer.dob)}
            icon={<FaCalendarAlt />}
            color="text-pink-700"
            bg="bg-pink-100"
          />

          <Info
            label="Father Name"
            value={customer.fatherName}
            icon={<FaUser />}
            color="text-slate-700"
            bg="bg-slate-100"
          />

          <Info
            label="Aadhaar"
            value={customer.aadhaarNo}
            icon={<FaShieldAlt />}
            color="text-indigo-700"
            bg="bg-indigo-100"
          />
        </Section>

        {/* NOMINEE DETAILS */}
        <Section
          title="Nominee Details"
          icon={<FaUsers />}
          subtitle="Nominee contact and identification details"
          headerClass="from-emerald-500 to-teal-600"
        >
          <Info
            label="Nominee Name"
            value={customer.nomineeName}
            icon={<FaUser />}
            color="text-emerald-700"
            bg="bg-emerald-100"
          />

          <Info
            label="Relation"
            value={customer.nomineeRelation}
            icon={<FaUsers />}
            color="text-teal-700"
            bg="bg-teal-100"
          />

          <Info
            label="Nominee Aadhaar"
            value={customer.nomineeAadhaar}
            icon={<FaShieldAlt />}
            color="text-lime-700"
            bg="bg-lime-100"
          />

          <Info
            label="Nominee Mobile"
            value={customer.nomineeMobile}
            icon={<FaPhone />}
            color="text-orange-700"
            bg="bg-orange-100"
          />
        </Section>
      </div>
    </div>
  );
}

/* MINI STAT CARD */
function MiniStatCard({ title, value, subtitle, icon, iconWrap }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <p className="text-xs font-medium text-slate-500">{title}</p>

      <div className="mt-3 flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconWrap}`}>
          {icon}
        </div>

        <div>
          <p className="text-xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

/* SECTION COMPONENT */
function Section({ title, icon, subtitle, children, headerClass = "from-blue-600 to-blue-700" }) {
  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`bg-gradient-to-r ${headerClass} px-5 py-4 text-white`}>
        <h2 className="flex items-center gap-2 text-base font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            {icon}
          </span>
          {title}
        </h2>
        <p className="mt-1 text-sm text-white/85">{subtitle}</p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

/* INFO CARD */
function Info({ label, value, icon, color = "text-blue-700", bg = "bg-blue-100" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition duration-200 hover:border-blue-200 hover:bg-white hover:shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}>
          {icon}
        </span>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>

      <p className="break-words text-sm font-semibold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}