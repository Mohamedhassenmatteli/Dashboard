const React = require("react");
const { useParams, Outlet } = require("react-router-dom");
const SidebarManager = require("../components/ManagerSidebar");

function ManagerLayout() {
  var params = useParams();
  var managerId = params.managerId;

  return React.createElement(
    "div",
    { className: "flex min-h-screen bg-gray-100" },
    React.createElement(SidebarManager, { managerId: managerId }),
    React.createElement(
      "main",
      { className: "flex-1 p-6 overflow-auto" },
      React.createElement(Outlet, null)
    )
  );
}

module.exports = ManagerLayout;
