// backend/server.js
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
//insight api
const superadminRoutes = require("./routes/UserInsightApi");
app.use("/api/superadmin", superadminRoutes);
//fleet api
const fleetroute =  require("./routes/FleetApi")
app.use("/api/fleet",fleetroute);
//delivery api
const deliveryroute = require("./routes/DeliveryAPI")
app.use("/api/delivery",deliveryroute);
//leave api
const leaveroute = require("./routes/LeaveApi");
app.use("/api/leave",leaveroute);
//Driverperformance api
const driverPerRoute = require("./routes/DriverPerformanceApi");
app.use("/api/driver-performance",driverPerRoute);
const leaveManagerRoutes = require("./routes/leave.manager");
app.use("/api/leave/manager", leaveManagerRoutes);
const DriverperformanceperManager = require("./routes/DriverPerformance.manager")
app.use("/api/manager-performance",DriverperformanceperManager)
const driverDashboard = require("./routes/DriverDashboard");
app.use("/api/driver-dashboard",driverDashboard)


app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
