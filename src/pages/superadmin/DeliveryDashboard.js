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
  CartesianGrid,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LeafletTooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const statusColors = {
  canceled: "#EF4444",
  completed: "#10B981",
  delayed: "#F59E0B",
  in_progress: "#6366F1",
  pending: "#EC4899",
};

const statusLabels = {
  canceled: "Canceled",
  completed: "Completed",
  delayed: "Delayed",
  in_progress: "In Progress",
  pending: "Pending",
};

const cityCoordinates = {
  Tunis: [36.8065, 10.1815],
  Sfax: [34.7406, 10.7603],
  Sousse: [35.8256, 10.6084],
  Kairouan: [35.6781, 10.0963],
  Gabès: [33.8818, 10.0982],
  Gafsa: [34.425, 8.7842],
  Nabeul: [36.451, 10.7352],
  Monastir: [35.7771, 10.8262],
  Bizerte: [37.2744, 9.8739],
  Ariana: [36.8665, 10.1647],
  Ben_Arous: [36.7547, 10.2189],
  Manouba: [36.808, 10.097],
  Beja: [36.7333, 9.1833],
  Jendouba: [36.5011, 8.7802],
  Kasserine: [35.1676, 8.8365],
  Kef: [36.1829, 8.7144],
  Mahdia: [35.5047, 11.0622],
  Medenine: [33.354, 10.5055],
  Siliana: [36.0833, 9.3833],
  Sidi_Bouzid: [35.0382, 9.4858],
  Zaghouan: [36.4022, 10.1426],
  Tozeur: [33.9197, 8.1335],
  Kebili: [33.7044, 8.969],
};

const Delivery = () => {
  const [tripsKpi, setTripsKpi] = useState({ TotalTrips: 0 });
  const [canceledtrips, setCanceledTrips] = useState(null);
  const [delayedtrips, setDelayedTrips] = useState(null);
  const [drillData, setDrillData] = useState([]);
  const [drillLevel, setDrillLevel] = useState("year");
  const [drillValue, setDrillValue] = useState(null);
  const [destination, setDestination] = useState("");
  const [mapData, setMapData] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/delivery/insights", {
        params: { destination },
      });
      const { Delayed, Canceled, TotalTrips } = res.data;
      setTripsKpi({ TotalTrips });
      setCanceledTrips(Canceled);
      setDelayedTrips(Delayed);
    } catch (err) {
      console.error("Error fetching fleet insight data:", err);
    }
  };

  const fetchDrillData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/delivery/drill", {
        params: { level: drillLevel, value: drillValue, destination },
      });
      setDrillData(transformDrillData(res.data));
    } catch (err) {
      console.error("Error fetching drill data:", err);
    }
  };

  const fetchMapData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/delivery/map-data", {
        params: { destination },
      });
      setMapData(res.data);
    } catch (err) {
      console.error("Error fetching map data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDrillData();
    fetchMapData();
  }, [destination, drillLevel, drillValue]);

  const transformDrillData = (rows) => {
    const grouped = {};
    const statusMap = {
      completed: "completed",
      pending: "pending",
      in_progress: "in_progress",
      delayed: "delayed",
      canceled: "canceled",
    };

    rows.forEach((row) => {
      const key = row.period;
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          completed: 0,
          in_progress: 0,
          delayed: 0,
          canceled: 0,
          pending: 0,
        };
      }

      const statusLabel = statusMap[row.status_trip];
      if (statusLabel && grouped[key]) {
        grouped[key][statusLabel] = parseInt(row.count_trips, 10);
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
      setDrillValue(drillValue.substring(0, 7));
    } else if (drillLevel === "month" && drillValue) {
      setDrillLevel("year");
      setDrillValue(null);
    }
  };

  const formatDrillLabel = () => {
    if (drillLevel === "year") return "Yearly";
    if (drillLevel === "month") return "Monthly";
    return "Daily";
  };

  const CustomTooltip = ({ active, payload, label }) => {
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
                <span className="text-gray-600 font-medium">
                  {statusLabels[entry.dataKey]}:{" "}
                </span>
                <span className="font-bold ml-1">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const KpiCard = ({ title, value, icon, trend }) => (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {trend && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend === "positive" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend === "positive" ? (
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
              {trend === "positive" ? "On track" : "Needs attention"}
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-opacity-10 bg-blue-500">{icon}</div>
      </div>
    </div>
  );

  return (
    <SuperAdminLayout>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-6 mb-6 rounded-lg shadow-lg">
        <h1 className="text-center text-3xl font-bold text-white">
          Delivery Dashboard
        </h1>
        <p className="text-center text-blue-100 mt-2">
          Monitor and analyze delivery performance across Tunisia
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <label
            htmlFor="destinationFilter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filter by Destination
          </label>
          <select
            id="destinationFilter"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">All Destinations</option>
            {Object.keys(cityCoordinates).map((city) => (
              <option key={city} value={city}>
                {city.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <KpiCard
          title="Total Trips"
          value={tripsKpi.TotalTrips}
          icon={
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />

        <KpiCard
          title="Delayed"
          value={delayedtrips !== null ? `${delayedtrips}%` : "N/A"}
          trend={delayedtrips > 10 ? "negative" : "positive"}
          icon={
            <svg
              className="w-8 h-8 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        <KpiCard
          title="Canceled"
          value={canceledtrips !== null ? `${canceledtrips}%` : "N/A"}
          trend={canceledtrips > 5 ? "negative" : "positive"}
          icon={
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">
              Trip Status Over Time
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">
                {formatDrillLabel()} View
              </span>
              <button
                onClick={drillUp}
                disabled={drillLevel === "year"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition duration-200 ${
                  drillLevel === "year"
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Drill Up
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={drillData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onClick={(event) => {
                if (event && event.activeLabel) {
                  drillDown(event.activeLabel);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="period" tick={{ fill: "#6B7280" }} tickMargin={10} />
              <YAxis tick={{ fill: "#6B7280" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => statusLabels[value] || value} wrapperStyle={{ paddingTop: 20 }} />
              {Object.entries(statusColors).map(([status, color]) => (
                <Bar
                  key={status}
                  dataKey={status}
                  stackId="a"
                  fill={color}
                  name={statusLabels[status]}
                  cursor="pointer"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Delivery Status by Destination
            </h2>
            <div className="flex space-x-2">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-1"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600">
                    {statusLabels[status]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <MapContainer
            center={[36.8, 10.1]}
            zoom={7}
            style={{ height: 400, width: "100%", borderRadius: "0.5rem" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {mapData.map(({ destination, status_trip, count_trips }, idx) => {
              const coords = cityCoordinates[destination];
              if (!coords) return null;
              return (
                <CircleMarker
                  key={idx}
                  center={coords}
                  radius={5 + Math.sqrt(count_trips) * 2}
                  fillColor={statusColors[status_trip] || "#000"}
                  color="#fff"
                  weight={1}
                  fillOpacity={0.8}
                  eventHandlers={{
                    click: () => {
                      setDestination(destination);
                    },
                  }}
                >
                  <LeafletTooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={1}
                    permanent={false}
                    className="font-sans"
                  >
                    <div className="font-bold text-gray-800">
                      {destination.replace("_", " ")}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Status:</span>{" "}
                      {statusLabels[status_trip] || status_trip}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Trips:</span> {count_trips}
                    </div>
                  </LeafletTooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Delivery;
