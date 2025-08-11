import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function DriverDashboard() {
  const { driverId } = useParams();
  const [driverInfo, setDriverInfo] = useState({});
  const [kpis, setKpis] = useState({
    canceled: 0,
    avg_mileage: 0,
    completed: 0,
    total: 0,
  });
  const [tripData, setTripData] = useState([]);
  const [groupBy, setGroupBy] = useState("year");
  const [mapData, setMapData] = useState([]);

  const destinationCoords = {
    Tunis: [36.8065, 10.1815],
    Sfax: [34.7406, 10.7603],
    Sousse: [35.8256, 10.6084],
    Gabès: [33.8869, 10.1033],
    Bizerte: [37.2746, 9.8739],
    Kairouan: [35.6781, 10.1011],
    Mahdia: [35.5035, 11.0622],
    Tozeur: [33.9197, 8.1335],
    Tataouine: [32.9297, 10.4515],
    Manouba: [36.7993, 10.0865],
    Béja: [36.7333, 9.1833],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, kpiRes, tripsRes, mapRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/driver-dashboard/info/${driverId}`),
          axios.get(`http://localhost:5000/api/driver-dashboard/kpis`, { params: { driverId } }),
          axios.get(`http://localhost:5000/api/driver-dashboard/trips-over-time`, {
            params: { driverId, level: groupBy },
          }),
          axios.get(`http://localhost:5000/api/driver-dashboard/trips-by-destination`, { params: { driverId } }),
        ]);

        setDriverInfo(infoRes.data);
        setKpis(kpiRes.data);

        setTripData(
          tripsRes.data.map((row) => ({
            label:
              groupBy === "year"
                ? new Date(row.period).getFullYear()
                : groupBy === "month"
                ? new Date(row.period).toLocaleString("default", {
                    year: "numeric",
                    month: "short",
                  })
                : new Date(row.period).toLocaleDateString(),
            count: row.trip_count,
          }))
        );

        setMapData(
          mapRes.data.map((item) => {
            const coords = destinationCoords[item.destination] || [34.0, 9.0];
            return {
              destination: item.destination,
              count: parseInt(item.trip_count, 10),
              latitude: coords[0],
              longitude: coords[1],
            };
          })
        );
      } catch (err) {
        console.error("Error loading driver dashboard data", err);
      }
    };

    fetchData();
  }, [driverId, groupBy]);

  const groupOptions = ["year", "month", "day"];

  const handleDrillDown = () => {
    const idx = groupOptions.indexOf(groupBy);
    if (idx < groupOptions.length - 1) {
      setGroupBy(groupOptions[idx + 1]);
    }
  };

  const handleDrillUp = () => {
    const idx = groupOptions.indexOf(groupBy);
    if (idx > 0) {
      setGroupBy(groupOptions[idx - 1]);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
          <p className="font-bold text-gray-800">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry, index) => (
              <div key={`tooltip-item-${index}`} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {`${driverInfo.FirstName || driverInfo.firstname || ""} ${driverInfo.LastName || driverInfo.last_name || ""}`}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Driver ID: {driverId}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard 
            title="Total Deliveries" 
            value={kpis.total} 
            icon="🚛" 
            color="bg-blue-100 text-blue-600"
          />
          <KpiCard 
            title="Completed" 
            value={kpis.completed} 
            icon="✅" 
            color="bg-green-100 text-green-600"
          />
          <KpiCard 
            title="Canceled" 
            value={kpis.canceled} 
            icon="❌" 
            color="bg-red-100 text-red-600"
          />
          <KpiCard 
            title="Avg Mileage" 
            value={Number(kpis.avg_mileage).toFixed(2)} 
            icon="📊" 
            color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Time Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">
              Trip Analytics
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-500">
                Group by: {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              </span>
              <button
                onClick={handleDrillUp}
                disabled={groupBy === "year"}
                className={`inline-flex items-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  groupBy === "year"
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="-ml-1 mr-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Drill Up
              </button>
              <button
                onClick={handleDrillDown}
                disabled={groupBy === "day"}
                className={`inline-flex items-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  groupBy === "day"
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="-ml-1 mr-2 h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Drill Down
              </button>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trip Count Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Trip Count Over Time
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={tripData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#6B7280' }}
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fill: '#6B7280' }}
                  label={{
                    value: "Trips",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#6B7280",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3B82F6" }}
                  activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Trips by Destination
            </h2>
            <MapContainer
              center={[34.0, 9.0]}
              zoom={6}
              style={{ height: "400px", width: "100%", borderRadius: "0.5rem" }}
            >
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapData.map((item, idx) => (
                <CircleMarker
                  key={idx}
                  center={[item.latitude, item.longitude]}
                  radius={Math.min(item.count * 2 + 5, 30)}
                  fillOpacity={0.7}
                  stroke={true}
                  color="#3B82F6"
                  weight={1.5}
                  fillColor="#3B82F6"
                >
                  <LeafletTooltip 
                    direction="top" 
                    offset={[0, -10]} 
                    className="font-sans"
                  >
                    <div className="font-bold text-gray-800">{item.destination}</div>
                    <div className="text-sm">
                      <span className="font-medium">Trips:</span> {item.count}
                    </div>
                  </LeafletTooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

const KpiCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`${color} rounded-lg p-3 text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
