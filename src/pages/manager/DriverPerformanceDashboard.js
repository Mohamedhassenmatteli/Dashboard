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
        console.log("Fetching data for managerId:", managerId, "selectedDriver:", selectedDriver);
        const [kpiRes, departureRes, tripRes, driversRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/manager-performance/${managerId}/kpis`, {
            params: { driver: selectedDriver || undefined },
          }),
          axios.get(`http://localhost:5000/api/manager-performance/${managerId}/departure-times`, {
            params: { driver: selectedDriver || undefined },
          }),
          axios.get(`http://localhost:5000/api/manager-performance/${managerId}/trips-by-date`, {
            params: { driver: selectedDriver || undefined },
          }),
          axios.get(`http://localhost:5000/api/manager-performance/${managerId}/drivers`),
        ]);

        console.log("KPIs data:", kpiRes.data);
        console.log("Departure times data:", departureRes.data);
        console.log("Trips by date data:", tripRes.data);
        console.log("Drivers list:", driversRes.data);

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

  const handleChange = (e) => {
    console.log("Driver selected:", e.target.value);
    setSelectedDriver(e.target.value);
  };

  // Extraire les destinations uniques
  const destinations = [...new Set(departureData.map((d) => d.destination))];

  const kpis = kpiData || {
    in_progress: 0,
    delayed: 0,
    canceled: 0,
    completed: 0,
    total: 0,
  };

  // Transformer les données pour BarChart: un objet par driver avec les avg departure par destination
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

  // Log des données transformées pour vérification
  console.log("Transformed departure data for BarChart:", transformedData);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white py-4 px-6 mb-6 rounded shadow">
        <h1 className="text-center text-2xl font-bold text-gray-900">Driver Performance</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries({
          "Delivery in progress": kpis.in_progress,
          "Delayed delivery": kpis.delayed,
          "Canceled delivery": kpis.canceled,
          "Completed delivery": kpis.completed,
          "Total delivery": kpis.total,
        }).map(([label, value], index) => (
          <div key={index} className="bg-white p-4 rounded shadow text-center">
            <h2 className="text-lg font-bold">{label}</h2>
            <p className="text-3xl font-bold">{value || 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded p-4 w-64">
          <label htmlFor="slicer" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Driver
          </label>
          <select
            id="slicer"
            value={selectedDriver}
            onChange={handleChange}
            className="border rounded p-2 w-full"
          >
            <option value="">-- Select Driver --</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.firstname} {d.last_name}
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
                label={{ value: "Avg Departure Hour", angle: -90, position: "insideLeft" }}
                tickFormatter={(val) => parseFloat(val).toFixed(2)}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (isNaN(value)) return value;
                  const floatVal = parseFloat(value);
                  const hours = Math.floor(floatVal);
                  const minutes = Math.round((floatVal - hours) * 60);
                  return [`${hours}:${minutes.toString().padStart(2, "0")}`, name];
                }}
              />
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

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-center font-bold mb-2">Trips by Date</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tripData}>
            <XAxis dataKey="year" />
            <YAxis label={{ value: "Trip Count", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Line type="monotone" dataKey="trip_count" stroke="#007BFF" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DriverPerformance;
