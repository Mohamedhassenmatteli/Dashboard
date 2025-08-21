const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const User = require("../../models/user"); 
const Trip = require("../../models/trip"); 
const { authenticateToken, authorizeRoles } = require("../../middleware/authMiddleware");
//const { fakeAuthenticateToken, fakeAuthorizeRoles } = require("../../middleware/fakeAuth") FOR TESTING

// ---------- Helpers ----------
function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

const DEFAULT_DEST = { name: "Unknown", lat: 36.8, lon: 10.1 };

// ---------- ROUTE 1: KPIs ----------
router.get("/kpis", authenticateToken, authorizeRoles("manager"), async (req, res) => {
  try {
    const { driver } = req.query;
    const managerId = toObjectId(req.user._id);

    const driverFilter = { createdBy: managerId };
    if (driver) {
      const driverId = toObjectId(driver);
      if (driverId) driverFilter._id = driverId;
      else driverFilter.FirstName = driver;
    }

    const drivers = await User.find(driverFilter).select("_id");
    if (!drivers.length) return res.json({ in_progress: 0, delayed: 0, canceled: 0, completed: 0, total: 0 });

    const driverIds = drivers.map(d => d._id);

    const aggregation = await Trip.aggregate([
      { $match: { driver: { $in: driverIds } } },
      {
        $group: {
          _id: null,
          in_progress: { $sum: { $cond: [{ $eq: ["$statusTrip", "in_progress"] }, 1, 0] } },
          delayed: { $sum: { $cond: [{ $eq: ["$statusTrip", "delayed"] }, 1, 0] } },
          canceled: { $sum: { $cond: [{ $eq: ["$statusTrip", "failed"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$statusTrip", "completed"] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    res.json(aggregation[0] || { in_progress: 0, delayed: 0, canceled: 0, completed: 0, total: 0 });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
});

// ---------- ROUTE 2: Average departure time per driver ----------
router.get("/departure-times", authenticateToken, authorizeRoles("manager"), async (req, res) => {
  try {
    const { driver } = req.query;
    const managerId = toObjectId(req.user._id);

    const driverFilter = { createdBy: managerId };
    if (driver) {
      const driverId = toObjectId(driver);
      if (!driverId) return res.status(400).json({ error: "Invalid driver id" });
      driverFilter._id = driverId;
    }

    const drivers = await User.find(driverFilter).select("_id FirstName LastName");
    if (!drivers.length) return res.json([]);

    const driverIds = drivers.map(d => d._id);

    const agg = await Trip.aggregate([
      { $match: { driver: { $in: driverIds }, departureTime: { $ne: null, $ne: "" } } },
      {
        $addFields: {
          parts: { $split: ["$departureTime", ":"] },
          destName: { $ifNull: ["$destination.name", DEFAULT_DEST.name] }
        }
      },
      {
        $addFields: {
          hour: { $toDouble: { $arrayElemAt: ["$parts", 0] } },
          minute: { $toDouble: { $arrayElemAt: ["$parts", 1] } }
        }
      },
      {
        $group: {
          _id: { driver: "$driver", destination: "$destName" },
          avgDepartureHour: { $avg: { $add: ["$hour", { $divide: ["$minute", 60] }] } }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.driver",
          foreignField: "_id",
          as: "driverInfo"
        }
      },
      { $unwind: "$driverInfo" },
      {
        $project: {
          firstname: "$driverInfo.FirstName",
          last_name: "$driverInfo.LastName",
          destination: "$_id.destination",
          avgdeparturehour: { $round: ["$avgDepartureHour", 2] }
        }
      },
      { $sort: { avgdeparturehour: -1 } },
      { $limit: 10 }
    ]);

    res.json(agg);
  } catch (error) {
    console.error("Error fetching departure times:", error);
    res.status(500).json({ error: "Failed to fetch departure times" });
  }
});

// ---------- ROUTE 3: Trips by date ----------
router.get("/trips-by-date", authenticateToken, authorizeRoles("manager"), async (req, res) => {
  try {
    const { driver } = req.query;
    const managerId = toObjectId(req.user._id);

    const driverFilter = { createdBy: managerId };
    if (driver) {
      const driverId = toObjectId(driver);
      if (!driverId) return res.status(400).json({ error: "Invalid driver id" });
      driverFilter._id = driverId;
    }

    const drivers = await User.find(driverFilter).select("_id");
    if (!drivers.length) return res.json([]);

    const driverIds = drivers.map(d => d._id);

    const agg = await Trip.aggregate([
      { $match: { driver: { $in: driverIds } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          trip_count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      { $project: { year: "$_id", trip_count: 1, _id: 0 } }
    ]);

    res.json(agg);
  } catch (error) {
    console.error("Error fetching trips by date:", error);
    res.status(500).json({ error: "Failed to fetch trips by date" });
  }
});

// ---------- ROUTE 4: Drivers list ----------
router.get("/drivers", authenticateToken, authorizeRoles("manager"), async (req, res) => {
  try {
    const managerId = toObjectId(req.user._id);

    const drivers = await User.find({ role: "driver", createdBy: managerId })
      .select("_id FirstName LastName")
      .sort({ FirstName: 1 });

    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

module.exports = router;
