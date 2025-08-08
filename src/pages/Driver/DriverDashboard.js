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

  // Manual mapping destination -> [lat, lng]
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

  const lineChart = React.createElement(
    ResponsiveContainer,
    { width: "100%", height: 320 },
    React.createElement(
      LineChart,
      { data: tripData },
      React.createElement(XAxis, { dataKey: "label", tickLine: false, axisLine: false, tick: { fill: '#4B5563' } }),
      React.createElement(YAxis, {
        label: { value: "Trips", angle: -90, position: "insideLeft", fill: '#4B5563', offset: 10 },
        tickLine: false,
        axisLine: false,
        tick: { fill: '#4B5563' },
      }),
      React.createElement(Tooltip, { contentStyle: { backgroundColor: '#F9FAFB', borderRadius: '8px' }, labelStyle: { fontWeight: 'bold' } }),
      React.createElement(Line, {
        type: "monotone",
        dataKey: "count",
        stroke: "#3B82F6", // Tailwind blue-500
        strokeWidth: 3,
        dot: { r: 5, fill: "#3B82F6" },
        activeDot: { r: 8 },
      }),
      React.createElement(Legend, { wrapperStyle: { paddingTop: 10, color: '#374151' } })
    )
  );

  const map = React.createElement(
    MapContainer,
    { center: [34.0, 9.0], zoom: 6, style: { height: "320px", width: "100%", borderRadius: "0.5rem", boxShadow: "0 10px 15px -3px rgba(59,130,246,0.3)" } },
    React.createElement(TileLayer, {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>',
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    }),
    ...mapData.map((item, idx) =>
      React.createElement(
        CircleMarker,
        {
          key: idx,
          center: [item.latitude, item.longitude],
          radius: Math.min(item.count * 2 + 5, 30),
          fillOpacity: 0.6,
          stroke: true,
          color: "#3B82F6",
          weight: 2,
          fillColor: "#3B82F6",
        },
        React.createElement(LeafletTooltip, { direction: "top", offset: [0, -10], opacity: 1 }, `${item.destination}: ${item.count} trips`)
      )
    )
  );

  return React.createElement(
    "div",
    { className: "p-8 bg-gray-50 min-h-screen space-y-8 font-sans" },

    // Title with driver name
    React.createElement(
      "div",
      { className: "bg-white py-6 px-8 rounded-lg shadow-md border border-gray-200" },
      React.createElement(
        "h1",
        { className: "text-center text-3xl font-extrabold text-gray-900 tracking-wide" },
        `${driverInfo.firstname || ""} ${driverInfo.last_name || ""} Dashboard`
      )
    ),

    // KPI Cards
    React.createElement(
      "div",
      { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6" },
      ["Canceled Deliveries", "Average Mileage", "Completed Deliveries", "Total Deliveries"].map((title, i) => {
        const values = [
          kpis.canceled,
          Number(kpis.avg_mileage).toFixed(2),
          kpis.completed,
          kpis.total,
        ];
        const colors = ["red-500", "blue-500", "green-500", "purple-500"];
        return React.createElement(
          "div",
          {
            key: i,
            className: `bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow duration-300 border border-gray-200 flex flex-col items-center`,
          },
          React.createElement(
            "h2",
            { className: `text-xl font-semibold text-gray-700 mb-2` },
            title
          ),
          React.createElement(
            "p",
            { className: `text-4xl font-bold text-${colors[i]} select-none` },
            values[i]
          )
        );
      })
    ),

    // Drill Down/Up Buttons + label
    React.createElement(
      "div",
      { className: "flex justify-center items-center gap-6" },
      React.createElement(
        "button",
        {
          className:
            "bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-5 rounded-lg shadow transition",
          onClick: handleDrillUp,
          disabled: groupBy === "year",
        },
        "⬆ Drill Up"
      ),
      React.createElement(
        "span",
        { className: "text-lg text-gray-600 font-medium" },
        `Grouped by ${groupBy}`
      ),
      React.createElement(
        "button",
        {
          className:
            "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg shadow transition",
          onClick: handleDrillDown,
          disabled: groupBy === "day",
        },
        "⬇ Drill Down"
      )
    ),

    // Chart + Map side by side 
    React.createElement(
      "div",
      { className: "grid grid-cols-1 md:grid-cols-2 gap-8" },
      React.createElement(
        "section",
        { className: "bg-white p-6 rounded-lg shadow border border-gray-200" },
        React.createElement(
          "h2",
          { className: "text-xl font-semibold text-gray-800 mb-4 text-center" },
          "Trip Count Over Time"
        ),
        lineChart
      ),
      React.createElement(
        "section",
        { className: "bg-white p-6 rounded-lg shadow border border-gray-200" },
        React.createElement(
          "h2",
          { className: "text-xl font-semibold text-gray-800 mb-4 text-center" },
          "Trips by Destination"
        ),
        map
      )
    )
  );
}

export default DriverDashboard;
