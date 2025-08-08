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
  const [kpiData, setKpiData] = useState(null);
  const [departureData, setDepartureData] = useState([]);
  const [tripData, setTripData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, departureRes, tripRes, driversRes] = await Promise.all([
          axios.get("http://localhost:5000/api/driver-performance/kpis", {
            params: { driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/driver-performance/departure-times", {
            params: { driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/driver-performance/trips-by-date", {
            params: { driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/driver-performance/drivers"),
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
  }, [selectedDriver]);

  const handleChange = (e) => {
    setSelectedDriver(e.target.value);
  };

  // Transform departureData into grouped data by firstname,
  // each destination is a key with avgdeparturehour as value (number)
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

  // Get unique destinations for Bar keys
  const destinations = [...new Set(departureData.map((d) => d.destination))];

  // BarChart using transformedData and keys as destinations
  const barChart = React.createElement(
    ResponsiveContainer,
    { width: "100%", height: 300 },
    React.createElement(
      BarChart,
      { data: transformedData },
      React.createElement(XAxis, { dataKey: "firstname" }),
      React.createElement(YAxis, {
        label: {
          value: "Avg Departure Hour",
          angle: -90,
          position: "insideLeft",
        },
      }),
      React.createElement(
        Tooltip,
        {
          formatter: (value) => {
            if (typeof value !== "number") return value;
            const hours = Math.floor(value);
            const minutes = Math.round((value - hours) * 60);
            return `${hours}:${minutes.toString().padStart(2, "0")}`;
          },
        }
      ),
      React.createElement(Legend, { verticalAlign: "top" }),
      ...destinations.map((dest, idx) =>
        React.createElement(Bar, {
          key: dest,
          dataKey: dest,
          name: dest,
          stackId: "a",
          fill: ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"][idx % 5],
        })
      )
    )
  );

  const lineChart = React.createElement(
    ResponsiveContainer,
    { width: "100%", height: 300 },
    React.createElement(
      LineChart,
      { data: tripData },
      React.createElement(XAxis, { dataKey: "year" }),
      React.createElement(YAxis, {
        label: {
          value: "Count of trips",
          angle: -90,
          position: "insideLeft",
        },
      }),
      React.createElement(Tooltip, null),
      React.createElement(Line, {
        type: "monotone",
        dataKey: "trip_count",
        stroke: "#007BFF",
        strokeWidth: 2,
      })
    )
  );

  const kpis = kpiData || {
    in_progress: 0,
    delayed: 0,
    canceled: 0,
    completed: 0,
    total: 0,
  };

  return React.createElement(
    SuperAdminLayout,
    null,
    React.createElement(
      "div",
      { className: "p-6 space-y-6" },
      React.createElement(
        "div",
        { className: "bg-white py-4 px-6 mb-6 rounded shadow", key: "title" },
        React.createElement(
          "h1",
          { className: "text-center text-2xl font-bold text-gray-900" },
          "Driver Performance"
        )
      ),

      // KPI Cards
      React.createElement(
        "div",
        { className: "grid grid-cols-2 md:grid-cols-5 gap-4" },
        Object.entries({
          "Delivery in progress": kpis.in_progress,
          "Delayed delivery": kpis.delayed,
          "Canceled delivery": kpis.canceled,
          "Completed delivery": kpis.completed,
          "Total delivery": kpis.total,
        }).map(([label, value], index) =>
          React.createElement(
            "div",
            { key: index, className: "bg-white p-4 rounded shadow text-center" },
            React.createElement("h2", { className: "text-lg font-bold" }, label),
            React.createElement("p", { className: "text-3xl font-bold" }, value || 0)
          )
        )
      ),

      // Driver filter + BarChart
      React.createElement(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-3 gap-6" },
        React.createElement(
          "div",
          { className: "bg-white shadow rounded p-4 w-64" },
          React.createElement(
            "label",
            { htmlFor: "slicer", className: "block text-sm font-medium text-gray-700 mb-2" },
            "Filter by Driver"
          ),
          React.createElement(
            "select",
            {
              id: "slicer",
              value: selectedDriver,
              onChange: handleChange,
              className: "border rounded p-2 w-full",
            },
            React.createElement("option", { value: "" }, "-- Select Driver --"),
            drivers.map((d) =>
              React.createElement(
                "option",
                { key: d._id, value: d.firstname },
                `${d.firstname} ${d.last_name}`
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "col-span-2 bg-white p-4 rounded shadow" },
          React.createElement(
            "h2",
            { className: "text-center font-bold mb-2" },
            "Average Departure Time per Driver"
          ),
          barChart
        )
      ),

      // Trips line chart
      React.createElement(
        "div",
        { className: "bg-white p-4 rounded shadow" },
        React.createElement("h2", { className: "text-center font-bold mb-2" }, "Trips by Date"),
        lineChart
      )
    )
  );
};

export default DriverPerformance;
