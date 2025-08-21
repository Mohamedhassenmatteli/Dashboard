const express = require('express');
const cors = require('cors');          
const connectDB = require('./db');
// Super admin API
const DriverPerforRoutes = require('./routes/SuperAdminRoute/DriverPerforamnceAPI');
const deliveryRoute = require('./routes/SuperAdminRoute/DeliveryPerforamnceAPI');
const fleetRoutes = require('./routes/SuperAdminRoute/FleetPerforamnceAPI');
const leaveRoutes = require('./routes/SuperAdminRoute/CongesPerformanceAPI');
const UserRoutes = require('./routes/SuperAdminRoute/UsersPerforamnceAPI');

// Manager API
const DriverPrformanceRoute = require("./routes/ManagerRoute/DriverPerformanceAPI")
const DriverConges  = require("./routes/ManagerRoute/DriverCongesAPI")
const TruckPerforamnce = require("./routes/ManagerRoute/TruckPerformanceAPI")

// Driver API
const driverDashboard = require("./routes/DriverRoute/DriverDashboardAPI")

const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS for all origins 
app.use(cors({
  origin: 'http://localhost:3000',  
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,                
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Use API routes under /api
app.use('/api', DriverPerforRoutes);
app.use('/api/delivery', deliveryRoute);
app.use("/api/fleet", fleetRoutes);
app.use('/api/leave',leaveRoutes);
app.use('/api/superadmin',UserRoutes)
app.use('/api/manager-performance',DriverPrformanceRoute)
app.use('/api/truck',TruckPerforamnce)
app.use('/api/leave/manager',DriverConges)
app.use('/api/driver-dashboard/',driverDashboard)

// Root endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the Trucking API');
});

// Start the server
app.listen(5000, () => {
  console.log(`Server running on http://localhost:5000`);
});
