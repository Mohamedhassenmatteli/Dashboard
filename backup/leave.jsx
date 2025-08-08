import axios from "axios";
import SuperAdminLayout from "../../layouts/SuperAdminLayout";
import { useEffect, useState } from "react";
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
  Legend
} from "recharts";
const statusColors = {
    autre: "#2196f3",
    vacance: "#001f54",
    maladie: "#ff9800",
}
const Colors = {
    approved: "#2196f3",
    pending: "#001f54",
    rejected: "#ff9800",
}
const Leave = () =>{
        const [leaveKpi , setleavekpi] = useState({
            TotalRequest : 0 ,
            Period : ""
        });
        const [driver, setDriver] = useState("");
        const [drillData, setDrillData] = useState([]);
        const [drillLevel, setDrillLevel] = useState("year");
        const [drillValue, setDrillValue] = useState(null);
        const [piedata,setPieData] = useState([]);
        const [users,setUsers] = useState([]);
        const [selectedUserId, setSelectedUserId] = useState('');
    useEffect(()=>{
    axios.get("http://localhost:5000/api/leave/insight",{
            params: { driver }
        })
        .then((res) => {
            const {
            TotalRequest,
            Period,
            users
        
            } = res.data;
            setleavekpi({TotalRequest,Period});
            setUsers(users)
        })
        .catch((err) => {
            console.error("Error fetching fleet insight data:", err);
        });
    }, [driver]);
     useEffect(() => {
    setDrillData([]);
        // Drilldown chart data
        axios
            .get("http://localhost:5000/api/leave/drill", {
                params: { level: drillLevel, value: drillValue,driver },
            })
            .then((res) => {
            setDrillData(transformDrillData(res.data));
            });
        }, [drillLevel, drillValue,driver ]);
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
        const total = res.data.reduce((sum, item) => sum + parseInt(item.count), 0);
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
            // From day → month, 
            setDrillLevel("month");
            setDrillValue(drillValue.substring(0, 4)); // foramt "YYYY" 
        } else if (drillLevel === "month" && drillValue) {
            // From month → year
            setDrillLevel("year");
            setDrillValue(null);
        }
        };
         function handleChange(e) {
        const selectedId = e.target.value;
        setSelectedUserId(selectedId);
        const selectedUser = users.find(u => u._id === selectedId);
        if (selectedUser) {
            setDriver(selectedUser.firstname);
        } else {
            setDriver("");
        }
        }
    return(
        <SuperAdminLayout>
                <div className="bg-white py-4 px-6 mb-6 rounded shadow">
                <h1 className="text-center text-2xl font-bold text-gray-900">
                    Leave Dashboard
                </h1>
                </div>
                <div className="flex flex-col items-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6 w-full max-w-4xl">
                        <KpiCard title="Total Leave Requests" value={leaveKpi.TotalRequest} />
                        <KpiCard title="Period " value={leaveKpi.Period} />
                    </div>
                    <div className="w-full flex flex-col lg:flex-row gap-6 items-start px-4">
                        <div className="bg-white shadow rounded p-4 w-64">
                            <label htmlFor="slicer" className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Option
                            </label>
                                <select value={selectedUserId} onChange={handleChange} className="border rounded p-2">
                                <option value="">-- Select Driver --</option>
                                    {users.map(user => (
                                    <option key={user._id} value={user._id}>
                                    {user.firstname} {user.last_name}
                                </option>
                                ))}
                                </select>
                        </div>
                        <div className="w-full lg:w-2/4 bg-white shadow rounded p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-lg font-bold text-gray-800 text-center w-full">Leave Requests Over Time</h2>
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
                                <LineChart data={drillData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={(e) => {
                                                          if (e && e.activeLabel) {
                                                            drillDown(e.activeLabel);
                                                            
                                                          }
                                                        }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period"/>
                                    <YAxis />
                                    <RechartsTooltip />
                                    <Legend />
                                    {Object.entries(statusColors).map(([status, color]) => (
                                                          <Line type="linear" key={status} dataKey={status} stackId="a" stroke={color}  strokeWidth={2}  activeDot={{ r: 6 }}  />
                                                        ))}
                                </LineChart>
                                </ResponsiveContainer>
                        </div>
                        <div className="flex-1 min-w-[250px] max-w-sm bg-white shadow rounded p-4 flex flex-col overflow-hidden">
                            <h2 className="text-lg font-bold text-gray-800 text-center w-full">Requests by Type</h2>
                            <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data = {piedata} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                                                    {piedata.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={Colors[entry.name] || "#ccc"} />
                                ))}
                                </Pie>
                                <RechartsTooltip
                                                                        formatter={(value, name, props) => [
                                    `${value} (${props.payload.percent}%)`,
                                    name,
                                ]} />
                                <Legend
                                             
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value, entry) => (
                                    <span style={{ color: Colors[value] || "#555" }}>{value}</span>
                                    )}
                                />
                            </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
        </SuperAdminLayout>
    );
}
const KpiCard = ({title , value}) =>(
    <div className="bg-white shadow rounded p-4 text-center w-full h-full flex flex-col justify-center">
        <div className="text-lg font-bold text-gray-800 mb-2">{title}</div>
        <div className="text-2xl font-bold text-dark-600">{value}</div>
    </div>
);
export default Leave;