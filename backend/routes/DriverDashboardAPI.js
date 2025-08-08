const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const User = require("../models/user");
const Trip = require("../models/trip");
const Truck = require("../models/camion");

function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

// 1. Driver Info
router.get("/info/:driverId", async (req, res) => {
  const driverId = toObjectId(req.params.driverId);
  if (!driverId) return res.status(400).json({ error: "Invalid driverId" });

  try {
    const driver = await User.findById(driverId, "FirstName LastName").lean();
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(driver);
  } catch (error) {
    console.error("Error fetching driver info", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. KPIs
router.get("/kpis", async (req, res) => {
  const driverId = toObjectId(req.query.driverId);
  if (!driverId) return res.status(400).json({ error: "Invalid driverId" });

  try {
    // Aggregate trip counts by statusTrip for the driver
    const tripStats = await Trip.aggregate([
      { $match: { driver: driverId } },
      {
        $group: {
          _id: "$statusTrip",
          count: { $sum: 1 },
        },
      },
    ]);

    let canceled = 0,
      completed = 0,
      total = 0;
    tripStats.forEach((stat) => {
      total += stat.count;
      if (stat._id === "canceled") canceled = stat.count;
      else if (stat._id === "completed") completed = stat.count;
    });

    // Get all trucks used in trips by this driver
    const trips = await Trip.find({ driver: driverId }, "truck").lean();
    const truckIds = trips
      .map((t) => {
        try {
          return new mongoose.Types.ObjectId(t.truck);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    let avgMileage = 0;
    if (truckIds.length > 0) {
      const avgMileageResult = await Truck.aggregate([
        { $match: { _id: { $in: truckIds } } },
        {
          $group: {
            _id: null,
            avgMileage: { $avg: "$mileage" },
          },
        },
      ]);
      if (avgMileageResult.length > 0) {
        avgMileage = avgMileageResult[0].avgMileage;
      }
    }

    res.json({
      canceled,
      completed,
      total,
      avg_mileage: parseFloat(avgMileage.toFixed(2)),
    });
  } catch (error) {
    console.error("Error fetching driver KPIs", error);
    res.status(500).json({ error: "Error fetching driver KPIs" });
  }
});

// 3. Trips Over Time
router.get("/trips-over-time", async (req, res) => {
  const driverId = toObjectId(req.query.driverId);
  if (!driverId) return res.status(400).json({ error: "Invalid driverId" });

  const level = req.query.level || "day";

  try {
    let groupId;
    if (level === "year") {
      groupId = { year: { $year: "$createdAt" } };
    } else if (level === "month") {
      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };
    } else {
      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
    }

    const tripsOverTime = await Trip.aggregate([
      { $match: { driver: driverId } },
      {
        $group: {
          _id: groupId,
          trip_count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);

    const formatted = tripsOverTime.map((item) => {
      let periodStr = "";
      if (level === "year") {
        periodStr = item._id.year.toString();
      } else if (level === "month") {
        periodStr = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      } else {
        periodStr = `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(
          item._id.day
        ).padStart(2, "0")}`;
      }
      return {
        period: periodStr,
        trip_count: item.trip_count,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching trips over time", error);
    res.status(500).json({ error: "Error fetching trips over time" });
  }
});

// 4. Trips By Destination
router.get("/trips-by-destination", async (req, res) => {
  const driverId = toObjectId(req.query.driverId);
  if (!driverId) return res.status(400).json({ error: "Invalid driverId" });

  try {
    const tripsByDestination = await Trip.aggregate([
      { $match: { driver: driverId } },
      {
        $group: {
          _id: "$destination",
          trip_count: { $sum: 1 },
        },
      },
    ]);

    const formatted = tripsByDestination.map((item) => ({
      destination: item._id,
      trip_count: item.trip_count,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching trips by destination", error);
    res.status(500).json({ error: "Error fetching trips by destination" });
  }
});

module.exports = router;
