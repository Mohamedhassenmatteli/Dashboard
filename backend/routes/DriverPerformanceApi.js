const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET KPIs with optional driver filter
router.get("/kpis", async (req, res) => {
  const driver = req.query.driver;
  let whereClause = "";
  const params = [];

  if (driver && driver !== "") {
    whereClause = "WHERE D.firstname = $1";
    params.push(driver);
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN status_trip = 'in_progress' THEN 1 END) AS in_progress,
        COUNT(CASE WHEN status_trip = 'delayed' THEN 1 END) AS delayed,
        COUNT(CASE WHEN status_trip = 'canceled' THEN 1 END) AS canceled,
        COUNT(CASE WHEN status_trip = 'completed' THEN 1 END) AS completed,
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

// GET Average Departure Time per driver (filtered)
router.get("/departure-times", async (req, res) => {
  const driver = req.query.driver;
  let whereClause = "";
  const params = [];

  if (driver && driver !== "") {
    whereClause = "WHERE D.firstname = $1";
    params.push(driver);
  }

  try {
    const result = await pool.query(
      `
     SELECT 
        DISTINCT
        D.firstname, 
        D.last_name,
        T.destination,
          ROUND(AVG(EXTRACT(HOUR FROM departure_time) + EXTRACT(MINUTE FROM departure_time)/60.0), 2) AS avgdeparturehour
      FROM trips AS  T
      INNER JOIN driver AS D ON T.id_driver = D._id
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

// GET Trips by date (filtered)
router.get("/trips-by-date", async (req, res) => {
  const driver = req.query.driver;
  let whereClause = "";
  const params = [];

  if (driver && driver !== "") {
    whereClause = "WHERE D.firstname = $1";
    params.push(driver);
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        TO_CHAR(T.created_at, 'YYYY') AS year, 
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

// GET Drivers list (distinct)
router.get("/drivers", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT D._id, firstname, last_name 
      FROM driver AS D
      INNER JOIN TRIPS AS T ON D._id = T.id_driver
      ORDER BY firstname;
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

module.exports = router;
