import React, { useEffect, useState } from "react";
import axios from "axios";
import SuperAdminLayout from "../../layouts/superadmin";
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

const Leave = () => {
  const [leaveKpi, setLeaveKpi] = useState({
    TotalRequest: 0,
    Period: "",
  });
  const [driver, setDriver] = useState("");
  const [drillData, setDrillData] = useState([]);
  const [drillLevel, setDrillLevel] = useState("year");
  const [drillValue, setDrillValue] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/leave/insight", {
        params: { driver },
      })
      .then((res) => {
        const { TotalRequest, Period, users } = res.data;
        setLeaveKpi({ TotalRequest, Period });
        setUsers(users);
      })
      .catch((err) => {
        console.error("Error fetching fleet insight data:", err);
      });
  }, [driver]);

  useEffect(() => {
    setDrillData([]);
    axios
      .get("http://localhost:5000/api/leave/drill", {
        params: { level: drillLevel, value: drillValue, driver },
      })
      .then((res) => {
        setDrillData(transformDrillData(res.data));
      });
  }, [drillLevel, drillValue, driver]);

  const transformDrillData = (rows) => {
    const grouped = {};
    const status = {
      autre: "autre",
      vacance: "vacance",
      maladie: "maladie",
    };

    rows.forEach((row) => {
      const key = row.period;
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
        grouped[key][typeLabel] += parseInt(row.count_time_off);
      }
    });

    return Object.values(grouped);
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/leave/pie", {
        params: { driver },
      })
      .then((res) => {
        const total = res.data.reduce(
          (sum, item) => sum + parseInt(item.count),
          0
        );
        const formatted = res.data.map((item) => ({
          name: item.status,
          value: parseInt(item.count),
          percent: ((item.count / total) * 100).toFixed(2),
        }));
        setPieData(formatted);
      })
      .catch((err) => {
        console.error("Error fetching pie data:", err);
        setPieData([]);
      });
  }, [driver]);

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
      setDrillValue(drillValue.substring(0, 4));
    } else if (drillLevel === "month" && drillValue) {
      setDrillLevel("year");
      setDrillValue(null);
    }
  };

  function handleChange(e) {
    const selectedId = e.target.value;
    setSelectedUserId(selectedId);
    const selectedUser = users.find((u) => u._id === selectedId);
    if (selectedUser) {
      setDriver(selectedUser.firstname);
    } else {
      setDriver("");
    }
  }

  return React.createElement(
    SuperAdminLayout,
    null,
    React.createElement(
      "div",
      { className: "bg-white py-4 px-6 mb-6 rounded shadow" },
      React.createElement(
        "h1",
        { className: "text-center text-2xl font-bold text-gray-900" },
        "Leave Dashboard"
      )
    ),
    React.createElement(
      "div",
      { className: "flex flex-col items-center" },
      React.createElement(
        "div",
        {
          className:
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6 w-full max-w-4xl",
        },
        React.createElement(KpiCard, {
          title: "Total Leave Requests",
          value: leaveKpi.TotalRequest,
          key: "kpi-total",
        }),
        React.createElement(KpiCard, {
          title: "Period ",
          value: leaveKpi.Period,
          key: "kpi-period",
        })
      ),
      React.createElement(
        "div",
        { className: "w-full flex flex-col lg:flex-row gap-6 items-start px-4" },
        React.createElement(
          "div",
          { className: "bg-white shadow rounded p-4 w-64" },
          React.createElement(
            "label",
            {
              htmlFor: "slicer",
              className: "block text-sm font-medium text-gray-700 mb-2",
            },
            "Filter by Option"
          ),
          React.createElement(
            "select",
            {
              value: selectedUserId,
              onChange: handleChange,
              className: "border rounded p-2",
            },
            React.createElement(
              "option",
              { value: "" },
              "-- Select Driver --"
            ),
            users.map((user) =>
              React.createElement(
                "option",
                { key: user._id, value: user._id },
                user.firstname + " " + user.last_name
              )
            )
          )
        ),
        React.createElement(
          "div",
          { className: "w-full lg:w-2/4 bg-white shadow rounded p-4" },
          React.createElement(
            "div",
            { className: "flex justify-between items-center mb-2" },
            React.createElement(
              "h2",
              {
                className:
                  "text-lg font-bold text-gray-800 text-center w-full",
              },
              "Leave Requests Over Time"
            ),
            React.createElement(
              "button",
              {
                onClick: drillUp,
                className:
                  "flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-full shadow hover:shadow-lg transition duration-200",
              },
              React.createElement(
                "svg",
                {
                  xmlns: "http://www.w3.org/2000/svg",
                  className: "h-5 w-5",
                  fill: "none",
                  viewBox: "0 0 24 24",
                  stroke: "currentColor",
                },
                React.createElement("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M5 15l7-7 7 7",
                })
              ),
              "Drill Up"
            )
          ),
          React.createElement(
            ResponsiveContainer,
            { width: "100%", height: 300 },
            React.createElement(
              LineChart,
              {
                data: drillData,
                margin: { top: 20, right: 30, left: 20, bottom: 5 },
                onClick: (e) => {
                  if (e && e.activeLabel) {
                    drillDown(e.activeLabel);
                  }
                },
              },
              React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
              React.createElement(XAxis, { dataKey: "period" }),
              React.createElement(YAxis, null),
              React.createElement(RechartsTooltip, null),
              React.createElement(Legend, null),
              Object.entries(statusColors).map(([status, color]) =>
                React.createElement(Line, {
                  type: "linear",
                  key: status,
                  dataKey: status,
                  stackId: "a",
                  stroke: color,
                  strokeWidth: 2,
                  activeDot: { r: 6 },
                })
              )
            )
          )
        ),
        React.createElement(
          "div",
          {
            className:
              "flex-1 min-w-[250px] max-w-sm bg-white shadow rounded p-4 flex flex-col overflow-hidden",
          },
          React.createElement(
            "h2",
            { className: "text-lg font-bold text-gray-800 text-center w-full" },
            "Requests by Type"
          ),
          React.createElement(
            ResponsiveContainer,
            { width: "100%", height: 300 },
            React.createElement(
              PieChart,
              null,
              React.createElement(Pie, {
                data: pieData,
                dataKey: "value",
                nameKey: "name",
                cx: "50%",
                cy: "50%",
                outerRadius: 80,
                fill: "#8884d8",
                label: ({ percent }) => `${percent}%`, 
                children: pieData.map((entry, index) =>
                  React.createElement(Cell, {
                    key: `cell-${index}`,
                    fill: Colors[entry.name] || "#ccc",
                  })
                ),
              }),
              React.createElement(RechartsTooltip, {
                formatter: (value, name, props) => [
                  `${value} (${props.payload.percent}%)`,
                  name,
                ],
              }),
              React.createElement(Legend, {
                verticalAlign: "bottom",
                height: 36,
                formatter: (value) =>
                  React.createElement(
                    "span",
                    { style: { color: Colors[value] || "#555" } },
                    value
                  ),
              })
            )
          )
        )
      )
    )
  );
};

const KpiCard = ({ title, value }) =>
  React.createElement(
    "div",
    {
      className:
        "bg-white shadow rounded p-4 text-center w-full h-full flex flex-col justify-center",
    },
    React.createElement("div", { className: "text-lg font-bold text-gray-800 mb-2" }, title),
    React.createElement("div", { className: "text-2xl font-bold text-dark-600" }, value)
  );

export default Leave;
