const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/fleet/insights
router.get("/insights", async (req, res) => {
  try {
    const [avgMileage, totalTrucks, trucksInService, truckCapacityByBrand] = await Promise.all([
      pool.query(`
        SELECT ROUND(AVG(mileage), 2) AS avg_mileage FROM truck;
      `),
      pool.query(`
        SELECT COUNT(*) AS total_trucks FROM truck;
      `),
      pool.query(`
        SELECT COUNT(*) AS in_service FROM truck WHERE status = 'in_service';
      `),
      pool.query(`
        SELECT 
          brand,
          COUNT(*) FILTER (WHERE status = 'available') AS "Available",
          COUNT(*) FILTER (WHERE status = 'in_service') AS "In Service",
          COUNT(*) FILTER (WHERE status = 'maintenance') AS "Maintenance"
        FROM truck
        GROUP BY brand;
      `)
    ]);

    res.json({
      avgMileage: parseFloat(avgMileage.rows[0].avg_mileage),
      totalTrucks: parseInt(totalTrucks.rows[0].total_trucks),
      trucksInService: parseInt(trucksInService.rows[0].in_service),
      truckCapacityByBrand: truckCapacityByBrand.rows
    });
  } catch (err) {
    console.error("Error in /fleet/insights:", err);
    res.status(500).json({ error: "Failed to fetch fleet insights" });
  }
});
router.get("/drill", async (req, res) => {
  const { level = "year", value } = req.query;

  let groupBy = "";
  let filterClause = "";
  let params = [];

  if (level === "year") {
    groupBy = "TO_CHAR(created_at, 'YYYY')";
  } else if (level === "month") {
    groupBy = "TO_CHAR(created_at, 'YYYY-MM')";
    filterClause = "WHERE TO_CHAR(created_at, 'YYYY') = $1";
    params = [value];
  } else if (level === "day") {
    groupBy = "TO_CHAR(created_at, 'YYYY-MM-DD')";
    filterClause = "WHERE TO_CHAR(created_at, 'YYYY-MM') = $1";
    params = [value];
  } else {
    return res.status(400).json({ error: "Invalid drill level" });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        ${groupBy} AS period,
        status,
        COUNT(*) AS truck_count,
        COUNT(DISTINCT registration) AS registration_count
      FROM truck
      ${filterClause}
      GROUP BY period, status
      ORDER BY period;
      `,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error in /fleet/drill:", err);
    res.status(500).json({ error: "Failed to fetch drill data" });
  }
});

module.exports = router;
