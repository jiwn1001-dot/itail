const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.json');

// 기본 데이터 구조
let data = {
  countries: [],
  parties: [],
  parliament_config: []
};

// 고유 ID 생성을 위한 시퀀스
let sequences = {
  countries: 1,
  parties: 1
};

// 데이터 로드
function loadDb() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      data = parsed.data || data;
      sequences = parsed.sequences || sequences;
    } catch (err) {
      console.error('Failed to parse data.json:', err);
    }
  } else {
    saveDb();
  }
}

// 데이터 저장
function saveDb() {
  const exportData = {
    data,
    sequences
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(exportData, null, 2), 'utf8');
}

// 초기화
loadDb();

module.exports = {
  getDb: () => data,
  saveDb,
  
  // ===== Countries =====
  getCountries: () => {
    return [...data.countries].sort((a, b) => a.name.localeCompare(b.name));
  },
  
  getCountryById: (id) => {
    return data.countries.find(c => c.id === parseInt(id));
  },
  
  getCountryByName: (name) => {
    return data.countries.find(c => c.name === name);
  },

  getCountryByOwnerId: (ownerId) => {
    return data.countries.find(c => c.owner_id === ownerId);
  },
  
  searchCountriesByName: (keyword) => {
    return data.countries
      .filter(c => c.name.includes(keyword))
      .slice(0, 25);
  },
  
  getCountriesOrderByGdp: () => {
    return [...data.countries].sort((a, b) => (b.gdp || 0) - (a.gdp || 0));
  },
  
  insertCountry: (countryData) => {
    const id = sequences.countries++;
    const newCountry = {
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
    };
    data.countries.push(newCountry);
    
    // 기본 의회 설정 추가
    data.parliament_config.push({
      country_id: id,
      senate_total: 100,
      house_total: 300,
      senate_name: '상원',
      house_name: '하원'
    });
    
    saveDb();
    return id;
  },
  
  updateCountry: (id, updates) => {
    const index = data.countries.findIndex(c => c.id === parseInt(id));
    if (index !== -1) {
      data.countries[index] = { ...data.countries[index], ...updates };
      saveDb();
      return true;
    }
    return false;
  },
  
  deleteCountry: (id) => {
    const cid = parseInt(id);
    data.countries = data.countries.filter(c => c.id !== cid);
    data.parties = data.parties.filter(p => p.country_id !== cid);
    data.parliament_config = data.parliament_config.filter(p => p.country_id !== cid);
    saveDb();
  },

  // ===== Parliament =====
  getParliament: (countryId) => {
    return data.parliament_config.find(p => p.country_id === parseInt(countryId));
  },

  updateParliament: (countryId, config) => {
    const cid = parseInt(countryId);
    const index = data.parliament_config.findIndex(p => p.country_id === cid);
    if (index !== -1) {
      data.parliament_config[index] = { ...data.parliament_config[index], ...config };
    } else {
      data.parliament_config.push({ country_id: cid, ...config });
    }
    saveDb();
  },

  // ===== Parties =====
  getPartiesByCountry: (countryId) => {
    return data.parties
      .filter(p => p.country_id === parseInt(countryId))
      .sort((a, b) => (b.house_seats || 0) - (a.house_seats || 0));
  },

  insertParty: (partyData) => {
    const id = sequences.parties++;
    const newParty = {
      id,
      country_id: parseInt(partyData.country_id),
      name: partyData.name,
      color: partyData.color || '#808080',
      ideology: partyData.ideology || '',
      support_rate: parseFloat(partyData.support_rate) || 0,
      senate_seats: parseInt(partyData.senate_seats) || 0,
      house_seats: parseInt(partyData.house_seats) || 0,
    };
    data.parties.push(newParty);
    saveDb();
    return id;
  },

  updateParty: (id, updates) => {
    const index = data.parties.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      data.parties[index] = { ...data.parties[index], ...updates };
      saveDb();
      return true;
    }
    return false;
  },

  deleteParty: (id) => {
    data.parties = data.parties.filter(p => p.id !== parseInt(id));
    saveDb();
  }
};
