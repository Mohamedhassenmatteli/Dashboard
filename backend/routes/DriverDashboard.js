const express = require("express");
const router = express.Router();
const pool = require("../db"); 



router.get("/info/:driverId", async (req, res) => {
  const { driverId } = req.params;
  try {
    const result = await pool.query(
      "SELECT firstname, last_name FROM driver WHERE _id = $1",
      [driverId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching driver info", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// === 1. KPIs ===
router.get("/kpis", async (req, res) => {
  const { driverId } = req.query;

  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status_trip = 'canceled') AS canceled,
        COUNT(*) FILTER (WHERE status_trip = 'completed') AS completed,
        COUNT(*) AS total
      FROM trips
      WHERE id_driver = $1
    `, [driverId]);

    // Average mileage
    const avgMileageResult = await pool.query(`
      SELECT ROUND(AVG(mileage), 2) AS avg_mileage
      FROM truck  AS TR INNER JOIN TRIPS AS T ON T.id_truck = TR._id
      WHERE T.id_driver = $1
    `, [driverId]);

    const kpis = result.rows[0];
    const avgMileage = parseFloat(avgMileageResult.rows[0].avg_mileage || 0).toFixed(2);

    res.json({
      canceled: parseInt(kpis.canceled),
      completed: parseInt(kpis.completed),
      total: parseInt(kpis.total),
      avg_mileage: parseFloat(avgMileage)
    });

  } catch (error) {
    console.error("Error fetching driver KPIs", error);
    res.status(500).json({ error: "Error fetching driver KPIs" });
  }
});

// === 2. Trips Over Time (for Line Chart with drill-down) ===
router.get("/trips-over-time", async (req, res) => {
  const { driverId, level } = req.query;

  let dateTrunc = "day";
  if (level === "month") dateTrunc = "month";
  else if (level === "year") dateTrunc = "year";

  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC($1, created_at)::date AS period,
        COUNT(*) AS trip_count
      FROM trips
      WHERE id_driver = $2
      GROUP BY period
      ORDER BY period
    `, [dateTrunc, driverId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching trips over time", error);
    res.status(500).json({ error: "Error fetching trips over time" });
  }
});

// === 3. Destination Bubbles (Map) ===
router.get("/trips-by-destination", async (req, res) => {
  const { driverId } = req.query;

  try {
    const result = await pool.query(`
      SELECT destination, COUNT(*) AS trip_count
      FROM trips
      WHERE id_driver = $1
      GROUP BY destination
    `, [driverId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching trips by destination", error);
    res.status(500).json({ error: "Error fetching trips by destination" });
  }
});

module.exports = router;
