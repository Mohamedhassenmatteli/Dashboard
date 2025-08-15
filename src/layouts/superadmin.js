import React from "react";
import Sidebar from "../components/Sidebar";

const SuperAdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-100">
        {children}
      </main>
    </div>
  );
};

export default SuperAdminLayout;
