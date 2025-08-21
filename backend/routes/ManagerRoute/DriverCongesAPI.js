const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { authenticateToken, authorizeRoles } = require("../../middleware/authMiddleware");
//const { fakeAuthenticateToken, fakeAuthorizeRoles } = require("../../middleware/fakeAuth");  FOR TESTING
const User = require("../../models/user");
const TimeOff = require("../../models/conges");

// Utility: Validate ObjectId safely
function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// ================== INSIGHT ==================
router.get("/insight", authenticateToken , authorizeRoles("manager") , async (req, res) => {
  try {
    
    const managerObjectId = toObjectId(req.user._id);
    if (!managerObjectId) {
      return res.status(400).json({ error: "Invalid manager ID" });
    }
    const { driver} = req.query;

    // Find drivers for this manager
    let driverFilter = { createdBy: managerObjectId, role: "driver" };
    if (driver) driverFilter.FirstName = driver;
    const drivers = await User.find(driverFilter).select("_id").lean();

    if (!drivers.length) {
      return res.json({
        TotalRequest: 0,
        Period: "N/A",
        users: [],
      });
    }

    const driverIds = drivers.map((d) => d._id);

    const totalRequest = await TimeOff.countDocuments({ user: { $in: driverIds } });

    const lastTimeOff = await TimeOff.findOne({ user: { $in: driverIds } })
      .sort({ startDate: -1 })
      .select("periode")
      .lean();

    const users = await User.find({ createdBy: managerObjectId, role: "driver" })
      .select("_id FirstName LastName")
      .sort({ FirstName: 1 })
      .lean();

    res.json({
      TotalRequest: totalRequest || 0,
      Period: lastTimeOff?.periode || "N/A",
      users: users || [],
    });
  } catch (err) {
    console.error("Error in /leave/manager/insight:", err);
    res.status(500).json({ error: "Failed to fetch leave insights" });
  }
});

// ================== DRILL ==================
router.get("/drill", authenticateToken , authorizeRoles("manager") ,  async (req, res) => {
  try {
    const managerObjectId = toObjectId(req.user._id);
    if (!managerObjectId) {
      return res.status(400).json({ error: "Invalid manager ID" });
    }
    const { driver, level = "year", value } = req.query;

    let driverFilter = { createdBy: managerObjectId, role: "driver" };
    if (driver) driverFilter.FirstName = driver;
    const drivers = await User.find(driverFilter).select("_id").lean();

    if (!drivers.length) return res.json([]);

    const driverIds = drivers.map((d) => d._id);

    let groupId = {};
    let matchDateFilter = {};

    if (level === "year") {
      groupId = { year: { $year: "$startDate" } };
      if (value) matchDateFilter = { $expr: { $eq: [{ $year: "$startDate" }, parseInt(value) || 0] } };
    } else if (level === "month") {
      groupId = { year: { $year: "$startDate" }, month: { $month: "$startDate" } };
      if (value) matchDateFilter = { $expr: { $eq: [{ $year: "$startDate" }, parseInt(value) || 0] } };
    } else if (level === "day") {
      groupId = { year: { $year: "$startDate" }, month: { $month: "$startDate" }, day: { $dayOfMonth: "$startDate" } };
      if (value) {
        const [year, month] = value.split("-").map(Number);
        matchDateFilter = { $expr: { $and: [{ $eq: [{ $year: "$startDate" }, year] }, { $eq: [{ $month: "$startDate" }, month] }] } };
      }
    } else {
      return res.status(400).json({ error: "Invalid drill level" });
    }

    const result = await TimeOff.aggregate([
      { $match: { user: { $in: driverIds }, ...matchDateFilter } },
      {
        $group: {
          _id: { period: groupId, typeConge: "$typeConge" },
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
      { $sort: { "period.year": 1, "period.month": 1, "period.day": 1 } },
    ]);

    res.json(result || []);
  } catch (err) {
    console.error("Error in /leave/manager/drill:", err);
    res.status(500).json({ error: "Failed to fetch drill data" });
  }
});

// ================== PIE ==================
router.get("/pie", authenticateToken , authorizeRoles("manager") ,  async (req, res) => {
  try {
     const managerObjectId = toObjectId(req.user._id);
    if (!managerObjectId) {
      return res.status(400).json({ error: "Invalid manager ID" });
    }
    const { driver } = req.query;

    let driverFilter = { createdBy: managerObjectId, role: "driver" };
    if (driver) driverFilter.FirstName = driver;
    const drivers = await User.find(driverFilter).select("_id").lean();

    if (!drivers.length) return res.json([]);

    const driverIds = drivers.map((d) => d._id);

    const result = await TimeOff.aggregate([
      { $match: { user: { $in: driverIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]);

    res.json(result || []);
  } catch (err) {
    console.error("Error in /leave/manager/pie:", err);
    res.status(500).json({ error: "Failed to fetch pie data" });
  }
});

module.exports = router;
