const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Country = require('./models/Country');
const Party = require('./models/Party');
const Parliament = require('./models/Parliament');

let isMongoMode = false;
let memoryCache = null;
const dataPath = path.join(__dirname, '..', 'data.json');

const defaultData = {
  data: {
    countries: [
      {
        id: 1,
        name: "미국",
        flag_emoji: "🇺🇸",
        owner_id: "",
        leader_name: "제임스 하퍼",
        leader_title: "대통령",
        leader_description: "강경한 외교 노선을 주도하며, 동맹국과의 협력을 최우선 과제로 삼고 있는 지도자.",
        leader_image: "",
        gdp: 25.5,
        army_power: 95,
        navy_power: 98,
        airforce_power: 97,
        nuclear_power: 95,
        stability: 72,
        war_support: 45,
        color: "#3C3B6E"
      },
      {
        id: 2,
        name: "러시아",
        flag_emoji: "🇷🇺",
        owner_id: "",
        leader_name: "드미트리 볼코프",
        leader_title: "대통령",
        leader_description: "강력한 중앙집권적 통치 스타일로 러시아의 군사력 재건에 집중하고 있다.",
        leader_image: "",
        gdp: 1.8,
        army_power: 85,
        navy_power: 65,
        airforce_power: 72,
        nuclear_power: 90,
        stability: 58,
        war_support: 62,
        color: "#D52B1E"
      },
      {
        id: 3,
        name: "중국",
        flag_emoji: "🇨🇳",
        owner_id: "",
        leader_name: "리웨이밍",
        leader_title: "국가주석",
        leader_description: "기술 혁신과 군사 현대화를 동시에 추진하는 차세대 지도자.",
        leader_image: "",
        gdp: 18.3,
        army_power: 88,
        navy_power: 78,
        airforce_power: 75,
        nuclear_power: 80,
        stability: 82,
        war_support: 35,
        color: "#DE2910"
      },
      {
        id: 4,
        name: "한국",
        flag_emoji: "🇰🇷",
        owner_id: "",
        leader_name: "박현준",
        leader_title: "대통령",
        leader_description: "통일 대비 외교와 반도 안보를 최우선 과제로 삼고 있다.",
        leader_image: "",
        gdp: 1.7,
        army_power: 75,
        navy_power: 60,
        airforce_power: 65,
        nuclear_power: 0,
        stability: 68,
        war_support: 30,
        color: "#003478"
      }
    ],
    parties: [
      { id: 1, country_id: 1, name: "공화당", color: "#E81B23", ideology: "보수주의", support_rate: 45.2, senate_seats: 51, house_seats: 222 },
      { id: 2, country_id: 1, name: "민주당", color: "#0015BC", ideology: "자유주의", support_rate: 43.8, senate_seats: 47, house_seats: 213 },
      { id: 3, country_id: 1, name: "무소속", color: "#808080", ideology: "중도", support_rate: 11, senate_seats: 2, house_seats: 0 },
      { id: 4, country_id: 2, name: "통합 러시아", color: "#1C3578", ideology: "보수주의", support_rate: 55, senate_seats: 120, house_seats: 325 },
      { id: 5, country_id: 2, name: "러시아 공산당", color: "#CC0000", ideology: "공산주의", support_rate: 18.5, senate_seats: 25, house_seats: 57 },
      { id: 6, country_id: 3, name: "중국 공산당", color: "#DE2910", ideology: "공산주의", support_rate: 92, senate_seats: 0, house_seats: 2115 },
      { id: 7, country_id: 3, name: "무소속", color: "#808080", ideology: "기타", support_rate: 8, senate_seats: 0, house_seats: 865 },
      { id: 8, country_id: 4, name: "국민의힘", color: "#E61E2B", ideology: "보수주의", support_rate: 38.5, senate_seats: 0, house_seats: 120 },
      { id: 9, country_id: 4, name: "더불어민주당", color: "#004EA2", ideology: "중도좌파", support_rate: 35.2, senate_seats: 0, house_seats: 130 }
    ],
    parliament_config: [
      { country_id: 1, senate_total: 100, house_total: 435, senate_name: "상원 (Senate)", house_name: "하원 (House)" },
      { country_id: 2, senate_total: 170, house_total: 450, senate_name: "연방평의회", house_name: "국가두마" },
      { country_id: 3, senate_total: 0, house_total: 2980, senate_name: "없음", house_name: "전국인민대표대회" },
      { country_id: 4, senate_total: 0, house_total: 300, senate_name: "없음", house_name: "국회" }
    ]
  },
  sequences: { countries: 5, parties: 10 }
};

function loadJsonData() {
  if (memoryCache) return memoryCache;
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      memoryCache = JSON.parse(raw);
      return memoryCache;
    }
  } catch (e) {
    console.warn('⚠️ data.json 로드 실패, 기본 인메모리 데이터 사용:', e.message);
  }
  memoryCache = JSON.parse(JSON.stringify(defaultData));
  return memoryCache;
}

function saveJsonData(jsonObj) {
  memoryCache = jsonObj;
  try {
    fs.writeFileSync(dataPath, JSON.stringify(jsonObj, null, 2), 'utf-8');
  } catch (e) {
    console.warn('⚠️ data.json 파일 쓰기 건너뜀 (Read-Only 환경 가능성):', e.message);
  }
}

async function connect(uri) {
  if (!uri || uri.includes('여기에_') || !uri.startsWith('mongodb')) {
    console.log('ℹ️ MONGODB_URI 미설정으로 인메모리/data.json DB 모드를 사용합니다.');
    isMongoMode = false;
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    isMongoMode = true;
    console.log('✅ MongoDB에 성공적으로 연결되었습니다.');
  } catch (err) {
    console.warn('⚠️ MongoDB 연결 실패! 인메모리/data.json DB 모드로 자동 전환합니다:', err.message);
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
