const express = require("express");
const router = express.Router();
const User = require("../models/user");   // user model
const Trip = require("../models/trip");   // trip model

// GET KPIs with optional driver filter
router.get("/kpis", async (req, res) => {
  const driver = req.query.driver;
  try {
    const matchStage = {};
    if (driver && driver.trim() !== "") {
      // Find drivers matching firstname filter
      const drivers = await User.find({ FirstName: driver.trim() }, { _id: 1 }).lean();
      if (drivers.length === 0) return res.json({ in_progress: 0, delayed: 0, canceled: 0, completed: 0, total: 0 });
      matchStage.driver = { $in: drivers.map(d => d._id) };
    }

    const aggregation = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          in_progress: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "in_progress"] }, 1, 0] }
          },
          delayed: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "delayed"] }, 1, 0] }
          },
          canceled: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "canceled"] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "completed"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      }
    ]);

    res.json(aggregation[0] || { in_progress: 0, delayed: 0, canceled: 0, completed: 0, total: 0 });
  } catch (err) {
    console.error("Error fetching KPIs:", err);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
});

// GET Average Departure Time per driver (filtered)
router.get("/departure-times", async (req, res) => {
  const driver = req.query.driver;

  try {
    const matchStage = {};
    if (driver && driver.trim() !== "") {
      const drivers = await User.find({ FirstName: driver.trim() }, { _id: 1 }).lean();
      if (drivers.length === 0) return res.json([]);
      matchStage.driver = { $in: drivers.map(d => d._id) };
    }

    const times = await Trip.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "driver",
          foreignField: "_id",
          as: "driver"
        }
      },
      { $unwind: "$driver" },
      // Convert departureTime string "HH:mm" to numeric hour + fraction
      {
        $addFields: {
          departure_hour: {
            $toInt: { $arrayElemAt: [{ $split: ["$departureTime", ":"] }, 0] }
          },
          departure_minute: {
            $toInt: { $arrayElemAt: [{ $split: ["$departureTime", ":"] }, 1] }
          }
        }
      },
      {
        $group: {
          _id: {
            FirstName: "$driver.FirstName",
            LastName: "$driver.LastName",
            destination: "$destination"
          },
          avgdeparturehour: {
            $avg: { $add: ["$departure_hour", { $divide: ["$departure_minute", 60] }] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          FirstName: "$_id.FirstName",
          LastName: "$_id.LastName",
          destination: "$_id.destination",
          avgdeparturehour: { $round: ["$avgdeparturehour", 2] }
        }
      },
      { $sort: { FirstName: 1 } },
      { $limit: 10 }
    ]);

    res.json(times);
  } catch (err) {
    console.error("Error fetching departure times:", err);
    res.status(500).json({ error: "Failed to fetch departure times" });
  }
});

// GET Trips by date (filtered)
router.get("/trips-by-date", async (req, res) => {
  const driver = req.query.driver;

  try {
    const matchStage = {};
    if (driver && driver.trim() !== "") {
      const drivers = await User.find({ FirstName: driver.trim() }, { _id: 1 }).lean();
      if (drivers.length === 0) return res.json([]);
      matchStage.driver = { $in: drivers.map(d => d._id) };
    }

    const tripsByYear = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $year: "$createdAt" },
          trip_count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          trip_count: 1
        }
      },
      { $sort: { year: 1 } }
    ]);

    res.json(tripsByYear);
  } catch (err) {
    console.error("Error fetching trips by date:", err);
    res.status(500).json({ error: "Failed to fetch trips by date" });
  }
});

// GET Drivers list (distinct)
router.get("/drivers", async (req, res) => {
  try {
    // Find users with role 'driver' who have trips
    const driversWithTrips = await Trip.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "driver",
          foreignField: "_id",
          as: "driverInfo"
        }
      },
      { $unwind: "$driverInfo" },
      {
        $match: { "driverInfo.role": "driver" }
      },
      {
        $group: {
          _id: "$driverInfo._id",
          FirstName: { $first: "$driverInfo.FirstName" },
          LastName: { $first: "$driverInfo.LastName" }
        }
      },
      {
        $sort: { FirstName: 1 }
      }
    ]);

    res.json(driversWithTrips);
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

module.exports = router;
