const express = require("express");
const router = express.Router();
const Conges = require("../../models/conges");
const User = require("../../models/user");

// GET /leave/insight
router.get("/insight", async (req, res) => {
  const driverName = req.query.driver;

  try {
    let userFilter = {};
    if (driverName?.trim()) {
      const user = await User.findOne({ FirstName: new RegExp(`^${driverName}$`, "i") });
      if (!user) return res.json({ TotalRequest: 0, Period: "N/A", users: [] });
      userFilter.user = user._id;
    }

    const totalRequest = await Conges.countDocuments(userFilter);
    const periodDoc = await Conges.findOne(userFilter).select("periode").lean();
    const period = periodDoc?.periode || "N/A";

    const users = await User.aggregate([
      {
        $lookup: {
          from: "conges",
          localField: "_id",
          foreignField: "user",
          as: "leaves",
        },
      },
      { $match: { "leaves.0": { $exists: true } } },
      { $project: { FirstName: 1, LastName: 1 } },
      { $sort: { FirstName: 1 } },
    ]);

    res.json({ TotalRequest: totalRequest, Period: period, users });
  } catch (err) {
    console.error("Error in /leave/insight:", err);
    res.status(500).json({ error: "Failed to fetch leave insights" });
  }
});

// GET /leave/drill
router.get("/drill", async (req, res) => {
  const driverName = req.query.driver;
  const { level = "year", value } = req.query;

  try {
    let userFilter = {};
    if (driverName?.trim()) {
      const user = await User.findOne({ FirstName: new RegExp(`^${driverName}$`, "i") });
      if (!user) return res.json([]);
      userFilter.user = user._id;
    }

    let startDate, endDate;

    if (value) {
      if (level === "year") {
        const year = parseInt(value);
        if (!isNaN(year)) {
          startDate = new Date(`${year}-01-01T00:00:00Z`);
          endDate = new Date(`${year + 1}-01-01T00:00:00Z`);
        }
      } else if (level === "month") {
        const parts = value.split("-");
        if (parts.length === 2) {
          const [year, month] = parts.map(Number);
          if (!isNaN(year) && !isNaN(month)) {
            startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`);
            const nextMonth = month + 1;
            endDate =
              nextMonth > 12
                ? new Date(`${year + 1}-01-01T00:00:00Z`)
                : new Date(`${year}-${String(nextMonth).padStart(2, "0")}-01T00:00:00Z`);
          }
        }
      } else if (level === "day") {
        // validate value format: YYYY-MM-DD
        const parts = value.split("-");
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            startDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00Z`);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
          }
        }
      }
    }

    let match = { ...userFilter };
    if (startDate instanceof Date && !isNaN(startDate) && endDate instanceof Date && !isNaN(endDate)) {
      match.createdAt = { $gte: startDate, $lt: endDate };
    }

    let groupId;
    if (level === "year") groupId = { $dateToString: { format: "%Y", date: "$createdAt" } };
    else if (level === "month") groupId = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    else if (level === "day") groupId = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    else groupId = { $dateToString: { format: "%Y", date: "$createdAt" } }; // fallback

    const results = await Conges.aggregate([
      { $match: match },
      { $group: { _id: { period: groupId, type: "$typeConge" }, count_time_off: { $sum: 1 } } },
      { $sort: { "_id.period": 1 } },
      { $project: { _id: 0, period: "$_id.period", type: "$_id.type", count_time_off: 1 } },
    ]);

    res.json(results);
  } catch (err) {
    console.error("Error in /leave/drill:", err);
    res.status(500).json({ error: "Failed to fetch drill data" });
  }
});

// GET /leave/pie
router.get("/pie", async (req, res) => {
  const driverName = req.query.driver;

  try {
    let userFilter = {};
    if (driverName?.trim()) {
      const user = await User.findOne({ FirstName: new RegExp(`^${driverName}$`, "i") });
      if (!user) return res.json([]);
      userFilter.user = user._id;
    }

    const results = await Conges.aggregate([
      { $match: userFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]);

    res.json(results);
  } catch (err) {
    console.error("Error in /leave/pie:", err);
    res.status(500).json({ error: "Failed to fetch pie data" });
  }
});

module.exports = router;
