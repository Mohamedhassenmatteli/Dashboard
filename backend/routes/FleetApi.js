const express = require("express");
const router = express.Router();
const Camion = require("../models/camion"); // Ton modèle Camion

// =============================================
// GET Fleet Insights
// =============================================
router.get("/insights", async (req, res) => {
  try {
    // Average Mileage
    const avgMileage = await Camion.aggregate([
      { $group: { _id: null, avgMileage: { $avg: "$mileage" } } },
    ]);

    // Total Trucks
    const totalTrucks = await Camion.countDocuments();

    // Trucks In Service
    const trucksInService = await Camion.countDocuments({ status: "in_service" });

    // Truck Capacity by Brand & Status
    const capacityByBrandStatus = await Camion.aggregate([
      {
        $group: {
          _id: { brand: "$brand", status: "$status" },
          totalCapacity: { $sum: "$capacity" },
        },
      },
      { $sort: { "_id.brand": 1, "_id.status": 1 } },
    ]);

    res.json({
      avgMileage: avgMileage.length > 0 ? avgMileage[0].avgMileage : 0,
      totalTrucks,
      trucksInService,
      capacityByBrandStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET Drilldown Truck Counts by Status (for stacked bars)
// =============================================
router.get("/drill", async (req, res) => {
  try {
    const { level, parent } = req.query;

    let dateFormat;
    if (level === "year") {
      dateFormat = { $dateToString: { format: "%Y", date: "$createdAt" } };
    } else if (level === "month") {
      dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else if (level === "day") {
      dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else {
      return res.status(400).json({ error: "Invalid level parameter" });
    }

    // Build match stage based on parent
    let matchStage = {};
    if (parent) {
      let startDate, endDate;
      if (parent.length === 4) { // YYYY
        startDate = new Date(`${parent}-01-01`);
        endDate = new Date(`${parseInt(parent) + 1}-01-01`);
      } else if (parent.length === 7) { // YYYY-MM
        const [year, month] = parent.split("-");
        startDate = new Date(`${year}-${month}-01`);
        let nextMonth = parseInt(month) + 1;
        let nextYear = parseInt(year);
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear++;
        }
        endDate = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01`);
      } else if (parent.length === 10) { // YYYY-MM-DD
        startDate = new Date(parent);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
      }
      matchStage = { createdAt: { $gte: startDate, $lt: endDate } };
    }

    const drillData = await Camion.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { period: dateFormat, status: "$status" },
          truck_count: { $sum: 1 }
        }
      },
      { $sort: { "_id.period": 1, "_id.status": 1 } }
    ]);

    res.json(drillData.map(doc => ({
      period: doc._id.period,
      status: doc._id.status,
      truck_count: doc.truck_count
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =============================================
// GET Drilldown for Trucks Under Maintenance
// =============================================
router.get("/drill-maintenance", async (req, res) => {
  try {
    const { level } = req.query;

    let dateFormat;
    if (level === "year") {
      dateFormat = { $dateToString: { format: "%Y", date: "$createdAt" } };
    } else if (level === "month") {
      dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else if (level === "day") {
      dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else {
      return res.status(400).json({ error: "Invalid level parameter" });
    }

    const drillMaintenanceData = await Camion.aggregate([
      { $match: { status: "maintenance" } },
      { $group: { _id: dateFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json(drillMaintenanceData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
