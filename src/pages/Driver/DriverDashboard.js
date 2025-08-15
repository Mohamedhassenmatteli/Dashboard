import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  MapIcon,
  ClockIcon,
  BoltIcon,
} from "@heroicons/react/24/solid";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const kpiIcons = {
  total: TruckIcon,
  completed: CheckCircleIcon,
  canceled: XCircleIcon,
  avg_mileage: ChartBarIcon,
  totalDistance: MapIcon,
  totalHours: ClockIcon,
  totalFuel: BoltIcon,
};

const KpiCard = ({ title, value, type, bgColor = "bg-blue-500", unit }) => {
  const Icon = kpiIcons[type];
  return (
    <div className="bg-white rounded-xl shadow-md p-3 flex items-center space-x-3 transition-transform transform hover:-translate-y-1 hover:shadow-lg">
      <div className={`w-10 h-10 flex items-center justify-center rounded-full ${bgColor} text-white`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">{title}</span>
        <span className="text-lg font-bold text-gray-900">
          {value} {unit || ""}
        </span>
      </div>
    </div>
  );
};

function DriverDashboard() {
  const { driverId } = useParams();
  const [driverInfo, setDriverInfo] = useState({});
  const [kpis, setKpis] = useState({
    canceled: 0,
    completed: 0,
    total: 0,
    totalDistance: 0,
    totalHours: 0,
    totalFuel: 0,
  });
  const [tripData, setTripData] = useState([]);
  const [groupBy, setGroupBy] = useState("year");
  const [mapData, setMapData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, kpiRes, tripsRes, mapRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/driver-dashboard/info/${driverId}`),
          axios.get(`http://localhost:5000/api/driver-dashboard/kpis`, { params: { driverId } }),
          axios.get(`http://localhost:5000/api/driver-dashboard/trips-over-time`, { params: { driverId, level: groupBy } }),
          axios.get(`http://localhost:5000/api/driver-dashboard/trips-by-destination`, { params: { driverId } }),
        ]);

        setDriverInfo(infoRes.data);
        setKpis(kpiRes.data);

        setTripData(tripsRes.data.map(row => ({
          label: row.period,
          count: row.trip_count,
        })));

        setMapData(mapRes.data.map(item => ({
          destination: item.destination,
          count: parseInt(item.trip_count, 10),
          latitude: item.latitude ?? 34.0,
          longitude: item.longitude ?? 9.0,
        })));
      } catch (err) {
        console.error("Error loading driver dashboard data", err);
      }
    };

    fetchData();
  }, [driverId, groupBy]);

  const groupOptions = ["year", "month", "day"];
  const handleDrillDown = () => {
    const idx = groupOptions.indexOf(groupBy);
    if (idx < groupOptions.length - 1) setGroupBy(groupOptions[idx + 1]);
  };
  const handleDrillUp = () => {
    const idx = groupOptions.indexOf(groupBy);
    if (idx > 0) setGroupBy(groupOptions[idx - 1]);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200">
          <p className="font-bold text-gray-800">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center">
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
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {`${driverInfo.FirstName || driverInfo.firstname || ""} ${driverInfo.LastName || driverInfo.last_name || ""}`}
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Driver ID: {driverId}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <KpiCard title="Total Deliveries" value={kpis.total} type="total" bgColor="bg-blue-500" />
          <KpiCard title="Completed" value={kpis.completed} type="completed" bgColor="bg-green-500" />
          <KpiCard title="Canceled" value={kpis.canceled} type="canceled" bgColor="bg-red-500" />
          <KpiCard title="Total Distance" value={Number(kpis.totalDistance)} type="totalDistance" bgColor="bg-indigo-500" unit="km" />
          <KpiCard
            title="Total Hours"
            value={kpis.totalHours || "0h 0m"} // pass string directly
            type="totalHours"
            bgColor="bg-yellow-500"
          />
          <KpiCard title="Fuel Consumption" value={Number(kpis.totalFuel)} type="totalFuel" bgColor="bg-orange-500" unit="L" />
        </div>


        {/* Trip Analytics Controls */}
        <div className="bg-white rounded-xl shadow p-3 mb-6 border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Trip Analytics</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Group by: <span className="text-gray-700 font-semibold">{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
          </span>
          <button
            onClick={handleDrillUp}
            disabled={groupBy === "year"}
            className="px-2 py-1 rounded bg-blue-600 text-white disabled:bg-gray-200"
          >
            Drill Up
          </button>
          <button
            onClick={handleDrillDown}
            disabled={groupBy === "day"}
            className="px-2 py-1 rounded bg-blue-600 text-white disabled:bg-gray-200"
          >
            Drill Down
          </button>
        </div>
      </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trip Count Chart */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Trip Count Over Time</h2>
           <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={tripData}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                {/* Background grid */}
                <CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" vertical={false} />
                
                {/* X axis */}
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} 
                  tickMargin={10} 
                  axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                />
                
                {/* Y axis */}
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
                  tickLine={false}
                  label={{ value: "Trips", angle: -90, position: "insideLeft", fill: "#6B7280", fontSize: 12, fontWeight: 500 }}
                />
                
                {/* Tooltip */}
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: "#3B82F6", strokeWidth: 2, opacity: 0.1 }}
                />
                
                {/* Line */}
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: "#3B82F6", stroke: "#fff", strokeWidth: 1 }}
                  activeDot={{ r: 7, stroke: "#3B82F6", strokeWidth: 2, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Map */}
         <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Trips by Destination</h2>
            <MapContainer
              center={[36.8, 10.1]}
              zoom={7}
              scrollWheelZoom={true}
              style={{ height: "450px", width: "100%", borderRadius: "0.75rem" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {mapData
                .filter(item => item.latitude != null && item.longitude != null)
                .map((item, idx) => {
                  const lat = parseFloat(item.latitude);
                  const lng = parseFloat(item.longitude);
                  const trips = parseInt(item.count || 0, 10);

                  // dynamic radius scaling
                  const radius = Math.min(20, 5 + Math.sqrt(trips) * 2);

                  return (
                    <CircleMarker
                      key={idx}
                      center={[lat, lng]}
                      radius={radius}
                      fillColor="#3B82F6"
                      color="#1E40AF"
                      fillOpacity={0.6}
                      stroke={true}
                      weight={1.5}
                    >
                      <LeafletTooltip direction="top" offset={[0, -12]} opacity={0.9} permanent={false}>
                        <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200">
                          <div className="font-bold text-sm text-gray-800">{item.destination}</div>
                          <div className="text-xs text-gray-600 mt-1">Trips: {trips}</div>
                          <div className="text-xs text-gray-500">Coords: {lat.toFixed(4)}, {lng.toFixed(4)}</div>
                        </div>
                      </LeafletTooltip>
                    </CircleMarker>
                  );
                })}
            </MapContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DriverDashboard;
