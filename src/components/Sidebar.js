import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "User Dashboard", path: "/superadmin/UserInsight" },
    { name: "Fleet Dashboard", path: "/superadmin/FleetDashboard" },
    { name: "Delivery Dashboard", path: "/superadmin/DeliveryDashboard" },
    { name: "Leave Dashboard", path: "/superadmin/CongesDashboard" },
    { name: "Driver Performance", path: "/superadmin/DriverPerformance" },
  ];

  return React.createElement(
    React.Fragment,
    null,
    // Toggle button visible only on small screens
    React.createElement(
      "button",
      {
        className:
          "md:hidden fixed top-4 left-4 z-60 p-2 rounded-md bg-blue-600 text-white shadow-lg",
        onClick: () => setIsOpen(!isOpen),
        "aria-label": isOpen ? "Close sidebar" : "Open sidebar",
      },
      isOpen
        ? React.createElement("span", null, "✕") // simple close icon
        : React.createElement("span", null, "☰") // hamburger icon
    ),

    // Sidebar
    React.createElement(
      "aside",
      {
        className:
          "w-64 bg-gradient-to-b from-white to-gray-100 shadow-lg h-screen fixed top-0 left-0 z-50 transition-transform transform md:translate-x-0 " +
          (isOpen ? "translate-x-0" : "-translate-x-full") +
          " md:relative md:z-auto",
      },
      React.createElement(
        "div",
        { className: "p-6 border-b border-gray-200 text-2xl font-bold text-gray-800" },
        "Super Admin"
      ),
      React.createElement(
        "nav",
        { className: "flex flex-col px-4 py-6 space-y-3" },
        links.map((link) =>
          React.createElement(
            NavLink,
            {
              key: link.path,
              to: link.path,
              className: ({ isActive }) =>
                "px-4 py-2 rounded-lg transition-all text-sm font-medium " +
                (isActive
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"),
              onClick: () => setIsOpen(false), // close sidebar on link click (mobile)
            },
            link.name
          )
        )
      )
    ),

    // Overlay behind sidebar when open on small screens
    isOpen &&
      React.createElement("div", {
        className: "fixed inset-0 bg-black opacity-40 z-40 md:hidden",
        onClick: () => setIsOpen(false),
      })
  );
};

export default Sidebar;
