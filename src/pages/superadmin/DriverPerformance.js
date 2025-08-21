import React, { useEffect, useState } from "react";
import axios from "axios";
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
  CartesianGrid,
} from "recharts";

const statusColors = {
  in_progress: "#6366F1",
  delayed: "#F59E0B",
  canceled: "#EF4444",
  completed: "#10B981",
  total: "#3B82F6",
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

  const timeFormatter = (value) => {
    if (typeof value !== "number") return value;
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-200 text-xs md:text-sm">
          <p className="font-bold text-gray-800">{label}</p>
          <div className="mt-1 space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-600 font-medium">{entry.name}: </span>
                <span className="font-bold ml-1">{timeFormatter(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow rounded border border-gray-200 text-xs md:text-sm">
          <p className="font-bold text-gray-800">{label}</p>
          <div className="mt-1 space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
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
  <>
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-2 px-4 mb-4 rounded-lg shadow-md flex-shrink-0">
      <h1 className="text-center text-xl font-semibold text-white">
        Driver Performance Dashboard
      </h1>
      <p className="text-center text-blue-100 mt-1 text-xs md:text-sm">
        Monitor and analyze driver performance metrics
      </p>
    </div>

    {/* KPIs row */}
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-4 px-3 sm:px-6">
        {/* Driver slicer */}
        <div className="sm:col-span-2 bg-white rounded-xl shadow-md p-3 border border-gray-100">
          <label
            htmlFor="driverFilter"
            className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
          >
            Filter by Driver
          </label>
          <select
            id="driverFilter"
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-xs sm:text-sm"
          >
            <option value="">All Drivers</option>
            {drivers.map((d) => (
              <option key={d._id} value={d.FirstName}>
                {d.FirstName} {d.LastName}
              </option>
            ))}
          </select>
        </div>

        {/* KPI cards - 4 KPIs */}
        {[
          ["in_progress", "In Progress", "M5 13l4 4L19 7", statusColors.in_progress],
          ["completed", "Completed", "M5 13l4 4L19 7", statusColors.completed],
          ["delayed", "Delayed", "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", statusColors.delayed],
          ["canceled", "Canceled", "M6 18L18 6M6 6l12 12", statusColors.canceled],
        ].map(([key, title, iconPath, color]) => (
          <div
            key={key}
            className="bg-white rounded-xl shadow-md p-3 border border-gray-100 flex items-center justify-between"
          >
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-800 mt-0.5">
                {kpiData[key] || 0}
              </p>
            </div>
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500"
              fill="none"
              stroke={color}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
            </svg>
          </div>
        ))}
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 mb-4 px-2">
      <div className="bg-white rounded-lg shadow p-2 border border-gray-100">
        <h2 className="text-base md:text-lg font-bold text-gray-800 mb-2">
          Average Departure Time per Driver
        </h2>
        <div className="bg-gray-50 rounded p-1">
              <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={transformedData}
                    margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                    barCategoryGap="20%"
                    barGap={2}
                  >
                {/* Grid with subtle lines */}
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />

                    {/* X axis with smaller font, rotated labels if too long */}
                    <XAxis
                      dataKey="firstname"
                      tick={{ fill: "#6B7280", fontSize: 11 }}
                      tickMargin={8}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60} // room for rotated labels
                    />

                    {/* Y axis with label and ticks formatted */}
                    <YAxis
                      tick={{ fill: "#6B7280", fontSize: 11 }}
                      tickCount={6}
                      label={{
                        value: "Avg Departure Time",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#6B7280",
                        fontSize: 12,
                        offset: 10,
                      }}
                      tickFormatter={timeFormatter}
                      domain={['dataMin - 1', 'dataMax + 1']} // add some padding
                    />

                    {/* Tooltip with subtle styling */}
                    <Tooltip
                      content={<CustomBarTooltip />}
                      cursor={{ fill: "#f3f4f6" }}
                      wrapperStyle={{ outline: "none" }}
                    />

                    {/* Legend with small font, aligned center */}
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />

                    {/* Bars stacked with rounded corners */}
                   {destinations.map((dest, idx) => {
                      // Extract first 2 words for legend
                      const legendName = dest.split(" ").slice(0, 2).join(" ");

                      return (
                        <Bar
                          key={dest}
                          dataKey={dest}
                          name={legendName} // use first 2 words only
                          stackId="a"
                          fill={destinationColors[idx % destinationColors.length]}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      );
                    })}
                  </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-2 border border-gray-100">
        <h2 className="text-base md:text-lg font-bold text-gray-800 mb-2">Trips by Date</h2>
        <div className="bg-gray-50 rounded p-1">
        <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={tripData}
              margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
            >
              {/* Light grid with subtle lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />

              {/* XAxis with clearer ticks and small font */}
              <XAxis
                dataKey="year"
                tick={{ fill: "#6B7280", fontSize: 11 }}
                tickMargin={8}
                interval="preserveEnd"
                minTickGap={15}
              />

              {/* YAxis with label and ticks */}
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 11 }}
                label={{
                  value: "Count of trips",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#6B7280",
                  fontSize: 12,
                  offset: 10,
                }}
                tickCount={6}
                allowDecimals={false}
                domain={['dataMin - 1', 'dataMax + 1']} // padding
              />

              {/* Tooltip with custom styling */}
              <Tooltip
                content={<CustomLineTooltip />}
                cursor={{ stroke: "#93c5fd", strokeWidth: 2, opacity: 0.2 }}
                wrapperStyle={{ outline: "none" }}
              />

              {/* Smooth monotone line with nice color and dots */}
              <Line
                type="monotone"
                dataKey="trip_count"
                stroke="#3B82F6"
                strokeWidth={2.5}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#2563eb", fill: "#3B82F6" }}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>
      </div>
    </div>
  </>
);

};

const KpiCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow p-3 border border-gray-100 flex items-center justify-between overflow-hidden">
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="text-lg font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
      <div
        className="p-2 rounded-md bg-opacity-10"
        style={{ backgroundColor: `${color}20`, color: color }}
      >
        {icon}
      </div>
    </div>
  );
};

export default DriverPerformance;
