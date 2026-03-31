import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getLoansByCustomer } from "../api/loan.api";
import {
  ArrowLeft,
  Eye,
  History,
  CreditCard,
  CalendarDays,
  CheckCircle2,
  Landmark,
  Percent,
  AlertCircle,
  Clock3,
} from "lucide-react";

const LoanHistory = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);

        const res = await getLoansByCustomer(customerId);
        const loanList = Array.isArray(res?.data) ? res.data : [];

        setLoans(loanList);
        setCustomerName(loanList[0]?.customer?.name || "");
      } catch (error) {
        console.error("Loan history load error:", error);
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) loadHistory();
  }, [customerId]);

  // ✅ Show all loans
  const sortedLoans = useMemo(() => {
    return [...loans].sort(
      (a, b) =>
        new Date(b.createdAt || b.startDate || 0).getTime() -
        new Date(a.createdAt || a.startDate || 0).getTime()
    );
  }, [loans]);

  const activeLoans = useMemo(() => {
    return sortedLoans.filter(
      (loan) => String(loan.status || "").toLowerCase() === "active"
    );
  }, [sortedLoans]);

  const closedLoans = useMemo(() => {
    return sortedLoans.filter(
      (loan) => String(loan.status || "").toLowerCase() === "closed"
    );
  }, [sortedLoans]);

  const formatCurrency = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString("en-IN");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
          <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
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
                <History size={13} />
                Loan History
              </div>

              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                  <CreditCard size={22} />
                </div>
                {customerName || "Customer"} Loan History
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                All loan records are shown here including active and closed loans
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              Active Loans: {activeLoans.length}
            </div>

            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              Closed Loans: {closedLoans.length}
            </div>

            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              Total Loans: {sortedLoans.length}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              All Loan Records
            </h2>
            <p className="text-sm text-slate-500">
              Active and previous closed loan records for this customer
            </p>
          </div>

          {sortedLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                No loan history found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                No loan records are available for this customer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Loan Amount</th>
                    <th className="px-6 py-4 text-left font-semibold">Interest</th>
                    <th className="px-6 py-4 text-left font-semibold">Duration</th>
                    <th className="px-6 py-4 text-left font-semibold">Start Date</th>
                    <th className="px-6 py-4 text-left font-semibold">Closed Date</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-center font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedLoans.map((loan) => {
                    const isClosed =
                      String(loan.status || "").toLowerCase() === "closed";

                    return (
                      <tr
                        key={loan._id}
                        className="border-b border-slate-100 transition hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Landmark size={16} className="text-blue-700" />
                            {formatCurrency(loan.loanAmount)}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          <div className="flex items-center gap-2">
                            <Percent size={15} className="text-violet-700" />
                            {loan.interestRate}%
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {loan.durationMonths} months
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={15} className="text-amber-700" />
                            {formatDate(loan.startDate)}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {formatDate(loan.closedAt)}
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
      </div>
    </div>
  );
};

export default LoanHistory;