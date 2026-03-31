import { useState, useEffect } from "react";
import { getLoans } from "../api/loan.api";
import { getCustomers } from "../api/customers.api";

export default function Emis() {
  const [emis, setEmis] = useState([]);
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch loans and customers
      const loansRes = await getLoans();
      const customersRes = await getCustomers();

      // Normalize responses to arrays supporting shapes:
      // - axios response: { data: [...] } or { data: { data: [...] } }
      // - direct array
      const normalizeArray = (res) => {
        if (Array.isArray(res)) return res;
        if (!res) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.data)) return res.data.data;
        if (Array.isArray(res.data?.loans)) return res.data.loans;
        return [];
      };

      const loansData = normalizeArray(loansRes);
      const customersData = normalizeArray(customersRes);

      setLoans(loansData);
      setCustomers(customersData);

      // Extract EMIs from loans
      const allEmis = [];
      loansData.forEach((loan) => {
        if (loan.emis && Array.isArray(loan.emis)) {
          loan.emis.forEach((emi) => {
            allEmis.push({
              ...emi,
              loanId: loan._id,
              customerId: loan.customerId,
            });
          });
        }
      });

      setEmis(allEmis);
    } catch (error) {
      console.error("Error fetching data:", error);
      setEmis([]);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    return customer ? customer.name : "N/A";
  };

  const getLoanAmount = (loanId) => {
    const loan = loans.find((l) => l._id === loanId);
    return loan ? `₹${loan.loanAmount?.toLocaleString()}` : "N/A";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading EMIs...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">EMI Payments</h2>

      {emis.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No EMI records found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Loan Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {emis.map((emi, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {getCustomerName(emi.customerId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {getLoanAmount(emi.loanId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {formatDate(emi.dueDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-semibold">
                    ₹{emi.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        emi.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : emi.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {emi.status || "PENDING"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
