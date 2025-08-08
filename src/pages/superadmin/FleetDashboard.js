import React, { useEffect, useState } from "react";
import SuperAdminLayout from "../../layouts/superadmin";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";
import axios from "axios";

const Fleet = () => {
  const [fleetKpi, setFleetKpi] = useState({
    avgMileage: 0,
    totalTrucks: 0,
    trucksInService: 0,
  });

  const [truckCapacityData, setTruckCapacityData] = useState([]);
  const [drillData, setDrillData] = useState([]);
  const [drillLevel, setDrillLevel] = useState("year");
  const [drillValue, setDrillValue] = useState(null);

  // Transform backend capacityByBrandStatus to frontend bar chart format
  const transformCapacityData = (rawData) => {
    const grouped = {};

    rawData.forEach(({ _id, totalCapacity }) => {
      const { brand, status } = _id;
      if (!grouped[brand]) {
        grouped[brand] = {
          brand,
          Available: 0,
          InService: 0,
          Maintenance: 0,
        };
      }
      if (status === "available") grouped[brand].Available += totalCapacity;
      else if (status === "in_service") grouped[brand].InService += totalCapacity;
      else if (status === "maintenance") grouped[brand].Maintenance += totalCapacity;
    });

    return Object.values(grouped);
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/fleet/insights")
      .then((res) => {
        const {
          avgMileage,
          totalTrucks,
          trucksInService,
          capacityByBrandStatus,
        } = res.data;

        setFleetKpi({ avgMileage, totalTrucks, trucksInService });
        setTruckCapacityData(transformCapacityData(capacityByBrandStatus));
      })
      .catch((err) => {
        console.error("Error fetching fleet insight data:", err);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/fleet/drill", {
        params: { level: drillLevel, value: drillValue },
      })
      .then((res) => {
        
        const grouped = {};
        res.data.forEach(({ period, status, truck_count }) => {
          if (!grouped[period]) grouped[period] = { period };
          // Normalize status keys (replace spaces, lowercase)
          const key = status.toLowerCase().replace(/\s+/g, "_");
          grouped[period][key] = truck_count;
        });

        // Fill zeros for missing statuses to avoid NaN issues
        const allStatuses = [
          "available",
          "in_service",
          "maintenance",
          "idle",
          "delivering",
          "out_of_service",
        ];

        const formatted = Object.values(grouped).map((entry) => {
          allStatuses.forEach((status) => {
            if (!(status in entry)) entry[status] = 0;
          });
          return entry;
        });

        setDrillData(formatted);
      })
      .catch((err) => {
        console.error("Error fetching drill data:", err);
      });
  }, [drillLevel, drillValue]);

  // Compute total registrations per period (sum of all statuses)
  const drillDataWithTotals = drillData.map((entry) => {
    const totalCount = Object.keys(entry)
      .filter((key) => key !== "period")
      .reduce((sum, key) => sum + (entry[key] || 0), 0);
    return {
      ...entry,
      registration_count: totalCount,
    };
  });

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
      setDrillValue(drillValue.substring(0, 7)); // YYYY-MM
    } else if (drillLevel === "month" && drillValue) {
      setDrillLevel("year");
      setDrillValue(null);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="bg-gray-100 min-h-screen p-6">
        {/* Title */}
        <div className="bg-white py-4 px-6 mb-6 rounded shadow">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Fleet Overview
          </h1>
        </div>

        {/* KPIs + Charts container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* KPI cards container */}
          <div className="grid grid-cols-1 gap-4">
            <KpiCard
              title="Average Mileage"
              value={`${fleetKpi.avgMileage.toFixed(2)} km`}
              key="avg"
            />
            <KpiCard
              title="Total Trucks"
              value={fleetKpi.totalTrucks}
              key="total"
            />
            <KpiCard
              title="Trucks In Service"
              value={fleetKpi.trucksInService}
              key="inService"
            />
          </div>

          {/* Stacked bar chart container */}
          <div className="col-span-2 bg-white shadow rounded p-4">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-4">
              Truck Capacity by Brand & Status
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={truckCapacityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="brand" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Available" stackId="a" fill="#4caf50" />
                <Bar dataKey="InService" stackId="a" fill="#2196f3" />
                <Bar dataKey="Maintenance" stackId="a" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drill charts container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
          {/* Drilldown Chart container */}
          <div className="bg-white shadow rounded p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 text-center w-full">
                Truck Registrations by Status and Brand
              </h2>
              <button
                onClick={drillUp}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-full shadow hover:shadow-lg transition duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                Drill Up
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={drillDataWithTotals}
                onClick={(data) => {
                  if (data && data.activeLabel) drillDown(data.activeLabel);
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="available" stackId="a" fill="#4caf50" />
                <Bar yAxisId="left" dataKey="in_service" stackId="a" fill="#2196f3" />
                <Bar yAxisId="left" dataKey="maintenance" stackId="a" fill="#f44336" />
                <Bar yAxisId="left" dataKey="idle" stackId="a" fill="#607d8b" />
                <Bar yAxisId="left" dataKey="delivering" stackId="a" fill="#9c27b0" />
                <Bar yAxisId="left" dataKey="out_of_service" stackId="a" fill="#ff5722" />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="registration_count"
                  stroke="#ff9800"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Maintenance Line Chart container */}
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-4">
              Trucks Under Maintenance Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={drillData.filter((d) => d.status === "maintenance")}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#f44336"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

const KpiCard = ({ title, value }) => (
  <div className="bg-white shadow rounded p-4 text-center">
    <div className="text-sm font-bold text-gray-800 mb-1">{title}</div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
  </div>
);

export default Fleet;
