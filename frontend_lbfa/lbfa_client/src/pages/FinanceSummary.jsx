import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function FinanceSummary() {

  const { customerId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await api.get(`/ledger/summary/${customerId}`);
    setData(res.data.data);
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto bg-white p-4 shadow rounded">

      <h2 className="text-lg font-bold mb-3">
        Financial Summary
      </h2>

      <p>Total Share Paid: ₹ {data.totalShare}</p>
      <p>Total Insurance Paid: ₹ {data.totalInsurance}</p>

      <p>
        Last Share Paid:{" "}
        {data.lastShareDate
          ? new Date(data.lastShareDate).toLocaleDateString()
          : "N/A"}
      </p>

      <p>
        Last Insurance Paid:{" "}
        {data.lastInsuranceDate
          ? new Date(data.lastInsuranceDate).toLocaleDateString()
          : "N/A"}
      </p>

    </div>
  );
}