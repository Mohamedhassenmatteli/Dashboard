const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  truck: { type: mongoose.Schema.Types.ObjectId, ref: 'truck' }, // assuming you have a truck model
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  startPoint: { type: String, required: true },
  destination: { type: String, required: true },
  departureDate: { type: Date, required: true },
  departureTime: { type: String, required: true }, // "HH:mm" format string
  statusTrip: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'trips' // specify the collection name if needed
});

module.exports = mongoose.model('trip', tripSchema);
