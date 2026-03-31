import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAnnualStatement } from "../api/customers.api";

export default function AnnualStatement() {
  const { id } = useParams();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatement();
  }, []);

  const fetchStatement = async () => {
    try {
      const res = await getAnnualStatement(id);
      setStatement(res.data.data);
      console.log("Annual Statement Response:", res.data.data);
    } catch (error) {
      console.error("Error fetching annual statement:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-lg font-semibold text-blue-900">
          Loading Annual Statement...
        </p>
      </div>
    );

  if (!statement)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-lg font-semibold text-red-600">
          No data found
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
      {/* ===== HEADER ===== */}
      <header className="bg-blue-900 text-white py-6 shadow-lg">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-3xl font-bold tracking-wide">
            Annual Share, Loan & Interest Statement
          </h1>
          <p className="text-sm mt-2 text-blue-200">
            Financial Summary Report
          </p>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-grow max-w-5xl mx-auto px-6 py-10 w-full">

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <SummaryCard
            title="Total Insurance Paid"
            value={`₹${statement.totalInsurancePaid || 0}`}
            color="green"
          />
          <SummaryCard
            title="Total Loan Taken"
            value={`₹${statement.totalLoanTaken || 0}`}
            color="blue"
          />
          <SummaryCard
            title="Total Loan Balance"
            value={`₹${statement.totalLoanBalance || 0}`}
            color="red"
          />
        </div>

        {/* DETAILS CARD */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">
            Customer Financial Details
          </h2>

          <table className="w-full border-collapse">
            <tbody>
              <Row label="A/C No" value={statement.accountNumber} />
              <Row label="Name" value={statement.name} />
              <Row label="Joining Amount" value={`₹${statement.joiningAmount || 0}`} />
              <Row label="Share Amount" value={`₹${statement.shareAmount || 0}`} />
              <Row label="Bonus Amount" value={`₹${statement.bonusAmount || 0}`} />
              <Row label="Total Insurance Paid" value={`₹${statement.totalInsurancePaid || 0}`} />
              <Row label="Total Loan Taken" value={`₹${statement.totalLoanTaken || 0}`} />
              <Row
                label="Total Loan Balance"
                value={`₹${statement.totalLoanBalance || 0}`}
                highlight
              />
            </tbody>
          </table>
        </div>

      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-blue-900 text-white text-center py-4 mt-10">
        <p className="text-sm text-blue-200">
          © 2025 Loan & Share Management System | Confidential Financial Report
        </p>
      </footer>
    </div>
  );
}

/* ===== ROW COMPONENT ===== */

function Row({ label, value, highlight }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-4 font-semibold text-gray-700">
        {label}
      </td>
      <td
        className={`py-4 text-right ${
          highlight
            ? "text-red-600 font-bold text-lg"
            : "text-gray-800"
        }`}
      >
        {value}
      </td>
    </tr>
  );
}

/* ===== SUMMARY CARD COMPONENT ===== */

function SummaryCard({ title, value, color }) {
  const colorClasses = {
    green: "bg-green-50 border-green-500 text-green-700",
    blue: "bg-blue-50 border-blue-500 text-blue-700",
    red: "bg-red-50 border-red-500 text-red-700",
  };

  return (
    <div
      className={`p-6 rounded-2xl shadow-md border-l-4 ${colorClasses[color]} transition transform hover:scale-105`}
    >
      <p className="text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-2">{value}</h3>
    </div>
  );
}