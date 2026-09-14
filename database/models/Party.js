const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  country_id: { type: Number, required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#808080' },
  ideology: { type: String, default: '' },
  support_rate: { type: Number, default: 0 },
  senate_seats: { type: Number, default: 0 },
  house_seats: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Party', partySchema);
