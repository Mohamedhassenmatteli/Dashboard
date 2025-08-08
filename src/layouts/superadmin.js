import React from "react";
import Sidebar from "../components/Sidebar";

const SuperAdminLayout = ({ children }) => {
  return React.createElement(
    "div",
    { className: "flex h-screen" },
    React.createElement(Sidebar, null),
    React.createElement(
      "main",
      { className: "flex-1 p-6 overflow-auto bg-gray-100" },
      children
    )
  );
};

export default SuperAdminLayout;
