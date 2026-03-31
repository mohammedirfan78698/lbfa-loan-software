import { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { getEmisByLoan, payEmi } from "../api/emi.api";
import { getLoanById } from "../api/loan.api";
// axiosInstance removed: using mock APIs for frontend-only mode
import { generateEMISchedule } from "../utils/emiCalculator";
import {
  downloadLoanPDF,
  exportEmiExcel,
  exportPaymentExcel
} from "../api/reports.api";





const EmiDetails = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  

  const [loan, setLoan] = useState(null);
  const [emis, setEmis] = useState([]);
  const [emiSchedule, setEmiSchedule] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [paymentMode, setPaymentMode] = useState("💰 Cash");


  // ===============================
  // Fetch Loan Details
  // ===============================
  const fetchLoan = async () => {
    try {
      const res = await getLoanById(loanId);
      const loanData = res?.data || res;
      
      console.log("Loan Data:", loanData);
      setLoan(loanData);

      // Calculate EMI schedule if loan has required fields
      if (
        loanData?.loanAmount &&
        loanData?.interestRate &&
        loanData?.durationMonths
      ) {
        const monthlyRate = loanData.interestRate / 100; // since you use 1% directly

        const schedule = generateEMISchedule(
          loanData.loanAmount,
          monthlyRate,
          loanData.durationMonths
        );

        setEmiSchedule(schedule);
      } else {
        console.warn("Loan missing required fields:", {
          loanAmount: loanData?.loanAmount,
          interestRate: loanData?.interestRate,
          durationMonths: loanData?.durationMonths,
        });
      }

    } catch (error) {
      console.error("Error fetching loan:", error);
    }
  };

  // ===============================
  // Fetch EMI Schedule
  // ===============================
  const fetchEmis = async () => {
    try {
      const res = await getEmisByLoan(loanId);
      // getEmisByLoan may return an array (mock) or an axios response
      const emiList = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);

      const sortedEmis = Array.isArray(emiList)
        ? emiList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        : [];

      console.log("Fetched EMIs:", sortedEmis);
      setEmis(sortedEmis);
    } catch (error) {
      console.error("Error fetching EMIs:", error);
    }
  };

  // ===============================
  // Fetch Payments
  // ===============================
  const fetchPayments = async () => {
    try {
      const { getLoanPayments } = await import("../api/emi.api");
      const res = await getLoanPayments(loanId);

      const paymentsList = Array.isArray(res)
        ? res
        : res?.data?.data || [];

      setPayments(paymentsList);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    }
  };

  useEffect(() => {
    if (!loanId) return;

    const loadData = async () => {
      try {
        await fetchLoan();
        await fetchEmis();
        await fetchPayments();
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId]);

  // ===============================
  // Open Payment Modal
  // ===============================
  const openPaymentModal = (emi, scheduleItem) => {
    setSelectedEmi({ emi, scheduleItem });
    setPaymentMode("💰 Cash");
  };

  // ===============================
  // Close Payment Modal
  // ===============================
  const closePaymentModal = () => {
    setSelectedEmi(null);
    setPaymentMode("💰 Cash");
  };

  // ===============================
  // Pay Specific EMI with Details
  // ===============================
  const handlePay = async () => {
    if (!selectedEmi) {
      alert("❌ No EMI selected");
      return;
    }
    console.log("Selected EMI Object:", selectedEmi);

    const emiId =
      selectedEmi?.emi?._id ||
      selectedEmi?.scheduleItem?._id ||
      null;

      console.log("EMI ID being sent:", emiId); 

      const emiAmount = parseFloat(
        selectedEmi?.emi?.totalAmount ??
        selectedEmi?.emi?.amount ??
        0
      );


    if (!emiAmount || emiAmount <= 0) {
      alert("❌ Invalid EMI amount");
      return;
    }

    if (!paymentMode) {
      alert("❌ Please select payment mode");
      return;
    }

    try {
      const payload = {
        amount: emiAmount,
        paymentDate: new Date().toISOString(),
        paymentMode: paymentMode.split(" ").pop(),
        loanId: loanId,
      };

      console.log("Final Payment Payload:", payload);

      // If backend EMI exists
      if (emiId) {
        await payEmi(emiId, payload);
      } else {
        // Mock mode fallback
        const { payEmiMock } = await import("../api/emi.api");
        await payEmiMock(payload);
      }

      alert(
        `✅ Payment Successful\n\nAmount: ₹${emiAmount.toLocaleString()}\nMode: ${paymentMode}`
      );

      closePaymentModal();

      await fetchEmis();
      await fetchPayments();

    } catch (error) {
      console.error("Payment Error:", error.response?.data);
      alert(error.response?.data?.message || "❌ Payment Failed");
    }
  };


  if (loading)
    return <p className="p-6 text-lg">Loading EMI details...</p>;

  const pendingEmis = emis.filter(
    (emi) => String(emi.status || "").toUpperCase() !== "PAID"
  );


    // 🔽 File Download Helper
  const handleDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
  };

  // 🔽 PDF
  const handlePDF = async () => {
    const data = await downloadLoanPDF(loanId);
    handleDownload(data, "Loan_Statement.pdf");
  };

  // 🔽 EMI Excel
  const handleEmiExcel = async () => {
    const data = await exportEmiExcel(loanId);
    handleDownload(data, "EMI_Schedule.xlsx");
  };

  // 🔽 Payment Excel
  const handlePaymentExcel = async () => {
    const data = await exportPaymentExcel(loanId);
    handleDownload(data, "Payments.xlsx");
  };

  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">EMI Payments</h2>

      

      {/* ✅ DOWNLOAD BUTTONS ADDED HERE */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handlePDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          📄 Download PDF
        </button>

        <button
          onClick={handleEmiExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
        >
          📊 Export EMI Excel
        </button>

        <button
          onClick={handlePaymentExcel}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
        >
          📑 Export Payments Excel
        </button>

          {/* Action Buttons */}
  <div className="flex gap-3">

    <button
      onClick={() => navigate(`/loan-payments/${loan._id}`)}
      className="bg-blue-600 text-white font-semibold px-6 py-3 shadow hover:bg-blue-700 transition"
    >
      Loan Payments
    </button>

    <button
      onClick={() => navigate(`/overdue-emis/${loan._id}`)}
      className="bg-red-600 text-white font-semibold px-6 py-3 shadow hover:bg-red-700 transition"
    >
      Overdue EMIs
    </button>

  </div>

      </div>
      

      {/* LOAN SUMMARY */}
      {loan && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg mb-6 border-l-4 border-blue-600 shadow-md">
          <h3 className="text-2xl font-bold mb-4 text-blue-800">📊 Loan Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-gray-600 text-sm font-semibold">Principal Amount</p>
              <p className="font-bold text-2xl text-blue-600">
                ₹{loan?.loanAmount ? loan.loanAmount.toLocaleString() : "—"}
              </p>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-gray-600 text-sm font-semibold">Interest Rate (p.a.)</p>
              <p className="font-bold text-2xl text-orange-600">{loan?.interestRate || "—"}%</p>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-gray-600 text-sm font-semibold">Loan Tenure</p>
              <p className="font-bold text-2xl text-purple-600">{loan?.durationMonths || "—"} months</p>
            </div>
            <div className="bg-green-50 p-3 rounded border border-green-300">
              <p className="text-gray-600 text-sm font-semibold">Monthly EMI</p>
              <p className="font-bold text-2xl text-green-600">
                ₹{emiSchedule[0]?.emi ? Math.round(emiSchedule[0].emi).toLocaleString() : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PAY EMI BUTTON */}
      <button
        onClick={() => setShowPending(!showPending)}
        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded mb-6"
      >
        💰 Pay EMI
      </button>

      {/* PENDING EMI TABLE */}
      {showPending && (
        <div className="bg-gray-100 p-4 rounded mb-6 shadow-md overflow-x-auto">
          <h3 className="text-lg font-bold mb-3">Pending EMIs</h3>

          {pendingEmis.length === 0 ? (
            <p>No pending EMIs 🎉</p>
          ) : (
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3 border">Due Date</th>
                  <th className="p-3 border">EMI Amount</th>
                  <th className="p-3 border">Principal</th>
                  <th className="p-3 border">Interest</th>
                  <th className="p-3 border">Balance</th>
                  <th className="p-3 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingEmis.map((emi, pendingIdx) => {
                  // Find the index of this EMI in the full emis array
                  const fullIndex = emis.findIndex(e => e._id === emi._id);
                  // Get the corresponding schedule item
                  let scheduleItem = emiSchedule[fullIndex] || emiSchedule[pendingIdx] || {};
                  
                  // Fallback: If no schedule item, create one from EMI data
                  if (!scheduleItem.emi && emi.emiAmount) {
                    const nextEmi = pendingEmis[pendingIdx + 1];
                    const principalDecrease = nextEmi 
                      ? (emi.emiAmount - nextEmi.emiAmount) 
                      : (emi.emiAmount * 0.2); // Estimate if no next EMI
                    
                    scheduleItem = {
                      emi: emi.emiAmount,
                      principal: Math.max(0, principalDecrease),
                      interest: Math.max(0, emi.emiAmount - principalDecrease),
                      balance: loan?.principal || 0,
                    };
                  }
                  
                  const emiAmountValue = emi.emiAmount || scheduleItem.emi;
                  const principalValue = Math.round(scheduleItem.principal || 0);
                  const interestValue = Math.round(scheduleItem.interest || 0);
                  const balanceValue = Math.round(scheduleItem.balance || 0);
                  
                  return (
                    <tr key={emi._id} className="text-center hover:bg-gray-300">
                      <td className="p-3 border font-bold">
                        {new Date(emi.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 border font-bold text-green-600 text-lg">
                        ₹{emiAmountValue ? Math.round(emiAmountValue).toLocaleString() : "—"}
                      </td>
                      <td className="p-3 border text-blue-600 font-semibold">
                        {principalValue > 0 ? `₹${principalValue.toLocaleString()}` : "₹0"}
                      </td>
                      <td className="p-3 border text-orange-600 font-semibold">
                        {interestValue > 0 ? `₹${interestValue.toLocaleString()}` : "₹0"}
                      </td>
                      <td className="p-3 border text-purple-600 font-semibold">
                        {balanceValue > 0 ? `₹${balanceValue.toLocaleString()}` : "₹0"}
                      </td>
                      <td className="p-3 border">
                        <button
                          onClick={() => openPaymentModal(emi, scheduleItem)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold"
                        >
                          Pay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PAYMENT MODAL */}
      {selectedEmi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">💳 Pay EMI</h3>

            {/* EMI Details */}
            <div className="bg-blue-50 p-4 rounded mb-4 border-2 border-blue-400">
              <p className="text-sm text-gray-700 font-semibold">EMI Amount Due (This Month)</p>
              <p className="text-4xl font-bold text-green-600 mt-2">
                ₹{Math.round(selectedEmi.emi.emiAmount || selectedEmi.scheduleItem.emi || 0).toLocaleString()}
              </p>
              <hr className="my-3" />
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-white p-2 rounded border border-blue-200">
                  <p className="text-gray-600 text-xs font-bold">Principal</p>
                  <p className="font-bold text-blue-600 text-lg">
                    ₹{Math.round(selectedEmi.scheduleItem.principal || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-2 rounded border border-orange-200">
                  <p className="text-gray-600 text-xs font-bold">Interest</p>
                  <p className="font-bold text-orange-600 text-lg">
                    ₹{Math.round(selectedEmi.scheduleItem.interest || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-2 rounded border border-purple-200">
                  <p className="text-gray-600 text-xs font-bold">Balance</p>
                  <p className="font-bold text-purple-600 text-lg">
                    ₹{Math.round(selectedEmi.scheduleItem.balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3 text-gray-800">
                💳 Select Payment Mode
              </label>

              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full border-2 border-gray-300 rounded p-3 text-lg font-semibold bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="cash">💰 Cash</option>
                <option value="upi">📱 UPI</option>
                <option value="bank">🏦 Bank </option>
                <option value="card">💳 Card</option>
              </select>
            </div>



            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closePaymentModal}
                className="px-5 py-2 border-2 border-gray-400 rounded font-bold hover:bg-gray-100 transition"
              >
                ✕ Cancel
              </button>
              <button
                onClick={handlePay}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-lg shadow-lg transition transform hover:scale-105"
              >
                ✓ Pay ₹{Math.round(selectedEmi.emi.emiAmount || selectedEmi.scheduleItem.emi || 0).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SUMMARY */}
      <div className="mb-6">
        {(() => {
          const totalPaid = Array.isArray(payments)
          ? payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
          : 0;

          const totalDue = loan?.loanAmount || 0;

          const totalRemaining = Math.max(0, totalDue - totalPaid);

          // Safe progress calculation
          const rawPercentage = totalDue
            ? (totalPaid / totalDue) * 100
            : 0;

          // Never allow above 100%
          const paidPercentage = Math.min(Math.round(rawPercentage), 100);

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-100 p-4 rounded border-l-4 border-green-600">
                <p className="text-gray-600 text-sm">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{totalPaid.toFixed(2)}
                </p>
              </div>
              <div className="bg-red-100 p-4 rounded border-l-4 border-red-600">
                <p className="text-gray-600 text-sm">Remaining</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{totalRemaining.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded border-l-4 border-purple-600">
                <p className="text-gray-600 text-sm">Total Loan</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{totalDue.toFixed(2)}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded border-l-4 border-blue-600">
                <p className="text-gray-600 text-sm">Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {paidPercentage}%
                </p>
                <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* PAYMENT HISTORY TABLE */}
      <h3 className="text-lg font-bold mb-3">Payment History</h3>

      {payments.length === 0 ? (
        <p>No EMI payments found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 border">Date</th>
                <th className="p-3 border">Amount Paid</th>
                <th className="p-3 border">Payment Mode</th>
                <th className="p-3 border">Remaining Balance</th>
                <th className="p-3 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(payments) && payments.map((pay, idx) => {
                const cumulativePaid = payments
                  .slice(0, idx + 1)
                  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                const totalDue = loan?.loanAmount || 0;
                const remainingAfterPayment = Math.max(0, totalDue - cumulativePaid);

                return (
                  <tr key={pay._id} className="text-center hover:bg-gray-100">
                    <td className="p-3 border">
                      {new Date(pay.createdAt || pay.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 border font-semibold text-green-600">
                      ₹{parseFloat(pay.amount).toFixed(2)}
                    </td>
                    <td className="p-3 border text-sm">{pay.paymentMode}</td>
                    <td className="p-3 border text-red-600 font-semibold">
                      ₹{remainingAfterPayment.toFixed(2)}
                    </td>
                    <td className="p-3 border">
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold">
                        ✅ Paid
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmiDetails;
