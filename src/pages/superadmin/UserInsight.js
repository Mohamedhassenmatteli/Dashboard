import React, { useEffect, useState } from "react";
import SuperAdminLayout from "../../layouts/superadmin";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import axios from "axios";

const COLORS = [
  '#4caf50', '#81c784', // greens for active
  '#f44336', '#e57373', // reds for inactive
  '#2196f3', '#64b5f6'  // blues for any additional slices
];

const KpiCard = ({ title, value }) =>
  React.createElement("div", { className: "bg-white shadow rounded p-4 text-center" }, [
    React.createElement("div", { className: "text-sm font-bold text-gray-800 mb-1", key: "title" }, title),
    React.createElement("div", { className: "text-2xl font-bold text-gray-800", key: "value" }, value)
  ]);

const Insight = () => {
  const [kpi, setKpi] = useState({
    messages: 0,
    activeUsers: 0,
    managers: 0,
    drivers: 0,
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [gouvData, setGouvData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [mustChangePercentage, setMustChangePercentage] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/superadmin/insights")
      .then((res) => {
        const {
          messages,
          activeUsers,
          managers,
          drivers,
          usersPerMonth,
          usersPerGouv,
          activeInactiveByRole,
          mustChangePassword
        } = res.data;

        setKpi({ messages, activeUsers, managers, drivers });
        setMonthlyData(usersPerMonth);
        setGouvData(usersPerGouv);

        const transformedPieData = activeInactiveByRole.flatMap(({ role, active, inactive }) => [
          { name: `${role} - Active`, value: Number(active) },
          { name: `${role} - Inactive`, value: Number(inactive) }
        ]);
        setPieData(transformedPieData);
        setMustChangePercentage(mustChangePassword);
      })
      .catch((err) => {
        console.error("Error fetching insight data:", err);
      });
  }, []);

  return React.createElement(
    SuperAdminLayout,
    null,
    React.createElement("div", { className: "bg-gray-100 min-h-screen p-6" }, [
      React.createElement("div", { className: "bg-white py-4 px-6 mb-6 rounded shadow", key: "header" },
        React.createElement("h1", { className: "text-center text-2xl font-bold text-gray-900" },
          "Driver & Manager Usage Insights"
        )
      ),
      React.createElement("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8",
        key: "kpiCards"
      }, [
        React.createElement(KpiCard, { title: "Total Messages", value: kpi.messages, key: "msg" }),
        React.createElement(KpiCard, { title: "Active Users", value: kpi.activeUsers, key: "active" }),
        React.createElement(KpiCard, { title: "Total Managers", value: kpi.managers, key: "managers" }),
        React.createElement(KpiCard, { title: "Total Drivers", value: kpi.drivers, key: "drivers" })
      ]),
      React.createElement("div", {
        className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
        key: "charts"
      }, [
        React.createElement("div", { className: "col-span-2 bg-white shadow rounded p-4", key: "lineChart" }, [
          React.createElement("h2", {
            key: "lineChartTitle",
            className: "text-lg font-bold text-gray-800 text-center mb-4"
          }, "Users Per Month"),
          React.createElement(ResponsiveContainer, { key: "lineChartContainer", width: "100%", height: 300 },
            React.createElement(LineChart, { data: monthlyData }, [
              React.createElement(Line, {
                key: "line-count",
                type: "monotone",
                dataKey: "count",
                stroke: "#3b82f6",
                strokeWidth: 2
              }),
              React.createElement(CartesianGrid, { key: "grid", strokeDasharray: "3 3" }),
              React.createElement(XAxis, { key: "x-axis", dataKey: "month" }),
              React.createElement(YAxis, { key: "y-axis", allowDecimals: false }),
              React.createElement(Tooltip, { key: "tooltip" })
            ])
          )
        ]),
        React.createElement("div", { className: "bg-white shadow rounded p-4", key: "barChart" }, [
          React.createElement("h2", {
            key: "barChartTitle",
            className: "text-lg font-bold text-gray-800 text-center mb-4"
          }, "Users by Governorate"),
          React.createElement(ResponsiveContainer, { key: "barChartContainer", width: "100%", height: 300 },
            React.createElement(BarChart, {
              layout: "vertical",
              data: gouvData,
              margin: { top: 20, right: 30, left: 20, bottom: 20 }
            }, [
              React.createElement(CartesianGrid, { key: "grid", strokeDasharray: "3 3" }),
              React.createElement(XAxis, { key: "x-axis", type: "number" }),
              React.createElement(YAxis, { key: "y-axis", dataKey: "country", type: "category" }),
              React.createElement(Tooltip, { key: "tooltip" }),
              React.createElement(Legend, { key: "legend" }),
              React.createElement(Bar, {
                key: "bar",
                dataKey: "total_count",
                fill: "#3182ce",
                name: "Count of users"
              })
            ])
          )
        ])
      ]),
      React.createElement("div", {
        className: "mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6",
        key: "pieAndKpi"
      }, [
        React.createElement("div", { className: "bg-white shadow rounded p-4 flex flex-col items-center", key: "pie" }, [
          React.createElement("h2", {
            key: "pieChartTitle",
            className: "text-lg font-bold text-gray-800 text-center mb-4"
          }, "Users Active vs Inactive by Role"),
          React.createElement(ResponsiveContainer, { key: "pieChartContainer", width: "100%", height: 300 },
            React.createElement(PieChart, { key: "pieChart" }, [
              React.createElement(Pie, {
                key: "pie-slices",
                data: pieData,
                dataKey: "value",
                nameKey: "name",
                cx: "50%",
                cy: "50%",
                outerRadius: 100,
                label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`
              }, pieData.map((entry, index) =>
                React.createElement(Cell, {
                  key: `cell-${index}`,
                  fill: COLORS[index % COLORS.length]
                })
              )),
              React.createElement(Tooltip, { key: "tooltip" }),
              React.createElement(Legend, { key: "legend", verticalAlign: "bottom", height: 36 })
            ])
          )
        ]),
        React.createElement("div", {
          className: "bg-white shadow rounded p-4 flex flex-col justify-center items-center",
          key: "mustChange"
        }, [
          React.createElement("h2", {
            key: "mustChangeTitle",
            className: "text-lg font-bold text-gray-800 text-center mb-4"
          }, "Users Must Change Password"),
          React.createElement("p", {
            key: "mustChangeValue",
            className: "text-5xl font-bold text-red-600"
          }, `${mustChangePercentage ?? 0}%`)
        ])
      ])
    ])
  );
};

export default Insight;
