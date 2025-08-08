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
  Line
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
        const [kpiRes, departureRes, tripRes, driversRes] = await Promise.all([
          axios.get("http://localhost:5000/api/manager-performance/kpis", {
            params: { managerId, driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/manager-performance/departure-times", {
            params: { managerId, driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/manager-performance/trips-by-date", {
            params: { managerId, driver: selectedDriver },
          }),
          axios.get("http://localhost:5000/api/manager-performance/drivers", {
            params: { managerId },
          }),
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

  const handleChange = (e) => setSelectedDriver(e.target.value);
  const destinations = [...new Set(departureData.map((d) => d.destination))];

  const kpis = kpiData || {
    in_progress: 0,
    delayed: 0,
    canceled: 0,
    completed: 0,
    total: 0,
  };
   const transformedData = [];
    departureData.forEach((entry) => {
        let existing = transformedData.find((d) => d.firstname === entry.firstname);
        if (!existing) {
            existing = { firstname: entry.firstname };
            transformedData.push(existing);
        }
        // Convert avgdeparturehour string to float
        const avgHour = parseFloat(entry.avgdeparturehour);
        if (!isNaN(avgHour)) {
            existing[entry.destination] = parseFloat(avgHour.toFixed(2));
        } else {
            existing[entry.destination] = 0;
        }
    });
  return React.createElement(
    "div",
    { className: "p-6 space-y-6" },
    React.createElement(
      "div",
      { className: "bg-white py-4 px-6 mb-6 rounded shadow" },
      React.createElement(
        "h1",
        { className: "text-center text-2xl font-bold text-gray-900" },
        "Driver Performance"
      )
    ),
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
    React.createElement(
      "div",
      { className: "grid grid-cols-1 md:grid-cols-3 gap-6" },
      React.createElement(
        "div",
        { className: "bg-white shadow rounded p-4 w-64" },
        React.createElement(
          "label",
          {
            htmlFor: "slicer",
            className: "block text-sm font-medium text-gray-700 mb-2",
          },
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
        React.createElement(
          ResponsiveContainer,
          { width: "100%", height: 300 },
          React.createElement(
            BarChart,
            { data: transformedData  },
            React.createElement(XAxis, { dataKey: "firstname" }),
            React.createElement(YAxis, {
              label: {
                value: "Avg Departure Hour",
                angle: -90,
                position: "insideLeft",
              },
              tickFormatter: (val) => parseFloat(val).toFixed(2)    
            }),
            React.createElement(Tooltip, {
               formatter: function (value, name) {
                    if (isNaN(value)) return value;
                    const floatVal = parseFloat(value);
                    const hours = Math.floor(floatVal);
                    const minutes = Math.round((floatVal - hours) * 60);
                    return [`${hours}:${minutes.toString().padStart(2, "0")}`, name];
                }
                }),
            React.createElement(Legend, { verticalAlign: "top" }),
           destinations.map((dest, idx) =>
                React.createElement(Bar, {
                    key: dest,
                    dataKey: dest, // direct property key of avg departure hour by destination
                    name: dest,
                    stackId: "a",
                    fill: ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"][idx % 5],
                })
                )
          )
        )
      )
    ),
    React.createElement(
      "div",
      { className: "bg-white p-4 rounded shadow" },
      React.createElement(
        "h2",
        { className: "text-center font-bold mb-2" },
        "Trips by Date"
      ),
      React.createElement(
        ResponsiveContainer,
        { width: "100%", height: 300 },
        React.createElement(
          LineChart,
          { data: tripData },
          React.createElement(XAxis, { dataKey: "year" }),
          React.createElement(YAxis, {
            label: {
              value: "Trip Count",
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
      )
    )
  );
}

export default DriverPerformance;
