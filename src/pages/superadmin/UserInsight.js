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
  <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
      {title}
    </div>
    <div className="text-3xl font-bold text-gray-900">{value}</div>
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
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-6 px-6 mb-6 rounded-lg shadow-md">
          <h1 className="text-center text-3xl font-bold text-white">
            Driver & Manager Usage Insights
          </h1>
          <p className="text-center text-blue-100 mt-2">
            Overview of platform activity and user statistics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard title="Total Messages" value={kpi.messages} />
          <KpiCard title="Active Users" value={kpi.activeUsers} />
          <KpiCard title="Total Managers" value={kpi.managers} />
          <KpiCard title="Total Drivers" value={kpi.drivers} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Users Per Month
              </h2>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">User Growth</span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    allowDecimals={false} 
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
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Users by Governorate
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={gouvData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    type="number" 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    dataKey="country" 
                    type="category" 
                    tick={{ fill: '#6b7280' }}
                    tickLine={{ stroke: '#e5e7eb' }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="total_count" 
                    fill="#3182ce" 
                    name="Count of users"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Users Active vs Inactive by Role
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Users Must Change Password
            </h2>
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-red-500"
                  strokeWidth="8"
                  strokeDasharray={`${mustChangePercentage ?? 0 * 2.51}, 251`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-gray-800">
                  {mustChangePercentage ?? 0}%
                </span>
                <span className="text-sm text-gray-500">of users</span>
              </div>
            </div>
            <p className="mt-4 text-gray-600 text-center">
              Percentage of users who need to update their passwords for security reasons.
            </p>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default Insight;