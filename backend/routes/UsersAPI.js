const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const User = require("../models/user"); // all users: drivers, managers, super_admins

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
      {
        $sort: { "_id": 1 },
      },
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
              in: { $arrayElemAt: ["$$monthsInString", "$_id"] },
            },
          },
          count: 1,
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
          country: "$_id",
          total_count: 1,
          _id: 0,
        },
      },
    ]);

    // Active vs inactive users by role
    const activeInactiveByRolePromise = User.aggregate([
      {
        $group: {
          _id: "$role",
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          inactive: { $sum: { $cond: [{ $not: "$isActive" }, 1, 0] } },
        },
      },
      {
        $project: {
          role: "$_id",
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
      messages: messagesCount,
      activeUsers: activeDriversCount,
      managers: managersCount,
      drivers: driversCount,
      usersPerMonth,
      usersPerCountry,
      activeInactiveByRole,
      mustChangePassword: parseFloat(mustChangePassword.toFixed(1)),
    });
  } catch (err) {
    console.error("Error in /insights:", err);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

module.exports = router;
