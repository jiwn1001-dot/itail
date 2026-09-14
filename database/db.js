const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Country = require('./models/Country');
const Party = require('./models/Party');
const Parliament = require('./models/Parliament');

let isMongoMode = false;
const dataPath = path.join(__dirname, '..', 'data.json');

function loadJsonData() {
  if (!fs.existsSync(dataPath)) {
    return { data: { countries: [], parties: [], parliament_config: [] }, sequences: { countries: 1, parties: 1 } };
  }
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { data: { countries: [], parties: [], parliament_config: [] }, sequences: { countries: 1, parties: 1 } };
  }
}

function saveJsonData(jsonObj) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(jsonObj, null, 2), 'utf-8');
  } catch (e) {
    console.error('❌ data.json 저장 실패:', e.message);
  }
}

async function connect(uri) {
  if (!uri || uri.includes('여기에_') || !uri.startsWith('mongodb')) {
    console.log('ℹ️ MONGODB_URI가 설정되지 않아 로컬 data.json DB 모드로 실행합니다.');
    isMongoMode = false;
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    isMongoMode = true;
    console.log('✅ MongoDB에 성공적으로 연결되었습니다.');
  } catch (err) {
    console.warn('⚠️ MongoDB 연결 실패! 로컬 data.json DB 모드로 자동 전환합니다:', err.message);
    isMongoMode = false;
  }
}

function useJsonFallback() {
  isMongoMode = false;
}

async function getNextId(Model) {
  const lastDoc = await Model.findOne().sort({ id: -1 });
  return lastDoc ? lastDoc.id + 1 : 1;
}

module.exports = {
  connect,
  useJsonFallback,
  
  // ===== Countries =====
  getCountries: async () => {
    if (isMongoMode) return await Country.find().sort({ name: 1 }).lean();
    const dbData = loadJsonData();
    return (dbData.data.countries || []).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  },
  
  getCountryById: async (id) => {
    const cid = parseInt(id);
    if (isMongoMode) return await Country.findOne({ id: cid }).lean();
    const dbData = loadJsonData();
    return (dbData.data.countries || []).find(c => c.id === cid) || null;
  },
  
  getCountryByName: async (name) => {
    if (isMongoMode) return await Country.findOne({ name }).lean();
    const dbData = loadJsonData();
    return (dbData.data.countries || []).find(c => c.name === name) || null;
  },

  getCountryByOwnerId: async (ownerId) => {
    if (isMongoMode) return await Country.findOne({ owner_id: ownerId }).lean();
    const dbData = loadJsonData();
    return (dbData.data.countries || []).find(c => c.owner_id === ownerId) || null;
  },
  
  searchCountriesByName: async (keyword) => {
    if (isMongoMode) {
      return await Country.find({ name: { $regex: keyword, $options: 'i' } }).limit(25).lean();
    }
    const dbData = loadJsonData();
    const kw = (keyword || '').toLowerCase();
    return (dbData.data.countries || [])
      .filter(c => c.name.toLowerCase().includes(kw))
      .slice(0, 25);
  },
  
  getCountriesOrderByGdp: async () => {
    if (isMongoMode) return await Country.find().sort({ gdp: -1 }).lean();
    const dbData = loadJsonData();
    return [...(dbData.data.countries || [])].sort((a, b) => b.gdp - a.gdp);
  },
  
  insertCountry: async (countryData) => {
    if (isMongoMode) {
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
        gdp: parseFloat(countryData.gdp) || 0,
        army_power: parseInt(countryData.army_power) || 0,
        navy_power: parseInt(countryData.navy_power) || 0,
        airforce_power: parseInt(countryData.airforce_power) || 0,
        nuclear_power: parseInt(countryData.nuclear_power) || 0,
        stability: parseInt(countryData.stability) || 50,
        war_support: parseInt(countryData.war_support) || 50,
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
    }

    const dbData = loadJsonData();
    const id = dbData.sequences.countries++;
    const newCountry = {
      id,
      name: countryData.name,
      flag_emoji: countryData.flag_emoji || '🏳️',
      owner_id: countryData.owner_id || '',
      leader_name: countryData.leader_name || '',
      leader_title: countryData.leader_title || '',
      leader_description: countryData.leader_description || '',
      leader_image: countryData.leader_image || '',
      gdp: parseFloat(countryData.gdp) || 0,
      army_power: parseInt(countryData.army_power) || 0,
      navy_power: parseInt(countryData.navy_power) || 0,
      airforce_power: parseInt(countryData.airforce_power) || 0,
      nuclear_power: parseInt(countryData.nuclear_power) || 0,
      stability: parseInt(countryData.stability) || 50,
      war_support: parseInt(countryData.war_support) || 50,
      color: countryData.color || '#5865F2'
    };
    dbData.data.countries.push(newCountry);
    dbData.data.parliament_config.push({
      country_id: id,
      senate_total: 100,
      house_total: 300,
      senate_name: '상원',
      house_name: '하원'
    });
    saveJsonData(dbData);
    return id;
  },
  
  updateCountry: async (id, updates) => {
    const cid = parseInt(id);
    if (isMongoMode) {
      const result = await Country.findOneAndUpdate({ id: cid }, updates, { new: true });
      return !!result;
    }
    const dbData = loadJsonData();
    const idx = dbData.data.countries.findIndex(c => c.id === cid);
    if (idx === -1) return false;
    dbData.data.countries[idx] = { ...dbData.data.countries[idx], ...updates };
    saveJsonData(dbData);
    return true;
  },
  
  deleteCountry: async (id) => {
    const cid = parseInt(id);
    if (isMongoMode) {
      await Country.deleteOne({ id: cid });
      await Party.deleteMany({ country_id: cid });
      await Parliament.deleteOne({ country_id: cid });
      return;
    }
    const dbData = loadJsonData();
    dbData.data.countries = dbData.data.countries.filter(c => c.id !== cid);
    dbData.data.parties = dbData.data.parties.filter(p => p.country_id !== cid);
    dbData.data.parliament_config = dbData.data.parliament_config.filter(pc => pc.country_id !== cid);
    saveJsonData(dbData);
  },

  // ===== Parliament =====
  getParliament: async (countryId) => {
    const cid = parseInt(countryId);
    if (isMongoMode) return await Parliament.findOne({ country_id: cid }).lean();
    const dbData = loadJsonData();
    return dbData.data.parliament_config.find(pc => pc.country_id === cid) || null;
  },

  updateParliament: async (countryId, config) => {
    const cid = parseInt(countryId);
    if (isMongoMode) {
      await Parliament.findOneAndUpdate(
        { country_id: cid },
        config,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return;
    }
    const dbData = loadJsonData();
    const idx = dbData.data.parliament_config.findIndex(pc => pc.country_id === cid);
    if (idx > -1) {
      dbData.data.parliament_config[idx] = { ...dbData.data.parliament_config[idx], ...config };
    } else {
      dbData.data.parliament_config.push({ country_id: cid, ...config });
    }
    saveJsonData(dbData);
  },

  // ===== Parties =====
  getPartiesByCountry: async (countryId) => {
    const cid = parseInt(countryId);
    if (isMongoMode) return await Party.find({ country_id: cid }).sort({ house_seats: -1 }).lean();
    const dbData = loadJsonData();
    return (dbData.data.parties || [])
      .filter(p => p.country_id === cid)
      .sort((a, b) => b.house_seats - a.house_seats);
  },

  insertParty: async (partyData) => {
    const cid = parseInt(partyData.country_id);
    if (isMongoMode) {
      const id = await getNextId(Party);
      const newParty = new Party({
        id,
        country_id: cid,
        name: partyData.name,
        color: partyData.color || '#808080',
        ideology: partyData.ideology || '',
        support_rate: parseFloat(partyData.support_rate) || 0,
        senate_seats: parseInt(partyData.senate_seats) || 0,
        house_seats: parseInt(partyData.house_seats) || 0,
      });
      await newParty.save();
      return id;
    }
    const dbData = loadJsonData();
    const id = dbData.sequences.parties++;
    const newParty = {
      id,
      country_id: cid,
      name: partyData.name,
      color: partyData.color || '#808080',
      ideology: partyData.ideology || '',
      support_rate: parseFloat(partyData.support_rate) || 0,
      senate_seats: parseInt(partyData.senate_seats) || 0,
      house_seats: parseInt(partyData.house_seats) || 0,
    };
    dbData.data.parties.push(newParty);
    saveJsonData(dbData);
    return id;
  },

  updateParty: async (id, updates) => {
    const pid = parseInt(id);
    if (isMongoMode) {
      const result = await Party.findOneAndUpdate({ id: pid }, updates, { new: true });
      return !!result;
    }
    const dbData = loadJsonData();
    const idx = dbData.data.parties.findIndex(p => p.id === pid);
    if (idx === -1) return false;
    dbData.data.parties[idx] = { ...dbData.data.parties[idx], ...updates };
    saveJsonData(dbData);
    return true;
  },

  deleteParty: async (id) => {
    const pid = parseInt(id);
    if (isMongoMode) {
      await Party.deleteOne({ id: pid });
      return;
    }
    const dbData = loadJsonData();
    dbData.data.parties = dbData.data.parties.filter(p => p.id !== pid);
    saveJsonData(dbData);
  }
};
