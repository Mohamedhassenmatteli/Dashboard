const express = require("express");
const router = express.Router();
const Camion = require("../../models/camion"); 
const {authenticateToken , authorizeRoles} = require("../../middleware/authMiddleware"); // import middleware
//const { fakeAuthenticateToken, fakeAuthorizeRoles } = require("../../middleware/fakeAuth");  FOR TESTING
// GET Fleet Insights (super_admin only)
router.get("/insights", authenticateToken, authorizeRoles("super_admin") ,  async (req, res) => {
  try {
    const avgMileageAgg = await Camion.aggregate([
      { $group: { _id: null, avgMileage: { $avg: "$mileage" } } },
    ]);
    const avgMileage = avgMileageAgg.length > 0 ? avgMileageAgg[0].avgMileage || 0 : 0;

    const totalTrucks = await Camion.countDocuments();
    const trucksInService = await Camion.countDocuments({ status: "in_service" });

    const capacityByBrandAgg = await Camion.aggregate([
      { $group: { _id: "$brand", totalCapacity: { $sum: { $ifNull: ["$capacity", 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      avgMileage: Number(avgMileage.toFixed(2)),
      totalTrucks,
      trucksInService,
      capacityByBrand: capacityByBrandAgg.map(item => ({
        _id: item._id || "Unknown",
        totalCapacity: item.totalCapacity || 0,
      })),
    });
  } catch (err) {
    console.error("Error in /insights:", err);
    res.status(500).json({ error: "Failed to fetch fleet insights" });
  }
});

// GET Truck Maintenance Counts (Yearly)
router.get("/maintenance-count-year",authenticateToken, authorizeRoles("super_admin"),authenticateToken , async (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(`${now.getFullYear()}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${now.getFullYear()}-12-31T23:59:59.999Z`);

    const data = await Camion.aggregate([
      { $match: { status: "under_maintenance", createdAt: { $gte: startOfYear, $lte: endOfYear } } },
      { $group: { _id: { $dateToString: { format: "%Y", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const formattedData = data.map(item => ({
      period: item._id || "Unknown",
      count: item.count || 0,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Error in /maintenance-count-year:", err);
    res.status(500).json({ error: "Failed to fetch maintenance data" });
  }
});

// GET Fuel Consumption per Truck 
router.get("/fuel-consumption",authenticateToken, authorizeRoles("super_admin"),  async (req, res) => {
  try {
    const trucks = await Camion.find({}, { truckId: 1, fuelConsumption: 1, _id: 0 }).lean();

    const data = trucks.map(truck => ({
      truckId: truck.truckId || "Unknown",
      fuelConsumption: truck.fuelConsumption || 0,
    }));

    res.json(data);
  } catch (err) {
    console.error("Error in /fuel-consumption:", err);
    res.status(500).json({ error: "Failed to fetch fuel consumption data" });
  }
});

module.exports = router;
