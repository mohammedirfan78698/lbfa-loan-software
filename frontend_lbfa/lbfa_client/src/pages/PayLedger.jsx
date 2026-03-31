import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLedgerById, payLedger } from "../api/ledger.api";
import {
  ChevronDown,
  ArrowLeft,
  Wallet,
  IndianRupee,
  User,
  CalendarDays,
  CreditCard,
  Shield,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function PayLedger() {
  const { ledgerId } = useParams();
  const navigate = useNavigate();

  const [ledger, setLedger] = useState(null);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

  useEffect(() => {
    if (ledgerId) {
      fetchLedger();
    }
  }, [ledgerId]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getLedgerById(ledgerId);
      setLedger(res?.data?.data || null);
    } catch (err) {
      console.error("Fetch ledger error:", err);
      setError("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);
      setError("");

      const payload = {
        paymentMode,
        paymentDate: new Date().toISOString(),
      };

      const res = await payLedger(ledgerId, payload);

      const paidLedger = res?.data?.data || res?.data?.receiptData || null;
      const nextLedger = res?.data?.nextLedger || null;
      const history = res?.data?.history || [];
      const receiptData = res?.data?.receiptData || res?.data?.data || paidLedger;

      if (!receiptData) {
        setError("Payment completed but receipt data is missing");
        return;
      }

      const customerId =
        receiptData?.customer?._id ||
        receiptData?.customer ||
        paidLedger?.customer?._id ||
        paidLedger?.customer ||
        ledger?.customer?._id ||
        ledger?.customer;

      if (!customerId) {
        setError("Payment completed but customer id is missing");
        return;
      }

      // receipt
      sessionStorage.setItem("receiptData", JSON.stringify(receiptData));

      // member ledger instant refresh data
      sessionStorage.setItem("ledgerRefresh", "true");
      sessionStorage.setItem("ledgerHistory", JSON.stringify(history || []));
      sessionStorage.setItem("nextLedger", JSON.stringify(nextLedger || null));
      sessionStorage.setItem("paidLedger", JSON.stringify(paidLedger || null));

      navigate(`/receipt/${customerId}`, {
        state: {
          receiptData,
          paidLedger: paidLedger || receiptData,
          nextLedger,
          history,
        },
      });
    } catch (err) {
      console.error("Payment error:", err);
      console.error("Payment error response:", err?.response?.data);

      setError(
        err?.response?.data?.message || "Failed to complete payment"
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl bg-white px-8 py-6 shadow-sm">
          <p className="text-lg font-medium text-slate-600">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-red-600">Ledger data not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-2xl bg-blue-700 px-4 py-2 text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const shareAmount = Number(ledger.shareAmount || 0);
  const joiningFee = Number(ledger.joiningFee || 0);
  const emiAmount = Number(ledger.emiAmount || 0);
  const insuranceAmount = Number(ledger.insuranceAmount || 0);
  const totalAmount = Number(ledger.totalAmount || 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <Wallet size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Confirm Payment</h1>
                <p className="text-sm text-blue-100">
                  Complete this member ledger payment
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-500">
                <User size={16} />
                <span className="text-sm">Member Name</span>
              </div>
              <p className="text-lg font-semibold text-slate-800">
                {ledger?.customer?.name || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-500">
                <CalendarDays size={16} />
                <span className="text-sm">Month</span>
              </div>
              <p className="text-lg font-semibold text-slate-800">
                {ledger?.month || "N/A"}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-blue-700">
                <Wallet size={16} />
                <span className="text-sm">Share Amount</span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(shareAmount)}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-700">
                <FileText size={16} />
                <span className="text-sm">Joining Fee</span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(joiningFee)}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-700">
                <CreditCard size={16} />
                <span className="text-sm">EMI Amount</span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(emiAmount)}
              </p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-violet-700">
                <Shield size={16} />
                <span className="text-sm">Insurance Amount</span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {formatCurrency(insuranceAmount)}
              </p>
            </div>
          </div>

          <div className="px-6 pb-4">
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-5 text-white">
              <div>
                <p className="text-sm text-slate-300">Total Payable</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <IndianRupee size={30} />
            </div>
          </div>

          <div className="px-6 pb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Payment Mode
            </label>

            <div className="relative">
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-10 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle size={18} className="mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="mt-5 w-full rounded-2xl bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {processing ? "Processing Payment..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}