import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import UserInsight from "./pages/superadmin/UserInsight";
import FleetDashboard from "./pages/superadmin/FleetDashboard";
import LeaveDashboard from "./pages/superadmin/LeaveDashboard";
import DeliveryDashboard from "./pages/superadmin/DeliveryDashboard";
import DriverPerformance from "./pages/superadmin/DriverPerformance";

import ManagerLeaveDashboard from "./pages/manager/leaveDashboard";
import DriverperformanceperManager from "./pages/manager/DriverPerformance";
import ManagerLayout from "./layouts/ManagerLayout"
import DriverDashboard from "./pages/Driver/DriverDashboard";

const App = () =>
  React.createElement(
    Router,
    null,
    React.createElement(
      Routes,
      null,
      // Superadmin routes
      React.createElement(Route, {
        path: "/superadmin/UserInsight",
        element: React.createElement(UserInsight),
      }),
      React.createElement(Route, {
        path: "/superadmin/FleetDashboard",
        element: React.createElement(FleetDashboard),
      }),
      React.createElement(Route, {
        path: "/superadmin/LeaveDashboard",
        element: React.createElement(LeaveDashboard),
      }),
      React.createElement(Route, {
        path: "/superadmin/DeliveryDashboard",
        element: React.createElement(DeliveryDashboard),
      }),
      React.createElement(Route, {
        path: "/superadmin/DriverPerformance",
        element: React.createElement(DriverPerformance),
      }),

      // Manager parent route with layout
      React.createElement(
        Route,
        {
          path: "/manager/:managerId",
          element: React.createElement(ManagerLayout),
        },
        // Nested child route(s)
        React.createElement(Route, {
          path: "LeaveDashboard",
          element: React.createElement(ManagerLeaveDashboard),
        }),
        React.createElement(Route, {
          path: "performance",
          element: React.createElement(DriverperformanceperManager),
        })
      ),
       // Driver dashboard route with driverId param
      React.createElement(Route, {
        path: "/driver/:driverId/dashboard",
        element: React.createElement(DriverDashboard),
      })
    )
  );


export default App;
