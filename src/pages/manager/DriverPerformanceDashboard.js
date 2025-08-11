import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
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

function DriverPerformance() {
  const { managerId } = useParams();

  const [kpiData, setKpiData] = useState(null);
  const [departureData, setDepartureData] = useState([]);
  const [tripData, setTripData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, departureRes, tripRes, driversRes] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/manager-performance/${managerId}/kpis`,
            { params: { driver: selectedDriver || undefined } }
          ),
          axios.get(
            `http://localhost:5000/api/manager-performance/${managerId}/departure-times`,
            { params: { driver: selectedDriver || undefined } }
          ),
          axios.get(
            `http://localhost:5000/api/manager-performance/${managerId}/trips-by-date`,
            { params: { driver: selectedDriver || undefined } }
          ),
          axios.get(
            `http://localhost:5000/api/manager-performance/${managerId}/drivers`
          ),
        ]);

        setKpiData(kpiRes.data);
        setDepartureData(departureRes.data);
        setTripData(tripRes.data);
        setDrivers(driversRes.data);
      } catch (error) {
        console.error("Error loading driver performance data", error);
      }
    };

    fetchData();
  }, [managerId, selectedDriver]);

  // Extract unique destinations for BarChart
  const destinations = [...new Set(departureData.map((d) => d.destination))];

  const kpis = kpiData || {
    in_progress: 0,
    delayed: 0,
    canceled: 0,
    completed: 0,
    total: 0,
  };

  // Transform departureData for BarChart
  const transformedData = [];
  departureData.forEach((entry) => {
    let existing = transformedData.find((d) => d.firstname === entry.firstname);
    if (!existing) {
      existing = { firstname: entry.firstname };
      transformedData.push(existing);
    }
    const avgHour = parseFloat(entry.avgdeparturehour);
    existing[entry.destination] = !isNaN(avgHour) ? parseFloat(avgHour.toFixed(2)) : 0;
  });

  const handleChange = (e) => {
    setSelectedDriver(e.target.value);
  };

  // Tooltip time formatter HH:mm
  const timeFormatter = (value) => {
    if (typeof value !== "number") return value;
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-6 rounded-lg shadow-lg mb-6">
        <h1 className="text-center text-3xl font-bold text-white">Driver Performance</h1>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mb-8">
        {[
          ["Delivery in progress", kpis.in_progress, statusColors.in_progress],
          ["Delayed delivery", kpis.delayed, statusColors.delayed],
          ["Canceled delivery", kpis.canceled, statusColors.canceled],
          ["Completed delivery", kpis.completed, statusColors.completed],
          ["Total delivery", kpis.total, statusColors.total],
        ].map(([label, value, color], i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col items-center justify-center"
          >
            <h2 className="text-lg font-semibold text-gray-700 mb-2">{label}</h2>
            <p className="text-4xl font-extrabold text-gray-900" style={{ color }}>
              {value || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Filter + BarChart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Driver Filter */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <label
            htmlFor="driverFilter"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Filter by Driver
          </label>
          <select
            id="driverFilter"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            value={selectedDriver}
            onChange={handleChange}
          >
            <option value="">All Drivers</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.firstname} {d.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* BarChart: Average Departure Time */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Average Departure Time per Driver
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={transformedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
              <Tooltip
                formatter={(value, name) => {
                  if (isNaN(value)) return value;
                  return [timeFormatter(value), name];
                }}
              />
              <Legend verticalAlign="top" />
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
      </div>

      {/* LineChart: Trips by Date */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Trips by Date</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={tripData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="year" tick={{ fill: "#6B7280" }} tickMargin={10} />
            <YAxis
              tick={{ fill: "#6B7280" }}
              label={{ value: "Trip Count", angle: -90, position: "insideLeft", fill: "#6B7280" }}
            />
            <Tooltip />
            <Line type="monotone" dataKey="trip_count" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DriverPerformance;
