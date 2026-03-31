import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLoanById } from "../api/loan.api";
import {
  ArrowLeft,
  CreditCard,
  User,
  CalendarDays,
  Landmark,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FileText,
  Percent,
  Banknote,
  Sparkles,
  History,
  PlusCircle,
} from "lucide-react";

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [emiSchedule, setEmiSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        setLoading(true);
        const res = await getLoanById(id);
        const loanData = res?.data;

        setLoan(loanData || null);
        setEmiSchedule(Array.isArray(loanData?.emiSchedule) ? loanData.emiSchedule : []);
      } catch (error) {
        console.error("Error fetching loan:", error);
        setLoan(null);
        setEmiSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLoan();
  }, [id]);

  const formatCurrency = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString("en-IN");
  };

  const principalAmount = useMemo(() => Number(loan?.loanAmount || 0), [loan]);

  const totalPayable = useMemo(() => {
    return emiSchedule.reduce(
      (sum, emi) => sum + Number(emi.totalAmount || 0),
      0
    );
  }, [emiSchedule]);

  const totalPaid = useMemo(() => {
    return emiSchedule
      .filter((emi) => emi.status?.toLowerCase() === "paid")
      .reduce((sum, emi) => sum + Number(emi.totalAmount || 0), 0);
  }, [emiSchedule]);

  const totalRemaining = useMemo(() => {
    return Math.max(totalPayable - totalPaid, 0);
  }, [totalPayable, totalPaid]);

  const progress = useMemo(() => {
    return totalPayable > 0
      ? Math.min(Number(((totalPaid / totalPayable) * 100).toFixed(1)), 100)
      : 0;
  }, [totalPaid, totalPayable]);

  const nextPendingEmi = useMemo(() => {
    return emiSchedule.find((emi) => emi.status?.toLowerCase() !== "paid");
  }, [emiSchedule]);

  const currentEmiAmount = nextPendingEmi
    ? formatCurrency(nextPendingEmi.totalAmount)
    : "All EMIs Paid";

  const hasSchedule = emiSchedule.length > 0;

  const allEmisPaid = useMemo(() => {
    return hasSchedule && emiSchedule.every((emi) => emi.status?.toLowerCase() === "paid");
  }, [emiSchedule, hasSchedule]);

  const loanStatus =
    String(loan?.status || "").toLowerCase() === "closed" || allEmisPaid
      ? "Closed"
      : "In Progress";

  const paidCount = useMemo(() => {
    return emiSchedule.filter((emi) => emi.status?.toLowerCase() === "paid").length;
  }, [emiSchedule]);

  const pendingCount = useMemo(() => {
    return emiSchedule.filter((emi) => emi.status?.toLowerCase() !== "paid").length;
  }, [emiSchedule]);

  const isClosed = loanStatus === "Closed";
  const customerId = loan?.customer?._id || "";
  const customerName = loan?.customer?.name || "Customer";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-5">
            <div className="h-24 rounded-2xl border border-slate-200 bg-white shadow-sm" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl border border-slate-200 bg-white shadow-sm"
                />
              ))}
            </div>
            <div className="h-96 rounded-2xl border border-slate-200 bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!loan) {
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
                Loan Details
              </h1>
              <p className="mt-1 text-sm text-slate-500">Loan details not found</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Loan not found</h3>
            <p className="mt-2 text-sm text-slate-500">
              The selected loan record could not be loaded.
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
                Loan Overview
              </div>

              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 md:text-3xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <CreditCard size={18} />
                </div>
                Loan Details
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Full loan summary, payment progress, and EMI schedule
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!!customerId && (
              <button
                type="button"
                onClick={() => navigate(`/loan-history/${customerId}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <History size={16} />
                View Loan History
              </button>
            )}

            {isClosed && !!customerId && (
              <button
                type="button"
                onClick={() =>
                  navigate("/create-loan", {
                    state: {
                      customerId,
                      customerName,
                    },
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <PlusCircle size={16} />
                Create New Loan
              </button>
            )}
          </div>
        </div>

        {/* HERO */}
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-5 text-white shadow-lg">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-28 w-28 -translate-x-6 translate-y-6 rounded-full bg-cyan-300/10 blur-2xl" />

          <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <p className="text-sm text-blue-100">Loan Dashboard</p>
              <h2 className="mt-1 text-2xl font-bold">Loan Summary Overview</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-blue-100">
                View customer details, EMI progress, remaining balance, and the
                complete month-wise repayment schedule.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  <User size={14} />
                  {customerName}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
                  {loanStatus === "Closed" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Clock3 size={14} />
                  )}
                  {loanStatus}
                </span>
              </div>
            </div>

            <HeroMiniCard
              title="Total Paid"
              value={formatCurrency(totalPaid)}
              subtitle="Completed repayments"
              icon={<TrendingUp size={22} />}
            />

            <HeroMiniCard
              title="Remaining Balance"
              value={formatCurrency(totalRemaining)}
              subtitle="Outstanding payable"
              icon={<Wallet size={22} />}
            />
          </div>
        </div>

        {/* CUSTOMER INFO */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-bold text-slate-900">Customer Information</h3>
            <p className="text-sm text-slate-500">
              Basic borrower and loan setup details
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile
              label="Name"
              value={customerName || "N/A"}
              icon={<User size={16} />}
              iconWrap="bg-blue-100 text-blue-700"
            />

            <InfoTile
              label="Interest Rate"
              value={`${loan.interestRate || 0}%`}
              icon={<Percent size={16} />}
              iconWrap="bg-violet-100 text-violet-700"
            />

            <InfoTile
              label="Duration"
              value={`${loan.durationMonths || 0} months`}
              icon={<CalendarDays size={16} />}
              iconWrap="bg-emerald-100 text-emerald-700"
            />

            <InfoTile
              label="Start Date"
              value={formatDate(loan.startDate)}
              icon={<CalendarDays size={16} />}
              iconWrap="bg-amber-100 text-amber-700"
            />
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Loan Amount"
            value={formatCurrency(principalAmount)}
            subtitle="Principal"
            icon={<Landmark size={20} />}
            iconWrap="bg-blue-100 text-blue-700"
          />

          <StatCard
            title="Total Paid"
            value={formatCurrency(totalPaid)}
            subtitle="Paid amount"
            icon={<TrendingUp size={20} />}
            iconWrap="bg-emerald-100 text-emerald-700"
          />

          <StatCard
            title="Remaining"
            value={formatCurrency(totalRemaining)}
            subtitle="Balance amount"
            icon={<Wallet size={20} />}
            iconWrap="bg-rose-100 text-rose-700"
          />

          <StatCard
            title="Current EMI"
            value={currentEmiAmount}
            subtitle="Next payable"
            icon={<Banknote size={20} />}
            iconWrap="bg-amber-100 text-amber-700"
          />

          <StatCard
            title="Loan Status"
            value={loanStatus}
            subtitle="Current stage"
            icon={
              loanStatus === "Closed" ? (
                <CheckCircle2 size={20} />
              ) : (
                <Clock3 size={20} />
              )
            }
            iconWrap={
              loanStatus === "Closed"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-indigo-100 text-indigo-700"
            }
          />
        </div>

        {/* PROGRESS */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Repayment Progress</h3>
              <p className="text-sm text-slate-500">
                Track how much of the loan has been completed
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <FileText size={16} />
              {paidCount} Paid / {pendingCount} Pending
            </div>
          </div>

          <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-slate-600">{progress}% completed</p>
            <p className="font-semibold text-slate-900">
              {formatCurrency(totalPaid)} / {formatCurrency(totalPayable)}
            </p>
          </div>
        </div>

        {/* EMI TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">EMI Schedule</h3>
              <p className="text-sm text-slate-500">
                Month-wise repayment breakdown and status
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              <CalendarDays size={16} />
              {emiSchedule.length} EMIs
            </div>
          </div>

          {emiSchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-500">
                <AlertCircle size={28} />
              </div>
              <h4 className="text-lg font-semibold text-slate-800">
                No EMI schedule found
              </h4>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                EMI schedule data is not available for this loan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">Month</th>
                    <th className="px-5 py-4 text-left font-semibold">Due Date</th>
                    <th className="px-5 py-4 text-left font-semibold">Principal</th>
                    <th className="px-5 py-4 text-left font-semibold">Interest</th>
                    <th className="px-5 py-4 text-left font-semibold">EMI</th>
                    <th className="px-5 py-4 text-left font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {emiSchedule.map((emi, index) => (
                    <tr
                      key={emi._id || index}
                      className="border-b border-slate-100 transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {formatDate(emi.dueDate)}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {formatCurrency(emi.principalAmount)}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {formatCurrency(emi.interestAmount)}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatCurrency(emi.totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        {emi.status?.toLowerCase() === "paid" ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={14} />
                            Paid
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
      </div>
    </div>
  );
};

function HeroMiniCard({ title, value, subtitle, icon }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <p className="mb-2 text-sm text-blue-100">{title}</p>
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/15 p-3 text-white">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-blue-100">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value, icon, iconWrap }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition duration-200 hover:border-blue-200 hover:bg-white hover:shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconWrap}`}>
          {icon}
        </span>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className="text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, iconWrap }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-xl p-3 ${iconWrap}`}>{icon}</div>
        <span className="text-xs font-medium text-slate-400">{subtitle}</span>
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 break-words text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default LoanDetails;