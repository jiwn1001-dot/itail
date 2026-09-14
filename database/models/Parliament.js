const mongoose = require('mongoose');

const parliamentSchema = new mongoose.Schema({
  country_id: { type: Number, required: true, unique: true },
  senate_total: { type: Number, default: 100 },
  house_total: { type: Number, default: 300 },
  senate_name: { type: String, default: '상원' },
  house_name: { type: String, default: '하원' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Parliament', parliamentSchema);
