const mongoose = require('mongoose');

const congesSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, default: 'pending' }, // e.g. "pending", "approved", "rejected"
  typeConge: { type: String, required: true },  // e.g. "vacance", "sick"
  periode: { type: String, required: true },    // e.g. "3 jours"
  justificatif: { type: String, default: null }, // file path or URL
  validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  collection: 'conges',
});

module.exports = mongoose.model('conges', congesSchema);
