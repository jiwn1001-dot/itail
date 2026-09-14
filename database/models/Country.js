const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  flag_emoji: { type: String, default: '🏳️' },
  owner_id: { type: String, default: '' },
  leader_name: { type: String, default: '' },
  leader_title: { type: String, default: '' },
  leader_description: { type: String, default: '' },
  leader_image: { type: String, default: '' },
  gdp: { type: Number, default: 0 },
  army_power: { type: Number, default: 0 },
  navy_power: { type: Number, default: 0 },
  airforce_power: { type: Number, default: 0 },
  nuclear_power: { type: Number, default: 0 },
  stability: { type: Number, default: 50 },
  war_support: { type: Number, default: 50 },
  color: { type: String, default: '#5865F2' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Country', countrySchema);
