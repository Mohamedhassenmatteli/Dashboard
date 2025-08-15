const express = require("express");
const router = express.Router();
const Message = require("../../models/message");
const User = require("../../models/user"); // all users: drivers, managers, super_admins


router.get("/insights", async (req, res) => {
  try {
    // Count total messages
    const messagesCountPromise = Message.countDocuments();

    // Count active drivers
    const activeDriversCountPromise = User.countDocuments({ role: "driver", isActive: true });

    // Count managers
    const managersCountPromise = User.countDocuments({ role: "manager" });

    // Count drivers
    const driversCountPromise = User.countDocuments({ role: "driver" });

    // Users per month aggregation (group by month name)
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
                monthsInString: [
                  "",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: { $arrayElemAt: ["$$monthsInString", { $ifNull: ["$_id", 0] }] },
            },
          },
          count: { $ifNull: ["$count", 0] },
          _id: 0,
        },
      },
    ]);

    // Users per country
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

    // Active vs inactive users by role
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

    // Percentage of drivers who must change password
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

    // Await all promises in parallel
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
});

module.exports = router;
