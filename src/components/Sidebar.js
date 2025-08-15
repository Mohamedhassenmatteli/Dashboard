import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false); // sidebar toggle (mobile)
  const [dashboardOpen, setDashboardOpen] = useState(true); // accordion toggle (default open)

  const dashboardLinks = [
    { name: "User Dashboard", path: "/superadmin/UserInsight" },
    { name: "Fleet Dashboard", path: "/superadmin/FleetDashboard" },
    { name: "Delivery Dashboard", path: "/superadmin/DeliveryDashboard" },
    { name: "Leave Dashboard", path: "/superadmin/CongesDashboard" },
    { name: "Driver Performance", path: "/superadmin/DriverPerformance" },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-60 p-2 rounded-md bg-blue-600 text-white shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-gradient-to-b from-white to-gray-100 shadow-lg h-screen fixed top-0 left-0 z-50 transition-transform transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:z-auto`}
      >
        <div className="p-6 border-b border-gray-200 text-2xl font-bold text-gray-800">
          Super Admin
        </div>

        <nav className="flex flex-col px-4 py-6 space-y-2">
          {/* Dashboard accordion */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className="w-full flex justify-between items-center px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 rounded-md transition-all"
            >
              <span>Dashboards</span>
              <span className="text-gray-500">
                {dashboardOpen ? "−" : "+"}
              </span>
            </button>

            {dashboardOpen && (
              <div className="mt-1 space-y-1 pl-4">
                {dashboardLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                      }`
                    }
                    onClick={() => setIsOpen(false)} // close sidebar on mobile
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
