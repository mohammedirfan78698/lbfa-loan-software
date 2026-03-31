export default function Navbar() {
  return (
    <div className="h-16 bg-white shadow px-6 flex items-center justify-between">

      <h2 className="text-lg font-semibold text-slate-800">
        Dashboard
      </h2>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }}
        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}
