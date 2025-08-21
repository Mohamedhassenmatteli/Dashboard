import React, { useEffect, useState } from "react";
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

// Smaller Heroicons SVG icons
const icons = {
  messages: (
    <svg
      className="w-6 h-6 text-blue-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
    </svg>
  ),
  activeUsers: (
    <svg
      className="w-6 h-6 text-green-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),
  managers: (
    <svg
      className="w-6 h-6 text-purple-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  drivers: (
    <svg
      className="w-6 h-6 text-yellow-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h18M3 16h18M6 8h12" />
    </svg>
  ),
};

const KpiCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center space-x-3">
    <div>{icon}</div>
    <div>
      <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">
        {title}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
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
  const [mustChangePercentage, setMustChangePercentage] = useState(0);

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
        setMustChangePercentage(mustChangePassword ?? 0);
      })
      .catch((err) => {
        console.error("Error fetching insight data:", err);
      });
  }, []);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (mustChangePercentage / 100) * circumference;

  return (
    <>
      <div className="bg-gray-50 h-screen flex flex-col p-4 overflow-hidden">
       {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-2 px-4 mb-4 rounded-lg shadow-md flex-shrink-0">
            <h1 className="text-center text-xl font-semibold text-white">
              Driver & Manager Usage Insights
            </h1>
            <p className="text-center text-blue-200 mt-1 text-xs">
              Overview of platform activity and user statistics
            </p>
          </div>


        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 flex-shrink-0">
          <KpiCard title="Total Messages" value={kpi.messages} icon={icons.messages} />
          <KpiCard title="Active Users" value={kpi.activeUsers} icon={icons.activeUsers} />
          <KpiCard title="Total Managers" value={kpi.managers} icon={icons.managers} />
          <KpiCard title="Total Drivers" value={kpi.drivers} icon={icons.drivers} />
        </div>

        {/* Scrollable charts container */}
        <div className="flex-grow overflow-auto space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[220px]">
            {/* Line chart, smaller height */}
            <div className="col-span-1 lg:col-span-2 bg-white rounded-lg shadow-md p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Users Per Month
                </h2>
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600">User Growth</span>
                </div>
              </div>
             <div className="flex-grow min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="5 5" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickLine={{ stroke: "#e5e7eb" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickLine={{ stroke: "#e5e7eb" }}
                      axisLine={{ stroke: "#e5e7eb" }}
                      width={40}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div
                              style={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                padding: "8px 12px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                fontSize: 12,
                                color: "#333",
                              }}
                            >
                              <strong>{label}</strong>
                              <div>{`Count: ${payload[0].value}`}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: "#2563eb", strokeWidth: 2, fill: "#3b82f6" }}
                      activeDot={{ r: 6 }}
                      animationDuration={700}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Users by Governorate */}
            <div className="bg-white rounded-lg shadow-md p-4 flex flex-col min-h-[220px]">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                Users by Governorate
              </h2>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={gouvData}
                    margin={{ top: 15, right: 20, left: 15, bottom: 15 }}
                  >
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="5 5" />
                    <XAxis
                      type="number"
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      minTickGap={10}
                    />
                    <YAxis
                      dataKey="country"
                      type="category"
                      tick={{ fill: "#6b7280", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        fontSize: 12,
                        color: "#333",
                        padding: "8px 12px",
                      }}
                    />
                    <Bar
                      dataKey="total_count"
                      fill="#3182ce"
                      name="Count of users"
                      radius={[4, 4, 4, 4]}
                      barSize={18}
                      animationDuration={700}
                      background={{ fill: "#e6f0fa" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pie chart card */}
      <div
        className="bg-white rounded-lg shadow-md p-3 flex flex-col"
        style={{ height: 280, minWidth: 0 /* prevents flexbox shrinking issues */ }}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
          Users Active vs Inactive by Role
        </h2>


        <div style={{ height: 220, minWidth: 0, flexGrow: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={50}
            innerRadius={35}
            label={({ percent }) => ` ${(percent * 100).toFixed(1)}%`}
            labelLine={true}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            height={40}
            wrapperStyle={{
              paddingTop: "6px",
              fontSize: "0.75rem",
              whiteSpace: "nowrap", // Force horizontal layout
              overflowX: "auto", // Enable horizontal scroll
              display: "block",
            }}
            formatter={(value) => (
              <span style={{ whiteSpace: "nowrap" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
        </div>
      </div>

        {/* Must Change Password card */}
        <div className="bg-white rounded-lg shadow-md p-3 flex flex-col items-center justify-center" style={{ height: 280 }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
            Users Must Change Password
          </h2>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                className="text-gray-200"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="50"
                cy="50"
              />
              <circle
                className="text-red-500"
                strokeWidth="8"
                strokeDasharray={`${progress}, ${circumference}`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="50"
                cy="50"
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-gray-800">
                {mustChangePercentage}%
              </span>
              <span className="text-xs text-gray-500">of users</span>
            </div>
          </div>
          <p className="mt-3 text-gray-600 text-center px-3 text-sm">
            Percentage of users who need to update their passwords for security reasons.
          </p>
        </div>
      </div>
              </div>
            </div>
    </>
  );
};

export default Insight;
