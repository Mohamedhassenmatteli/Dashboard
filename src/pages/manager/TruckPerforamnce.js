import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#ff2828ff", "#FF8042", "#8884D8"];

const icons = {
  distance: (
    <svg
      className="w-6 h-6 text-blue-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  fuel: (
    <svg
      className="w-6 h-6 text-red-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  truck: (
    <svg
      className="w-6 h-6 text-green-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
      />
    </svg>
  ),
  maintenance: (
    <svg
      className="w-6 h-6 text-red-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  ),
};

const KpiCard = ({ title, value, icon, trend }) => (
  <div className="bg-white rounded-lg shadow-md p-3 flex items-center space-x-3">
    <div>{icon}</div>
    <div className="flex-grow">
      <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">
        {title}
      </div>
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold text-gray-900">{value}</div>
        {trend && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              trend > 0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  </div>
);

const TruckPerformanceManager = () => {
  const [trucks, setTrucks] = useState([]);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    const fetchTruckData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/truck/truck-performance`
        );
        setTrucks(response.data.trucks);
      } catch (err) {
        console.error("Failed to fetch truck data:", err);
        setError("Failed to load truck performance data");
      }
    };

    fetchTruckData();
  }, []);

  const performanceMetrics = {
    totalDistance: trucks.reduce((sum, t) => sum + t.distance, 0),
    totalFuel: trucks.reduce((sum, t) => sum + t.fuelConsumed, 0),
    enRouteCount: trucks.filter((t) => t.status === "En Route").length,
    disponibleCount: trucks.filter((t) => t.status === "Disponible").length,
    maintenanceCount: trucks.filter((t) => t.status === "En Maintenance").length,
  };

  const statusData = [
    { name: "En Route", value: performanceMetrics.enRouteCount },
    { name: "Available", value: performanceMetrics.disponibleCount },
    { name: "Maintenance", value: performanceMetrics.maintenanceCount },
  ];

  const fuelEfficiencyData = trucks
    .sort((a, b) => b.distance / b.fuelConsumed - a.distance / a.fuelConsumed)
    .slice(0, 5)
    .map((truck) => ({
      name: truck.truckId,
      efficiency: truck.fuelConsumed > 0 ? (truck.distance / truck.fuelConsumed).toFixed(2) : 0,
    }));

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-2 px-4 mb-4 rounded-lg shadow-md">
        <h1 className="text-center text-xl font-semibold text-white">
          Fleet Performance Dashboard
        </h1>
        <p className="text-center text-blue-200 mt-1 text-xs">
          Overview of truck operations and efficiency metrics
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          title="Total Distance"
          value={`${(performanceMetrics.totalDistance / 1000).toFixed(1)} km`}
          icon={icons.distance}
          
        />
        <KpiCard
          title="Fuel Consumed"
          value={`${performanceMetrics.totalFuel.toFixed(1)} L`}
          icon={icons.fuel}
          
        />
        <KpiCard
          title="Active Trucks"
          value={performanceMetrics.enRouteCount}
          icon={icons.truck}
          
        />
        <KpiCard
          title="In Maintenance"
          value={performanceMetrics.maintenanceCount}
          icon={icons.maintenance}
          
        />
      </div>

      {/* Charts */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Status Pie */}
        <div className="bg-white rounded-lg shadow-md p-4 flex-1 min-h-[300px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Truck Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    // Display labels inside slices
                    position="inside"
                    fontSize={12} // adjust size for mobile
                    >
                    {statusData.map((entry, index) => (
                        <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} trucks`, "Count"]} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>

        {/* Fuel Efficiency Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 flex-1 min-h-[300px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Top 5 Most Fuel Efficient Trucks (km/L)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={fuelEfficiencyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                {/* Light, subtle grid */}
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="4 4" />
                
                {/* X Axis styling */}
                <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#555" }}
                axisLine={{ stroke: "#ccc" }}
                tickLine={false}
                />
                
                {/* Y Axis styling */}
                <YAxis
                tick={{ fontSize: 12, fill: "#555" }}
                axisLine={{ stroke: "#ccc" }}
                tickLine={false}
                unit=" km/L"
                />
                
                {/* Tooltip with custom style */}
                <Tooltip
                formatter={(value) => [`${value} km/L`, "Fuel Efficiency"]}
                contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    padding: "10px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                />
                
                {/* Legend with nicer styling */}
                <Legend
                wrapperStyle={{ paddingTop: 10 }}
                iconType="circle"
                iconSize={12}
                formatter={(value) => <span style={{ color: "#555" }}>{value}</span>}
                />
                
                {/* Bars with rounded corners and gradient */}
                <Bar
                dataKey="efficiency"
                name="Fuel Efficiency"
                fill="url(#colorGradient)"
                radius={[10, 10, 0, 0]}
                />
                
                {/* Define a gradient for the bars */}
                <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4caf50" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#81c784" stopOpacity={0.7} />
                </linearGradient>
                </defs>
            </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Truck Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Truck ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distance (km)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fuel (L)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Efficiency
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trucks.map((truck) => (
              <tr key={truck.truckId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {truck.truckId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {truck.brand}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {truck.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      truck.status === "En Route"
                        ? "bg-blue-100 text-blue-800"
                        : truck.status === "Disponible"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {truck.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {truck.distance.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {truck.fuelConsumed.toFixed(1)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {truck.fuelConsumed > 0
                    ? (truck.distance / truck.fuelConsumed).toFixed(2)
                    : 0}{" "}
                  km/L
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TruckPerformanceManager;
