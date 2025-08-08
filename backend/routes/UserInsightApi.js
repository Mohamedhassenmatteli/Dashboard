// backend/routes/superadmin.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/insights", async (req, res) => {
  try {
   const [messages, activeUsers, managers, drivers, usersPerMonth, usersPerGouv, active_vs_inactive, mustchangepassword] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM message"),
    pool.query("SELECT COUNT(*) FROM driver WHERE is_active = true"),
    pool.query("SELECT COUNT(*) FROM manager"),
    pool.query("SELECT COUNT(*) FROM driver"),
    pool.query(`
      SELECT TO_CHAR(created_at, 'Mon') AS month,
            COUNT(*) AS count
      FROM driver
      GROUP BY month, EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
    `),
    pool.query(`
      SELECT country,
            COUNT(*) AS total_count
      FROM driver
      GROUP BY country;
    `),
    pool.query(`
      SELECT 'super_admin' AS role,
            COUNT(*) FILTER (WHERE is_active = true) AS active,
            COUNT(*) FILTER (WHERE is_active = false) AS inactive
      FROM super_admin
      UNION ALL
      SELECT 'manager' AS role,
            COUNT(*) FILTER (WHERE is_active = true) AS active,
            COUNT(*) FILTER (WHERE is_active = false) AS inactive
      FROM manager
      UNION ALL
      SELECT 'driver' AS role,
            COUNT(*) FILTER (WHERE is_active = true) AS active,
            COUNT(*) FILTER (WHERE is_active = false) AS inactive
      FROM driver;
    `),
    pool.query(`
      SELECT 
        ROUND(
          (SUM(CASE WHEN mustchangepassword = TRUE THEN 1 ELSE 0 END)::decimal 
          / COUNT(*)) * 100, 1
        ) AS must_change_percentage
      FROM driver;
    `)
  ]);

  res.json({
    messages: parseInt(messages.rows[0].count),
    activeUsers: parseInt(activeUsers.rows[0].count),
    managers: parseInt(managers.rows[0].count),
    drivers: parseInt(drivers.rows[0].count),
    usersPerMonth: usersPerMonth.rows,
    usersPerGouv: usersPerGouv.rows,
    activeInactiveByRole: active_vs_inactive.rows.map(row => ({
        role: row.role,
        active: parseInt(row.active),
        inactive: parseInt(row.inactive),
      })), // renamed for clarity
    mustChangePassword: mustchangepassword.rows[0].must_change_percentage // renamed for clarity
  });

  } catch (err) {
    console.error("Error in /insights:", err);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

module.exports = router;
