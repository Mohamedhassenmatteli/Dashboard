const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const User = require("../models/user"); // Modèle User
const Trip = require("../models/trip"); // Modèle Trip

// ROUTE 1 : KPIs avec filtre driver & manager
router.get("/:managerId/kpis", async (req, res) => {
  try {
    const { driver } = req.query;
    const { managerId } = req.params;

    let driverFilter = {};
    if (managerId) {
      if (!ObjectId.isValid(managerId))
        return res.status(400).json({ error: "Invalid managerId" });
      driverFilter.createdBy = new ObjectId(managerId);
    }

    if (driver) {
      if (!ObjectId.isValid(driver))
        return res.status(400).json({ error: "Invalid driver id" });
      driverFilter._id = new ObjectId(driver);
    }

    // Chercher les drivers
    const drivers = await User.find(driverFilter).select("_id");

    if (!drivers.length)
      return res.json({
        in_progress: 0,
        delayed: 0,
        canceled: 0,
        completed: 0,
        total: 0,
      });

    const driverIds = drivers.map((d) => d._id);

    const aggregation = await Trip.aggregate([
      { $match: { driver: { $in: driverIds } } },
      {
        $group: {
          _id: null,
          in_progress: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "in_progress"] }, 1, 0] },
          },
          delayed: { $sum: { $cond: [{ $eq: ["$statusTrip", "delayed"] }, 1, 0] } },
          canceled: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "canceled"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "completed"] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
    ]);

    const kpis = aggregation[0] || {
      in_progress: 0,
      delayed: 0,
      canceled: 0,
      completed: 0,
      total: 0,
    };

    res.json(kpis);
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
});

// ROUTE 2 : Temps de départ moyens par driver (filtré par driver et manager)
router.get("/:managerId/departure-times", async (req, res) => {
  try {
    const { driver } = req.query;
    const { managerId } = req.params;

    let driverFilter = {};
    if (managerId) {
      if (!ObjectId.isValid(managerId))
        return res.status(400).json({ error: "Invalid managerId" });
      driverFilter.createdBy = new ObjectId(managerId);
    }
    if (driver) {
      if (!ObjectId.isValid(driver))
        return res.status(400).json({ error: "Invalid driver id" });
      driverFilter._id = new ObjectId(driver);
    }

    // Trouver les drivers
    const drivers = await User.find(driverFilter).select("_id FirstName LastName");

    if (!drivers.length) return res.json([]);

    const driverIds = drivers.map((d) => d._id);

    const agg = await Trip.aggregate([
      { $match: { driver: { $in: driverIds } } },
      {
        $group: {
          _id: { driver: "$driver", destination: "$destination" },
          avgDepartureHour: {
            $avg: {
              $let: {
                vars: {
                  parts: { $split: ["$departureTime", ":"] },
                },
                in: {
                  $add: [
                    { $toDouble: { $arrayElemAt: ["$$parts", 0] } },
                    { $divide: [{ $toDouble: { $arrayElemAt: ["$$parts", 1] } }, 60] },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.driver",
          foreignField: "_id",
          as: "driverInfo",
        },
      },
      { $unwind: "$driverInfo" },
      {
        $project: {
          firstname: "$driverInfo.FirstName",
          last_name: "$driverInfo.LastName",
          destination: "$_id.destination",
          avgdeparturehour: { $round: ["$avgDepartureHour", 2] },
        },
      },
      { $sort: { firstname: 1 } },
      { $limit: 100 },
    ]);

    res.json(agg);
  } catch (error) {
    console.error("Error fetching departure times:", error);
    res.status(500).json({ error: "Failed to fetch departure times" });
  }
});

// ROUTE 3 : Nombre de trips par date (filtré par driver et manager)
router.get("/:managerId/trips-by-date", async (req, res) => {
  try {
    const { driver } = req.query;
    const { managerId } = req.params;

    let driverFilter = {};
    if (managerId) {
      if (!ObjectId.isValid(managerId))
        return res.status(400).json({ error: "Invalid managerId" });
      driverFilter.createdBy = new ObjectId(managerId);
    }
    if (driver) {
      if (!ObjectId.isValid(driver))
        return res.status(400).json({ error: "Invalid driver id" });
      driverFilter._id = new ObjectId(driver);
    }

    // Trouver les drivers
    const drivers = await User.find(driverFilter).select("_id");

    if (!drivers.length) return res.json([]);

    const driverIds = drivers.map((d) => d._id);

    const agg = await Trip.aggregate([
      { $match: { driver: { $in: driverIds } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          trip_count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          year: "$_id",
          trip_count: 1,
          _id: 0,
        },
      },
    ]);

    res.json(agg);
  } catch (error) {
    console.error("Error fetching trips by date:", error);
    res.status(500).json({ error: "Failed to fetch trips by date" });
  }
});

// ROUTE 4 : Liste des drivers pour un manager (filtré par createdBy = managerId)
router.get("/:managerId/drivers", async (req, res) => {
  try {
    const { managerId } = req.params;
    if (!managerId || !ObjectId.isValid(managerId)) {
      return res.status(400).json({ error: "Missing or invalid managerId parameter" });
    }

    const managerObjectId = new ObjectId(managerId);

    const drivers = await User.find({
      role: "driver",
      createdBy: managerObjectId,
    })
      .select("_id FirstName LastName")
      .sort({ FirstName: 1 });

    res.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

module.exports = router;
