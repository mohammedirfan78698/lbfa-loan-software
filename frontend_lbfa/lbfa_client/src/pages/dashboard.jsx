import { useEffect, useMemo, useState } from "react";
import {
  Users,
  CreditCard,
  AlertCircle,
  Wallet,
  Phone,
  LayoutDashboard,
  CheckCircle2,
  Clock3,
  Shield,
  BadgeIndianRupee,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CircleDollarSign,
} from "lucide-react";
import axiosInstance from "../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dueTypeFilter, setDueTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/dashboard/stats");
      setStats(res?.data?.data || null);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const dueMembers = useMemo(() => {
    return Array.isArray(stats?.dueMembers) ? stats.dueMembers : [];
  }, [stats]);

  const normalizedDueMembers = useMemo(() => {
    return dueMembers.map((member) => {
      const pendingShareAmount = Number(member?.pendingShareAmount || 0);
      const pendingInsuranceAmount = Number(member?.pendingInsuranceAmount || 0);
      const pendingEmiAmount = Number(member?.pendingEmiAmount || 0);

      const hasShare = pendingShareAmount > 0;
      const hasInsurance = pendingInsuranceAmount > 0;
      const hasEmi = pendingEmiAmount > 0;

      let dueTypes = [];
      if (hasShare) dueTypes.push("share");
      if (hasEmi) dueTypes.push("emi");
      if (hasInsurance) dueTypes.push("insurance");

      return {
        ...member,
        pendingShareAmount,
        pendingInsuranceAmount,
        pendingEmiAmount,
        totalOverdueAmount: Number(member?.totalOverdueAmount || 0),
        pendingRows: Number(member?.pendingRows || 0),
        maxDaysLate: Number(member?.maxDaysLate || 0),
        dueTypes,
        hasShare,
        hasInsurance,
        hasEmi,
      };
    });
  }, [dueMembers]);

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return normalizedDueMembers.filter((member) => {
      const matchesSearch =
        !value ||
        member?.customerName?.toLowerCase().includes(value) ||
        member?.mobile?.toLowerCase().includes(value) ||
        member?.dueTypes?.join(", ").toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "overdue"
          ? member.maxDaysLate > 0
          : statusFilter === "dueToday"
          ? member.maxDaysLate === 0
          : true;

      const matchesType =
        dueTypeFilter === "all"
          ? true
          : dueTypeFilter === "share"
          ? member.hasShare
          : dueTypeFilter === "emi"
          ? member.hasEmi
          : dueTypeFilter === "insurance"
          ? member.hasInsurance
          : false;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [normalizedDueMembers, search, statusFilter, dueTypeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dueTypeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / rowsPerPage)
  );

  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const summary = useMemo(() => {
    return {
      totalDueMembers: normalizedDueMembers.length,
      overdueMembers: normalizedDueMembers.filter((m) => m.maxDaysLate > 0).length,
      totalPendingShareAmount: normalizedDueMembers.reduce(
        (sum, m) => sum + Number(m.pendingShareAmount || 0),
        0
      ),
      totalPendingInsuranceAmount: normalizedDueMembers.reduce(
        (sum, m) => sum + Number(m.pendingInsuranceAmount || 0),
        0
      ),
      totalPendingEmiAmount: normalizedDueMembers.reduce(
        (sum, m) => sum + Number(m.pendingEmiAmount || 0),
        0
      ),
      totalOverdueAmount: normalizedDueMembers.reduce(
        (sum, m) => sum + Number(m.totalOverdueAmount || 0),
        0
      ),
    };
  }, [normalizedDueMembers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
              <LayoutDashboard size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Clear pending share, EMI, and insurance tracking for admin users
              </p>
            </div>
          </div>
        </div>

        {/* TOP STATS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Members"
            value={stats?.totalCustomers || 0}
            icon={<Users size={20} />}
            iconWrap="bg-blue-100 text-blue-700"
            badge="Members"
            badgeClass="bg-slate-100 text-slate-600"
          />

          <StatCard
            title="Total Loans"
            value={stats?.totalLoans || 0}
            icon={<CreditCard size={20} />}
            iconWrap="bg-emerald-100 text-emerald-700"
            badge="Loans"
            badgeClass="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="Active Loans"
            value={stats?.activeLoans || 0}
            icon={<CircleDollarSign size={20} />}
            iconWrap="bg-amber-100 text-amber-700"
            badge="Active"
            badgeClass="bg-amber-50 text-amber-700"
          />

          <StatCard
            title="Due Members"
            value={summary.totalDueMembers}
            icon={<Clock3 size={20} />}
            iconWrap="bg-violet-100 text-violet-700"
            badge="Pending"
            badgeClass="bg-violet-50 text-violet-700"
          />
        </div>

        {/* DUE AMOUNT SUMMARY */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Pending Share Amount"
            value={formatCurrency(summary.totalPendingShareAmount)}
            icon={<Wallet size={20} />}
            iconWrap="bg-sky-100 text-sky-700"
            badge="Share"
            badgeClass="bg-sky-50 text-sky-700"
          />

          <StatCard
            title="Pending EMI Amount"
            value={formatCurrency(summary.totalPendingEmiAmount)}
            icon={<BadgeIndianRupee size={20} />}
            iconWrap="bg-indigo-100 text-indigo-700"
            badge="EMI"
            badgeClass="bg-indigo-50 text-indigo-700"
          />

          <StatCard
            title="Pending Insurance Amount"
            value={formatCurrency(summary.totalPendingInsuranceAmount)}
            icon={<Shield size={20} />}
            iconWrap="bg-rose-100 text-rose-700"
            badge="Insurance"
            badgeClass="bg-rose-50 text-rose-700"
          />

          <StatCard
            title="Total Overdue Amount"
            value={formatCurrency(summary.totalOverdueAmount)}
            icon={<AlertCircle size={20} />}
            iconWrap="bg-orange-100 text-orange-700"
            badge="Overdue"
            badgeClass="bg-orange-50 text-orange-700"
          />
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <Search size={18} className="mr-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by member name, phone, or due type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Filter size={18} className="mr-3 text-blue-700" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">All Due Status</option>
                  <option value="overdue">Overdue Only</option>
                  <option value="dueToday">Due Today / Current</option>
                </select>
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Filter size={18} className="mr-3 text-emerald-700" />
                <select
                  value={dueTypeFilter}
                  onChange={(e) => setDueTypeFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">All Due Types</option>
                  <option value="share">Share Missing</option>
                  <option value="emi">EMI Missing</option>
                  <option value="insurance">Insurance Missing</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* DUE TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Due Members Breakdown
              </h2>
              <p className="text-sm text-slate-500">
                Clear member-wise pending share, EMI, and insurance details
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              <CalendarDays size={16} />
              {filteredMembers.length} Records
            </div>
          </div>

          {paginatedMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-emerald-100 p-4 text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <h4 className="text-lg font-semibold text-slate-800">
                No due records found
              </h4>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Try changing the search or filter options.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">Member</th>
                    <th className="px-5 py-4 text-left font-semibold">Phone</th>
                    <th className="px-5 py-4 text-center font-semibold">Pending Share</th>
                    <th className="px-5 py-4 text-center font-semibold">Pending EMI</th>
                    <th className="px-5 py-4 text-center font-semibold">Pending Insurance</th>
                    <th className="px-5 py-4 text-center font-semibold">Total Pending</th>
                    <th className="px-5 py-4 text-center font-semibold">Due Types</th>
                    <th className="px-5 py-4 text-center font-semibold">Due Rows</th>
                    <th className="px-5 py-4 text-center font-semibold">Latest Due Date</th>
                    <th className="px-5 py-4 text-center font-semibold">Days Late</th>
                    <th className="px-5 py-4 text-center font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedMembers.map((member, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white shadow-sm">
                            {member?.customerName
                              ? member.customerName.charAt(0).toUpperCase()
                              : "M"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {member?.customerName || "-"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Pending ledger member
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        <span className="inline-flex items-center gap-2">
                          <Phone size={14} className="text-emerald-600" />
                          {member?.mobile || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center font-semibold text-sky-700">
                        {formatCurrency(member?.pendingShareAmount || 0)}
                      </td>

                      <td className="px-5 py-4 text-center font-semibold text-indigo-700">
                        {formatCurrency(member?.pendingEmiAmount || 0)}
                      </td>

                      <td className="px-5 py-4 text-center font-semibold text-rose-700">
                        {formatCurrency(member?.pendingInsuranceAmount || 0)}
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-slate-900">
                        {formatCurrency(member?.totalOverdueAmount || 0)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                          {member?.hasShare && (
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                              Share
                            </span>
                          )}
                          {member?.hasEmi && (
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                              EMI
                            </span>
                          )}
                          {member?.hasInsurance && (
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                              Insurance
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-amber-600">
                        {member?.pendingRows || 0}
                      </td>

                      <td className="px-5 py-4 text-center text-slate-700">
                        {member?.latestDueDate
                          ? new Date(member.latestDueDate).toLocaleDateString("en-IN")
                          : "-"}
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-red-600">
                        {member?.maxDaysLate || 0}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {member?.maxDaysLate > 0 ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                            <AlertCircle size={14} />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            <Clock3 size={14} />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {filteredMembers.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <div className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white">
                Page {currentPage} of {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StatCard = ({
  title,
  value,
  icon,
  iconWrap = "bg-blue-100 text-blue-700",
  badge = "Overview",
  badgeClass = "bg-slate-100 text-slate-600",
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
    <div className="mb-4 flex items-center justify-between">
      <div className={`rounded-2xl p-3 ${iconWrap}`}>{icon}</div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
        {badge}
      </span>
    </div>

    <p className="text-sm text-slate-500">{title}</p>
    <h2 className="mt-1 break-words text-2xl font-bold text-slate-900">
      {value || 0}
    </h2>
  </div>
);