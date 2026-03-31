import { useEffect, useMemo, useState } from "react";
import { getAllCustomers } from "../api/customers.api";
import { useNavigate } from "react-router-dom";

import {
  Users,
  UserPlus,
  Phone,
  MapPin,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserMinus2,
  ArrowLeft,
  CalendarDays,
  AlertCircle,
  FileSpreadsheet,
  BadgeInfo,
  Filter,
  RefreshCw,
  LayoutList,
} from "lucide-react";

export default function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const normalizeArray = (res) => {
    if (Array.isArray(res)) return res;
    if (!res) return [];
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.customers)) return res.data.customers;
    if (Array.isArray(res.customers)) return res.customers;
    return [];
  };

  const getPagesCount = (res) => {
    return (
      res?.pages ||
      res?.data?.pages ||
      res?.totalPages ||
      res?.data?.totalPages ||
      1
    );
  };

  const fetchAllCustomersData = async () => {
    try {
      setLoading(true);

      const firstRes = await getAllCustomers(1, "");
      const firstPageCustomers = normalizeArray(firstRes);
      const totalBackendPages = getPagesCount(firstRes);

      let allCustomers = [...firstPageCustomers];

      if (totalBackendPages > 1) {
        const requests = [];
        for (let page = 2; page <= totalBackendPages; page++) {
          requests.push(getAllCustomers(page, ""));
        }

        const responses = await Promise.all(requests);

        responses.forEach((res) => {
          allCustomers = [...allCustomers, ...normalizeArray(res)];
        });
      }

      setCustomers(allCustomers);
    } catch (error) {
      console.error(error);
      setCustomers([]);
      alert("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCustomersData();
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN");
  };

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const name = customer?.name?.toLowerCase() || "";
      const mobile = String(customer?.mobile || "").toLowerCase();
      const subgroup = String(customer?.subgroupNo || "").toLowerCase();
      const address = customer?.address?.toLowerCase() || "";
      const status = (customer?.status || "active").toLowerCase();

      const matchesSearch =
        !value ||
        name.includes(value) ||
        mobile.includes(value) ||
        subgroup.includes(value) ||
        address.includes(value);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? status !== "passive"
          : status === "passive";

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / rowsPerPage)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredCustomers.slice(indexOfFirst, indexOfLast);

  const totalMembers = customers.length;

  const activeMembers = useMemo(() => {
    return customers.filter((customer) => customer?.status !== "passive").length;
  }, [customers]);

  const passiveMembers = useMemo(() => {
    return customers.filter((customer) => customer?.status === "passive").length;
  }, [customers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <LayoutList size={13} />
                  Member Management
                </div>

                <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                    <Users size={22} />
                  </div>
                  Members
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Clean and simple member management for admin users
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fetchAllCustomersData}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => navigate("/customers/add")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-800 hover:to-indigo-800"
              >
                <UserPlus size={18} />
                Add Member
              </button>
            </div>
          </div>
        </div>

        {/* TOP STATS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Members"
            value={totalMembers}
            tag="Total"
            icon={<Users size={20} />}
            iconClass="bg-blue-100 text-blue-700"
            tagClass="bg-slate-100 text-slate-600"
          />

          <StatCard
            title="Active Members"
            value={activeMembers}
            tag="Active"
            icon={<UserCheck size={20} />}
            iconClass="bg-emerald-100 text-emerald-700"
            tagClass="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="Passive Members"
            value={passiveMembers}
            tag="Passive"
            icon={<UserMinus2 size={20} />}
            iconClass="bg-amber-100 text-amber-700"
            tagClass="bg-amber-50 text-amber-700"
          />

          <StatCard
            title="Visible Records"
            value={filteredCustomers.length}
            tag="Records"
            icon={<FileSpreadsheet size={20} />}
            iconClass="bg-violet-100 text-violet-700"
            tagClass="bg-violet-50 text-violet-700"
          />
        </div>

        {/* SEARCH + FILTER */}
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <Search size={20} className="mr-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, subgroup or address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="flex h-full items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Filter size={18} />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">All Members</option>
                  <option value="active">Active Members</option>
                  <option value="passive">Passive Members</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ">
          <div className="flex flex-col gap-5 border-b  md:flex-row md:items-left md:justify-between">
            <div className="border-b border-slate-200 px-5 py-4 ">
              <h2 className="text-lg font-semibold text-slate-900">Members List</h2>
              <p className="text-sm text-slate-500">
                Important member records only with clean and stable placement
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-9 pr-3 ">
              <InfoChip
                icon={<CalendarDays size={16} />}
                text={`Page ${currentPage} of ${totalPages}`}
                className="bg-sky-50 text-sky-700"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                No members found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                No matching member records are available for your search or filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Member
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Subgroup
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Mobile
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Address
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Join Date
                    </th>
                    <th className="border-r border-blue-600 px-6 py-4 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentRows.map((customer) => {
                    const isPassive = customer?.status === "passive";

                    return (
                      <tr
                        key={customer._id}
                        className="border-b border-slate-100 transition hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                              {customer.name
                                ? customer.name.charAt(0).toUpperCase()
                                : "C"}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {customer.name || "-"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Member account
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {customer.subgroupNo || "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          <span className="flex items-center gap-2">
                            <Phone size={14} className="text-emerald-600" />
                            {customer.mobile || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          <span className="flex items-center gap-2">
                            <MapPin size={14} className="text-rose-500" />
                            {customer.address || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {formatDate(customer.dateOfJoin)}
                        </td>

                        <td className="px-6 py-4">
                          {isPassive ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Passive
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => navigate(`/customers/${customer._id}`)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-800 hover:to-indigo-800"
                          >
                            <Eye size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CENTER PAGINATION */}
        {filteredCustomers.length > 0 && (
          <div className="mt-6 flex justify-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <div className="flex flex-col items-center">
                <div className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Showing {indexOfFirst + 1} -{" "}
                  {Math.min(indexOfLast, filteredCustomers.length)} of{" "}
                  {filteredCustomers.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, tag, icon, iconClass, tagClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-2xl p-3 ${iconClass}`}>{icon}</div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tagClass}`}>
          {tag}
        </span>
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InfoChip({ icon, text, className }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${className}`}
    >
      {icon}
      {text}
    </div>
  );
}