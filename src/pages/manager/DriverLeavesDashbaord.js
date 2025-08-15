import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  Line,
  Pie,
  Cell,
  XAxis,
  YAxis,
  LineChart,
  PieChart,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useParams } from "react-router-dom";


const statusColors = {
  autre: "#6366F1",
  vacance: "#10B981",
  maladie: "#F59E0B",
};
const statusLabels = {
  autre: "Other",
  vacance: "Vacation",
  maladie: "Sickness",
};
const requestStatusColors = {
  approved: "#10B981",
  pending: "#F59E0B",
  rejected: "#EF4444",
};
const requestStatusLabels = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

const Leave = () => {
  const { managerId } = useParams();

  const [leaveKpi, setLeaveKpi] = useState({ TotalRequest: 0, Period: "" });
  const [driver, setDriver] = useState("");
  const [drillData, setDrillData] = useState([]);
  const [drillLevel, setDrillLevel] = useState("year");
  const [drillValue, setDrillValue] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leave/manager/insight", {
        params: { managerId, driver },
      });
      const { TotalRequest, Period, users } = res.data;
      setLeaveKpi({ TotalRequest, Period });
      setUsers(users);
    } catch (err) {
      console.error("Error fetching leave insight data:", err);
    }
  };

  const fetchDrillData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leave/manager/drill", {
        params: { managerId, level: drillLevel, value: drillValue, driver },
      });
      setDrillData(transformDrillData(res.data));
    } catch (err) {
      console.error("Error fetching drill data:", err);
    }
  };

  const fetchPieData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leave/manager/pie", {
        params: { managerId, driver },
      });
      const total = res.data.reduce((sum, item) => sum + parseInt(item.count), 0);
      const formatted = res.data.map((item) => ({
        name: item.status,
        value: parseInt(item.count),
        percent: total > 0 ? ((item.count / total) * 100).toFixed(2) : 0,
      }));
      setPieData(formatted);
    } catch (err) {
      console.error("Error fetching pie data:", err);
      setPieData([]);
    }
  };

  useEffect(() => {
    fetchInsights();
    fetchDrillData();
    fetchPieData();
  }, [managerId, driver, drillLevel, drillValue]);

  const transformDrillData = (rows) => {
    const grouped = {};
    const status = {
      autre: "autre",
      vacance: "vacance",
      maladie: "maladie",
    };

    rows.forEach((row) => {
      let key = row.period;
      if (typeof key === "object" && key !== null) {
        if ("day" in key) {
          key = `${key.year}-${String(key.month).padStart(2, "0")}-${String(key.day).padStart(2, "0")}`;
        } else if ("month" in key) {
          key = `${key.year}-${String(key.month).padStart(2, "0")}`;
        } else if ("year" in key) {
          key = `${key.year}`;
        }
      }
      if (!grouped[key]) {
        grouped[key] = { period: key, autre: 0, vacance: 0, maladie: 0 };
      }
      const typeLabel = status[row.type];
      if (typeLabel && grouped[key]) {
        grouped[key][typeLabel] += parseInt(row.count_time_off);
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
    } else if (drillLevel === "month") {
      setDrillLevel("year");
      setDrillValue(null);
    }
  };

  const formatDrillLabel = () => {
    if (drillLevel === "year") return "Yearly";
    if (drillLevel === "month") return "Monthly";
    return "Daily";
  };

  const handleChange = (e) => {
    const selectedId = e.target.value;
    setSelectedUserId(selectedId);
    const selectedUser = users.find((u) => u._id === selectedId);
    if (selectedUser) setDriver(selectedUser.FirstName);
    else setDriver("");
  };

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 sm:p-4 shadow-lg rounded-lg border border-gray-200 text-xs sm:text-sm">
          <p className="font-bold text-gray-800">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry, index) => (
              <div key={`tooltip-item-${index}`} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 font-medium">
                  {statusLabels[entry.dataKey] || entry.dataKey}:{" "}
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
    const KpiCard = ({ title, value, icon }) => (
      <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer text-xs sm:text-sm">
        <div>{icon}</div>
        <div>
          <div className="text-xs font-medium text-gray-500">{title}</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    );
  return (
    <div>
              {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-2 px-3 mb-3 rounded-lg shadow-md flex-shrink-0">
          <h1 className="text-center text-lg sm:text-xl font-semibold text-white">Leave Dashboard</h1>
          <p className="text-center text-blue-200 mt-1 text-xs sm:text-sm">
            Track and analyze leave requests and approvals
          </p>
        </div>

        {/* Grid for slicer + KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4 px-3 sm:px-6">
        {/* Driver slicer */}
        <div className="sm:col-span-2 bg-white rounded-xl shadow-md p-3 border border-gray-100">
          <label
            htmlFor="slicer"
            className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
          >
            Filter by Driver
          </label>
          <select
            value={selectedUserId}
            onChange={handleChange}
            id="slicer"
            className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-xs sm:text-sm"
          >
            <option value="">All Drivers</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.FirstName} {user.LastName}
              </option>
            ))}
          </select>
        </div>

        {/* KPI cards */}
        <KpiCard
          title="Total Requests"
          value={leaveKpi.TotalRequest}
          icon={
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KpiCard
          title="Period"
          value={leaveKpi.Period}
          icon={
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KpiCard
          title="Avg. Requests"
          value={users.length > 0 ? (leaveKpi.TotalRequest / users.length).toFixed(1) : "N/A"}
          icon={
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 px-3 sm:px-6">
          {/* Leave Requests Over Time Line Chart */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-0">
                Leave Requests Over Time
              </h2>
              <div className="flex items-center space-x-2 text-xs sm:text-sm">
                <span className="font-medium text-gray-500">{formatDrillLabel()} View</span>
                <button
                  onClick={drillUp}
                  disabled={drillLevel === "year"}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition duration-200 ${
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
             <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
                <LineChart
                  data={drillData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  onClick={(e) => {
                    if (e && e.activeLabel) {
                      drillDown(e.activeLabel);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: "#6B7280", fontSize: isMobile ? 10 : 12 }}
                    tickMargin={8}
                  />
                  <YAxis tick={{ fill: "#6B7280", fontSize: isMobile ? 10 : 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => statusLabels[value] || value}
                    wrapperStyle={{ paddingTop: 10, fontSize: isMobile ? 10 : 14 }}
                    verticalAlign="top"
                    height={30}
                  />
                  {Object.entries(statusColors).map(([status, color]) => (
                    <Line
                      key={status}
                      type="monotone"
                      dataKey={status}
                      stroke={color}
                      strokeWidth={2}
                      activeDot={{ r: isMobile ? 3 : 6 }}
                      name={statusLabels[status]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
          </div>

          {/* Request Status Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Request Status Distribution</h2>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 70 : 100}
                    innerRadius={isMobile ? 30 : 60}
                    fill="#8884d8"
                    label={(props) => {
                      if (!isMobile) {
                        const { percent } = props;
                        return `${(percent)}%`;
                      } else {
                        const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) / 2;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="#fff"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={10}
                          >
                            {`${(percent)}%`}
                          </text>
                        );
                      }
                    }}
                    labelLine={!isMobile}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={requestStatusColors[entry.name] || "#ccc"}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name, props) => [
                      `${value} (${(props.payload.percent)}%)`,
                      requestStatusLabels[name] || name,
                    ]}
                  />
                  <Legend
                    layout={isMobile ? "horizontal" : "vertical"}
                    verticalAlign={isMobile ? "bottom" : "middle"}
                    align={isMobile ? "center" : "right"}
                    wrapperStyle={{
                      paddingTop: 10,
                      maxWidth: "100%",
                      overflowX: "auto",
                      whiteSpace: isMobile ? "nowrap" : "normal",
                      fontSize: isMobile ? 12 : 14,
                    }}
                    formatter={(value) => requestStatusLabels[value] || value}
                  />
                </PieChart>
              </ResponsiveContainer>
          </div>
      </div>
      </div>
    );
};

export default Leave;
