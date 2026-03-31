import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getLedgerByCustomer } from "../api/ledger.api";
import jsPDF from "jspdf";

export default function Receipt() {
  const { customerId } = useParams();
  const location = useLocation();

  const [ledger, setLedger] = useState([]);
  const [customer, setCustomer] = useState({});
  const [loan, setLoan] = useState({});
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const stateReceipt = location.state?.receiptData || null;

      let sessionReceipt = null;
      try {
        sessionReceipt = sessionStorage.getItem("receiptData")
          ? JSON.parse(sessionStorage.getItem("receiptData"))
          : null;
      } catch (err) {
        console.error("Session receipt parse error:", err);
      }

      const receiptSource = stateReceipt || sessionReceipt;

      if (receiptSource) {
        setLatest(receiptSource);
        setCustomer(receiptSource.customer || {});
        setLoan(receiptSource.loan || {});
      }

      if (customerId) {
        const res = await getLedgerByCustomer(customerId);
        let data = res?.data?.ledger || res?.data?.data || [];

        if (!Array.isArray(data)) data = [];

        data = [...data].sort((a, b) => {
          const aDate = new Date(
            a.paymentDate ||
              a.ledgerDate ||
              `${a.year || 1970}-${String(a.monthNumber || 1).padStart(2, "0")}-01`
          ).getTime();

          const bDate = new Date(
            b.paymentDate ||
              b.ledgerDate ||
              `${b.year || 1970}-${String(b.monthNumber || 1).padStart(2, "0")}-01`
          ).getTime();

          return bDate - aDate;
        });

        setLedger(data);

        if (!receiptSource) {
          const latestPaid =
            data.find((row) => row.status === "paid") || data[0] || null;

          if (latestPaid) {
            setLatest(latestPaid);
            setCustomer(latestPaid.customer || {});
            setLoan(latestPaid.loan || {});
          }
        }
      }
    } catch (err) {
      console.error("Receipt fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = useMemo(() => {
    return ledger
      .filter((row) => row.status === "paid")
      .reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
  }, [ledger]);

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN");
  };

  const getMonthText = (row) => {
    if (!row) return "-";
    if (row.month) return row.month;
    if (row.ledgerDate) return formatDate(row.ledgerDate);
    if (row.year && row.monthNumber) {
      return `${row.year}-${String(row.monthNumber).padStart(2, "0")}`;
    }
    return "-";
  };

  const downloadPDF = () => {
    if (!latest) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [58, 220],
    });

    let y = 5;

    const line = (text) => {
      doc.text(String(text), 2, y);
      y += 5;
    };

    const formatLine = (label, value) => {
      const val = Number(value || 0);
      doc.text(label, 2, y);
      doc.text("₹", 40, y);
      doc.text(String(val), 56, y, { align: "right" });
      y += 5;
    };

    doc.setFontSize(10);
    doc.text("SANGAM FINANCE", 29, y, { align: "center" });
    y += 5;
    doc.text("LBFA SANGAM", 29, y, { align: "center" });
    y += 5;

    doc.line(2, y, 56, y);
    y += 4;

    line(`Name: ${customer?.name || "-"}`);
    line(`Member ID: ${customer?._id || customerId || "-"}`);
    line(`Date: ${formatDate(latest?.paymentDate)}`);

    doc.line(2, y, 56, y);
    y += 4;

    line(`Month: ${getMonthText(latest)}`);

    doc.line(2, y, 56, y);
    y += 4;

    formatLine("Share", latest?.shareAmount);
    formatLine("Joining", latest?.joiningFee);
    formatLine("EMI", latest?.emiAmount);
    formatLine("Insurance", latest?.insuranceAmount);

    doc.line(2, y, 56, y);
    y += 4;

    formatLine("Total", latest?.totalAmount);

    doc.line(2, y, 56, y);
    y += 4;

    line("Loan Summary");
    formatLine("Loan", loan?.loanAmount);
    formatLine("Interest", loan?.totalInterest);
    formatLine("Total Payable", loan?.totalPayable);

    doc.line(2, y, 56, y);
    y += 4;

    formatLine("Total Paid", totalPaid);

    doc.line(2, y, 56, y);
    y += 4;

    line(`Mode: ${latest?.paymentMode || "-"}`);

    y += 3;
    doc.text("Thank You", 29, y, { align: "center" });

    doc.save("receipt.pdf");
  };

  const handlePrint = () => window.print();

  if (loading) return <p className="p-4">Loading...</p>;
  if (!latest) return <p className="p-4">No receipt data found</p>;

  return (
    <div className="flex justify-center bg-gray-100 p-4">
      <div className="receipt bg-white p-3 text-[12px] shadow rounded">
        <div className="text-center">
          <p className="font-bold">SANGAM FINANCE</p>
          <p>LBFA SANGAM</p>
        </div>

        <hr />

        <p>Name: {customer?.name || "-"}</p>
        <p style={{ wordBreak: "break-all" }}>
          Member ID: {customer?._id || customerId || "-"}
        </p>
        <p>Date: {formatDate(latest?.paymentDate)}</p>

        <hr />

        <p>Month: {getMonthText(latest)}</p>

        <hr />

        <div className="receipt-line">
          <span>Share</span>
          <span>₹ {latest?.shareAmount || 0}</span>
        </div>

        <div className="receipt-line">
          <span>Joining</span>
          <span>₹ {latest?.joiningFee || 0}</span>
        </div>

        <div className="receipt-line">
          <span>EMI</span>
          <span>₹ {latest?.emiAmount || 0}</span>
        </div>

        <div className="receipt-line">
          <span>Insurance</span>
          <span>₹ {latest?.insuranceAmount || 0}</span>
        </div>

        <div className="receipt-line total">
          <span>Total</span>
          <span>₹ {latest?.totalAmount || 0}</span>
        </div>

        <hr />

        <p className="font-bold">Loan Summary</p>

        <div className="receipt-line">
          <span>Loan</span>
          <span>₹ {loan?.loanAmount || 0}</span>
        </div>

        <div className="receipt-line">
          <span>Interest</span>
          <span>₹ {loan?.totalInterest || 0}</span>
        </div>

        <div className="receipt-line">
          <span>Total Payable</span>
          <span>₹ {loan?.totalPayable || 0}</span>
        </div>


        <hr />
        
        <div className="receipt-line total">
          <span>Total Paid</span>
          <span>₹ {totalPaid}</span>
        </div>

        <p>Mode: {latest?.paymentMode || "-"}</p>
        <p className="text-center mt-2">Thank You</p>
      </div>

      <div className="ml-4 flex flex-col gap-2">
        <button
          onClick={downloadPDF}
          className="bg-green-600 text-white px-3 py-2 rounded"
        >
          Download PDF
        </button>

        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          Print
        </button>
      </div>
    </div>
  );
}