import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  getCustomerById,
  updatePersonalDetails,
  updateNomineeDetails,
  updateFinancialDetails,
  getAnnualStatement,   // ✅ ADDED
} from "../api/customers.api";

import {
  getCustomerInsurances,
  deleteInsurance,
  createInsurance,
  updateInsurance,
} from "../api/insurance.api";

export default function CustomerProfile() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [statement, setStatement] = useState(null); // ✅ ADDED
  const [insurances, setInsurances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

const [editPersonal, setEditPersonal] = useState(false);
const [editNominee, setEditNominee] = useState(false);
const [editFinancial, setEditFinancial] = useState(false); // ✅ ADD THIS
const [showInsuranceForm, setShowInsuranceForm] = useState(false);
const [editInsuranceId, setEditInsuranceId] = useState(null);

  const [insuranceForm, setInsuranceForm] = useState({
    paidDate: "",
    paidAmount: "",
    claimYear: "",
  });

  const [financialDetails, setFinancialDetails] = useState({
    joiningAmount: "",
    shareAmount: "",
    bonusAmount: "",
  });

  const navigate = useNavigate();

  // ================= PERSONAL STATE =================
  const [personalData, setPersonalData] = useState({
    subgroupNo: "",
    sangamAccountNo: "",
    joinFee: "",
    dateOfJoin: "",
    dob: "",
    fatherName: "",
    aadhaarNo: "",
  });

  // ================= NOMINEE STATE =================
  const [nomineeData, setNomineeData] = useState({
    nomineeName: "",
    nomineeRelation: "",
    nomineeAadhaar: "",
    nomineeMobile: "",
  });

  // ================= LOAD CUSTOMER =================
  useEffect(() => {
    fetchCustomer();
    fetchStatement(); // ✅ ADDED
  }, [id]);

  useEffect(() => {
    if (activeTab === "insurance") fetchInsurances();
  }, [activeTab]);

  // ================= FETCH CUSTOMER =================
  const fetchCustomer = async () => {
    try {
      const response = await getCustomerById(id);
      const data = response.data.data;

      setCustomer(data);

      // PERSONAL DATA
      setPersonalData({
        subgroupNo: data?.subgroupNo || "",
        sangamAccountNo: data?.sangamAccountNo || "",
        joinFee: data?.joinFee || "",
        dateOfJoin: data?.dateOfJoin?.substring(0, 10) || "",
        dob: data?.dob?.substring(0, 10) || "",
        fatherName: data?.fatherName || "",
        aadhaarNo: data?.aadhaarNo || "",
      });

      // NOMINEE DATA
      setNomineeData({
        nomineeName: data?.nomineeName || "",
        nomineeRelation: data?.nomineeRelation || "",
        nomineeAadhaar: data?.nomineeAadhaar || "",
        nomineeMobile: data?.nomineeMobile || "",
      });

      // FINANCIAL DATA
      setFinancialDetails({
        joiningAmount: data?.joiningAmount || "",
        shareAmount: data?.shareAmount || "",
        bonusAmount: data?.bonusAmount || "",
      });

    } catch (error) {
      console.log(error);
      alert("Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  // ================= FETCH ANNUAL STATEMENT =================
  const fetchStatement = async () => {
    try {
      const response = await getAnnualStatement(id);
      setStatement(response.data.data);
    } catch (error) {
      console.log("Error fetching annual statement:", error);

      // If token expired → redirect to login
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  const fetchInsurances = async () => {
    try {
      const response = await getCustomerInsurances(id);
      setInsurances(response.data.data || []);
    } catch (error) {
      console.log(error);
      alert("Failed to load insurance records");
    }
  };

  const handlePersonalChange = (e) => {
    setPersonalData({
      ...personalData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNomineeChange = (e) => {
    setNomineeData({
      ...nomineeData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFinancialChange = (e) => {
    setFinancialDetails({
      ...financialDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handleFinancialSave = async () => {
    try {
      setSaving(true);

      await updateFinancialDetails(id, financialDetails);

      // Refresh customer data
      await fetchCustomer();

      // Refresh annual statement totals
      await fetchStatement();

      // Exit edit mode
      setEditFinancial(false);

      alert("Financial details updated successfully");

    } catch (error) {
      console.error(error);
      alert("Failed to update financial details");
    } finally {
      setSaving(false);
    }
  };
  const handleSavePersonal = async () => {
    try {
      setSaving(true);
      await updatePersonalDetails(id, personalData);
      await fetchCustomer();
      setEditPersonal(false);
      alert("Personal details updated successfully");
    } catch {
      alert("Failed to update personal details");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNominee = async () => {
    try {
      setSaving(true);
      await updateNomineeDetails(id, nomineeData);
      await fetchCustomer();
      setEditNominee(false);
      alert("Nominee details updated successfully");
    } catch {
      alert("Failed to update nominee details");
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteInsurance = async (insuranceId) => {
    if (!window.confirm("Delete this insurance record?")) return;
    try {
      await deleteInsurance(insuranceId);
      await fetchInsurances();
      await fetchStatement(); // ✅ update totals after delete
    } catch {
      alert("Failed to delete insurance");
    }
  };

  const handleAddInsurance = async () => {
    try {
      if (!insuranceForm.paidDate || !insuranceForm.paidAmount) {
        return alert("Paid Date and Paid Amount are required");
      }

      if (editInsuranceId) {
        await updateInsurance(editInsuranceId, insuranceForm);
        alert("Insurance updated successfully");
      } else {
        await createInsurance(id, insuranceForm);
        alert("Insurance added successfully");
      }

      setInsuranceForm({
        paidDate: "",
        paidAmount: "",
        claimYear: "",
      });

      setEditInsuranceId(null);
      setShowInsuranceForm(false);
      await fetchInsurances();
      await fetchStatement(); // ✅ refresh totals
    } catch (error) {
      console.log(error);
      alert("Failed to save insurance");
    }
  };

  const handleEditInsurance = (insurance) => {
    setInsuranceForm({
      paidDate: insurance.paidDate?.substring(0, 10) || "",
      paidAmount: insurance.paidAmount || "",
      claimYear: insurance.claimYear || "",
    });

    setEditInsuranceId(insurance._id);
    setShowInsuranceForm(true);
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "-";

  if (loading) return <div className="p-10">Loading...</div>;
  if (!customer) return <div className="p-10">Customer Not Found</div>;

    return (
  <div className="min-h-screen bg-slate-100 py-10 px-6">
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header Row */}
      <div className="flex items-center justify-between">

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-blue-900">
          Customer Profile
        </h1>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/customer-payments/${customer._id}`)}
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow hover:bg-blue-700 transition"
          >
            Customer Payments
          </button>

          <button
            onClick={() => navigate(`/member-ledger/${customer._id}`)}
            className="bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow hover:bg-emerald-700 transition"
          >
            Member Ledger
          </button>
        </div>
      </div>
      {/* ================= HEADER ================= */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl p-8 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-blue-100 mt-1">{customer.mobile}</p>
          <p className="text-sm text-blue-200">
            {customer.address || "No address provided"}
          </p>
        </div>

        <button
          onClick={() => navigate(`/customers/${id}/annual-statement`)}
          className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-xl shadow hover:bg-blue-100 transition"
        >
          View Annual Statement
        </button>
        
      </div>
      

      {/* ================= TABS CONTAINER ================= */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {/* ================= TAB NAVIGATION ================= */}
        <div className="flex border-b bg-slate-50">
          {["basic", "personal", "nominee", "financial", "insurance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium capitalize transition-all
                ${
                  activeTab === tab
                    ? "border-b-4 border-blue-900 text-blue-900 bg-white"
                    : "text-gray-500 hover:text-blue-900"
                }`}
            >
              {tab} Details
            </button>
          ))}
        </div>




        <div className="p-8 space-y-6">



          {/* ================= BASIC ================= */}
          {activeTab === "basic" && (
            <div className="grid md:grid-cols-2 gap-6">
              <InfoCard label="Full Name" value={customer.name} />
              <InfoCard label="Mobile Number" value={customer.mobile} />
              <InfoCard label="Address" value={customer.address} />
              <InfoCard label="Created At" value={formatDate(customer.createdAt)} />
            </div>
          )}

          {/* ================= PERSONAL ================= */}
          {activeTab === "personal" && (
            <>
              {!editPersonal ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <InfoCard label="Subgroup No" value={customer.subgroupNo} />
                  <InfoCard label="Sangam Account No" value={customer.sangamAccountNo} />
                  <InfoCard label="Join Fee" value={`₹ ${customer.joinFee || 0}`} />
                  <InfoCard label="Date Of Join" value={formatDate(customer.dateOfJoin)} />
                  <InfoCard label="Date Of Birth" value={formatDate(customer.dob)} />
                  <InfoCard label="Father Name" value={customer.fatherName} />
                  <InfoCard label="Aadhaar Number" value={customer.aadhaarNo} />

                  <div className="md:col-span-2 text-right">
                    <button
                      onClick={() => setEditPersonal(true)}
                      className="bg-blue-900 text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition"
                    >
                      Edit Personal Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {renderInput("Subgroup No", "subgroupNo", personalData, handlePersonalChange)}
                  {renderInput("Sangam Account No", "sangamAccountNo", personalData, handlePersonalChange)}
                  {renderInput("Join Fee", "joinFee", personalData, handlePersonalChange, "number")}
                  {renderInput("Date Of Join", "dateOfJoin", personalData, handlePersonalChange, "date")}
                  {renderInput("Date Of Birth", "dob", personalData, handlePersonalChange, "date")}
                  {renderInput("Father Name", "fatherName", personalData, handlePersonalChange)}
                  {renderInput("Aadhaar Number", "aadhaarNo", personalData, handlePersonalChange)}

                  <div className="md:col-span-2 flex justify-end gap-4">
                    <button
                      onClick={() => setEditPersonal(false)}
                      className="px-6 py-2 border rounded-xl hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePersonal}
                      className="bg-blue-900 text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= NOMINEE ================= */}
          {activeTab === "nominee" && (
            <>
              {!editNominee ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <InfoCard label="Nominee Name" value={customer.nomineeName} />
                  <InfoCard label="Relation" value={customer.nomineeRelation} />
                  <InfoCard label="Nominee Aadhaar" value={customer.nomineeAadhaar} />
                  <InfoCard label="Nominee Mobile" value={customer.nomineeMobile} />

                  <div className="md:col-span-2 text-right">
                    <button
                      onClick={() => setEditNominee(true)}
                      className="bg-blue-900 text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition"
                    >
                      Edit Nominee Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {renderInput("Nominee Name", "nomineeName", nomineeData, handleNomineeChange)}
                  {renderInput("Relation", "nomineeRelation", nomineeData, handleNomineeChange)}
                  {renderInput("Nominee Aadhaar", "nomineeAadhaar", nomineeData, handleNomineeChange)}
                  {renderInput("Nominee Mobile", "nomineeMobile", nomineeData, handleNomineeChange)}

                  <div className="md:col-span-2 flex justify-end gap-4">
                    <button
                      onClick={() => setEditNominee(false)}
                      className="px-6 py-2 border rounded-xl hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNominee}
                      className="bg-blue-900 text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= FINANCIAL ================= */}

          {activeTab === "financial" && (
            <>
              {!editFinancial ? (
                <div className="grid md:grid-cols-3 gap-6">
                  <InfoCard label="Joining Amount" value={`₹ ${customer.joiningAmount || 0}`} />
                  <InfoCard label="Share Amount" value={`₹ ${customer.shareAmount || 0}`} />
                  <InfoCard label="Bonus Amount" value={`₹ ${customer.bonusAmount || 0}`} />

                  <div className="md:col-span-3 text-right">
                    <button
                      onClick={() => setEditFinancial(true)}
                      className="bg-blue-900 text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition"
                    >
                      Edit Financial Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {renderInput("Joining Amount", "joiningAmount", financialDetails, handleFinancialChange, "number")}
                  {renderInput("Share Amount", "shareAmount", financialDetails, handleFinancialChange, "number")}
                  {renderInput("Bonus Amount", "bonusAmount", financialDetails, handleFinancialChange, "number")}

                  <div className="md:col-span-3 flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setEditFinancial(false);
                        setFinancialDetails({
                          joiningAmount: customer.joiningAmount || "",
                          shareAmount: customer.shareAmount || "",
                          bonusAmount: customer.bonusAmount || "",
                        });
                      }}
                      className="px-6 py-2 border rounded-xl hover:bg-gray-100"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleFinancialSave}
                      className="bg-blue-900 text-white px-6 py-2 rounded-xl hover:bg-blue-800 transition"
                    >
                      Save Financial Details
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= INSURANCE ================= */}
          {activeTab === "insurance" && (
            <div className="space-y-6">

              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Insurance Records</h2>
                <button
                  onClick={() => setShowInsuranceForm(!showInsuranceForm)}
                  className="bg-blue-900 text-white px-5 py-2 rounded-xl hover:bg-blue-800 transition"
                >
                  {showInsuranceForm ? "Cancel" : "Add Insurance"}
                </button>
              </div>

              {showInsuranceForm && (
                <div className="grid md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl shadow-inner">
                  {renderInput("", "paidDate", insuranceForm, (e)=>setInsuranceForm({...insuranceForm, paidDate:e.target.value}), "date")}
                  {renderInput("", "paidAmount", insuranceForm, (e)=>setInsuranceForm({...insuranceForm, paidAmount:e.target.value}), "number")}
                  {renderInput("", "claimYear", insuranceForm, (e)=>setInsuranceForm({...insuranceForm, claimYear:e.target.value}), "number")}

                  <div className="md:col-span-3 text-right">
                    <button
                      onClick={handleAddInsurance}
                      className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition"
                    >
                      {editInsuranceId ? "Update Insurance" : "Save Insurance"}
                    </button>
                  </div>
                </div>
              )}

              {insurances.length === 0 ? (
                <div className="bg-slate-50 p-6 rounded-xl text-gray-500">
                  No insurance records found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl shadow">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-4 text-left">Paid Date</th>
                        <th className="p-4 text-left">Paid Amount</th>
                        <th className="p-4 text-left">Claim Year</th>
                        <th className="p-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insurances.map((insurance) => (
                        <tr key={insurance._id} className="border-t hover:bg-slate-50">
                          <td className="p-4">{formatDate(insurance.paidDate)}</td>
                          <td className="p-4 font-medium">₹ {insurance.paidAmount}</td>
                          <td className="p-4">{insurance.claimYear || "-"}</td>
                          <td className="p-4 space-x-2">
                            <button
                              onClick={() => handleEditInsurance(insurance)}
                              className="bg-yellow-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-yellow-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteInsurance(insurance._id)}
                              className="bg-red-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              
            </div>
          )}
          
        </div>
      </div>
    </div>
      
  </div>
);



          function renderInput(label, name, state, onChange, type = "text") {
  return (
    <div>
      {label && <label className="block mb-2 text-sm font-medium">{label}</label>}
      <input
        type={type}
        name={name}
        value={state[name] || ""}
        onChange={onChange}
        className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
      />
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-50 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold mt-1">{value || "-"}</p>
    </div>
  );
}
}