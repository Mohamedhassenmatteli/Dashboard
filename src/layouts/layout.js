import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const AppLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        {/* If children are passed, render them, otherwise use <Outlet /> for nested routes */}
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AppLayout;
