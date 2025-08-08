const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET KPIs with optional driver & manager filter
router.get("/kpis", async (req, res) => {
  const { driver, managerId } = req.query;
  let whereClauses = [];
  let params = [];

  if (managerId && managerId !== "") {
    whereClauses.push("D.manager = $" + (params.length + 1));
    params.push(managerId);
  }
  if (driver && driver !== "") {
    whereClauses.push("D.firstname = $" + (params.length + 1));
    params.push(driver);
  }
  const whereClause = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

  try {
    const result = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN T.status_trip = 'in_progress' THEN 1 END) AS in_progress,
        COUNT(CASE WHEN T.status_trip = 'delayed' THEN 1 END) AS delayed,
        COUNT(CASE WHEN T.status_trip = 'canceled' THEN 1 END) AS canceled,
        COUNT(CASE WHEN T.status_trip = 'completed' THEN 1 END) AS completed,
        COUNT(*) AS total
      FROM trips T
      INNER JOIN driver D ON T.id_driver = D._id
      ${whereClause};
      `,
      params
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching KPIs:", err);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
});

// GET Average Departure Time per driver (filtered by driver & manager)
router.get("/departure-times", async (req, res) => {
  const { driver, managerId } = req.query;
  let whereClauses = [];
  let params = [];

  if (managerId && managerId !== "") {
    whereClauses.push("D.manager = $" + (params.length + 1));
    params.push(managerId);
  }
  if (driver && driver !== "") {
    whereClauses.push("D.firstname = $" + (params.length + 1));
    params.push(driver);
  }
  const whereClause = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

  try {
    const result = await pool.query(
      `
      SELECT 
        D.firstname, 
        D.last_name,
        T.destination,
        ROUND(AVG(EXTRACT(HOUR FROM departure_time) + EXTRACT(MINUTE FROM departure_time)/60.0), 2) AS avgdeparturehour
      FROM trips T
      INNER JOIN driver D ON T.id_driver = D._id
      ${whereClause}
      GROUP BY D.firstname, D.last_name, T.destination
      ORDER BY D.firstname
      LIMIT 10;
      `,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching departure times:", err);
    res.status(500).json({ error: "Failed to fetch departure times" });
  }
});

// GET Trips by date (filtered by driver & manager)
router.get("/trips-by-date", async (req, res) => {
  const { driver, managerId } = req.query;
  let whereClauses = [];
  let params = [];

  if (managerId && managerId !== "") {
    whereClauses.push("D.manager = $" + (params.length + 1));
    params.push(managerId);
  }
  if (driver && driver !== "") {
    whereClauses.push("D.firstname = $" + (params.length + 1));
    params.push(driver);
  }
  const whereClause = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

  try {
    const result = await pool.query(
      `
      SELECT 
        TO_CHAR(T.created_at, 'YYYY-MM') AS year, 
        COUNT(*) AS trip_count
      FROM trips T
      INNER JOIN driver D ON T.id_driver = D._id
      ${whereClause}
      GROUP BY year
      ORDER BY year;
      `,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching trips by date:", err);
    res.status(500).json({ error: "Failed to fetch trips by date" });
  }
});

// GET Drivers list for a manager (filtered by managerId)
router.get("/drivers", async (req, res) => {
  const { managerId } = req.query;
  if (!managerId) {
    return res.status(400).json({ error: "Missing managerId parameter" });
  }

  try {
    const result = await pool.query(
      `
      SELECT  DISTINCT D._id, firstname, last_name 
      FROM driver  AS D
      INNER JOIN  TRIPS AS T ON T.id_driver = D._id
      WHERE manager = $1
      ORDER BY firstname;
      `,
      [managerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

module.exports = router;
