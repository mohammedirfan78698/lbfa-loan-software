import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLedger } from "../api/ledger.api";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Wallet,
  Users,
  CheckCircle2,
  Clock3,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Filter,
  CalendarDays,
  Phone,
  LayoutList,
} from "lucide-react";

export default function Ledger() {
  const navigate = useNavigate();

  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getLedger();
      setLedger(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Ledger fetch error:", err);
      setError(err?.response?.data?.message || "Failed to load ledger");
      setLedger([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-IN") : "-";

  const groupedCustomers = useMemo(() => {
    const customerMap = new Map();

    for (const row of ledger) {
      const customerId = row?.customer?._id;
      if (!customerId) continue;

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName: row.customer?.name || "Unknown",
          mobile: row.customer?.mobile || row.customer?.phoneNo || "-",
          paymentGenerationActive: row.customer?.paymentGenerationActive ?? true,
          rows: [],
        });
      }

      customerMap.get(customerId).rows.push(row);
    }

    const customers = Array.from(customerMap.values()).map((item) => {
      const rows = [...item.rows].sort(
        (a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)
      );

      const pendingRows = rows.filter((r) => r.status === "pending");
      const paidRows = rows.filter((r) => r.status === "paid");

      const currentPending = pendingRows[0] || null;
      const latestRow = rows[rows.length - 1] || null;

      return {
        customerId: item.customerId,
        customerName: item.customerName,
        mobile: item.mobile,
        paymentGenerationActive: item.paymentGenerationActive,
        currentMonth: currentPending?.month || latestRow?.month || "-",
        dueDate: currentPending?.dueDate || latestRow?.dueDate || null,
        shareAmount: Number(currentPending?.shareAmount || 0),
        joiningFee: Number(currentPending?.joiningFee || 0),
        emiAmount: Number(currentPending?.emiAmount || 0),
        insuranceAmount: Number(currentPending?.insuranceAmount || 0),
        pendingAmount: Number(currentPending?.totalAmount || 0),
        totalPaid: paidRows.reduce(
          (sum, row) => sum + Number(row.totalAmount || 0),
          0
        ),
        totalSharePaid: paidRows.reduce(
          (sum, row) => sum + Number(row.shareAmount || 0),
          0
        ),
        totalEmiPaid: paidRows.reduce(
          (sum, row) => sum + Number(row.emiAmount || 0),
          0
        ),
        totalInsurancePaid: paidRows.reduce(
          (sum, row) => sum + Number(row.insuranceAmount || 0),
          0
        ),
        totalJoiningFeePaid: paidRows.reduce(
          (sum, row) => sum + Number(row.joiningFee || 0),
          0
        ),
        paidCount: paidRows.length,
        pendingCount: pendingRows.length,
        loanActive: rows.some((r) => r.loan),
        status: currentPending ? "pending" : "paid",
        isOverdue: Boolean(currentPending?.isOverdue),
      };
    });

    return customers.sort((a, b) =>
      a.customerName.localeCompare(b.customerName)
    );
  }, [ledger]);

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return groupedCustomers.filter((item) => {
      const matchesSearch =
        !value ||
        item.customerName.toLowerCase().includes(value) ||
        item.mobile.toLowerCase().includes(value) ||
        item.currentMonth.toLowerCase().includes(value) ||
        formatDate(item.dueDate).toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending"
          ? item.status === "pending"
          : statusFilter === "paid"
          ? item.status === "paid"
          : statusFilter === "overdue"
          ? item.isOverdue
          : true;

      return matchesSearch && matchesStatus;
    });
  }, [groupedCustomers, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / rowsPerPage)
  );

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const dashboard = useMemo(() => {
    return {
      totalMembers: groupedCustomers.length,
      pendingMembers: groupedCustomers.filter((c) => c.status === "pending")
        .length,
      overdueMembers: groupedCustomers.filter((c) => c.isOverdue).length,
      paidMembers: groupedCustomers.filter((c) => c.status === "paid").length,
      totalPendingAmount: groupedCustomers.reduce(
        (sum, c) => sum + Number(c.pendingAmount || 0),
        0
      ),
      totalPaidAmount: groupedCustomers.reduce(
        (sum, c) => sum + Number(c.totalPaid || 0),
        0
      ),
    };
  }, [groupedCustomers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
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
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <LayoutList size={13} />
                Payment Management
              </div>

              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <Wallet size={22} />
                </div>
                Payment
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Clean customer-wise ledger overview for admin tracking
              </p>
            </div>

            <button
              type="button"
              onClick={fetchLedger}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardCard
            title="Total Members"
            value={dashboard.totalMembers}
            icon={<Users size={20} />}
            iconClass="bg-blue-100 text-blue-700"
          />

          <DashboardCard
            title="Pending Members"
            value={dashboard.pendingMembers}
            icon={<Clock3 size={20} />}
            iconClass="bg-amber-100 text-amber-700"
          />

          <DashboardCard
            title="Overdue Members"
            value={dashboard.overdueMembers}
            icon={<AlertCircle size={20} />}
            iconClass="bg-rose-100 text-rose-700"
          />

          <DashboardCard
            title="Pending Amount"
            value={formatCurrency(dashboard.totalPendingAmount)}
            icon={<IndianRupee size={20} />}
            iconClass="bg-violet-100 text-violet-700"
          />

          <DashboardCard
            title="Total Paid"
            value={formatCurrency(dashboard.totalPaidAmount)}
            icon={<IndianRupee size={20} />}
            iconClass="bg-teal-100 text-teal-700"
          />
        </div>

        {/* SEARCH + FILTER */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <Search size={20} className="mr-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by member name, mobile number, month, or due date..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Filter size={18} />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">All Members</option>
                  <option value="pending">Pending Only</option>
                  <option value="overdue">Overdue Only</option>
                  <option value="paid">Completed Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Customer Payment Overview
              </h2>
              <p className="text-sm text-slate-500">
                One clean row for each customer
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              <CalendarDays size={16} />
              {filteredCustomers.length} Records
            </div>
          </div>

          {paginatedCustomers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-slate-700">
                No customers found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing search or filter
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-semibold">Member</th>
                    <th className="px-4 py-4 text-left font-semibold">Month</th>
                    <th className="px-4 py-4 text-left font-semibold">Due Date</th>
                    <th className="px-4 py-4 text-left font-semibold">Share</th>
                    <th className="px-4 py-4 text-left font-semibold">Joining</th>
                    <th className="px-4 py-4 text-left font-semibold">EMI</th>
                    <th className="px-4 py-4 text-left font-semibold">Insurance</th>
                    <th className="px-4 py-4 text-left font-semibold">Pending</th>
                    <th className="px-4 py-4 text-left font-semibold">Total Paid</th>
                    <th className="px-4 py-4 text-left font-semibold">Loan</th>
                    <th className="px-4 py-4 text-left font-semibold">Status</th>
                    <th className="px-4 py-4 text-center font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCustomers.map((item) => (
                    <tr
                      key={item.customerId}
                      className="border-b border-slate-100 transition hover:bg-blue-50/30"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                            {item.customerName?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.customerName}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone size={12} />
                              {item.mobile}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">
                        {item.currentMonth}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">
                        {formatDate(item.dueDate)}
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {formatCurrency(item.shareAmount)}
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {formatCurrency(item.joiningFee)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-blue-700">
                        {formatCurrency(item.emiAmount)}
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {formatCurrency(item.insuranceAmount)}
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-900">
                        {formatCurrency(item.pendingAmount)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-emerald-700">
                        {formatCurrency(item.totalPaid)}
                      </td>

                      <td className="px-4 py-4">
                        {item.loanActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            <CreditCard size={12} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            No Loan
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {item.status === "pending" ? (
                          item.isOverdue ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                              <AlertCircle size={14} />
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              <Clock3 size={14} />
                              Pending
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={14} />
                            Completed
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/member-ledger/${item.customerId}`)}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-800 hover:to-indigo-800"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {filteredCustomers.length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:gap-4">
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

function DashboardCard({ title, value, icon, iconClass }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`mb-3 inline-flex rounded-2xl p-3 ${iconClass}`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}