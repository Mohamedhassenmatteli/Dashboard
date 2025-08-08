const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const User = require("../models/user");      // User model (drivers/managers)
const TimeOff = require("../models/conges"); // Leave (conges) model

// GET /api/leave/manager/insight
router.get("/insight", async (req, res) => {
  try {
    const { driver, managerId } = req.query;

    if (!managerId || !ObjectId.isValid(managerId)) {
      return res.status(400).json({ error: "Invalid or missing managerId" });
    }
    const managerObjectId = new ObjectId(managerId);

    // Filter drivers managed by this manager and optionally by FirstName
    let driverFilter = { createdBy: managerObjectId, role: "driver" };
    if (driver && driver !== "") {
      driverFilter.FirstName = driver;
    }
    const drivers = await User.find(driverFilter).select("_id");

    if (drivers.length === 0) {
      return res.json({
        TotalRequest: 0,
        Period: "N/A",
        users: [],
      });
    }

    const driverIds = drivers.map((d) => d._id);

    // Total leave requests for those drivers
    const totalRequest = await TimeOff.countDocuments({ user: { $in: driverIds } });

    // Latest period (most recent startDate)
    const lastTimeOff = await TimeOff.findOne({ user: { $in: driverIds } })
      .sort({ startDate: -1 })
      .select("periode")
      .lean();

    // Distinct drivers under this manager for dropdown
    const users = await User.find({ createdBy: managerObjectId, role: "driver" })
      .select("_id FirstName LastName")
      .sort({ FirstName: 1 });

    res.json({
      TotalRequest: totalRequest,
      Period: lastTimeOff ? lastTimeOff.periode : "N/A",
      users,
    });
  } catch (err) {
    console.error("Error in /leave/manager/insight:", err);
    res.status(500).json({ error: "Failed to fetch leave insights" });
  }
});

// GET /api/leave/manager/drill
router.get("/drill", async (req, res) => {
  try {
    const { driver, managerId, level = "year", value } = req.query;

    if (!managerId || !ObjectId.isValid(managerId)) {
      return res.status(400).json({ error: "Invalid or missing managerId" });
    }
    const managerObjectId = new ObjectId(managerId);

    // Filter drivers managed by manager, optionally filtered by first name
    let driverFilter = { createdBy: managerObjectId, role: "driver" };
    if (driver && driver !== "") {
      driverFilter.FirstName = driver;
    }
    const drivers = await User.find(driverFilter).select("_id");
    if (drivers.length === 0) {
      return res.json([]);
    }
    const driverIds = drivers.map((d) => d._id);

    // Build date grouping and filtering on startDate field
    let groupId;
    let matchDateFilter = {};

    if (level === "year") {
      groupId = { year: { $year: "$startDate" } };
      if (value) {
        matchDateFilter = { $expr: { $eq: [{ $year: "$startDate" }, parseInt(value, 10)] } };
      }
    } else if (level === "month") {
      groupId = { year: { $year: "$startDate" }, month: { $month: "$startDate" } };
      if (value) {
        // value expected as "YYYY"
        matchDateFilter = { $expr: { $eq: [{ $year: "$startDate" }, parseInt(value, 10)] } };
      }
    } else if (level === "day") {
      groupId = {
        year: { $year: "$startDate" },
        month: { $month: "$startDate" },
        day: { $dayOfMonth: "$startDate" },
      };
      if (value) {
        // value expected as "YYYY-MM"
        const [year, month] = value.split("-").map(Number);
        matchDateFilter = {
          $expr: {
            $and: [
              { $eq: [{ $year: "$startDate" }, year] },
              { $eq: [{ $month: "$startDate" }, month] },
            ],
          },
        };
      }
    } else {
      return res.status(400).json({ error: "Invalid drill level" });
    }

    // Match leaves by user and date
    const matchStage = {
      user: { $in: driverIds },
      ...matchDateFilter,
    };

    // Aggregate leave counts grouped by period and typeConge (leave type)
    const aggregationPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            period: groupId,
            typeConge: "$typeConge",
          },
          count_time_off: { $sum: 1 },
        },
      },
      {
        $project: {
          period: "$_id.period",
          type: "$_id.typeConge",
          count_time_off: 1,
          _id: 0,
        },
      },
      { $sort: { period: 1 } },
    ];

    const result = await TimeOff.aggregate(aggregationPipeline);

    res.json(result);
  } catch (err) {
    console.error("Error in /leave/manager/drill:", err);
    res.status(500).json({ error: "Failed to fetch drill data" });
  }
});

// GET /api/leave/manager/pie
router.get("/pie", async (req, res) => {
  try {
    const { driver, managerId } = req.query;

    if (!managerId || !ObjectId.isValid(managerId)) {
      return res.status(400).json({ error: "Invalid or missing managerId" });
    }
    const managerObjectId = new ObjectId(managerId);

    // Filter drivers managed by this manager, optionally by first name
    let driverFilter = { createdBy: managerObjectId, role: "driver" };
    if (driver && driver !== "") {
      driverFilter.FirstName = driver;
    }
    const drivers = await User.find(driverFilter).select("_id");
    if (drivers.length === 0) {
      return res.json([]);
    }
    const driverIds = drivers.map((d) => d._id);

    // Aggregate leave counts grouped by status
    const aggregationPipeline = [
      { $match: { user: { $in: driverIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ];

    const result = await TimeOff.aggregate(aggregationPipeline);

    res.json(result);
  } catch (err) {
    console.error("Error in /leave/manager/pie:", err);
    res.status(500).json({ error: "Failed to fetch pie data" });
  }
});

module.exports = router;
