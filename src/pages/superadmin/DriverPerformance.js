import React, { useEffect, useState } from "react";
import axios from "axios";
import SuperAdminLayout from "../../layouts/superadmin";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const statusColors = {
  in_progress: "#6366F1", // indigo
  delayed: "#F59E0B", // amber
  canceled: "#EF4444", // red
  completed: "#10B981", // emerald
  total: "#3B82F6", // blue
};

const destinationColors = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#64748B",
];

const DriverPerformance = () => {
  const [kpiData, setKpiData] = useState({
    in_progress: 0,
    delayed: 0,
    canceled: 0,
    completed: 0,
    total: 0,
  });
  const [departureData, setDepartureData] = useState([]);
  const [tripData, setTripData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, departureRes, tripRes, driversRes] = await Promise.all([
          axios.get("http://localhost:5000/api/kpis", {
            params: { driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/departure-times", {
            params: { driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/trips-by-date", {
            params: { driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/drivers"),
        ]);

        setKpiData(kpiRes.data || {});
        setDepartureData(departureRes.data || []);
        setTripData(tripRes.data || []);
        setDrivers(driversRes.data || []);
      } catch (error) {
        console.error("Error loading driver performance data", error);
      }
    };

    fetchData();
  }, [selectedDriver]);

  // Transform departureData for bar chart
  const transformedData = [];
  departureData.forEach((entry) => {
    let existing = transformedData.find((d) => d.firstname === entry.FirstName);
    if (!existing) {
      existing = { firstname: entry.FirstName };
      transformedData.push(existing);
    }
    const avgHour = parseFloat(entry.avgdeparturehour);
    existing[entry.destination] = !isNaN(avgHour) ? avgHour : 0;
  });
  const destinations = [...new Set(departureData.map((d) => d.destination))];

  // Tooltip formatter for time in HH:mm
  const timeFormatter = (value) => {
    if (typeof value !== "number") return value;
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
          <p className="font-bold text-gray-800">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry, index) => (
              <div key={`tooltip-item-${index}`} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 font-medium">{entry.name}: </span>
                <span className="font-bold ml-1">{timeFormatter(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
          <p className="font-bold text-gray-800">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry, index) => (
              <div key={`tooltip-item-${index}`} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 font-medium">Trips: </span>
                <span className="font-bold ml-1">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <SuperAdminLayout>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-6 mb-6 rounded-lg shadow-lg">
        <h1 className="text-center text-3xl font-bold text-white">
          Driver Performance Dashboard
        </h1>
        <p className="text-center text-blue-100 mt-2">
          Monitor and analyze driver performance metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 px-4">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <label
            htmlFor="driverFilter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filter by Driver
          </label>
          <select
            id="driverFilter"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
          >
            <option value="">All Drivers</option>
            {drivers.map((d) => (
              <option key={d._id} value={d.FirstName}>
                {d.FirstName} {d.LastName}
              </option>
            ))}
          </select>
        </div>

        {[
          ["in_progress", "In Progress", "M5 13l4 4L19 7"],
          ["completed", "Completed", "M5 13l4 4L19 7"],
          ["delayed", "Delayed", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"],
          ["canceled", "Canceled", "M6 18L18 6M6 6l12 12"],
        ].map(([key, title, iconPath]) => (
          <KpiCard
            key={key}
            title={title}
            value={kpiData[key] || 0}
            icon={
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
              </svg>
            }
            color={statusColors[key]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 px-4">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Average Departure Time per Driver
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={transformedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="firstname" tick={{ fill: "#6B7280" }} tickMargin={10} />
              <YAxis
                tick={{ fill: "#6B7280" }}
                label={{
                  value: "Avg Departure Hour",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#6B7280",
                }}
                tickFormatter={timeFormatter}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              {destinations.map((dest, idx) => (
                <Bar
                  key={dest}
                  dataKey={dest}
                  name={dest}
                  stackId="a"
                  fill={destinationColors[idx % destinationColors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Trips by Date</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={tripData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fill: "#6B7280" }} tickMargin={10} />
              <YAxis
                tick={{ fill: "#6B7280" }}
                label={{
                  value: "Count of trips",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#6B7280",
                }}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="trip_count"
                stroke="#3B82F6"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

const KpiCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div
          className="p-3 rounded-lg bg-opacity-10"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DriverPerformance;
