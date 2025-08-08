const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/leave/manager/insight
router.get("/insight", async (req, res) => {
  const driver = req.query.driver;
  const managerId = req.query.managerId;

  let whereClause = "";
  const params = [];

  if (managerId) {
    whereClause = "WHERE D.manager = $1";
    params.push(managerId);
  }

  if (driver && driver !== "") {
    if (whereClause) {
      whereClause += ` AND D.firstname = $${params.length + 1}`;
    } else {
      whereClause = "WHERE D.firstname = $1";
    }
    params.push(driver);
  }

  try {
    const [totalRequestResult, periodResult, usersResult] = await Promise.all([
      pool.query(
        `
        SELECT COUNT(*) AS total_request 
        FROM time_off AS T
        INNER JOIN DRIVER AS D ON T.user_id = D._id
        ${whereClause}
        `,
        params
      ),
      pool.query(
        `
        SELECT period AS Periods 
        FROM time_off AS T
        INNER JOIN DRIVER AS D ON T.user_id = D._id
        ${whereClause}
        LIMIT 1;
        `,
        params
      ),
      pool.query(
        `
        SELECT DISTINCT D.firstname, D.last_name, D._id 
        FROM DRIVER AS D INNER JOIN TIME_OFF AS T ON  T.user_id = D._id
        WHERE D.manager = $1
        ORDER BY D.firstname;
        `,
        [managerId]
      )
    ]);

    res.json({
      TotalRequest: parseInt(totalRequestResult.rows[0]?.total_request || 0),
      Period: periodResult.rows[0]?.periods || "N/A",
      users: usersResult.rows,
    });
  } catch (err) {
    console.error("Error in /leave/manager/insight:", err);
    res.status(500).json({ error: "Failed to fetch leave insights" });
  }
});

// GET /api/leave/manager/drill
router.get("/drill", async (req, res) => {
  const driver = req.query.driver;
  const managerId = req.query.managerId;
  const { level = "year", value } = req.query;

  let groupBy = "";
  let filterClause = "";
  const params = [];

  if (level === "year") {
    groupBy = "TO_CHAR(T.created_at, 'YYYY')";
  } else if (level === "month") {
    groupBy = "TO_CHAR(T.created_at, 'YYYY-MM')";
    if (value) {
      filterClause = "WHERE TO_CHAR(T.created_at, 'YYYY') = $1";
      params.push(value);
    }
  } else if (level === "day") {
    groupBy = "TO_CHAR(T.created_at, 'YYYY-MM-DD')";
    if (value) {
      filterClause = "WHERE TO_CHAR(T.created_at, 'YYYY-MM') = $1";
      params.push(value);
    }
  } else {
    return res.status(400).json({ error: "Invalid drill level" });
  }

  // Add manager filter
  if (managerId) {
    if (filterClause) {
      filterClause += ` AND D.manager= $${params.length + 1}`;
    } else {
      filterClause = "WHERE D.manager = $1";
    }
    params.push(managerId);
  }

  // Add driver filter
  if (driver && driver !== "") {
    filterClause += ` AND D.firstname = $${params.length + 1}`;
    params.push(driver);
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        ${groupBy} AS period,
        type,
        COUNT(*) AS count_time_off
      FROM time_off AS T
      INNER JOIN DRIVER AS D ON T.user_id = D._id
      ${filterClause}
      GROUP BY ${groupBy}, type
      ORDER BY period;
      `,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error in /leave/manager/drill:", err);
    res.status(500).json({ error: "Failed to fetch drill data" });
  }
});

// GET /api/leave/manager/pie
router.get("/pie", async (req, res) => {
  const driver = req.query.driver;
  const managerId = req.query.managerId;

  let whereClause = "";
  const params = [];

  if (managerId) {
    whereClause = "WHERE D.manager= $1";
    params.push(managerId);
  }

  if (driver && driver !== "") {
    if (whereClause) {
      whereClause += ` AND D.firstname = $${params.length + 1}`;
    } else {
      whereClause = "WHERE D.firstname = $1";
    }
    params.push(driver);
  }

  try {
    const result = await pool.query(
      `
      SELECT T.status, COUNT(*) AS count
      FROM time_off T
      INNER JOIN DRIVER D ON T.user_id = D._id
      ${whereClause}
      GROUP BY T.status;
      `,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error in /leave/manager/pie:", err);
    res.status(500).json({ error: "Failed to fetch pie data" });
  }
});

module.exports = router;
