import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  getLedgerByCustomer,
  updateCustomerPaymentStatus,
} from "../api/ledger.api";
import {
  ArrowLeft,
  Wallet,
  User,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  Clock3,
  Shield,
  CreditCard,
  BadgeIndianRupee,
  History,
  Power,
  RefreshCw,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function MemberLedger() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [latestPending, setLatestPending] = useState(null);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    totalPaid: 0,
    totalSharePaid: 0,
    totalJoiningFeePaid: 0,
    totalInsurancePaid: 0,
    totalEmiPaid: 0,
    pendingShareAmount: 0,
    pendingInsuranceAmount: 0,
    pendingEmiAmount: 0,
    activeLoan: false,
  });

  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-IN") : "-";

  const recomputeSummary = (rows = []) => {
    const paidRows = rows.filter((row) => row.status === "paid");
    const pendingRows = rows.filter((row) => row.status === "pending");

    return {
      totalRecords: rows.length,
      paidCount: paidRows.length,
      pendingCount: pendingRows.length,
      overdueCount: pendingRows.filter((row) => row.isOverdue).length,
      totalPaid: paidRows.reduce(
        (sum, row) => sum + Number(row.totalAmount || 0),
        0
      ),
      totalSharePaid: paidRows.reduce(
        (sum, row) => sum + Number(row.shareAmount || 0),
        0
      ),
      totalJoiningFeePaid: paidRows.reduce(
        (sum, row) => sum + Number(row.joiningFee || 0),
        0
      ),
      totalInsurancePaid: paidRows.reduce(
        (sum, row) => sum + Number(row.insuranceAmount || 0),
        0
      ),
      totalEmiPaid: paidRows.reduce(
        (sum, row) => sum + Number(row.emiAmount || 0),
        0
      ),
      pendingShareAmount: pendingRows.reduce(
        (sum, row) => sum + Number(row.shareAmount || 0),
        0
      ),
      pendingInsuranceAmount: pendingRows.reduce(
        (sum, row) => sum + Number(row.insuranceAmount || 0),
        0
      ),
      pendingEmiAmount: pendingRows.reduce(
        (sum, row) => sum + Number(row.emiAmount || 0),
        0
      ),
      activeLoan: rows.some((row) => row.loan),
    };
  };

  const sortRowsAsc = (rows = []) => {
    return [...rows].sort(
      (a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)
    );
  };

  const findLatestPending = (rows = []) => {
    return (
      [...rows]
        .filter((row) => row.status === "pending")
        .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))[0] ||
      null
    );
  };

  const applyLocalRefreshFromSession = () => {
    try {
      const refresh = sessionStorage.getItem("ledgerRefresh");
      if (refresh !== "true") return false;

      const storedHistory = sessionStorage.getItem("ledgerHistory");
      const storedNextLedger = sessionStorage.getItem("nextLedger");

      const parsedHistory = storedHistory ? JSON.parse(storedHistory) : null;
      const parsedNextLedger = storedNextLedger ? JSON.parse(storedNextLedger) : null;

      if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
        const normalizedRows = sortRowsAsc(parsedHistory);
        setLedger(normalizedRows);
        setSummary(recomputeSummary(normalizedRows));
        setLatestPending(parsedNextLedger || findLatestPending(normalizedRows));
      } else if (parsedNextLedger) {
        setLatestPending(parsedNextLedger);
        setLedger((prev) => {
          const updated = sortRowsAsc([
            ...prev.filter((row) => row._id !== parsedNextLedger._id),
            parsedNextLedger,
          ]);
          setSummary(recomputeSummary(updated));
          return updated;
        });
      }

      sessionStorage.removeItem("ledgerRefresh");
      sessionStorage.removeItem("ledgerHistory");
      sessionStorage.removeItem("nextLedger");

      return true;
    } catch (err) {
      console.error("Session ledger refresh parse error:", err);
      sessionStorage.removeItem("ledgerRefresh");
      sessionStorage.removeItem("ledgerHistory");
      sessionStorage.removeItem("nextLedger");
      return false;
    }
  };

  const fetchLedger = async (showPageLoader = true) => {
    try {
      if (showPageLoader) setLoading(true);
      else setPageLoading(true);

      setError("");

      const res = await getLedgerByCustomer(customerId);

      const rows = sortRowsAsc(res?.data?.ledger || res?.data?.data || []);
      const customerData = res?.data?.customer || null;
      const pending = res?.data?.latestPending || findLatestPending(rows);
      const summaryData = res?.data?.summary || recomputeSummary(rows);

      setCustomer(customerData);
      setLedger(rows);
      setLatestPending(pending);
      setSummary(summaryData);
    } catch (err) {
      console.error("Fetch member ledger error:", err);
      setError(err?.response?.data?.message || "Failed to load member ledger");
      setLedger([]);
      setLatestPending(null);
      setCustomer(null);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger(true);
  }, [customerId]);

  useEffect(() => {
    const hasLocalRefresh = applyLocalRefreshFromSession();

    if (hasLocalRefresh) {
      fetchLedger(false);
    }
  }, [location.key]);

  const handlePayNow = () => {
    if (!latestPending?._id) return;
    navigate(`/pay-ledger/${latestPending._id}`);
  };

  const handleTogglePaymentStatus = async () => {
    if (!customer?._id) return;

    try {
      setToggleLoading(true);
      setError("");

      await updateCustomerPaymentStatus(
        customer._id,
        !customer.paymentGenerationActive
      );

      setCustomer((prev) => ({
        ...prev,
        paymentGenerationActive: !prev.paymentGenerationActive,
      }));

      await fetchLedger(false);
    } catch (err) {
      console.error("Toggle payment status error:", err);
      setError(
        err?.response?.data?.message || "Failed to update payment status"
      );
    } finally {
      setToggleLoading(false);
    }
  };

  const paidHistory = useMemo(() => {
    return [...ledger]
      .filter((row) => row.status === "paid")
      .sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0));
  }, [ledger]);

  const pendingHistory = useMemo(() => {
    return [...ledger]
      .filter((row) => row.status === "pending")
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  }, [ledger]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Wallet size={13} />
                  Member Ledger
                </div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 md:text-3xl">
                  <Wallet size={25} className="text-blue-700" />
                  Payment Overview
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Track current payment, totals, due dates, and full payment history
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fetchLedger(false)}
                disabled={pageLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
              >
                <RefreshCw size={16} className={pageLoading ? "animate-spin" : ""} />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleTogglePaymentStatus}
                disabled={toggleLoading}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  customer?.paymentGenerationActive
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <Power size={16} />
                {toggleLoading
                  ? "Updating..."
                  : customer?.paymentGenerationActive
                  ? "Stop Auto Payment"
                  : "Activate Auto Payment"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* CUSTOMER + CURRENT PAYMENT */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Member Details
                </h2>
                <p className="text-sm text-slate-500">
                  Basic customer and payment generation status
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoCard
                label="Member Name"
                value={customer?.name || "N/A"}
                icon={<User size={16} />}
                iconClass="bg-blue-100 text-blue-700"
              />

              <InfoCard
                label="Mobile"
                value={customer?.mobile || customer?.phoneNo || "N/A"}
                icon={<FileText size={16} />}
                iconClass="bg-emerald-100 text-emerald-700"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg bg-violet-100 p-2.5 text-violet-700">
                    <Power size={16} />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Payment Generation
                  </p>
                </div>
                <p
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    customer?.paymentGenerationActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {customer?.paymentGenerationActive ? "Active" : "Stopped"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
                    <CreditCard size={16} />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Active Loan
                  </p>
                </div>
                <p
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    summary?.activeLoan
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {summary?.activeLoan ? "Active" : "Not Active"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <IndianRupee size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Current Payment
                </h2>
                <p className="text-sm text-slate-500">
                  Earliest pending payable record
                </p>
              </div>
            </div>

            {latestPending ? (
              <>
                <div className="space-y-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-700">Month</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {latestPending.month || "N/A"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MiniAmountCard
                      label="Due Date"
                      value={formatDate(latestPending.dueDate)}
                      color="bg-slate-50 text-slate-700 border-slate-200"
                    />
                    <MiniAmountCard
                      label="Status"
                      value={latestPending.isOverdue ? "Overdue" : "Pending"}
                      color={
                        latestPending.isOverdue
                          ? "bg-rose-50 text-rose-700 border-rose-100"
                          : "bg-amber-50 text-amber-700 border-amber-100"
                      }
                    />
                    <MiniAmountCard
                      label="Share"
                      value={formatCurrency(latestPending.shareAmount)}
                      color="bg-sky-50 text-sky-700 border-sky-100"
                    />
                    <MiniAmountCard
                      label="Joining Fee"
                      value={formatCurrency(latestPending.joiningFee)}
                      color="bg-violet-50 text-violet-700 border-violet-100"
                    />
                    <MiniAmountCard
                      label="EMI"
                      value={formatCurrency(latestPending.emiAmount)}
                      color="bg-amber-50 text-amber-700 border-amber-100"
                    />
                    <MiniAmountCard
                      label="Insurance"
                      value={formatCurrency(latestPending.insuranceAmount)}
                      color="bg-rose-50 text-rose-700 border-rose-100"
                    />
                  </div>

                  <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white">
                    <p className="text-sm text-slate-300">Total Amount</p>
                    <p className="mt-1 text-3xl font-bold">
                      {formatCurrency(latestPending.totalAmount)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayNow}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-3 font-semibold text-white transition hover:from-blue-800 hover:to-indigo-800"
                >
                  Pay Now
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <Clock3 size={24} className="mx-auto mb-3 text-slate-400" />
                <p className="font-semibold text-slate-700">
                  No pending payment
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  All available ledger records are already paid
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total Paid"
            value={formatCurrency(summary.totalPaid)}
            icon={<BadgeIndianRupee size={20} />}
            iconClass="bg-emerald-100 text-emerald-700"
          />

          <SummaryCard
            title="Total Share Paid"
            value={formatCurrency(summary.totalSharePaid)}
            icon={<Wallet size={20} />}
            iconClass="bg-blue-100 text-blue-700"
          />

          <SummaryCard
            title="Joining Fee Paid"
            value={formatCurrency(summary.totalJoiningFeePaid)}
            icon={<FileText size={20} />}
            iconClass="bg-violet-100 text-violet-700"
          />

          <SummaryCard
            title="Total EMI Paid"
            value={formatCurrency(summary.totalEmiPaid)}
            icon={<CreditCard size={20} />}
            iconClass="bg-amber-100 text-amber-700"
          />

          <SummaryCard
            title="Total Insurance Paid"
            value={formatCurrency(summary.totalInsurancePaid)}
            icon={<Shield size={20} />}
            iconClass="bg-rose-100 text-rose-700"
          />
        </div>

        {/* PENDING SUMMARY */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Pending Share"
            value={formatCurrency(summary.pendingShareAmount)}
            icon={<Wallet size={20} />}
            iconClass="bg-sky-100 text-sky-700"
          />

          <SummaryCard
            title="Pending Insurance"
            value={formatCurrency(summary.pendingInsuranceAmount)}
            icon={<Shield size={20} />}
            iconClass="bg-rose-100 text-rose-700"
          />

          <SummaryCard
            title="Pending EMI"
            value={formatCurrency(summary.pendingEmiAmount)}
            icon={<CreditCard size={20} />}
            iconClass="bg-indigo-100 text-indigo-700"
          />

          <SummaryCard
            title="Overdue Records"
            value={summary.overdueCount}
            icon={<AlertCircle size={20} />}
            iconClass="bg-orange-100 text-orange-700"
          />
        </div>

        {/* STATUS COUNTS */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            title="Total Records"
            value={summary.totalRecords}
            icon={<CalendarDays size={20} />}
            iconClass="bg-sky-100 text-sky-700"
          />

          <SummaryCard
            title="Paid Records"
            value={summary.paidCount}
            icon={<CheckCircle2 size={20} />}
            iconClass="bg-emerald-100 text-emerald-700"
          />

          <SummaryCard
            title="Pending Records"
            value={summary.pendingCount}
            icon={<Clock3 size={20} />}
            iconClass="bg-amber-100 text-amber-700"
          />
        </div>

        {/* PENDING HISTORY */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <Clock3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Pending Records
              </h2>
              <p className="text-sm text-slate-500">
                Current and overdue pending ledger rows
              </p>
            </div>
          </div>

          {pendingHistory.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-700">No pending records</p>
              <p className="mt-1 text-sm text-slate-500">
                All ledger rows are cleared
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Month
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Share
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Joining Fee
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      EMI
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Insurance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingHistory.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-slate-100 transition hover:bg-blue-50/40"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                        {row.month || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(row.dueDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.shareAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.joiningFee)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.emiAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.insuranceAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900">
                        {formatCurrency(row.totalAmount)}
                      </td>
                      <td className="px-4 py-4">
                        {row.isOverdue ? (
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

        {/* PAID HISTORY */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Payment History
              </h2>
              <p className="text-sm text-slate-500">
                All completed payments with breakdown
              </p>
            </div>
          </div>

          {paidHistory.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-700">No payment history yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Once payment is completed, it will appear here instantly
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Month
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Payment Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Share
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Joining Fee
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      EMI
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Insurance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Mode
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paidHistory.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-slate-100 transition hover:bg-blue-50/40"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                        {row.month || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(row.dueDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(row.paymentDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.shareAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.joiningFee)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.emiAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatCurrency(row.insuranceAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900">
                        {formatCurrency(row.totalAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm capitalize text-slate-700">
                        {row.paymentMode || "cash"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon, iconClass }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function MiniAmountCard({ label, value, color }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs font-medium">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryCard({ title, value, icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`mb-3 inline-flex rounded-xl p-3 ${iconClass}`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}