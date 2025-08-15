import React, { useEffect, useState } from "react";
import axios from "axios";
import SuperAdminLayout from "../../layouts/superadmin";
import {
  TruckIcon,
  ClockIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

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

const Delivery = () => {
  const [tripsKpi, setTripsKpi] = useState({
    totalTrips: 0,
    totalDistance: 0,
    avgDuration: 0,
  });
  const [canceledtrips, setCanceledTrips] = useState(null);
  const [delayedtrips, setDelayedTrips] = useState(null);
  const [drillData, setDrillData] = useState([]);
  const [drillLevel, setDrillLevel] = useState("year");
  const [drillValue, setDrillValue] = useState(null);
  const [destination, setDestination] = useState("");
  const [mapData, setMapData] = useState([]);
  
  

const fetchData = async () => {
  try {
    const res = await axios.get(
      "http://localhost:5000/api/delivery/insights",
      { params: { destination } }
    );

    // Ensure it's always an array
    const tripsArray = Array.isArray(res.data) ? res.data : [res.data];

    // Sum KPIs from all items
    const totalTrips = tripsArray.reduce((sum, item) => sum + (item.TotalTrips || 0), 0);
    const totalDistance = tripsArray.reduce((sum, item) => sum + (item.TotalDistance || 0), 0);
    const avgDuration =
      tripsArray.length > 0
        ? tripsArray.reduce((sum, item) => sum + (item.AvgDuration || 0), 0) / tripsArray.length
        : 0;
    const canceled = tripsArray.reduce((sum, item) => sum + (item.Canceled || 0), 0);
    const delayed = tripsArray.reduce((sum, item) => sum + (item.Delayed || 0), 0);
    const totalStops = tripsArray.reduce((sum, item) => sum + (item.TotalStops || 0), 0);

    setTripsKpi({
      totalTrips,
      totalDistance,
      avgDuration,
      totalStops,
    });
    setCanceledTrips(canceled);
    setDelayedTrips(delayed);
    setStopsKpi(totalStops);
  } catch (err) {
    console.error("Error fetching delivery KPI data:", err);
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
    const trimmedDestination = destination.trim();
    const res = await axios.get("http://localhost:5000/api/delivery/map-data", {
      params: { destination: trimmedDestination },
    });
    setMapData(res.data);
  } catch (err) {
    console.error("Error fetching map data:", err);
  }
};
const handleDestinationChange = (e) => {
  setDestination(e.target.value);
};

const clearDestination = () => {
  setDestination("");
};
  
const [stopsKpi, setStopsKpi] = useState(null);

const handleChartClick = async (data) => {
  if (!data || !data.activeLabel) return;

  // Drill down if not day
  if (drillLevel !== "day") {
    drillDown(data.activeLabel);
    return;
  }

  // Fetch stops for this day
  try {
    const res = await axios.get("http://localhost:5000/api/delivery/stops", {
      params: {
        date: data.activeLabel, // clicked day
        destination: destination.trim() || null,
        level: drillLevel,
      },
    });
    setStopsKpi(res.data.totalStops);
  } catch (err) {
    console.error("Error fetching stops KPI:", err);
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
        grouped[key] = { period: key, completed: 0, in_progress: 0, delayed: 0, canceled: 0, pending: 0 };
      }
      const statusLabel = statusMap[row.status_trip];
      if (statusLabel && grouped[key]) grouped[key][statusLabel] = parseInt(row.count_trips, 10);
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
  setStopsKpi(null); // reset KPI when not at day level
  if (drillLevel === "day" && drillValue) {
    setDrillLevel("month");
    setDrillValue(drillValue.substring(0, 7));
  } else if (drillLevel === "month" && drillValue) {
    setDrillLevel("year");
    setDrillValue(null);
  }
};  

  const formatDrillLabel = () =>
    drillLevel === "year" ? "Yearly" : drillLevel === "month" ? "Monthly" : "Daily";

  const KpiCard = ({ title, value, icon, bgColor = "bg-blue-500", unit }) => (
    <div className="bg-white rounded-xl shadow-md p-4 flex items-center space-x-4 transition-transform transform hover:-translate-y-1 hover:shadow-xl">
      <div className={`w-12 h-12 flex items-center justify-center rounded-full ${bgColor} text-white`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">{title}</span>
        <span className="text-150 font-bold text-gray-900">
          {value} {unit ? unit : ""}
        </span>
      </div>
    </div>
  );

  return (
    <SuperAdminLayout>
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-2 px-4 rounded-lg shadow-md flex-shrink-0 mb-6">
        <h1 className="text-center text-xl sm:text-2xl font-semibold text-white">
          Delivery Dashboard
        </h1>
        <p className="text-center text-blue-200 mt-1 text-xs sm:text-sm">
          Monitor and analyze delivery performance across Tunisia
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* KPI Cards - Top Row */}
        <KpiCard title="Total Trips" value={tripsKpi.totalTrips} icon={<TruckIcon className="w-6 h-6" />} bgColor="bg-blue-500" />
        <KpiCard title="Delayed" value={delayedtrips !== null ? delayedtrips : "N/A"}  icon={<ExclamationTriangleIcon className="w-6 h-6" />} bgColor="bg-amber-500" />
        <KpiCard title="Canceled" value={canceledtrips !== null ? canceledtrips : "N/A"}  icon={<XCircleIcon className="w-6 h-6" />} bgColor="bg-red-500" />
       <KpiCard
          title="Average Duration"
          value={
            tripsKpi.avgDuration
              ? `${Math.floor(tripsKpi.avgDuration / 3600)}h ${Math.floor((tripsKpi.avgDuration % 3600) / 60)}m`
              : "N/A"
          }
          unit=""
          icon={<ClockIcon className="w-6 h-6" />}
          bgColor="bg-purple-500"
        />

        <KpiCard title="Distance" value={tripsKpi.totalDistance ? (tripsKpi.totalDistance / 1000).toFixed(2) : "N/A"} unit="km" icon={<MapPinIcon className="w-6 h-6" />} bgColor="bg-green-500" />
       <KpiCard
        title="Total Stops"
        value={stopsKpi !== null ? stopsKpi : "N/A"}
        icon={<MapPinIcon className="w-6 h-6" />}
        bgColor="bg-indigo-500"
      />  
       {/* Destination Filter - Bottom Row */}
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 col-span-1 lg:col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Destination
          </label>
          <div className="flex flex-col sm:flex-row w-full gap-2">
            <input
              type="text"
              placeholder="Enter destination..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg hover:bg-gray-300 text-gray-700 text-sm font-medium transition duration-200"
              onClick={() => setDestination("")}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex flex-col" style={{ minHeight: 240 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Trip Status Over Time</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">{formatDrillLabel()} View</span>
              <button
                onClick={drillUp}
                disabled={drillLevel === "year"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition duration-200 ${drillLevel === "year" ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Drill Up
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={drillData}
                margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="5 5" stroke="#e0e0e0" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#555" }} angle={-30} textAnchor="end" interval={0} height={50} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#555" }} axisLine={false} tickLine={false} />
                <Tooltip wrapperStyle={{ fontSize: 14, backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 3px 8px rgba(0,0,0,0.15)" }} contentStyle={{ border: "none", padding: "8px 12px" }} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                <Legend verticalAlign="bottom" height={36} iconSize={14} wrapperStyle={{ paddingTop: 8 }} formatter={(value) => <span style={{ fontSize: 13, color: "#333", fontWeight: "600" }}>{value.replace(/_/g, " ")}</span>} />
                {Object.keys(statusColors).map((status) => (
                  <Bar key={status} yAxisId="left" dataKey={status} stackId="a" fill={statusColors[status] + "cc"} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800} barSize={22} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 flex flex-col" style={{ minHeight: 240 }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Delivery Status by Destination</h2>
            <div className="flex space-x-2">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-600">{statusLabels[status]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-[220px]">
            <MapContainer
              center={[36.8, 10.1]}
              zoom={7}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%", borderRadius: "0.5rem", boxShadow: "0 6px 12px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              {mapData.map(({ destination, status_trip, count_trips, coords }, idx) => {
                if (!coords || coords.length !== 2) return null;
                return (
                  <CircleMarker
                    key={idx}
                    center={coords}
                    radius={5 + Math.sqrt(count_trips) * 2}
                    fillColor={statusColors[status_trip] || "#000"}
                    color="#fff"
                    weight={2}
                    fillOpacity={0.85}
                    stroke
                    eventHandlers={{
                      click: () => {
                        setDestination(destination); // send full name to backend
                      },
                      mouseover: (e) => {
                        e.target.setStyle({ weight: 4, fillOpacity: 1 });
                        e.target.openTooltip();
                      },
                      mouseout: (e) => {
                        e.target.setStyle({ weight: 2, fillOpacity: 0.85 });
                        e.target.closeTooltip();
                      },
                    }}
                    className="cursor-pointer"
                  >
                    <LeafletTooltip direction="top" offset={[0, -10]} opacity={1} permanent={false} className="font-sans bg-white text-gray-900 rounded-md shadow-lg p-2 border border-gray-200">
                      <div className="font-semibold text-lg mb-1">{destination.replace("_", " ")}</div>
                      <div><span className="font-medium">Status:</span> {statusLabels[status_trip]}</div>
                      <div><span className="font-medium">Trips:</span> {count_trips}</div>
                      <div><span className="font-medium">Coordinates:</span> {coords[0].toFixed(2)}, {coords[1].toFixed(2)}</div>
                    </LeafletTooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Delivery;
