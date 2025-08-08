const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  FirstName: { type: String, required: true },
  LastName: { type: String },
  email_user: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },          // e.g. "super_admin", "driver", "manager"
  num_user: { type: Number, default: null },
  country: { type: String, default: "" },
  image: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
  status: { type: String, default: null },          // optional, for drivers etc.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },  // optional
  Post: { type: String, default: null },            // optional, for managers
  __t: { type: String, default: null },             // discriminator key if used
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, {
  collection: 'users',
});

module.exports = mongoose.model('user', userSchema);
