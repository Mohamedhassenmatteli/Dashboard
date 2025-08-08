const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/delivery/insights
router.get("/insights", async (req, res) => {
  const destination = req.query.destination;
  let whereClause = "";
  const params = [];

  if (destination && destination !== '') {
    whereClause = "WHERE destination = $1";
    params.push(destination);
  }

  try {
    const [DelayedResult, CanceledResult, TotalTripsResult] = await Promise.all([
      pool.query(
        `
        SELECT
          ROUND(
            (SUM(CASE WHEN status_trip = 'delayed' THEN 1 ELSE 0 END)::decimal 
             / NULLIF(COUNT(*),0)) * 100, 1
          ) AS "Delayed"
        FROM trips
        ${whereClause};
        `,
        params
      ),
      pool.query(
        `
        SELECT
          ROUND(
            (SUM(CASE WHEN status_trip = 'canceled' THEN 1 ELSE 0 END)::decimal
             / NULLIF(COUNT(*),0)) * 100, 1
          ) AS "Canceled"
        FROM trips
        ${whereClause};
        `,
        params
      ),
      pool.query(
        `
        SELECT COUNT(*) AS "TotalTrips" FROM trips
        ${whereClause};
        `,
        params
      ),
    ]);

    res.json({
      Delayed: parseFloat(DelayedResult.rows[0].Delayed) || 0,
      Canceled: parseFloat(CanceledResult.rows[0].Canceled) || 0,
      TotalTrips: parseInt(TotalTripsResult.rows[0].TotalTrips) || 0,
    });
  } catch (err) {
    console.error("Error in /delivery/insights:", err);
    res.status(500).json({ error: "Failed to fetch delivery insights" });
  }
});

// GET /api/delivery/drill
router.get("/drill", async (req, res) => {
  const destination = req.query.destination;
  const { level = "year", value } = req.query;

  let groupBy = "";
  let filterClause = "";
  const params = [];

  if (level === "year") {
    groupBy = "TO_CHAR(created_at, 'YYYY')";
  } else if (level === "month") {
    groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
    if (value) {
      filterClause = "WHERE TO_CHAR(created_at, 'YYYY') = $1";
      params.push(value);
    }
  } else if (level === "day") {
    groupBy = "TO_CHAR(created_at, 'YYYY-MM-DD')";
    if (value) {
      filterClause = "WHERE TO_CHAR(created_at, 'YYYY-MM') = $1";
      params.push(value);
    }
  } else {
    return res.status(400).json({ error: "Invalid drill level" });
  }

  // destination filter
  if (destination && destination !== "") {
    if (filterClause.length > 0) {
      filterClause += ` AND destination = $${params.length + 1}`;
    } else {
      filterClause = `WHERE destination = $1`;
    }
    params.push(destination);
  }
  

  try {
    const result = await pool.query(
      `
      SELECT 
        ${groupBy} AS period,
        status_trip,
        COUNT(*) AS count_trips
      FROM trips
      ${filterClause}
      GROUP BY period, status_trip
      ORDER BY period;
      `,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error in /delivery/drill:", err);
    res.status(500).json({ error: "Failed to fetch drill data" });
  }
});
router.get("/map-data", async (req, res) => {
  const destinationFilter = req.query.destination;
  const { level = "year", value } = req.query;
  const params = [];
  let whereClause = "";
  let groupBy = "";

  if (destinationFilter && destinationFilter !== "") {
    whereClause = "WHERE destination = $1";
    params.push(destinationFilter);
  }
   if (level === "year") {
    groupBy = "TO_CHAR(created_at, 'YYYY')";
  } else if (level === "month") {
    groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
    if (value) {
      filterClause = "WHERE TO_CHAR(created_at, 'YYYY') = $1";
      params.push(value);
    }
  } else if (level === "day") {
    groupBy = "TO_CHAR(created_at, 'YYYY-MM-DD')";
    if (value) {
      filterClause = "WHERE TO_CHAR(created_at, 'YYYY-MM') = $1";
      params.push(value);
    }
  } else {
    return res.status(400).json({ error: "Invalid drill level" });
  }

  try {
    const query = `
      SELECT
       ${groupBy},
        destination,
        status_trip,
        COUNT(*) AS count_trips
      FROM trips
      ${whereClause}
      GROUP BY  ${groupBy} , destination, status_trip
      ORDER BY destination;
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching map data:", err);
    res.status(500).json({ error: "Failed to fetch map data" });
  }
});


module.exports = router;
