import React, { useEffect, useState } from "react";
import axios from "axios";
import SuperAdminLayout from "../../layouts/superadmin";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LeafletTooltip,
} from "react-leaflet";

const statusColors = {
  canceled: "#2196f3",
  completed: "#001f54",
  delayed: "#ff9800",
  in_progress: "#800080",
  pending: "#e91e63",
};
const cityCoordinates = {
  Tunis: [36.8065, 10.1815],
  Sfax: [34.7406, 10.7603],
  Sousse: [35.8256, 10.6084],
  Kairouan: [35.6781, 10.0963],
  Gabès: [33.8818, 10.0982],
  Gafsa: [34.425, 8.7842],
  Nabeul: [36.451, 10.7352],
  Monastir: [35.7771, 10.8262],
  Bizerte: [37.2744, 9.8739],
  Ariana: [36.8665, 10.1647],
  Ben_Arous: [36.7547, 10.2189],
  Manouba: [36.808, 10.097],
  Beja: [36.7333, 9.1833],
  Jendouba: [36.5011, 8.7802],
  Kasserine: [35.1676, 8.8365],
  Kef: [36.1829, 8.7144],
  Mahdia: [35.5047, 11.0622],
  Medenine: [33.354, 10.5055],
  Siliana: [36.0833, 9.3833],
  Sidi_Bouzid: [35.0382, 9.4858],
  Zaghouan: [36.4022, 10.1426],
  Tozeur: [33.9197, 8.1335],
  Kebili: [33.7044, 8.969],
};

const Delivery = () => {
  const [tripsKpi, setTripsKpi] = useState({ TotalTrips: 0 });
  const [canceledtrips, setCanceledTrips] = useState(null);
  const [delayedtrips, setDelayedTrips] = useState(null);
  const [drillData, setDrillData] = useState([]);
  const [drillLevel, setDrillLevel] = useState("year");
  const [drillValue, setDrillValue] = useState(null);
  const [destination, setDestination] = useState("");
  const [mapData, setMapData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/delivery/insights", {
        params: { destination },
      })
      .then((res) => {
        const { Delayed, Canceled, TotalTrips } = res.data;
        setTripsKpi({ TotalTrips });
        setCanceledTrips(Canceled);
        setDelayedTrips(Delayed);
      })
      .catch((err) => {
        console.error("Error fetching fleet insight data:", err);
      });
  }, [destination]);

  useEffect(() => {
    setDrillData([]);
    axios
      .get("http://localhost:5000/api/delivery/drill", {
        params: { level: drillLevel, value: drillValue, destination },
      })
      .then((res) => {
        setDrillData(transformDrillData(res.data));
      });
  }, [drillLevel, drillValue, destination]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/delivery/map-data", {
        params: { destination },
      })
      .then((res) => {
        setMapData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching map data:", err);
      });
  }, [destination]);

  const transformDrillData = (rows) => {
    const grouped = {};
    const statusMap = {
      completed: "completed",
      pending: "pending",
      in_progress: "in_progress",
      delayed: "delayed",
      canceled: "canceled",
    };

    rows.forEach((row) => {
      const key = row.period;
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          completed: 0,
          in_progress: 0,
          delayed: 0,
          canceled: 0,
        };
      }

      const statusLabel = statusMap[row.status_trip];
      if (statusLabel && grouped[key]) {
        grouped[key][statusLabel] = parseInt(row.count_trips);
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
    } else if (drillLevel === "month" && drillValue) {
      setDrillLevel("year");
      setDrillValue(null);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="bg-white py-4 px-6 mb-6 rounded shadow">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Delivery Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-4">
          <div className="bg-white shadow rounded p-4">
            <label
              htmlFor="destinationFilter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filter by Destination
            </label>
            <select
              id="destinationFilter"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">All</option>
              <option value="Tunis">Tunis</option>
              <option value="Sfax">Sfax</option>
              <option value="Sousse">Sousse</option>
              <option value="Kebili">Kebili</option>
              <option value="Jendouba">Jendouba</option>
              <option value="Kasserine">Kasserine</option>
              <option value="Zaghouan">Zaghouan</option>
              <option value="Manouba">Manouba</option>
              <option value="Medenine">Medenine</option>
              <option value="Mahdia">Mahdia</option>
              <option value="Gabès">Gabès</option>
              <option value="Gafsa">Gafsa</option>
              <option value="Beja">Beja</option>
              <option value="Kairouan">Kairouan</option>
              <option value="Kef">Kef</option>
              <option value="Monastir">Monastir</option>
              <option value="Nabeul">Nabeul</option>
              <option value="Tozeur">Tozeur</option>
              <option value="Siliana">Siliana</option>
              <option value="Sidi_Bouzid">Sidi Bouzid</option>
              <option value="Bizerte">Bizerte</option>
              <option value="Ben_Arous">Ben Arous</option>
              <option value="Ariana">Ariana</option>
            </select>
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded p-4 text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delayed %</h2>
            <p className="text-2xl font-bold text-dark-600">
              {delayedtrips ?? 0}%
            </p>
          </div>
          <div className="bg-white shadow rounded p-4 text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Canceled %</h2>
            <p className="text-2xl font-bold text-dark-600">
              {canceledtrips ?? 0}%
            </p>
          </div>
          <KpiCard title="Total Trips" value={tripsKpi.TotalTrips} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Count of Trips by Time</h2>
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

          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={drillData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.entries(statusColors).map(([status, color]) => (
                <Bar
                  key={status}
                  dataKey={status}
                  stackId="a"
                  fill={color}
                  onClick={(data) => {
                    if (data && data.payload?.period) {
                      drillDown(data.payload.period);
                    }
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-bold mb-2 text-center">
            Destination Status Trip
          </h2>
          <MapContainer
            center={[36.8, 10.1]}
            zoom={7}
            style={{ height: 400, width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {mapData.map(({ destination, status_trip, count_trips }, idx) => {
              const coords = cityCoordinates[destination];
              if (!coords) return null;
              return (
                <CircleMarker
                  key={idx}
                  center={coords}
                  radius={5 + Math.sqrt(count_trips) * 3}
                  fillColor={statusColors[status_trip] || "#000"}
                  color="#fff"
                  weight={1}
                  fillOpacity={0.7}
                  eventHandlers={{
                    click: () => {
                      setDestination(destination);
                    },
                  }}
                >
                  <LeafletTooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                    {`${destination}: ${count_trips} trips (${status_trip})`}
                  </LeafletTooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

const KpiCard = ({ title, value }) => (
  <div className="bg-white shadow rounded p-4 text-center">
    <div className="text-lg font-bold text-gray-800 mb-2">{title}</div>
    <div className="text-2xl font-bold text-dark-600">{value}</div>
  </div>
);

export default Delivery;
