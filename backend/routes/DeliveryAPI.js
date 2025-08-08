const express = require("express");
const router = express.Router();
const Trip = require("../models/trip"); // Your Mongoose Trip model

// GET /api/delivery/insights
router.get("/insights", async (req, res) => {
  const destination = req.query.destination;
  try {
    const match = {};
    if (destination && destination !== "") {
      match.destination = destination;
    }

    // Aggregation to calculate percentages and total count
    const agg = [
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          delayedCount: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "delayed"] }, 1, 0] },
          },
          canceledCount: {
            $sum: { $cond: [{ $eq: ["$statusTrip", "canceled"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          Delayed: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              {
                $round: [{ $multiply: [{ $divide: ["$delayedCount", "$total"] }, 100] }, 1],
              },
            ],
          },
          Canceled: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              {
                $round: [{ $multiply: [{ $divide: ["$canceledCount", "$total"] }, 100] }, 1],
              },
            ],
          },
          TotalTrips: "$total",
        },
      },
    ];

    const result = await Trip.aggregate(agg);

    res.json(result[0] || { Delayed: 0, Canceled: 0, TotalTrips: 0 });
  } catch (err) {
    console.error("Error in /delivery/insights:", err);
    res.status(500).json({ error: "Failed to fetch delivery insights" });
  }
});

// GET /api/delivery/drill
router.get("/drill", async (req, res) => {
  const destination = req.query.destination;
  const { level = "year", value } = req.query;

  let dateFormat;
  let match = {};
  if (destination && destination !== "") {
    match.destination = destination;
  }

  // Add filters based on drill level and value
  const dateFilters = {};
  if (level === "year") {
    dateFormat = "%Y";
  } else if (level === "month") {
    dateFormat = "%Y-%m";
    if (value) {
      // Filter by year equal to value
      dateFilters.year = value;
    }
  } else if (level === "day") {
    dateFormat = "%Y-%m-%d";
    if (value) {
      // Filter by month equal to value
      dateFilters.month = value;
    }
  } else {
    return res.status(400).json({ error: "Invalid drill level" });
  }

  // We'll use $dateToString to format createdAt and group by it.

  try {
    // Build aggregation pipeline
    const pipeline = [];

    // Match destination filter first
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    // Additional filtering on createdAt depending on level and value
    if (level === "month" && value) {
      // value = year, so filter createdAt year = value
      pipeline.push({
        $match: {
          createdAt: {
            $gte: new Date(`${value}-01-01T00:00:00.000Z`),
            $lt: new Date(`${parseInt(value) + 1}-01-01T00:00:00.000Z`),
          },
        },
      });
    } else if (level === "day" && value) {
      // value = year-month, e.g. "2023-08"
      const [year, month] = value.split("-");
      const nextMonth = parseInt(month) + 1;
      pipeline.push({
        $match: {
          createdAt: {
            $gte: new Date(`${year}-${month}-01T00:00:00.000Z`),
            $lt:
              nextMonth <= 12
                ? new Date(`${year}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00.000Z`)
                : new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`),
          },
        },
      });
    }

    pipeline.push({
      $group: {
        _id: {
          period: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          statusTrip: "$statusTrip",
        },
        count_trips: { $sum: 1 },
      },
    });

    pipeline.push({
      $project: {
        _id: 0,
        period: "$_id.period",
        status_trip: "$_id.statusTrip",
        count_trips: 1,
      },
    });

    pipeline.push({
      $sort: { period: 1 },
    });

    const result = await Trip.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    console.error("Error in /delivery/drill:", err);
    res.status(500).json({ error: "Failed to fetch drill data" });
  }
});

// GET /api/delivery/map-data
router.get("/map-data", async (req, res) => {
  const destination = req.query.destination;
  const { level = "year", value } = req.query;

  let dateFormat;
  const match = {};

  if (destination && destination !== "") {
    match.destination = destination;
  }

  if (level === "year") {
    dateFormat = "%Y";
  } else if (level === "month") {
    dateFormat = "%Y-%m";
  } else if (level === "day") {
    dateFormat = "%Y-%m-%d";
  } else {
    return res.status(400).json({ error: "Invalid drill level" });
  }

  // Date range filter (similar to /drill)
  if (value) {
    if (level === "month") {
      match.createdAt = {
        $gte: new Date(`${value}-01T00:00:00.000Z`),
        $lt: new Date(`${parseInt(value.slice(0, 4)) + 1}-01-01T00:00:00.000Z`),
      };
    } else if (level === "day") {
      const [year, month] = value.split("-");
      const nextMonth = parseInt(month) + 1;
      match.createdAt = {
        $gte: new Date(`${year}-${month}-01T00:00:00.000Z`),
        $lt:
          nextMonth <= 12
            ? new Date(`${year}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00.000Z`)
            : new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`),
      };
    }
  }

  try {
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: "$createdAt" } },
            destination: "$destination",
            statusTrip: "$statusTrip",
          },
          count_trips: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id.period",
          destination: "$_id.destination",
          status_trip: "$_id.statusTrip",
          count_trips: 1,
        },
      },
      { $sort: { destination: 1 } },
    ];

    const result = await Trip.aggregate(pipeline);

    res.json(result);
  } catch (err) {
    console.error("Error fetching map data:", err);
    res.status(500).json({ error: "Failed to fetch map data" });
  }
});

module.exports = router;
