import Sidebar from "./sidebar";
import Header from "./header";

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <Sidebar />

      {/* Right Side */}
      <div className="ml-64 flex flex-col w-full">

        {/* Header */}
        <Header />

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  );
};

export default MainLayout;