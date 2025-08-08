const express = require('express');
const cors = require('cors');           // <-- import cors here
const connectDB = require('./db');
// Super admin API
const DriverPerforRoutes = require('./routes/DriverPerfAPI');
const deliveryRoute = require('./routes/DeliveryAPI');
const fleetRoutes = require('./routes/FleetAPI');
const leaveRoutes = require('./routes/CongesAPI');
const UserRoutes = require('./routes/UsersAPI');

// Manager API
const DriverPrformanceRoute = require("./routes/DriverPerformanceAPI")
const DriverConges  = require("./routes/DriverCongesAPI")

// Driver API
const driverDashboard = require("./routes/DriverDashboardAPI")

const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS for all origins (or restrict to your frontend origin)
app.use(cors({
  origin: 'http://localhost:3000',  // allow your React app origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,                // if you use cookies/auth (optional)
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
