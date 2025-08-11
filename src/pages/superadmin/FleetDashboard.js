import React, { useEffect, useState } from "react";
import SuperAdminLayout from "../../layouts/superadmin";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, Line, LineChart
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

  const statusColors = {
    available: "#4caf50",
    in_service: "#2196f3",
    maintenance: "#f44336",
    idle: "#607d8b",
    delivering: "#9c27b0",
    out_of_service: "#ff5722",
    registration_count: "#ff9800"
  };

  const transformCapacityData = (rawData) => {
    const grouped = {};
    rawData.forEach(({ _id, totalCapacity }) => {
      const { brand, status } = _id;
      if (!grouped[brand]) {
        grouped[brand] = { brand, Available: 0, InService: 0, Maintenance: 0 };
      }
      if (status === "available") grouped[brand].Available += totalCapacity;
      if (status === "in_service") grouped[brand].InService += totalCapacity;
      if (status === "maintenance") grouped[brand].Maintenance += totalCapacity;
    });
    return Object.values(grouped);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [insightsRes, drillRes] = await Promise.all([
          axios.get("http://localhost:5000/api/fleet/insights"),
          axios.get("http://localhost:5000/api/fleet/drill", {
            params: { level: drillLevel, value: drillValue }
          })
        ]);

        const { avgMileage, totalTrucks, trucksInService, capacityByBrandStatus } = insightsRes.data;
        setFleetKpi({ avgMileage, totalTrucks, trucksInService });
        setTruckCapacityData(transformCapacityData(capacityByBrandStatus));

        const grouped = {};
        drillRes.data.forEach(({ period, status, truck_count }) => {
          if (!grouped[period]) grouped[period] = { period };
          const key = status.toLowerCase().replace(/\s+/g, "_");
          grouped[period][key] = truck_count;
        });

        const allStatuses = [
          "available", "in_service", "maintenance",
          "idle", "delivering", "out_of_service"
        ];

        const formatted = Object.values(grouped).map((entry) => {
          allStatuses.forEach((status) => {
            if (!(status in entry)) entry[status] = 0;
          });
          return entry;
        });

        setDrillData(formatted);
        
      } catch (err) {
        console.error("Error fetching fleet data:", err);
        
      }
    };

    fetchData();
  }, [drillLevel, drillValue]);

  const drillDataWithTotals = drillData.map((entry) => {
    const totalCount = Object.keys(entry)
      .filter((key) => key !== "period")
      .reduce((sum, key) => sum + (entry[key] || 0), 0);
    return { ...entry, registration_count: totalCount };
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
      setDrillValue(drillValue.substring(0, 7));
    } else if (drillLevel === "month" && drillValue) {
      setDrillLevel("year");
      setDrillValue(null);
    }
  };



  return (
    <SuperAdminLayout>
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-6 mb-6 rounded-lg shadow-md">
          <h1 className="text-center text-3xl font-bold text-white">Fleet Overview</h1>
          <p className="text-center text-blue-100 mt-2">
            Comprehensive analysis of your truck fleet operations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-8">
          <div className="grid grid-cols-1 gap-4">
            <KpiCard 
              title="Average Mileage" 
              value={`${fleetKpi.avgMileage.toFixed(2)} km`} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
            <KpiCard 
              title="Total Trucks" 
              value={fleetKpi.totalTrucks} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              }
            />
            <KpiCard 
              title="Trucks In Service" 
              value={fleetKpi.trucksInService} 
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          <div className="col-span-2 bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Truck Capacity by Brand & Status</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={truckCapacityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="brand" 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Available" 
                    stackId="a" 
                    fill="#4caf50" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="InService" 
                    stackId="a" 
                    fill="#2196f3" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="Maintenance" 
                    stackId="a" 
                    fill="#f44336" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Truck Registrations by Status
                <span className="block text-sm font-normal text-gray-500 mt-1">
                  {drillLevel === "year" ? "Yearly" : drillLevel === "month" ? "Monthly" : "Daily"} View
                </span>
              </h2>
              <button
                onClick={drillUp}
                disabled={drillLevel === "year"}
                className={`flex items-center gap-2 text-white font-semibold py-2 px-4 rounded-full shadow hover:shadow-lg transition duration-200 ${
                  drillLevel === "year" 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                }`}
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
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={drillDataWithTotals}
                  onClick={(data) => { if (data && data.activeLabel) drillDown(data.activeLabel); }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  {Object.keys(statusColors).map((status) => {
                    if (status === "registration_count") return null;
                    return (
                      <Bar 
                        key={status}
                        yAxisId="left" 
                        dataKey={status} 
                        stackId="a" 
                        fill={statusColors[status]} 
                        name={status.replace(/_/g, " ")}
                        radius={[4, 4, 0, 0]}
                      />
                    );
                  })}
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="registration_count" 
                    stroke={statusColors.registration_count} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Total Registrations"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Click on a period to drill down. Currently viewing {drillLevel === "year" ? "yearly" : drillLevel === "month" ? "monthly" : "daily"} data.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Trucks Under Maintenance Over Time
              <span className="block text-sm font-normal text-gray-500 mt-1">
                Trend analysis of maintenance requirements
              </span>
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={drillDataWithTotals.map(d => ({ period: d.period, count: d.maintenance }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#f44336" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Maintenance Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

const KpiCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex items-start">
    {icon && <div className="mr-4 mt-1">{icon}</div>}
    <div>
      <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  </div>
);

export default Fleet;