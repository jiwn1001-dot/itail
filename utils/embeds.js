const { EmbedBuilder } = require('discord.js');

// 색상 이모지 매핑 (HEX → 이모지)
const COLOR_EMOJI_MAP = {
  red: '🟥', blue: '🟦', green: '🟩', yellow: '🟨',
  purple: '🟪', orange: '🟧', white: '⬜', black: '⬛', brown: '🟫',
};

/**
 * HEX 색상을 가장 가까운 이모지 블록으로 변환
 */
function hexToEmoji(hex) {
  if (!hex) return '⬜';
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // HSL로 변환하여 색상 판별
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);

  // 밝기 기반
  if (l < 0.15) return '⬛';
  if (l > 0.9 && s < 0.2) return '⬜';
  if (s < 0.15) return l > 0.5 ? '⬜' : '⬛';

  // 색상 판별
  let h = 0;
  if (max !== min) {
    if (max === rn) h = ((gn - bn) / (max - min)) % 6;
    else if (max === gn) h = (bn - rn) / (max - min) + 2;
    else h = (rn - gn) / (max - min) + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  if (h >= 0 && h < 15) return '🟥';
  if (h >= 15 && h < 45) return l > 0.5 ? '🟧' : '🟫';
  if (h >= 45 && h < 70) return '🟨';
  if (h >= 70 && h < 165) return '🟩';
  if (h >= 165 && h < 260) return '🟦';
  if (h >= 260 && h < 310) return '🟪';
  if (h >= 310 && h < 345) return '🟥';
  return '🟥';
}

/**
 * 프로그레스 바 생성 (0~100)
 */
function progressBar(value, maxLength = 10, fillChar = '█', emptyChar = '░') {
  const filled = Math.round((value / 100) * maxLength);
  const empty = maxLength - filled;
  return fillChar.repeat(filled) + emptyChar.repeat(empty) + ` ${value}%`;
}

/**
 * 숫자를 색상 텍스트로 변환 (위험도 표시)
 */
function getStatusText(value) {
  if (value >= 80) return `🟢 ${value}`;
  if (value >= 60) return `🟡 ${value}`;
  if (value >= 40) return `🟠 ${value}`;
  return `🔴 ${value}`;
}

/**
 * GDP 포맷팅
 */
function formatGdp(gdp) {
  if (gdp >= 1) return `$${gdp.toFixed(1)}조`;
  return `$${(gdp * 1000).toFixed(0)}십억`;
}

/**
 * 의석 시각화 바 생성
 */
function seatBar(parties, totalSeats, barLength = 20) {
  if (totalSeats === 0) return '없음';
  
  const blocks = [];
  let usedLength = 0;

  for (let i = 0; i < parties.length; i++) {
    const party = parties[i];
    const seats = party.isHouse ? party.house_seats : party.senate_seats;
    if (seats <= 0) continue;
    
    let blockCount;
    if (i === parties.length - 1) {
      blockCount = barLength - usedLength;
    } else {
      blockCount = Math.round((seats / totalSeats) * barLength);
    }
    
    if (blockCount < 1 && seats > 0) blockCount = 1;
    usedLength += blockCount;
    
    const emoji = hexToEmoji(party.color);
    blocks.push(emoji.repeat(Math.max(blockCount, 0)));
  }

  return blocks.join('');
}

/**
 * 정당별 의석 목록 텍스트 생성
 */
function partySeatsText(parties, isHouse = true) {
  return parties
    .filter(p => (isHouse ? p.house_seats : p.senate_seats) > 0)
    .map(p => {
      const seats = isHouse ? p.house_seats : p.senate_seats;
      const emoji = hexToEmoji(p.color);
      return `${emoji} ${p.name}: **${seats}석**`;
    })
    .join('\n');
}

/**
 * 지지율 바 차트 생성
 */
function supportChart(parties) {
  const maxNameLen = Math.max(...parties.map(p => p.name.length));
  return parties
    .filter(p => p.support_rate > 0)
    .sort((a, b) => b.support_rate - a.support_rate)
    .map(p => {
      const emoji = hexToEmoji(p.color);
      const bar = progressBar(Math.round(p.support_rate), 10);
      return `${emoji} ${p.name}\n┗ ${bar}`;
    })
    .join('\n');
}

/**
 * 국가 종합 정보 임베드 생성
 */
function buildCountryEmbed(country, parties, parliament, serverUrl) {
  const embed = new EmbedBuilder()
    .setColor(country.color || '#5865F2')
    .setTitle(`${country.flag_emoji} ${country.name}`)
    .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━`)
    .addFields(
      {
        name: `🏛️ ${country.leader_title} - ${country.leader_name}`,
        value: country.leader_description || '정보 없음',
        inline: false,
      },
      {
        name: '💰 GDP',
        value: formatGdp(country.gdp),
        inline: true,
      },
      {
        name: '📊 안정도',
        value: getStatusText(country.stability),
        inline: true,
      },
      {
        name: '🗳️ 전쟁 지지도',
        value: getStatusText(country.war_support),
        inline: true,
      },
      {
        name: '⚔️ 군사력 종합',
        value: [
          `🏍️ 육군: ${progressBar(country.army_power)}`,
          `🚢 해군: ${progressBar(country.navy_power)}`,
          `✈️ 공군: ${progressBar(country.airforce_power)}`,
          `☢️ 핵:   ${progressBar(country.nuclear_power)}`,
        ].join('\n'),
        inline: false,
      }
    )
    .setFooter({ text: '모의전용 시뮬레이션 봇 | 실제 데이터가 아닙니다' })
    .setTimestamp();

  // 지도자 이미지가 URL이면 썸네일로 설정
  if (country.leader_image) {
    if (country.leader_image.startsWith('http')) {
      embed.setThumbnail(country.leader_image);
    } else if (serverUrl) {
      embed.setThumbnail(`${serverUrl}/uploads/leaders/${country.leader_image}`);
    }
  }

  return embed;
}

/**
 * 군사력 상세 임베드 생성
 */
function buildMilitaryEmbed(country) {
  const totalPower = Math.round(
    (country.army_power + country.navy_power + country.airforce_power + country.nuclear_power) / 4
  );

  const getRank = (val) => {
    if (val >= 90) return '🏆 세계 최강급';
    if (val >= 75) return '⭐ 강대국급';
    if (val >= 60) return '💪 지역 강국급';
    if (val >= 40) return '🛡️ 중견국급';
    if (val >= 20) return '📌 소국급';
    if (val > 0) return '🔸 최소 수준';
    return '❌ 보유하지 않음';
  };

  const embed = new EmbedBuilder()
    .setColor(country.color || '#5865F2')
    .setTitle(`${country.flag_emoji} ${country.name} - 군사력 상세`)
    .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━\n**종합 전투력 지수: ${totalPower}/100** ${getRank(totalPower)}`)
    .addFields(
      {
        name: '🏍️ 육군 역량',
        value: `${progressBar(country.army_power, 15)}\n${getRank(country.army_power)}`,
        inline: false,
      },
      {
        name: '🚢 해군 역량',
        value: `${progressBar(country.navy_power, 15)}\n${getRank(country.navy_power)}`,
        inline: false,
      },
      {
        name: '✈️ 공군 역량',
        value: `${progressBar(country.airforce_power, 15)}\n${getRank(country.airforce_power)}`,
        inline: false,
      },
      {
        name: '☢️ 핵 역량',
        value: `${progressBar(country.nuclear_power, 15)}\n${getRank(country.nuclear_power)}`,
        inline: false,
      }
    )
    .setFooter({ text: '모의전용 시뮬레이션 봇 | 실제 데이터가 아닙니다' })
    .setTimestamp();

  return embed;
}

/**
 * 의회 정보 임베드 생성
 */
function buildParliamentEmbed(country, parties, parliament) {
  const embed = new EmbedBuilder()
    .setColor(country.color || '#5865F2')
    .setTitle(`${country.flag_emoji} ${country.name} - 의회`)
    .setDescription(`━━━━━━━━━━━━━━━━━━━━━━━━`);

  // 하원
  if (parliament.house_total > 0) {
    const houseParties = parties.map(p => ({ ...p, isHouse: true }));
    const houseSeatBar = seatBar(houseParties, parliament.house_total, 20);
    const houseDetails = partySeatsText(parties, true);

    embed.addFields({
      name: `🏛️ ${parliament.house_name} (총 ${parliament.house_total}석)`,
      value: `${houseSeatBar}\n\n${houseDetails || '정당 정보 없음'}`,
      inline: false,
    });
  }

  // 상원 (총 의석이 0이면 단원제로 표시)
  if (parliament.senate_total > 0) {
    const senateParties = parties.map(p => ({ ...p, isHouse: false }));
    const senateSeatBar = seatBar(senateParties, parliament.senate_total, 20);
    const senateDetails = partySeatsText(parties, false);

    embed.addFields({
      name: `🏛️ ${parliament.senate_name} (총 ${parliament.senate_total}석)`,
      value: `${senateSeatBar}\n\n${senateDetails || '정당 정보 없음'}`,
      inline: false,
    });
  } else {
    embed.addFields({
      name: '🏛️ 상원',
      value: `*${parliament.senate_name || '단원제 (상원 없음)'}*`,
      inline: false,
    });
  }

  // 지지율
  const chart = supportChart(parties);
  if (chart) {
    embed.addFields({
      name: '📊 정당 지지율',
      value: chart,
      inline: false,
    });
  }

  embed.setFooter({ text: '모의전용 시뮬레이션 봇 | 실제 데이터가 아닙니다' })
    .setTimestamp();

  return embed;
}

module.exports = {
  hexToEmoji,
  progressBar,
  getStatusText,
  formatGdp,
  seatBar,
  partySeatsText,
  supportChart,
  buildCountryEmbed,
  buildMilitaryEmbed,
  buildParliamentEmbed,
};
