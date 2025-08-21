const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  truckId: { type: String, required: true, unique: true },
  truckType: { type: String, default: "" },
  brand: { type: String, default: "" },
  capacity: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  length: { type: Number, default: 0 },
  axleCount: { type: Number, default: 0 },
  fuelType: { type: String, default: "" },
  fuelConsumption: { type: Number, default: 0 },
  emissionRate: { type: Number, default: 0 },
  ecoMode: { type: Boolean, default: false },
  hazardousCargo: { type: Boolean, default: false },
  maxAllowedSpeed: { type: Number, default: null },
  status: { type: String, default: "available" },
  mileage: { type: Number, default: 0 },
  consumption: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  bearing: { type: Number, default: 0 },
  speed: { type: Number, default: 0 },
  engineTemp: { type: Number, default: 0 },
  fuelLevel: { type: Number, default: 0 },
  startPoint: { type: String, default: "" },
  destination: { type: String, default: "" },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [] } // [lng, lat]
  },
  route: { type: Array, default: [] }, // array of {longitude, latitude}
  routeProgress: { type: Number, default: 0 },
  isAtDestination: { type: Boolean, default: false },
  stops: { type: Array, default: [] },
  state: { type: String, default: "" },
  lastUpdate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'camions',
});

module.exports = mongoose.model('camions', truckSchema);