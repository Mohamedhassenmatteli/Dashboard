const express = require("express");
const router = express.Router();
const Trip = require("../../models/trip");



const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// ------------------- INSIGHTS -------------------
router.get("/insights", async (req, res) => {
  const { destination } = req.query;
  try {
    const match = {};
    if (destination) {
      match["destination.name"] = { 
        $regex: new RegExp(escapeRegex(destination.trim()), "i")
      };
    }

    const agg = [
      { $match: match },
      {
        $group: {
          _id: "$destination.name",
          totalTrips: { $sum: 1 },
          delayedCount: { $sum: { $cond: [{ $eq: ["$statusTrip", "delayed"] }, 1, 0] } },
          canceledCount: { $sum: { $cond: [{ $eq: ["$statusTrip", "failed"] }, 1, 0] } },
          totalDistance: { $sum: { $ifNull: ["$distance", 0] } },
          avgDuration: { $avg: { $ifNull: ["$duration", 0] } },
          totalStops: { $sum: { $size: { $ifNull: ["$planned_stops", []] } } },
        },
      },
      {
        $project: {
          _id: 0,
          destination: "$_id",
          TotalTrips: "$totalTrips",
          Delayed: "$delayedCount",   // raw count
          Canceled: "$canceledCount", // raw count
          TotalDistance: { $round: ["$totalDistance", 2] },
          AvgDuration: { $round: ["$avgDuration", 2] },
          TotalStops: "$totalStops",
        },
      },
      { $sort: { destination: 1 } },
    ];

    const result = await Trip.aggregate(agg);
    res.json(result);
  } catch (err) {
    console.error("Error in /delivery/insights:", err);
    res.status(500).json({ error: "Failed to fetch delivery insights" });
  }
});


// ------------------- DRILL -------------------
router.get("/drill", async (req, res) => {
  const { destination, level = "year", value } = req.query;

  const match = {};
if (destination) {
  match["destination.name"] = { 
    $regex: new RegExp(escapeRegex(destination.trim()), "i")
  };
}

  let dateFormat = "%Y";
  if (level === "month") dateFormat = "%Y-%m";
  else if (level === "day") dateFormat = "%Y-%m-%d";

  try {
    const pipeline = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });

    if (value) {
      let start, end;
      if (level === "year") {
        const year = parseInt(value);
        if (!isNaN(year)) {
          start = new Date(`${year}-01-01T00:00:00.000Z`);
          end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
        }
      } else if (level === "month") {
        const [year, month] = value.split("-");
        if (year && month) {
          const nextMonth = parseInt(month) + 1;
          start = new Date(`${year}-${month}-01T00:00:00.000Z`);
          end =
            nextMonth <= 12
              ? new Date(`${year}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000Z`)
              : new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`);
        }
      } else if (level === "day") {
        const [year, month, day] = value.split("-");
        if (year && month && day) {
          start = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
          end = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
        }
      }
      if (start && end) pipeline.push({ $match: { createdAt: { $gte: start, $lt: end } } });
    }

    pipeline.push({
      $group: {
        _id: { period: { $dateToString: { format: dateFormat, date: "$createdAt" } }, statusTrip: "$statusTrip" },
        count_trips: { $sum: 1 },
      },
    });

    pipeline.push({
      $project: { _id: 0, period: "$_id.period", status_trip: "$_id.statusTrip", count_trips: 1 },
    });

    pipeline.push({ $sort: { period: 1 } });

    const result = await Trip.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    console.error("Error in /delivery/drill:", err);
    res.status(500).json({ error: "Failed to fetch drill data" });
  }
});

// ------------------- MAP DATA -------------------
router.get("/map-data", async (req, res) => {
  const { destination } = req.query;
  const match = {};
if (destination) {
  match["destination.name"] = { 
    $regex: new RegExp(escapeRegex(destination.trim()), "i")
  };
}

  try {
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            destination: "$destination.name",
            statusTrip: "$statusTrip",
            lat: "$destination.lat",
            lon: "$destination.lon",
          },
          count_trips: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          destination: "$_id.destination",
          status_trip: "$_id.statusTrip",
          count_trips: 1,
          coords: ["$_id.lat", "$_id.lon"],
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

// ------------------- STOPS -------------------
router.get("/stops", async (req, res) => {
  const { destination, date, level } = req.query;
  const match = {};

if (destination) {
  match["destination.name"] = { 
    $regex: new RegExp(escapeRegex(destination.trim()), "i")
  };
}
  if (date) {
    try {
      let start, end;
      if (level === "day") {
        start = new Date(`${date}T00:00:00.000Z`);
        end = new Date(`${date}T23:59:59.999Z`);
      } else if (level === "month") {
        const [year, month] = date.split("-");
        const nextMonth = parseInt(month) + 1;
        start = new Date(`${year}-${month}-01T00:00:00.000Z`);
        end =
          nextMonth <= 12
            ? new Date(`${year}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000Z`)
            : new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`);
      } else if (level === "year") {
        const year = parseInt(date);
        start = new Date(`${year}-01-01T00:00:00.000Z`);
        end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
      }
      if (start && end) match.createdAt = { $gte: start, $lt: end };
    } catch (err) {
      console.warn("Invalid date for stops filter:", date);
    }
  }

  try {
    const result = await Trip.aggregate([
      { $match: match },
      { $project: { stopsCount: { $size: { $ifNull: ["$planned_stops", []] } } } },
      { $group: { _id: null, totalStops: { $sum: "$stopsCount" } } },
    ]);

    res.json({ totalStops: result.length ? result[0].totalStops : 0 });
  } catch (err) {
    console.error("Error in /delivery/stops:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
