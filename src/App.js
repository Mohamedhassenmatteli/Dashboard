import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/layout";

// Super Admin pages
import UserInsight from "./pages/superadmin/UserInsight";
import FleetDashboard from "./pages/superadmin/FleetDashboard";
import LeaveDashboard from "./pages/superadmin/CongesDashboard";
import DeliveryDashboard from "./pages/superadmin/DeliveryDashboard";
import DriverPerformance from "./pages/superadmin/DriverPerformance";

// Manager pages
import ManagerLeaveDashboard from "./pages/manager/DriverLeavesDashbaord";
import DriverperformanceperManager from "./pages/manager/DriverPerformanceDashboard";
import TruckPerformance from "./pages/manager/TruckPerforamnce";

// Driver page
import DriverDashboard from "./pages/Driver/DriverDashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* All protected routes with Sidebar */}
        <Route element={<AppLayout />}>
          {/* Superadmin routes */}
          <Route path="/superadmin/UserInsight" element={<UserInsight />} />
          <Route path="/superadmin/FleetDashboard" element={<FleetDashboard />} />
          <Route path="/superadmin/CongesDashboard" element={<LeaveDashboard />} />
          <Route path="/superadmin/DeliveryDashboard" element={<DeliveryDashboard />} />
          <Route path="/superadmin/DriverPerformance" element={<DriverPerformance />} />

          {/* Manager routes */}
          <Route path="/manager/:managerId/LeaveDashboard" element={<ManagerLeaveDashboard />} />
          <Route path="/manager/:managerId/performance" element={<DriverperformanceperManager />} />
          <Route path="/manager/:managerId/TruckPerformance" element={<TruckPerformance />} />

          {/* Driver routes */}
          <Route path="/driver/:driverId/driverdashboard" element={<DriverDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
