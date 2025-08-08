import SuperAdminLayout from "../../layouts/SuperAdminLayout";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,Line,LineChart
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


  useEffect(() => {
    axios.get("http://localhost:5000/api/fleet/insights")
      .then((res) => {
        const {
          avgMileage,
          totalTrucks,
          trucksInService,
          truckCapacityByBrand
        } = res.data;

        setFleetKpi({ avgMileage, totalTrucks, trucksInService });
        setTruckCapacityData(truckCapacityByBrand);
      })
      .catch((err) => {
        console.error("Error fetching fleet insight data:", err);
      });
  }, []);
  useEffect(() => {
    setDrillData([]);
  // Drilldown chart data
  axios
    .get("http://localhost:5000/api/fleet/drill", {
        params: { level: drillLevel, value: drillValue },
    })
    .then((res) => {
      setDrillData(transformDrillData(res.data));
    });
}, [drillLevel, drillValue]);
const transformDrillData = (rows) => {
  const grouped = {};
  const statusMap = {
    delivering: "Delivering",
    idle: "Idle",
    available: "Available",
    in_service: "In Service",
    out_of_service: "Out of Service",
    maintenance: "Maintenance"
  };

  rows.forEach((row) => {
    const key = row.period;
    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        registration_count: parseInt(row.registration_count),
        Delivering: 0,
        Idle: 0,
        Available: 0,
        "In Service": 0,
        "Out of Service": 0,
        Maintenance: 0
      };
    }

    const statusLabel = statusMap[row.status];
    if (statusLabel && grouped[key]) {
      grouped[key][statusLabel] = parseInt(row.truck_count);
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
    // From day → month, 
    setDrillLevel("month");
    setDrillValue(drillValue.substring(0, 4)); // foramt "YYYY" 
  } else if (drillLevel === "month" && drillValue) {
    // From month → year
    setDrillLevel("year");
    setDrillValue(null);
  }
};


  return (
    <SuperAdminLayout>
      <div className="bg-gray-100 min-h-screen p-6">
        {/* Title */}
        <div className="bg-white py-4 px-6 mb-6 rounded shadow">
          <h1 className="text-center text-2xl font-bold text-gray-900">Fleet Overview</h1>
        </div>

        {/* KPI + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* KPI Cards Left */}
          <div className="grid grid-cols-1 gap-4">
            <KpiCard title="Average Mileage" value={`${fleetKpi.avgMileage} km`} />
            <KpiCard title="Total Trucks" value={fleetKpi.totalTrucks} />
            <KpiCard title="Trucks In Service" value={fleetKpi.trucksInService} />
          </div>

          {/* Stacked Bar Chart Right */}
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
                <Bar dataKey="In Service" stackId="a" fill="#2196f3" />
                <Bar dataKey="Maintenance" stackId="a" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
            <div className="bg-white shadow rounded p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 text-center w-full">Truck Registrations by Status and Brand</h2>
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                        Drill Up
                                    </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={drillData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period"/>
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Available" stackId="a" fill="#4caf50" onClick={(data) => {
                      if (data && data.payload?.period) {
                        drillDown(data.payload.period);
                      }
                    }} />
                  <Bar yAxisId="left" dataKey="Delivering" stackId="a" fill="#9c27b0" onClick={(data) => {
                      if (data && data.payload?.period) {
                        drillDown(data.payload.period);
                      }
                    }} />
                  <Bar yAxisId="left" dataKey="Idle" stackId="a" fill="#607d8b" onClick={(data) => {
                      if (data && data.payload?.period) {
                        drillDown(data.payload.period);
                      }
                    }} />
                  <Bar yAxisId="left" dataKey="In Service" stackId="a" fill="#2196f3" onClick={(data) => {
                      if (data && data.payload?.period) {
                        drillDown(data.payload.period);
                      }
                    }}/>
                  <Bar yAxisId="left" dataKey="Out of Service" stackId="a" fill="#ff5722"  onClick={(data) => {
                      if (data && data.payload?.period) {
                        drillDown(data.payload.period);
                      }
                    }}/>
                  <Bar yAxisId="left" dataKey="Maintenance" stackId="a" fill="#f44336" onClick={(data) => {
                      if (data && data.payload?.period) {
                        drillDown(data.payload.period);
                      }
                    }} />
                  <Line yAxisId="right" type="monotone" dataKey="registration_count" stroke="#ff9800" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white shadow rounded p-4">
              <h2 className="text-lg font-bold text-gray-800 text-center mb-4">Trucks Under Maintenance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={drillData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Maintenance" stroke="#f44336" strokeWidth={2} />
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
