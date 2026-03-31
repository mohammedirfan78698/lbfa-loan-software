import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getCustomerPayments } from "../api/emi.api";

export default function CustomerPayments() {
  const { id } = useParams();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPayments();
    }
  }, [id]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await getCustomerPayments(id);
      setPayments(res?.data?.data || []);
    } catch (err) {
      console.error("Error loading payments:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedPayments = useMemo(() => {
    const map = new Map();

    payments.forEach((payment) => {
      const loanId = payment?.loan?._id || payment?.loan || "unknown-loan";

      if (!map.has(loanId)) {
        map.set(loanId, {
          loanId,
          loanAmount: payment?.loan?.loanAmount || 0,
          startDate: payment?.loan?.startDate || null,
          status: payment?.loan?.status || "unknown",
          closedAt: payment?.loan?.closedAt || null,
          payments: [],
        });
      }

      map.get(loanId).payments.push(payment);
    });

    return Array.from(map.values()).sort((a, b) => {
      const aDate = new Date(a.startDate || 0).getTime();
      const bDate = new Date(b.startDate || 0).getTime();
      return bDate - aDate;
    });
  }, [payments]);

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">
          Customer Payment History
        </h1>

        {loading ? (
          <div className="bg-white shadow rounded-xl p-6 text-gray-500">
            Loading payments...
          </div>
        ) : groupedPayments.length === 0 ? (
          <div className="bg-white shadow rounded-xl p-6 text-gray-500">
            No payments found.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedPayments.map((loanGroup, index) => (
              <div
                key={loanGroup.loanId}
                className="bg-white shadow rounded-xl overflow-hidden"
              >
                <div className="px-6 py-4 bg-slate-100 border-b">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        Loan {groupedPayments.length - index}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Loan Amount: ₹{" "}
                        {Number(loanGroup.loanAmount || 0).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${
                          String(loanGroup.status).toLowerCase() === "closed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {String(loanGroup.status).toLowerCase() === "closed"
                          ? "Closed"
                          : "Active"}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Start:{" "}
                        {loanGroup.startDate
                          ? new Date(loanGroup.startDate).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </span>

                      {loanGroup.closedAt && (
                        <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 font-medium">
                          Closed:{" "}
                          {new Date(loanGroup.closedAt).toLocaleDateString(
                            "en-IN"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-slate-200 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Payment Mode</th>
                      <th className="p-3 text-left">EMI No</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loanGroup.payments.map((p) => (
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

                        <td className="p-3">
                          {p.emi?.installmentNumber || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}