import React from "react";
import { useParams, Outlet } from "react-router-dom";
import SidebarManager from "../components/ManagerSidebar";

function ManagerLayout() {
  const params = useParams();
  const managerId = params.managerId;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarManager managerId={managerId} />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default ManagerLayout;
