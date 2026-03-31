import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoans } from "../api/loan.api";
import { getAllCustomers } from "../api/customers.api";
import axiosInstance from "../api/axios";

import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  WalletCards,
  Filter,
  RefreshCw,
  CalendarDays,
  Activity,
} from "lucide-react";

const Loans = () => {
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalPendingEmis: 0,
    totalOutstandingAmount: 0,
  });

  const normalizeArray = (res) => {
    if (Array.isArray(res)) return res;
    if (!res) return [];
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.loans)) return res.data.loans;
    if (Array.isArray(res.loans)) return res.loans;
    return [];
  };

  const getPagesCount = (res) => {
    return (
      res?.pages ||
      res?.data?.pages ||
      res?.totalPages ||
      res?.data?.totalPages ||
      1
    );
  };

  const formatCurrency = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await axiosInstance.get("/dashboard/stats");
      if (res?.data?.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Dashboard stats error:", error);
    }
  };

  const fetchAllLoans = async () => {
    try {
      setLoading(true);

      const firstRes = await getLoans(1, "");
      const firstPageLoans = normalizeArray(firstRes);
      const pages = getPagesCount(firstRes);

      let allLoans = [...firstPageLoans];

      if (pages > 1) {
        const requests = [];
        for (let page = 2; page <= pages; page++) {
          requests.push(getLoans(page, ""));
        }

        const responses = await Promise.all(requests);

        responses.forEach((res) => {
          allLoans = [...allLoans, ...normalizeArray(res)];
        });
      }

      const customersRes = await getAllCustomers();

      setLoans(allLoans);
      setCustomers(normalizeArray(customersRes));
      await fetchDashboardStats();
    } catch (err) {
      console.error("Error loading loans:", err);
      setLoans([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLoans();
  }, []);

  const filteredLoans = useMemo(() => {
    const value = search.trim().toLowerCase();

    const getLoanTime = (loan) => {
      return new Date(
        loan?.createdAt ||
          loan?.updatedAt ||
          loan?.startDate ||
          0
      ).getTime();
    };

    const groupedByCustomer = new Map();

    loans.forEach((loan) => {
      const customerId = String(loan?.customer?._id || loan?.customer || "");
      if (!customerId) return;

      if (!groupedByCustomer.has(customerId)) {
        groupedByCustomer.set(customerId, []);
      }

      groupedByCustomer.get(customerId).push(loan);
    });

    const visibleLoans = Array.from(groupedByCustomer.values()).map(
      (customerLoans) => {
        const activeLoans = customerLoans.filter(
          (loan) => String(loan?.status || "").toLowerCase() === "active"
        );

        if (activeLoans.length > 0) {
          return activeLoans.sort((a, b) => getLoanTime(b) - getLoanTime(a))[0];
        }

        return customerLoans.sort((a, b) => getLoanTime(b) - getLoanTime(a))[0];
      }
    );

    return visibleLoans.filter((loan) => {
      const customerName = loan?.customer?.name?.toLowerCase() || "";
      const loanId = loan?._id?.toLowerCase() || "";

      const matchesSearch =
        !value || customerName.includes(value) || loanId.includes(value);

      const isClosed = String(loan?.status || "").toLowerCase() === "closed";

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? !isClosed
          : isClosed;

      const months = Number(loan?.durationMonths || 0);
      const matchesDuration =
        durationFilter === "all"
          ? true
          : durationFilter === "short"
          ? months > 0 && months <= 6
          : durationFilter === "medium"
          ? months >= 7 && months <= 12
          : months > 12;

      return matchesSearch && matchesStatus && matchesDuration;
    });
  }, [loans, search, statusFilter, durationFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, durationFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / rowsPerPage));
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredLoans.slice(indexOfFirstRow, indexOfLastRow);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <CreditCard size={13} />
                Loan Management
              </div>

              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <WalletCards size={22} />
                </div>
                Loan Overview
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Simple, clean and professional loan overview for admin users
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchAllLoans}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate("/create-loan")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-800 hover:to-indigo-800"
            >
              <UserPlus size={18} />
              Create Loan
            </button>
          </div>
        </div>

        {/* TOP STATS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Loans"
            value={stats.totalLoans}
            tag="Total"
            icon={<WalletCards size={20} />}
            iconClass="bg-blue-100 text-blue-700"
            tagClass="bg-slate-100 text-slate-600"
          />

          <StatCard
            title="Running Loans"
            value={stats.activeLoans}
            tag="Active"
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-emerald-100 text-emerald-700"
            tagClass="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="Pending EMIs"
            value={stats.totalPendingEmis}
            tag="EMI"
            icon={<Clock3 size={20} />}
            iconClass="bg-amber-100 text-amber-700"
            tagClass="bg-amber-50 text-amber-700"
          />

          <StatCard
            title="Outstanding Amount"
            value={formatCurrency(stats.totalOutstandingAmount)}
            tag="Amount"
            icon={<CircleDollarSign size={20} />}
            iconClass="bg-violet-100 text-violet-700"
            tagClass="bg-violet-50 text-violet-700"
          />
        </div>

        {/* SEARCH + FILTER + INFO */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <Search size={20} className="mr-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by borrower name or loan ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Filter size={18} />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Loans</option>
                  <option value="closed">Closed Loans</option>
                </select>
              </div>
            </div>

            <div className="xl:col-span-3">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <CalendarDays size={18} />
                </div>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">All Duration</option>
                  <option value="short">Up to 6 months</option>
                  <option value="medium">7 to 12 months</option>
                  <option value="long">Above 12 months</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b  md:flex-row md:items-left md:justify-between">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Loan List</h2>
              <p className="text-sm text-slate-500">
                Important records only with clean and stable placement
              </p>
              </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 pr-3">
              <InfoChip
                icon={<Activity size={16} />}
                text={`Page: ${currentPage} / ${totalPages}`}
                className="bg-emerald-50 text-emerald-700"
              />
            </div>
          </div>

          {filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                No loans found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                No matching loan records are available for your search or filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Borrower
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Loan Amount
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Interest
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Duration
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentRows.map((loan) => {
                    const customerName = loan.customer?.name || "Unknown Customer";
                    const shortId = loan._id?.slice(-6) || "N/A";
                    const isClosed =
                      String(loan.status || "").toLowerCase() === "closed";

                    return (
                      <tr
                        key={loan._id}
                        className="border-b border-slate-100 transition hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                              {customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {customerName}
                              </p>
                              <p className="text-xs text-slate-500">
                                Loan ID: {shortId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {formatCurrency(loan.loanAmount)}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {loan.interestRate}%
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {loan.durationMonths} months
                        </td>

                        <td className="px-6 py-4">
                          {isClosed ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={14} />
                              Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              <Clock3 size={14} />
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/loans/${loan._id}`)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-800 hover:to-indigo-800"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CENTER PAGINATION */}
        {filteredLoans.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <div className="flex flex-col items-center">
                <div className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Showing {indexOfFirstRow + 1} -{" "}
                  {Math.min(indexOfLastRow, filteredLoans.length)} of{" "}
                  {filteredLoans.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
};

function StatCard({ title, value, tag, icon, iconClass, tagClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-2xl p-3 ${iconClass}`}>{icon}</div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tagClass}`}>
          {tag}
        </span>
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InfoChip({ icon, text, className }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${className}`}>
      {icon}
      {text}
    </div>
  );
}

export default Loans;