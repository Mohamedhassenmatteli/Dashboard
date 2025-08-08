const React = require("react");
const { NavLink } = require("react-router-dom");
const { useState } = React;

function SidebarManager({ managerId }) {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Leave Dashboard", path: `/manager/${managerId}/leaveDashboard` },
    { name: "Driver Performance", path: `/manager/${managerId}/performance` },
  ];

  return React.createElement(
    React.Fragment,
    null,
    // Toggle button (for mobile)
    React.createElement(
      "button",
      {
        className:
          "md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white shadow-lg",
        onClick: () => setIsOpen(!isOpen),
        "aria-label": isOpen ? "Close sidebar" : "Open sidebar",
      },
      isOpen
        ? React.createElement("span", null, "✕")
        : React.createElement("span", null, "☰")
    ),

    // Sidebar container
    React.createElement(
      "aside",
      {
        className:
          "w-64 bg-gradient-to-b from-white to-gray-100 shadow-lg h-screen fixed top-0 left-0 z-40 transition-transform transform md:translate-x-0 " +
          (isOpen ? "translate-x-0" : "-translate-x-full") +
          " md:relative md:z-auto",
      },
      React.createElement(
        "div",
        {
          className:
            "p-6 border-b border-gray-200 text-2xl font-bold text-gray-800",
        },
        "Manager Panel"
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
              onClick: () => setIsOpen(false),
            },
            link.name
          )
        )
      )
    ),

    // Mobile overlay
    isOpen &&
      React.createElement("div", {
        className: "fixed inset-0 bg-black opacity-40 z-30 md:hidden",
        onClick: () => setIsOpen(false),
      })
  );
}

module.exports = SidebarManager;
