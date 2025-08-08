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
  autre: "#2196f3",
  vacance: "#001f54",
  maladie: "#ff9800",
};
const Colors = {
  approved: "#2196f3",
  pending: "#001f54",
  rejected: "#ff9800",
};

function Leave() {
  const { managerId } = useParams();

  const [leaveKpi, setLeaveKpi] = useState({ TotalRequest: 0, Period: "" });
  const [driver, setDriver] = useState("");
  const [drillData, setDrillData] = useState([]);
  const [drillLevel, setDrillLevel] = useState("year");
  const [drillValue, setDrillValue] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    console.log("Fetching leave insight with:", { managerId, driver });
    axios
      .get("http://localhost:5000/api/leave/manager/insight", {
        params: { managerId, driver },
      })
      .then((res) => {
        console.log("Leave Insight response:", res.data);
        const { TotalRequest, Period, users } = res.data;
        setLeaveKpi({ TotalRequest, Period });
        setUsers(users);
      })
      .catch((err) => {
        console.error("Error fetching leave insight data:", err);
      });
  }, [managerId, driver]);

  useEffect(() => {
    console.log(
      "Fetching drill data with:",
      { managerId, level: drillLevel, value: drillValue, driver }
    );
    setDrillData([]);
    axios
      .get("http://localhost:5000/api/leave/manager/drill", {
        params: { managerId, level: drillLevel, value: drillValue, driver },
      })
      .then((res) => {
        console.log("Drill data response:", res.data);
        setDrillData(transformDrillData(res.data));
      })
      .catch((err) => {
        console.error("Error fetching drill data:", err);
      });
  }, [managerId, drillLevel, drillValue, driver]);

  const transformDrillData = (rows) => {
    const grouped = {};
    const status = {
      autre: "autre",
      vacance: "vacance",
      maladie: "maladie",
    };

    rows.forEach((row) => {
      let key = row.period;

      // Format period key if it's an object (year, month, day)
      if (typeof key === "object" && key !== null) {
        if ("day" in key) {
          // day-level period: format "YYYY-MM-DD"
          key = `${key.year}-${String(key.month).padStart(2, "0")}-${String(
            key.day
          ).padStart(2, "0")}`;
        } else if ("month" in key) {
          // month-level period: format "YYYY-MM"
          key = `${key.year}-${String(key.month).padStart(2, "0")}`;
        } else if ("year" in key) {
          // year-level period: format "YYYY"
          key = `${key.year}`;
        }
      }

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          autre: 0,
          vacance: 0,
          maladie: 0,
        };
      }
      const typeLabel = status[row.type];
      if (typeLabel && grouped[key]) {
        grouped[key][typeLabel] += parseInt(row.count_time_off, 10);
      }
    });

    return Object.values(grouped);
  };

  useEffect(() => {
    console.log("Fetching pie data with:", { managerId, driver });
    axios
      .get("http://localhost:5000/api/leave/manager/pie", {
        params: { managerId, driver },
      })
      .then((res) => {
        console.log("Pie data response:", res.data);
        const total = res.data.reduce(
          (sum, item) => sum + parseInt(item.count, 10),
          0
        );
        const formatted = res.data.map((item) => ({
          name: item.status,
          value: parseInt(item.count, 10),
          percent: ((item.count / total) * 100).toFixed(2),
        }));
        setPieData(formatted);
      })
      .catch((err) => {
        console.error("Error fetching pie data:", err);
        setPieData([]);
      });
  }, [managerId, driver]);

  function drillDown(period) {
    if (drillLevel === "year") {
      setDrillLevel("month");
      setDrillValue(period);
    } else if (drillLevel === "month") {
      setDrillLevel("day");
      setDrillValue(period);
    }
  }

  function drillUp() {
    if (drillLevel === "day" && drillValue) {
      setDrillLevel("month");
      setDrillValue(drillValue.substring(0, 7)); // e.g. "2025-08"
    } else if (drillLevel === "month" && drillValue) {
      setDrillLevel("year");
      setDrillValue(null);
    }
  }

  function handleChange(e) {
    const selectedId = e.target.value;
    console.log("Selected driver ID:", selectedId);
    setSelectedUserId(selectedId);
    const selectedUser = users.find((u) => u._id === selectedId);
    if (selectedUser) {
      console.log("Selected driver:", selectedUser);
      setDriver(selectedUser.FirstName); // or firstname depending on your backend
    } else {
      setDriver("");
    }
  }

  const KpiCard = ({ title, value }) => (
    <div className="bg-white shadow rounded p-4 text-center w-full h-full flex flex-col justify-center">
      <div className="text-lg font-bold text-gray-800 mb-2">{title}</div>
      <div className="text-2xl font-bold text-gray-700">{value}</div>
    </div>
  );

  return (
    <>
      <div className="bg-white py-4 px-6 mb-6 rounded shadow">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Leave Dashboard
        </h1>
      </div>

      <div className="flex flex-col items-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6 w-full max-w-4xl">
          <KpiCard title="Total Leave Requests" value={leaveKpi.TotalRequest} />
          <KpiCard title="Period" value={leaveKpi.Period} />
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-6 items-start px-4">
          <div className="bg-white shadow rounded p-4 w-64">
            <label
              htmlFor="slicer"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filter by Option
            </label>
            <select
              value={selectedUserId}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              id="slicer"
            >
              <option value="">-- Select Driver --</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.FirstName} {user.LastName}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-2/4 bg-white shadow rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-gray-800 text-center w-full">
                Leave Requests Over Time
              </h2>
              <button
                onClick={drillUp}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-full shadow hover:shadow-lg transition duration-200"
                type="button"
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
              <LineChart
                data={drillData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                onClick={(e) => {
                  if (e && e.activeLabel) {
                    drillDown(e.activeLabel);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                {Object.entries(statusColors).map(([status, color]) => (
                  <Line
                    type="monotone"
                    key={status}
                    dataKey={status}
                    stroke={color}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 min-w-[250px] max-w-sm bg-white shadow rounded p-4 flex flex-col overflow-hidden">
            <h2 className="text-lg font-bold text-gray-800 text-center w-full">
              Requests by Type
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ percent }) => `${percent}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Colors[entry.name] || "#ccc"}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value, name, props) => [
                    `${value} (${props.payload.percent}%)`,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: Colors[value] || "#555" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

export default Leave;
