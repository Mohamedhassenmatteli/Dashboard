const express = require("express");
const router = express.Router();
const Conges = require("../models/conges"); // Your MongoDB leave requests model
const User = require("../models/user");     // Your MongoDB users/drivers model

// GET /leave/insight
router.get("/insight", async (req, res) => {
  const driverName = req.query.driver;

  try {
    // Build user filter if driver param is provided
    let userFilter = {};
    if (driverName && driverName.trim() !== "") {
      // Find user by firstname (case-insensitive)
      const user = await User.findOne({ FirstName: new RegExp(`^${driverName}$`, "i") });
      if (!user) {
        return res.json({ TotalRequest: 0, Period: "N/A", users: [] });
      }
      userFilter.user = user._id;
    }

    // Total requests count
    const totalRequest = await Conges.countDocuments(userFilter);

    // Find one period (periode field of any matching conges)
    const periodDoc = await Conges.findOne(userFilter).select("periode").lean();
    const period = periodDoc ? periodDoc.periode : "N/A";

    // Distinct users who have leaves
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

    res.json({
      TotalRequest: totalRequest,
      Period: period,
      users,
    });
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
    // Find user filter by driver name if provided
    let userFilter = {};
    if (driverName && driverName.trim() !== "") {
      const user = await User.findOne({ FirstName: new RegExp(`^${driverName}$`, "i") });
      if (!user) return res.json([]);
      userFilter.user = user._id;
    }

    // Date filtering variables
    let startDate, endDate;
    if (value) {
      if (level === "year") {
        startDate = new Date(`${value}-01-01T00:00:00Z`);
        endDate = new Date(`${parseInt(value) + 1}-01-01T00:00:00Z`);
      } else if (level === "month") {
        const [year, month] = value.split("-");
        startDate = new Date(`${year}-${month}-01T00:00:00Z`);
        const nextMonth = parseInt(month) + 1;
        if (nextMonth > 12) {
          endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`);
        } else {
          endDate = new Date(`${year}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00Z`);
        }
      } else if (level === "day") {
        startDate = new Date(`${value}T00:00:00Z`);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      }
    }

    // Build match stage with user filter
    let match = { ...userFilter };

    // Add date filter only if both dates are valid
    if (startDate instanceof Date && !isNaN(startDate) && endDate instanceof Date && !isNaN(endDate)) {
      match.created_at = { $gte: startDate, $lt: endDate };
    }
    // else no date filtering to avoid accidentally filtering everything

    // Build grouping key based on level
   let groupId;
    if (level === "year") {
    groupId = { $dateToString: { format: "%Y", date: { $toDate: "$createdAt" } } };
    } else if (level === "month") {
    groupId = { $dateToString: { format: "%Y-%m", date: { $toDate: "$createdAt" } } };
    } else if (level === "day") {
    groupId = { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" } } };
    }


    // Aggregate data grouped by period and typeConge
    const results = await Conges.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            period: groupId,
            type: "$typeConge",
          },
          count_time_off: { $sum: 1 },
        },
      },
      { $sort: { "_id.period": 1 } },
      {
        $project: {
          _id: 0,
          period: "$_id.period",
          type: "$_id.type",
          count_time_off: 1,
        },
      },
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
    // Build user filter if driver param provided
    let userFilter = {};
    if (driverName && driverName.trim() !== "") {
      const user = await User.findOne({ FirstName: new RegExp(`^${driverName}$`, "i") });
      if (!user) return res.json([]);
      userFilter.user = user._id;
    }

    // Aggregate leave counts grouped by status
    const results = await Conges.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ]);  

    res.json(results);
  } catch (err) {
    console.error("Error in /leave/pie:", err);
    res.status(500).json({ error: "Failed to fetch pie data" });
  }
});


module.exports = router;
