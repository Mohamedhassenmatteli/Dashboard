const express = require("express");
const router = express.Router();
const Truck = require("../../models/camion");

// GET Truck performance (all trucks)
router.get("/truck-performance", async (req, res) => {
  try {
    const trucks = await Truck.find({}).lean(); // fetch all trucks

    const performanceData = trucks.map(truck => {
      // Map raw status to readable labels
     const statusRaw = String(truck.status || "available"); // convert to string
      let statusLabel = "Disponible";

      if (statusRaw === "in_progress") statusLabel = "En Route";
      else if (statusRaw === "maintenance") statusLabel = "En Maintenance";

      // Distance in km
      const distanceKm = Number(truck.distance || 0) / 1000;

      

      return {
        truckId: truck.truckId || null,
        brand: truck.brand || "Inconnu",
        type: truck.truckType || "Non spécifié",
        status: statusLabel,
        distance: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(2)) : 0,
        fuelConsumed: Number(truck.fuelConsumption || 0),
      };
    });

    res.json({ trucks: performanceData });
  } catch (error) {
    console.error("Error fetching truck performance:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
