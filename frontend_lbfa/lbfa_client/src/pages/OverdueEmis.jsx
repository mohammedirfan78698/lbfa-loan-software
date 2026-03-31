import { useEffect, useState } from "react";
import { getOverdueEmis } from "../api/emi.api";

export default function OverdueEmis() {
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverdue();
  }, []);

  const fetchOverdue = async () => {
    try {
      const res = await getOverdueEmis();
      setEmis(res.data.data || []);
    } catch (error) {
      console.error("Error fetching overdue EMIs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-red-700 mb-6">
          Overdue EMI Report
        </h1>

        <div className="bg-white shadow rounded-xl overflow-hidden">

          {loading ? (
            <div className="p-6 text-gray-500">Loading overdue EMIs...</div>
          ) : emis.length === 0 ? (
            <div className="p-6 text-gray-500">No overdue EMIs.</div>
          ) : (

            <table className="w-full">
              <thead className="bg-slate-200 text-gray-700">
                <tr>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Loan ID</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Due Date</th>
                </tr>
              </thead>

              <tbody>
                {emis.map((emi) => (
                  <tr
                    key={emi._id}
                    className="border-t hover:bg-slate-50 transition"
                  >
                    <td className="p-3 font-medium">
                      {emi.loan?.customer?.name || "Unknown"}
                    </td>

                    <td className="p-3 text-gray-600">
                      {emi.loan?._id}
                    </td>

                    <td className="p-3 font-semibold text-red-600">
                      ₹ {emi.amount}
                    </td>

                    <td className="p-3">
                      {new Date(emi.dueDate).toLocaleDateString()}
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