const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startPoint: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    name: { type: String, required: true }
  },
  destination: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    name: { type: String, required: true }
  },
  departureDate: { type: Date },
  departureTime: { type: String },
  statusTrip: { type: String, enum: ["in_progress", "delayed", "completed", "canceled"], default: "in_progress" },
  currentLocation: {
    lat: { type: Number },
    lon: { type: Number },
    name: { type: String }
  },
  routeProgress: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  route: { type: Array, default: [] }, // array of [lat, lng]
  distance: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  route_generated_at: { type: Date, default: null },
  planned_stops: { type: Array, default: [] },
  stops_generated_at: { type: Date, default: null },
  lastUpdate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'trips',
});

module.exports = mongoose.model('Trip', tripSchema);
