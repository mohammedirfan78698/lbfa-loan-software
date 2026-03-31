import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLoanPayments } from "../api/emi.api";

export default function LoanPayments() {
  const { loanId } = useParams();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loanId) {
      loadPayments();
    }
  }, [loanId]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await getLoanPayments(loanId);
      setPayments(res?.data?.data || []);
    } catch (error) {
      console.error("Error loading payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">
          Loan Payment History
        </h1>

        <div className="bg-white shadow rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-gray-500">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-gray-500">No payments found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-200 text-gray-700">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Payment Mode</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p._id}
                    className="border-t hover:bg-slate-50 transition"
                  >
                    <td className="p-3">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td className="p-3 font-semibold text-green-700">
                      ₹ {Number(p.amount || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="p-3 capitalize">
                      {p.paymentMode || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}