const express = require("express");
const router = express.Router();
const Truck = require("../../models/camion");
const { authenticateToken, authorizeRoles } = require("../../middleware/authMiddleware");
// const { fakeAuthenticateToken, fakeAuthorizeRoles } = require("../../middleware/fakeAuth") FOR TESTING

// GET Truck performance (all trucks)
router.get(
  "/truck-performance",
  authenticateToken,
  authorizeRoles("manager"),
  async (req, res) => {
    try {
      const trucks = await Truck.find({}).lean();

      const performanceData = trucks.map(truck => {
        const statusRaw = String(truck.status || "available");
        let statusLabel = "Disponible";

        if (statusRaw === "in_progress") statusLabel = "En Route";
        else if (statusRaw === "under_maintenance") statusLabel = "En Maintenance";
        else if (statusRaw === "out_of_service") statusLabel = "Out of Service";

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
  }
);

module.exports = router;
