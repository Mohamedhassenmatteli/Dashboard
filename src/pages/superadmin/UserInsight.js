import React, { useEffect, useState } from "react";
import SuperAdminLayout from "../../layouts/superadmin";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axios from "axios";

const COLORS = [
  "#4caf50",
  "#81c784", // greens for active
  "#f44336",
  "#e57373", // reds for inactive
  "#2196f3",
  "#64b5f6", // blues for additional slices
];

const KpiCard = ({ title, value }) => (
  <div className="bg-white shadow rounded p-4 text-center">
    <div className="text-sm font-bold text-gray-800 mb-1">{title}</div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
  </div>
);

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
    axios
      .get("http://localhost:5000/api/superadmin/insights")
      .then(({ data }) => {
        const {
          messages,
          activeUsers,
          managers,
          drivers,
          usersPerMonth,
          usersPerCountry,
          activeInactiveByRole,
          mustChangePassword,
        } = data;

        setKpi({ messages, activeUsers, managers, drivers });
        setMonthlyData(usersPerMonth);
        setGouvData(usersPerCountry);

        const transformedPieData = activeInactiveByRole.flatMap(
          ({ role, active, inactive }) => [
            { name: `${role} - Active`, value: Number(active) },
            { name: `${role} - Inactive`, value: Number(inactive) },
          ]
        );
        setPieData(transformedPieData);
        setMustChangePercentage(mustChangePassword);
      })
      .catch((err) => {
        console.error("Error fetching insight data:", err);
      });
  }, []);

  return (
    <SuperAdminLayout>
      <div className="bg-gray-100 min-h-screen p-6">
        <div className="bg-white py-4 px-6 mb-6 rounded shadow">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Driver & Manager Usage Insights
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard title="Total Messages" value={kpi.messages} />
          <KpiCard title="Active Users" value={kpi.activeUsers} />
          <KpiCard title="Total Managers" value={kpi.managers} />
          <KpiCard title="Total Drivers" value={kpi.drivers} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 bg-white shadow rounded p-4">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-4">
              Users Per Month
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-4">
              Users by Governorate
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={gouvData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="country" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_count" fill="#3182ce" name="Count of users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded p-4 flex flex-col items-center">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-4">
              Users Active vs Inactive by Role
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow rounded p-4 flex flex-col justify-center items-center">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-4">
              Users Must Change Password
            </h2>
            <p className="text-5xl font-bold text-red-600">
              {mustChangePercentage ?? 0}%
            </p>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Insight;
