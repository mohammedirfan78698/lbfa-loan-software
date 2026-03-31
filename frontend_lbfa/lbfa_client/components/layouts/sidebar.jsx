import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  BookOpen
} from "lucide-react";

export default function Sidebar() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

  return (

    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col justify-between">

      {/* TOP */}
      <div>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">

          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            L
          </div>

          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              LBFA Sangam
            </h1>

            <p className="text-xs text-gray-500">
              Admin Portal
            </p>
          </div>

        </div>

        {/* FULL WIDTH DIVIDER */}
        <div className="border-t border-gray-200"></div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 px-4 py-6">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${
                isActive
                  ? "bg-blue-600 text-white text-base font-semibold shadow-md"
                  : "text-gray-700 text-sm font-medium hover:bg-gray-100"
              }`
            }
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${
                isActive
                  ? "bg-blue-600 text-white text-base font-semibold shadow-md"
                  : "text-gray-700 text-sm font-medium hover:bg-gray-100"
              }`
            }
          >
            <Users size={20} />
            Members
          </NavLink>

          <NavLink
            to="/loans"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${
                isActive
                  ? "bg-blue-600 text-white text-base font-semibold shadow-md"
                  : "text-gray-700 text-sm font-medium hover:bg-gray-100"
              }`
            }
          >
            <CreditCard size={20} />
            Loans
          </NavLink>

                  <NavLink
                    to="/ledger"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                  >
                    <BookOpen size={20} />
                    Payments
                  </NavLink>

        </nav>



      </div>

      {/* USER + LOGOUT */}
      <div className="p-6 border-t border-gray-200">

        <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-xl">

          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            AD
          </div>

          <span className="text-sm font-semibold text-gray-800">
            Admin User
          </span>

        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 mt-4 text-red-500 hover:text-red-600 text-sm font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>

    </div>
  );
}