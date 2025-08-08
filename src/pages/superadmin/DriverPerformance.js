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
} from "recharts";

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
          axios.get("http://localhost:5000/api/kpis", { params: { driver: selectedDriver } }),
          axios.get("http://localhost:5000/api/departure-times", { params: { driver: selectedDriver } }),
          axios.get("http://localhost:5000/api/trips-by-date", { params: { driver: selectedDriver } }),
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
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <SuperAdminLayout>
      <div className="p-6 space-y-6">
        <div className="bg-white py-4 px-6 mb-6 rounded shadow">
          <h1 className="text-center text-2xl font-bold text-gray-900">Driver Performance</h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Delivery in progress", kpiData.in_progress],
            ["Delayed delivery", kpiData.delayed],
            ["Canceled delivery", kpiData.canceled],
            ["Completed delivery", kpiData.completed],
            ["Total delivery", kpiData.total],
          ].map(([label, value]) => (
            <div key={label} className="bg-white p-4 rounded shadow text-center">
              <h2 className="text-lg font-bold">{label}</h2>
              <p className="text-3xl font-bold">{value || 0}</p>
            </div>
          ))}
        </div>

        {/* Driver filter and charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded p-4 w-64">
            <label htmlFor="slicer" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Driver
            </label>
            <select
              id="slicer"
              className="border rounded p-2 w-full"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="">-- Select Driver --</option>
              {drivers.map((d) => (
                <option key={d._id} value={d.FirstName}>
                  {d.FirstName} {d.LastName}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 bg-white p-4 rounded shadow">
            <h2 className="text-center font-bold mb-2">Average Departure Time per Driver</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformedData}>
                <XAxis dataKey="firstname" />
                <YAxis
                  label={{
                    value: "Avg Departure Hour",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip formatter={timeFormatter} />
                <Legend verticalAlign="top" />
                {destinations.map((dest, idx) => (
                  <Bar
                    key={dest}
                    dataKey={dest}
                    name={dest}
                    stackId="a"
                    fill={["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"][idx % 5]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trips by Date */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-center font-bold mb-2">Trips by Date</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tripData}>
              <XAxis dataKey="year" />
              <YAxis
                label={{
                  value: "Count of trips",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Line type="monotone" dataKey="trip_count" stroke="#007BFF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default DriverPerformance;
