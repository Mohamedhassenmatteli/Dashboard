import React, { useEffect, useState } from "react";
import SuperAdminLayout from "../../layouts/superadmin";
import { TruckIcon, WrenchScrewdriverIcon, PresentationChartLineIcon } from "@heroicons/react/24/outline";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";

const FleetDashboard = () => {
  const [fleetKpi, setFleetKpi] = useState({ avgMileage: 0, totalTrucks: 0, trucksInService: 0 });
  const [truckCapacityData, setTruckCapacityData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [fuelData, setFuelData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const insightsRes = await axios.get("http://localhost:5000/api/fleet/insights");
        const { avgMileage, totalTrucks, trucksInService, capacityByBrand } = insightsRes.data;
        setFleetKpi({ avgMileage, totalTrucks, trucksInService });

        const transformedCapacity = capacityByBrand.map(({ _id, totalCapacity }) => ({
          brand: _id || "Unknown",
          totalCapacity,
        }));
        setTruckCapacityData(transformedCapacity);

        const fuelRes = await axios.get("http://localhost:5000/api/fleet/fuel-consumption");
        setFuelData(fuelRes.data);

        const maintenanceRes = await axios.get("http://localhost:5000/api/fleet/maintenance-count-year");
        setMaintenanceData(Array.isArray(maintenanceRes.data) ? maintenanceRes.data : []);
      } catch (err) {
        console.error("Error fetching fleet data:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <SuperAdminLayout>
      <div className="bg-gray-50 min-h-screen p-4 flex flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-3 px-4 rounded-lg shadow-md flex-shrink-0">
          <h1 className="text-center text-xl sm:text-2xl font-semibold text-white">
            Fleet Overview
          </h1>
          <p className="text-center text-blue-200 mt-1 text-xs sm:text-sm">
            Comprehensive analysis of your truck fleet operations
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard
            title="Average Mileage"
            value={`${fleetKpi.avgMileage.toFixed(2)} km`}
            icon={<PresentationChartLineIcon className="w-6 h-6 text-blue-600" />}
          />
          <KpiCard
            title="Total Trucks"
            value={fleetKpi.totalTrucks}
            icon={<TruckIcon className="w-6 h-6 text-green-600" />}
          />
          <KpiCard
            title="Trucks In Service"
            value={fleetKpi.trucksInService}
            icon={<WrenchScrewdriverIcon className="w-6 h-6 text-yellow-600" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0 overflow-auto">
          {/* Truck Capacity */}
          <ChartCard title="Truck Capacity by Brand">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={truckCapacityData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  type="category"
                  dataKey="brand"
                  tick={{ fontSize: 12, fill: "#555" }}
                  axisLine={false}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  label={{ value: "Truck Brand", position: "insideBottom", offset: 10, style: { fontSize: 14, fill: "#333" } }}
                />
                <YAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#555" }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: "Total Capacity", angle: -90, position: "insideLeft", style: { fontSize: 14, fill: "#333" } }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 3px 6px rgba(0,0,0,0.1)", padding: "10px" }}
                  itemStyle={{ color: "#3182ce", fontWeight: "600" }}
                />
                <defs>
                  <linearGradient id="barGradientHorizontal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3182ce" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#63b3ed" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <Bar dataKey="totalCapacity" fill="url(#barGradientHorizontal)" radius={[6, 6, 0, 0]} barSize={25} animationDuration={800} background={{ fill: "#e6f0fa" }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Trucks Under Maintenance */}
          <ChartCard title="Trucks Under Maintenance (Year)">
            <div className="bg-gradient-to-br from-white rounded-xl p-5 flex flex-col">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={maintenanceData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                  <XAxis
                    dataKey="period"
                    angle={-35}
                    textAnchor="end"
                    tick={{ fontSize: 12, fill: "#555" }}
                    interval={0}
                    height={60}
                    label={{ value: "Year", position: "insideBottom", offset: -40, style: { fontSize: 14, fill: "#333" } }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#555" }}
                    label={{ value: "Number of Trucks", angle: -90, position: "insideLeft", style: { fontSize: 14, fill: "#333" } }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 3px 6px rgba(0,0,0,0.1)", padding: "10px" }}
                    itemStyle={{ color: "#f44336", fontWeight: "600" }}
                  />
                  <defs>
                    <linearGradient id="maintenanceLineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f44336" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="url(#maintenanceLineGradient)"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#f44336", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                    name="Trucks Under Maintenance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Fuel Consumption */}
          <ChartCard title="Fuel Consumption per Truck">
            <div className="bg-gradient-to-br from-white rounded-xl p-5">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={fuelData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                  <XAxis
                    dataKey="truckId"
                    angle={-35}
                    textAnchor="end"
                    tick={{ fontSize: 12, fill: "#555" }}
                    interval={0}
                    height={60}
                    label={{ value: "Truck ID", position: "insideBottom", offset: -40, style: { fontSize: 14, fill: "#333" } }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#555" }}
                    label={{ value: "Fuel Consumption (L)", angle: -90, position: "insideLeft", style: { fontSize: 14, fill: "#333" } }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 3px 6px rgba(0,0,0,0.1)", padding: "10px" }}
                    itemStyle={{ color: "#f59e0b", fontWeight: "600" }}
                  />
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <Line
                    type="monotone"
                    dataKey="fuelConsumption"
                    stroke="url(#lineGradient)"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                    name="Fuel Consumption"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

const KpiCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-3 flex items-center space-x-3">
    <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">{icon}</div>
    <div>
      <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">{title}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-md p-4 flex flex-col min-h-[320px] md:min-h-[288px]">
    <h2 className="text-sm sm:text-base font-semibold mb-2 text-center md:text-left">{title}</h2>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

export default FleetDashboard;
