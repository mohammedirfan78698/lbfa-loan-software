import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMonthlyReport } from "../api/reports.api";
import {
  ArrowLeft,
  FileText,
  CalendarDays,
  BadgeIndianRupee,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Receipt,
  Wallet,
} from "lucide-react";

const Reports = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      const data = await getMonthlyReport(month, year);

      if (Array.isArray(data)) {
        setReport(data);
      } else if (Array.isArray(data?.data)) {
        setReport(data.data);
      } else {
        setReport([]);
      }
    } catch (error) {
      console.error("Report fetch error:", error);
      setReport([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const totalCollection = useMemo(() => {
    return report.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }, [report]);

  const totalMonths = useMemo(() => {
    return report.length;
  }, [report]);

  const highestCollection = useMemo(() => {
    if (!report.length) return 0;
    return Math.max(...report.map((item) => Number(item.total) || 0));
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-28 rounded-3xl bg-white shadow-sm" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 rounded-3xl bg-white shadow-sm" />
              ))}
            </div>
            <div className="h-96 rounded-3xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* TOP HEADER */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 md:text-3xl">
                <BarChart3 size={28} />
                Monthly Reports
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                View monthly collection summary and performance
              </p>
            </div>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-blue-700 p-6 text-white shadow-lg">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <p className="text-sm text-blue-100">Collection Dashboard</p>
              <h2 className="mt-1 text-2xl font-bold">Monthly Collection Report</h2>
              <p className="mt-3 max-w-lg text-sm text-blue-100">
                Track total collected amounts month by month with a clean and
                simple overview.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
                  <FileText size={16} />
                  {totalMonths} Records
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white">
                  <Wallet size={16} />
                  {formatCurrency(totalCollection)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="mb-2 text-sm text-blue-100">Total Collection</p>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <BadgeIndianRupee size={24} />
                </div>
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(totalCollection)}</p>
                  <p className="text-xs text-blue-100">Overall collected amount</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="mb-2 text-sm text-blue-100">Highest Month</p>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(highestCollection)}</p>
                  <p className="text-xs text-blue-100">Best monthly collection</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Receipt size={22} />
              </div>
              <span className="text-xs font-medium text-slate-400">Report</span>
            </div>
            <p className="text-sm text-slate-500">Total Records</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalMonths}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <BadgeIndianRupee size={22} />
              </div>
              <span className="text-xs font-medium text-slate-400">Amount</span>
            </div>
            <p className="text-sm text-slate-500">Total Collection</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(totalCollection)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <TrendingUp size={22} />
              </div>
              <span className="text-xs font-medium text-slate-400">Peak</span>
            </div>
            <p className="text-sm text-slate-500">Highest Collection</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(highestCollection)}
            </p>
          </div>
        </div>

        {/* REPORT TABLE */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Monthly Collection Data</h3>
              <p className="text-sm text-slate-500">
                Month-wise collected amount details
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <CalendarDays size={16} />
              {totalMonths} Records
            </div>
          </div>

          {report.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500">
                <AlertCircle size={30} />
              </div>
              <h4 className="text-lg font-semibold text-slate-800">
                No report data found
              </h4>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                No monthly collection data is available right now.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">#</th>
                    <th className="px-6 py-4 text-left font-semibold">Month</th>
                    <th className="px-6 py-4 text-left font-semibold">Total Collection</th>
                  </tr>
                </thead>

                <tbody>
                  {report.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 transition hover:bg-blue-50/40"
                    >
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                            <CalendarDays size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.month || "N/A"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Monthly Report Entry
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(item.total)}
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

export default Reports;