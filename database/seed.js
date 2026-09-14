const db = require('./db');

function seedDatabase() {
  const existing = db.getCountries();
  if (existing.length > 0) {
    console.log('⚠️  이미 데이터가 존재합니다. 시드를 건너뜁니다.');
    console.log('   초기화하려면 data.json 파일을 삭제 후 다시 실행하세요.');
    return;
  }

  const countries = [
    {
      country: { name: '미국', flag_emoji: '🇺🇸', leader_name: '제임스 하퍼', leader_title: '대통령', leader_description: '강경한 외교 노선을 주도하며, 동맹국과의 협력을 최우선 과제로 삼고 있는 지도자.', gdp: 25.5, army_power: 95, navy_power: 98, airforce_power: 97, nuclear_power: 95, stability: 72, war_support: 45, color: '#3C3B6E' },
      parliament: { senate_total: 100, house_total: 435, senate_name: '상원 (Senate)', house_name: '하원 (House)' },
      parties: [
        { name: '공화당', color: '#E81B23', ideology: '보수주의', support_rate: 45.2, senate_seats: 51, house_seats: 222 },
        { name: '민주당', color: '#0015BC', ideology: '자유주의', support_rate: 43.8, senate_seats: 47, house_seats: 213 },
        { name: '무소속', color: '#808080', ideology: '중도', support_rate: 11.0, senate_seats: 2, house_seats: 0 },
      ]
    },
    {
      country: { name: '러시아', flag_emoji: '🇷🇺', leader_name: '드미트리 볼코프', leader_title: '대통령', leader_description: '강력한 중앙집권적 통치 스타일로 러시아의 군사력 재건에 집중하고 있다.', gdp: 1.8, army_power: 85, navy_power: 65, airforce_power: 72, nuclear_power: 90, stability: 58, war_support: 62, color: '#D52B1E' },
      parliament: { senate_total: 170, house_total: 450, senate_name: '연방평의회', house_name: '국가두마' },
      parties: [
        { name: '통합 러시아', color: '#1C3578', ideology: '보수주의', support_rate: 55.0, senate_seats: 120, house_seats: 325 },
        { name: '러시아 공산당', color: '#CC0000', ideology: '공산주의', support_rate: 18.5, senate_seats: 25, house_seats: 57 },
      ]
    },
    {
      country: { name: '중국', flag_emoji: '🇨🇳', leader_name: '리웨이밍', leader_title: '국가주석', leader_description: '기술 혁신과 군사 현대화를 동시에 추진하는 차세대 지도자.', gdp: 18.3, army_power: 88, navy_power: 78, airforce_power: 75, nuclear_power: 80, stability: 82, war_support: 35, color: '#DE2910' },
      parliament: { senate_total: 0, house_total: 2980, senate_name: '없음', house_name: '전국인민대표대회' },
      parties: [
        { name: '중국 공산당', color: '#DE2910', ideology: '공산주의', support_rate: 92.0, senate_seats: 0, house_seats: 2115 },
        { name: '무소속', color: '#808080', ideology: '기타', support_rate: 8.0, senate_seats: 0, house_seats: 865 },
      ]
    },
    {
      country: { name: '한국', flag_emoji: '🇰🇷', leader_name: '박현준', leader_title: '대통령', leader_description: '통일 대비 외교와 반도 안보를 최우선 과제로 삼고 있다.', gdp: 1.7, army_power: 75, navy_power: 60, airforce_power: 65, nuclear_power: 0, stability: 68, war_support: 30, color: '#003478' },
      parliament: { senate_total: 0, house_total: 300, senate_name: '없음', house_name: '국회' },
      parties: [
        { name: '국민의힘', color: '#E61E2B', ideology: '보수주의', support_rate: 38.5, senate_seats: 0, house_seats: 120 },
        { name: '더불어민주당', color: '#004EA2', ideology: '중도좌파', support_rate: 35.2, senate_seats: 0, house_seats: 130 },
      ]
    }
  ];

  for (const data of countries) {
    const countryId = db.insertCountry(data.country);
    db.updateParliament(countryId, data.parliament);

    for (const party of data.parties) {
      party.country_id = countryId;
      db.insertParty(party);
    }
  }

  console.log('✅ 샘플 데이터 시드 완료 (JSON 저장됨)');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase();
}
