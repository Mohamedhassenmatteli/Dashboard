import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import UserInsight from "./pages/superadmin/UserInsight";
import FleetDashboard from "./pages/superadmin/FleetDashboard";
import LeaveDashboard from "./pages/superadmin/CongesDashboard";
import DeliveryDashboard from "./pages/superadmin/DeliveryDashboard";
import DriverPerformance from "./pages/superadmin/DriverPerformance";

import ManagerLeaveDashboard from "./pages/manager/DriverLeavesDashbaord";
import DriverperformanceperManager from "./pages/manager/DriverPerformanceDashboard";
import TruckPerformance from "./pages/manager/TruckPerforamnce";
import ManagerLayout from "./layouts/ManagerLayout";
import DriverDashboard from "./pages/Driver/DriverDashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Superadmin routes */}
        <Route path="/superadmin/UserInsight" element={<UserInsight />} />
        <Route path="/superadmin/FleetDashboard" element={<FleetDashboard />} />
        <Route path="/superadmin/CongesDashboard" element={<LeaveDashboard />} />
        <Route path="/superadmin/DeliveryDashboard" element={<DeliveryDashboard />} />
        <Route path="/superadmin/DriverPerformance" element={<DriverPerformance />} />

        {/* Manager parent route with layout */}
        <Route path="/manager/:managerId" element={<ManagerLayout />}>
          <Route path="LeaveDashboard" element={<ManagerLeaveDashboard />} />
          <Route path="performance" element={<DriverperformanceperManager />} />
          <Route path="TruckPerforamce" element={<TruckPerformance />} />
        </Route>

        {/* Driver dashboard route */}
        <Route path="/driver/:driverId/dashboard" element={<DriverDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
