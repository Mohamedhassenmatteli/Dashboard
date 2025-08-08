import React, { useEffect, useState } from "react";
import SuperAdminLayout from "../../layouts/superadmin";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, Line, LineChart
} from "recharts";
import axios from "axios";

const Fleet = () => {
  const [fleetKpi, setFleetKpi] = useState({
    avgMileage: 0,
    totalTrucks: 0,
    trucksInService: 0,
  });

  const [truckCapacityData, setTruckCapacityData] = useState([]);
  const [drillData, setDrillData] = useState([]);
  const [drillLevel, setDrillLevel] = useState("year");
  const [drillValue, setDrillValue] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/fleet/insights")
      .then((res) => {
        const {
          avgMileage,
          totalTrucks,
          trucksInService,
          truckCapacityByBrand
        } = res.data;
        setFleetKpi({ avgMileage, totalTrucks, trucksInService });
        setTruckCapacityData(truckCapacityByBrand);
      })
      .catch((err) => {
        console.error("Error fetching fleet insight data:", err);
      });
  }, []);

  useEffect(() => {
    setDrillData([]);
    axios.get("http://localhost:5000/api/fleet/drill", {
      params: { level: drillLevel, value: drillValue },
    }).then((res) => {
      setDrillData(transformDrillData(res.data));
    });
  }, [drillLevel, drillValue]);

  const transformDrillData = (rows) => {
    const grouped = {};
    const statusMap = {
      delivering: "Delivering",
      idle: "Idle",
      available: "Available",
      in_service: "In Service",
      out_of_service: "Out of Service",
      maintenance: "Maintenance"
    };

    rows.forEach((row) => {
      const key = row.period;
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          registration_count: parseInt(row.registration_count),
          Delivering: 0,
          Idle: 0,
          Available: 0,
          "In Service": 0,
          "Out of Service": 0,
          Maintenance: 0
        };
      }
      const statusLabel = statusMap[row.status];
      if (statusLabel && grouped[key]) {
        grouped[key][statusLabel] = parseInt(row.truck_count);
      }
    });

    return Object.values(grouped);
  };

  const drillDown = (period) => {
    if (drillLevel === "year") {
      setDrillLevel("month");
      setDrillValue(period);
    } else if (drillLevel === "month") {
      setDrillLevel("day");
      setDrillValue(period);
    }
  };

  const drillUp = () => {
    if (drillLevel === "day" && drillValue) {
      setDrillLevel("month");
      setDrillValue(drillValue.substring(0, 4));
    } else if (drillLevel === "month" && drillValue) {
      setDrillLevel("year");
      setDrillValue(null);
    }
  };
return React.createElement(
  SuperAdminLayout,
  null,
  React.createElement(
    "div",
    { className: "bg-gray-100 min-h-screen p-6" },
    // Title
    React.createElement(
      "div",
      { className: "bg-white py-4 px-6 mb-6 rounded shadow", key: "title" },
      React.createElement(
        "h1",
        { className: "text-center text-2xl font-bold text-gray-900" },
        "Fleet Overview"
      )
    ),

    // KPIs + Charts container
    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start", key: "kpis-charts" },
      // KPI cards container
      React.createElement(
        "div",
        { className: "grid grid-cols-1 gap-4", key: "kpi-cards" },
        React.createElement(KpiCard, { title: "Average Mileage", value: `${fleetKpi.avgMileage} km`, key: "avg" }),
        React.createElement(KpiCard, { title: "Total Trucks", value: fleetKpi.totalTrucks, key: "total" }),
        React.createElement(KpiCard, { title: "Trucks In Service", value: fleetKpi.trucksInService, key: "inService" }),
      ),

      // Stacked bar chart container
      React.createElement(
        "div",
        { className: "col-span-2 bg-white shadow rounded p-4", key: "stacked-bar" },
        React.createElement(
          "h2",
          { key: "TruckCapacity", className: "text-lg font-bold text-gray-800 text-center mb-4" },
          "Truck Capacity by Brand & Status"
        ),
        React.createElement(
          ResponsiveContainer,
          { width: "100%", height: 300 },
          React.createElement(
            BarChart,
            { data: truckCapacityData, margin: { top: 20, right: 30, left: 20, bottom: 5 } },
            React.createElement(CartesianGrid, { strokeDasharray: "3 3", key: "grid" }),
            React.createElement(XAxis, { key: "x-axis", dataKey: "brand" }),
            React.createElement(YAxis, { key: "y-axis" }),
            React.createElement(Tooltip, { key: "tooltip" }),
            React.createElement(Legend, { key: "legend" }),
            React.createElement(Bar, { key: "available", dataKey: "Available", stackId: "a", fill: "#4caf50" }),
            React.createElement(Bar, { key: "inService", dataKey: "In Service", stackId: "a", fill: "#2196f3" }),
            React.createElement(Bar, { key: "maintenance", dataKey: "Maintenance", stackId: "a", fill: "#f44336" }),
          )
        )
      )
    ),

    // Drill charts container
    React.createElement(
        "div",
        { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10", key: "drill-charts" },

        // Drilldown Chart container
        React.createElement(
          "div",
          { className: "bg-white shadow rounded p-4", key: "drill" },
          React.createElement(
            "div",
            { className: "flex justify-between items-center mb-4" },
            React.createElement(
              "h2",
              { key: "TruckRegistration", className: "text-lg font-bold text-gray-800 text-center w-full" },
              "Truck Registrations by Status and Brand"
            ),
            React.createElement(
              "button",
              {
                onClick: drillUp,
                className: "flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-full shadow hover:shadow-lg transition duration-200"
              },
              React.createElement(
                "svg",
                {
                  xmlns: "http://www.w3.org/2000/svg",
                  className: "h-5 w-5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor"
                },
                React.createElement("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M5 15l7-7 7 7"
                })
              ),
              "Drill Up"
            )
          ),
          React.createElement(
            ResponsiveContainer,
            { width: "100%", height: 300 },
            React.createElement(
              BarChart,
              { data: drillData },
              React.createElement(CartesianGrid, { strokeDasharray: "3 3", key: "grid" }),
              React.createElement(XAxis, { key: "x-axis", dataKey: "period" }),
              React.createElement(YAxis, { key: "y-left", yAxisId: "left", orientation: "left" }),
              React.createElement(YAxis, { key: "y-right", yAxisId: "right", orientation: "right" }),
              React.createElement(Tooltip, { key: "tooltip" }),
              React.createElement(Legend, { key: "legend" }),
              ...["Available", "Delivering", "Idle", "In Service", "Out of Service", "Maintenance"].map((key, i) =>
                React.createElement(Bar, {
                  key: `bar-${key}`,
                  yAxisId: "left",
                  dataKey: key,
                  stackId: "a",
                  fill: ["#4caf50", "#9c27b0", "#607d8b", "#2196f3", "#ff5722", "#f44336"][i],
                  onClick: (data) => {
                    if (data && data.payload?.period) drillDown(data.payload.period);
                  }
                })
              ),
              React.createElement(Line, {
                key: "line",
                yAxisId: "right",
                type: "monotone",
                dataKey: "registration_count",
                stroke: "#ff9800",
                strokeWidth: 2
              })
            )
          )
        ),

        // Maintenance Line Chart container
        React.createElement(
          "div",
          { className: "bg-white shadow rounded p-4", key: "maintenance" },
          React.createElement(
            "h2",
            { key: "Truck", className: "text-lg font-bold text-gray-800 text-center mb-4" },
            "Trucks Under Maintenance"
          ),
          React.createElement(
            ResponsiveContainer,
            { width: "100%", height: 300 },
            React.createElement(
              LineChart,
              { data: drillData },
              React.createElement(CartesianGrid, { strokeDasharray: "3 3", key: "grid" }),
              React.createElement(XAxis, { key: "x-axis", dataKey: "period" }),
              React.createElement(YAxis, { key: "y-axis" }),
              React.createElement(Tooltip, { key: "tooltip" }),
              React.createElement(Legend, { key: "legend" }),
              React.createElement(Line, {
                key: "line-maintenance",
                type: "monotone",
                dataKey: "Maintenance",
                stroke: "#f44336",
                strokeWidth: 2
              })
            )
          )
        )
      )
    )
  );

};

const KpiCard = ({ title, value }) => {
  return React.createElement("div", { className: "bg-white shadow rounded p-4 text-center" }, [
    React.createElement("div", { className: "text-sm font-bold text-gray-800 mb-1", key: "title" }, title),
    React.createElement("div", { className: "text-2xl font-bold text-gray-800", key: "value" }, value)
  ]);
};

export default Fleet;
