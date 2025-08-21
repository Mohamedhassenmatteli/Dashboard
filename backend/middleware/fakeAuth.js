// middlewares/fakeAuth.js
const mongoose = require("mongoose");
function fakeAuthenticateToken(req, res, next) {
  // Hardcode a test user
  req.user = {
    _id:  new  mongoose.Types.ObjectId("68739a5d3c51f2c156b9db14"),// fake ObjectId
    role: "super_admin",
    FirstName: "sirine",
    LastName: "sayari",
  };
  next();
}

function fakeAuthorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Check hardcoded role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { fakeAuthenticateToken, fakeAuthorizeRoles };
