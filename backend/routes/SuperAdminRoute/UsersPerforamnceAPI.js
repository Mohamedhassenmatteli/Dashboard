const express = require("express");
const router = express.Router();
const Message = require("../../models/message");
const User = require("../../models/user");
const { authenticateToken, authorizeRoles } = require("../../middleware/authMiddleware");
//const { fakeAuthenticateToken, fakeAuthorizeRoles } = require("../../middleware/fakeAuth"); FOR TESTING
// authentication & super_admin role
router.get(
  "/insights",
  authenticateToken,
  authorizeRoles("super_admin"),
  async (req, res) => {
    try {
      
      const messagesCountPromise = Message.countDocuments();
      const activeDriversCountPromise = User.countDocuments({ role: "driver", isActive: true });
      const managersCountPromise = User.countDocuments({ role: "manager" });
      const driversCountPromise = User.countDocuments({ role: "driver" });

      const usersPerMonthPromise = User.aggregate([
        { $match: { role: "driver" } },
        {
          $group: {
            _id: { $month: "$created_at" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id": 1 } },
        {
          $project: {
            month: {
              $let: {
                vars: {
                  monthsInString: ["", "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
                },
                in: { $arrayElemAt: ["$$monthsInString", { $ifNull: ["$_id", 0] }] },
              },
            },
            count: { $ifNull: ["$count", 0] },
            _id: 0,
          },
        },
      ]);

      const usersPerCountryPromise = User.aggregate([
        { $match: { role: "driver" } },
        {
          $group: {
            _id: "$country",
            total_count: { $sum: 1 },
          },
        },
        {
          $project: {
            country: { $ifNull: ["$_id", "Unknown"] },
            total_count: { $ifNull: ["$total_count", 0] },
            _id: 0,
          },
        },
      ]);

      const activeInactiveByRolePromise = User.aggregate([
        {
          $group: {
            _id: "$role",
            active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } },
          },
        },
        {
          $project: {
            role: { $ifNull: ["$_id", "Unknown"] },
            active: 1,
            inactive: 1,
            _id: 0,
          },
        },
      ]);

      const mustChangePasswordPromise = User.aggregate([
        { $match: { role: "driver" } },
        {
          $group: {
            _id: null,
            mustChangeCount: { $sum: { $cond: ["$mustChangePassword", 1, 0] } },
            totalCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            mustChangePercentage: {
              $cond: [
                { $eq: ["$totalCount", 0] },
                0,
                { $multiply: [{ $divide: ["$mustChangeCount", "$totalCount"] }, 100] },
              ],
            },
          },
        },
      ]);

      const [
        messagesCount,
        activeDriversCount,
        managersCount,
        driversCount,
        usersPerMonth,
        usersPerCountry,
        activeInactiveByRole,
        mustChangePasswordArr,
      ] = await Promise.all([
        messagesCountPromise,
        activeDriversCountPromise,
        managersCountPromise,
        driversCountPromise,
        usersPerMonthPromise,
        usersPerCountryPromise,
        activeInactiveByRolePromise,
        mustChangePasswordPromise,
      ]);

      const mustChangePassword = mustChangePasswordArr[0]?.mustChangePercentage || 0;

      res.json({
        messages: messagesCount || 0,
        activeUsers: activeDriversCount || 0,
        managers: managersCount || 0,
        drivers: driversCount || 0,
        usersPerMonth: usersPerMonth || [],
        usersPerCountry: usersPerCountry || [],
        activeInactiveByRole: activeInactiveByRole || [],
        mustChangePassword: parseFloat(mustChangePassword.toFixed(1)),
      });
    } catch (err) {
      console.error("Error in /insights:", err);
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  }
);

module.exports = router;
