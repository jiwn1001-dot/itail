const mongoose = require('mongoose');
const Country = require('./models/Country');
const Party = require('./models/Party');
const Parliament = require('./models/Parliament');

async function connect(uri) {
  if (!uri) throw new Error('MONGODB_URI is not provided.');
  await mongoose.connect(uri);
  console.log('✅ MongoDB에 성공적으로 연결되었습니다.');
}

async function getNextId(Model) {
  const lastDoc = await Model.findOne().sort({ id: -1 });
  return lastDoc ? lastDoc.id + 1 : 1;
}

module.exports = {
  connect,
  
  // ===== Countries =====
  getCountries: async () => {
    return await Country.find().sort({ name: 1 }).lean();
  },
  
  getCountryById: async (id) => {
    return await Country.findOne({ id: parseInt(id) }).lean();
  },
  
  getCountryByName: async (name) => {
    return await Country.findOne({ name }).lean();
  },

  getCountryByOwnerId: async (ownerId) => {
    return await Country.findOne({ owner_id: ownerId }).lean();
  },
  
  searchCountriesByName: async (keyword) => {
    return await Country.find({ name: { $regex: keyword, $options: 'i' } })
      .limit(25)
      .lean();
  },
  
  getCountriesOrderByGdp: async () => {
    return await Country.find().sort({ gdp: -1 }).lean();
  },
  
  insertCountry: async (countryData) => {
    const id = await getNextId(Country);
    const newCountry = new Country({
      id,
      name: countryData.name,
      flag_emoji: countryData.flag_emoji || '🏳️',
      owner_id: countryData.owner_id || '',
      leader_name: countryData.leader_name || '',
      leader_title: countryData.leader_title || '',
      leader_description: countryData.leader_description || '',
      leader_image: countryData.leader_image || '',
      gdp: countryData.gdp || 0,
      army_power: countryData.army_power || 0,
      navy_power: countryData.navy_power || 0,
      airforce_power: countryData.airforce_power || 0,
      nuclear_power: countryData.nuclear_power || 0,
      stability: countryData.stability || 50,
      war_support: countryData.war_support || 50,
      color: countryData.color || '#5865F2',
    });
    await newCountry.save();
    
    const newParliament = new Parliament({
      country_id: id,
      senate_total: 100,
      house_total: 300,
      senate_name: '상원',
      house_name: '하원'
    });
    await newParliament.save();
    
    return id;
  },
  
  updateCountry: async (id, updates) => {
    const result = await Country.findOneAndUpdate({ id: parseInt(id) }, updates, { new: true });
    return !!result;
  },
  
  deleteCountry: async (id) => {
    const cid = parseInt(id);
    await Country.deleteOne({ id: cid });
    await Party.deleteMany({ country_id: cid });
    await Parliament.deleteOne({ country_id: cid });
  },

  // ===== Parliament =====
  getParliament: async (countryId) => {
    return await Parliament.findOne({ country_id: parseInt(countryId) }).lean();
  },

  updateParliament: async (countryId, config) => {
    const cid = parseInt(countryId);
    await Parliament.findOneAndUpdate(
      { country_id: cid },
      config,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },

  // ===== Parties =====
  getPartiesByCountry: async (countryId) => {
    return await Party.find({ country_id: parseInt(countryId) })
      .sort({ house_seats: -1 })
      .lean();
  },

  insertParty: async (partyData) => {
    const id = await getNextId(Party);
    const newParty = new Party({
      id,
      country_id: parseInt(partyData.country_id),
      name: partyData.name,
      color: partyData.color || '#808080',
      ideology: partyData.ideology || '',
      support_rate: parseFloat(partyData.support_rate) || 0,
      senate_seats: parseInt(partyData.senate_seats) || 0,
      house_seats: parseInt(partyData.house_seats) || 0,
    });
    await newParty.save();
    return id;
  },

  updateParty: async (id, updates) => {
    const result = await Party.findOneAndUpdate({ id: parseInt(id) }, updates, { new: true });
    return !!result;
  },

  deleteParty: async (id) => {
    await Party.deleteOne({ id: parseInt(id) });
  }
};
