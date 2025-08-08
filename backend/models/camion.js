const mongoose = require("mongoose");

const camionSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    capacity: { type: Number, required: true },
    mileage: { type: Number, required: true },
    status: { type: String, required: true }, // e.g. 'in_service', 'available', etc.
    registration: { type: String, required: true, unique: true },
  },
  { timestamps: true } // will add createdAt and updatedAt automatically
);

module.exports = mongoose.model("camion", camionSchema, "camion"); // explicitly specify collection name "camions"
