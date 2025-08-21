const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authenticateToken, authorizeRoles } = require("../../middleware/authMiddleware");
// const { fakeAuthenticateToken, fakeAuthorizeRoles } = require("../../middleware/fakeAuth"); FOR TESTINHG !!!!

const User = require("../../models/user");
const Trip = require("../../models/trip");
const Truck = require("../../models/camion");

const DEFAULT_LAT = 36.8;
const DEFAULT_LON = 10.1;

// Helper to ensure ObjectId
function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

// ---------------- 1) Driver Info ----------------
router.get("/info", authenticateToken, authorizeRoles("driver"), async (req, res) => {
  const driverId = toObjectId(req.query.driverId || req.user._id);
  if (!driverId) return res.status(400).json({ error: "Invalid driverId" });

  try {
    const driver = await User.findById(driverId, "FirstName LastName").lean();
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (err) {
    console.error("Error fetching driver info", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------- 2) KPIs ----------------
router.get("/kpis", authenticateToken, authorizeRoles("driver"), async (req, res) => {
  const driverId = toObjectId(req.query.driverId || req.user._id);
  if (!driverId) return res.status(400).json({ error: "Invalid driverId" });

  try {
    // Make sure we match ObjectId
    const tripStats = await Trip.aggregate([
      { $match: { driver: driverId } },
      {
        $group: {
          _id: "$statusTrip",
          count: { $sum: 1 },
          totalDistance: { $sum: { $ifNull: ["$distance", 0] } },
          totalDuration: { $sum: { $ifNull: ["$duration", 0] } },
          truckIds: { $addToSet: "$truck" },
        },
      },
    ]);

    let canceled = 0,
      completed = 0,
      total = 0,
      totalDistance = 0,
      totalDuration = 0;
    const truckIdsSet = new Set();

    for (const stat of tripStats) {
      const count = stat.count || 0;
      total += count;
      if (stat._id === "failed") canceled = count;
      if (stat._id === "completed") completed = count;
      totalDistance += stat.totalDistance || 0;
      totalDuration += stat.totalDuration || 0;

      if (Array.isArray(stat.truckIds)) stat.truckIds.forEach(t => t && truckIdsSet.add(String(t)));
    }

    let totalFuel = 0;
    const truckIds = Array.from(truckIdsSet).map(toObjectId).filter(Boolean);

    if (truckIds.length) {
      const trucks = await Truck.find({ _id: { $in: truckIds } }).lean();
      const truckMap = trucks.reduce((acc, t) => {
        acc[String(t._id)] = t;
        return acc;
      }, {});

      const completedTrips = await Trip.find({ driver: driverId, statusTrip: "completed" }, { distance: 1, truck: 1 }).lean();
      for (const trip of completedTrips) {
        const truck = trip.truck ? truckMap[String(trip.truck)] : null;
        if (!truck) continue;
        const distanceKm = (trip.distance || 0) / 1000;
        const fuelPer100km = truck.fuelConsumption || 0;
        totalFuel += (distanceKm * fuelPer100km) / 100;
      }
    }

    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    res.json({
      canceled,
      completed,
      total,
      totalDistance: Number((totalDistance / 1000).toFixed(2)) || 0,
      totalHours: `${hours}h ${minutes}m`,
      totalFuel: Number(totalFuel.toFixed(2)) || 0,
    });
  } catch (err) {
    console.error("Error fetching driver KPIs", err);
    res.status(500).json({ error: "Error fetching driver KPIs" });
  }
});

// ---------------- 3) Trips Over Time ----------------
router.get("/trips-over-time", authenticateToken, authorizeRoles("driver"), async (req, res) => {
  const driverId = toObjectId(req.query.driverId || req.user._id);
  if (!driverId) return res.status(400).json({ error: "Invalid driverId" });

  const level = req.query.level || "day";

  try {
    let groupId;
    if (level === "year") groupId = { year: { $year: "$createdAt" } };
    else if (level === "month") groupId = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
    else groupId = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } };

    const tripsOverTime = await Trip.aggregate([
      { $match: { driver: driverId } },
      {
        $group: {
          _id: groupId,
          trip_count: { $sum: 1 },
          totalDistance: { $sum: { $ifNull: ["$distance", 0] } },
          totalDuration: { $sum: { $ifNull: ["$duration", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const formatted = tripsOverTime.map((item) => {
      const y = item._id.year || 0;
      const m = item._id.month || 0;
      const d = item._id.day || 0;
      let period = "";
      if (level === "year") period = `${y}`;
      else if (level === "month") period = `${y}-${String(m).padStart(2, "0")}`;
      else period = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      return {
        period,
        trip_count: item.trip_count || 0,
        totalDistance: Number(((item.totalDistance || 0) / 1000).toFixed(2)),
        totalHours: Number(((item.totalDuration || 0) / 3600).toFixed(2)),
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching trips over time", err);
    res.status(500).json({ error: "Error fetching trips over time" });
  }
});

// ---------------- 4) Trips By Destination ----------------
router.get("/trips-by-destination", authenticateToken, authorizeRoles("driver"), async (req, res) => {
  const driverId = toObjectId(req.query.driverId || req.user._id);
  if (!driverId) return res.status(400).json({ error: "Invalid driverId" });

  try {
    const tripsByDestination = await Trip.aggregate([
      { $match: { driver: driverId } },
      {
        $group: {
          _id: { name: "$destination.name", lat: "$destination.lat", lon: "$destination.lon" },
          trip_count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          destinationName: { $ifNull: ["$_id.name", "Unknown"] },
          trip_count: 1,
          latitude: { $ifNull: ["$_id.lat", DEFAULT_LAT] },
          longitude: { $ifNull: ["$_id.lon", DEFAULT_LON] },
        },
      },
      { $sort: { destinationName: 1 } },
    ]);

    res.json(tripsByDestination);
  } catch (err) {
    console.error("Error fetching trips by destination", err);
    res.status(500).json({ error: "Error fetching trips by destination" });
  }
});

module.exports = router;
