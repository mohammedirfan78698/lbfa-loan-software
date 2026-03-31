import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./auth/login";

import Dashboard from "./pages/dashboard";
import Customers from "./pages/customers";
import AddCustomer from "./pages/addCustomer";
import CustomerDetails from "./pages/customerdetails";
import CustomerProfile from "./pages/customerprofile";

import Loans from "./pages/loans";
import LoanDetails from "./pages/loandetails";
import CreateLoan from "./pages/CreateLoan";

import Emis from "./pages/emis";
import EmiDetails from "./pages/emidetails";

import Reports from "./pages/reports";
import Receipt from "./pages/Receipt";

import AnnualStatement from "./pages/annualstatement";
import OverdueEmis from "./pages/OverdueEmis";
import CustomerPayments from "./pages/CustomerPayments";
import LoanPayments from "./pages/LoanPayments";
import MemberLedger from "./pages/MemberLedger";
import Ledger from "./pages/ledger";
import PayLedger from "./pages/PayLedger";
import LoanHistory from "./pages/LoanHistory"

import MainLayout from "../components/layouts/mainlayout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? (
      <MainLayout>{children}</MainLayout>
    ) : (
      <Navigate to="/login" />
    );
  };

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        }
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* CUSTOMERS LIST */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />

      {/* ADD CUSTOMER PAGE */}
      <Route
        path="/customers/add"
        element={
          <ProtectedRoute>
            <AddCustomer />
          </ProtectedRoute>
        }
      />

      {/* CUSTOMER DETAILS */}
      <Route
        path="/customers/:id"
        element={
          <ProtectedRoute>
            <CustomerDetails />
          </ProtectedRoute>
        }
      />

      {/* CUSTOMER PROFILE */}
      <Route
        path="/customers/:id/profile"
        element={
          <ProtectedRoute>
            <CustomerProfile />
          </ProtectedRoute>
        }
      />

      {/* LOANS */}
      <Route
        path="/loans"
        element={
          <ProtectedRoute>
            <Loans />
          </ProtectedRoute>
        }
      />

      {/* LOAN DETAILS */}
      <Route
        path="/loans/:id"
        element={
          <ProtectedRoute>
            <LoanDetails />
          </ProtectedRoute>
        }
      />

      <Route path="/create-loan" element={<CreateLoan />} />

      {/* EMI LIST */}
      <Route
        path="/emis"
        element={
          <ProtectedRoute>
            <Emis />
          </ProtectedRoute>
        }
      />

      {/* EMI DETAILS */}
      <Route
        path="/emi/:loanId"
        element={
          <ProtectedRoute>
            <EmiDetails />
          </ProtectedRoute>
        }
      />

      {/* REPORTS */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* ANNUAL STATEMENT */}
      <Route
        path="/customers/:id/annual-statement"
        element={
          <ProtectedRoute>
            <AnnualStatement />
          </ProtectedRoute>
        }
      />

      {/* OVERDUE EMIs */}
      <Route
        path="/overdue-emis/:loanId"
        element={
          <ProtectedRoute>
            <OverdueEmis />
          </ProtectedRoute>
        }
      />

      {/* CUSTOMER PAYMENTS */}
      <Route
        path="/customer-payments/:customerId"
        element={
          <ProtectedRoute>
            <CustomerPayments />
          </ProtectedRoute>
        }
      />

      {/* LOAN PAYMENTS */}
      <Route
        path="/loan-payments/:loanId"
        element={
          <ProtectedRoute>
            <LoanPayments />
          </ProtectedRoute>
        }
      />

      {/* MEMBER LEDGER */}
      <Route
        path="/member-ledger/:customerId"
        element={
          <ProtectedRoute>
            <MemberLedger />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ledger"
        element={
          <ProtectedRoute>
            <Ledger />
          </ProtectedRoute>
        }
      />

      <Route
        path="/receipt/:customerId"
        element={
          <ProtectedRoute>
            <Receipt />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pay-ledger/:ledgerId"
        element={
          <ProtectedRoute>
            <PayLedger />
          </ProtectedRoute>
        }
      />
      <Route
        path="/loan-history/:customerId"
        element={
          <ProtectedRoute>
            <LoanHistory />
          </ProtectedRoute>
        }
      />

      {/* DEFAULT ROUTE */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
        }
      />

    </Routes>
  );
}

export default App;