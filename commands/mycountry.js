const db = require('../database/db');
const { buildCountryEmbed } = require('../utils/embeds');

module.exports = {
  name: '내국가',
  async execute(interaction) {
    const userId = interaction.user.id;
    const country = await db.getCountryByOwnerId(userId);

    if (!country) {
      await interaction.reply({
        content: `❌ 현재 <@${userId}> 님에게 배정된 국가가 없습니다. 관리자에게 문의하세요.`,
        ephemeral: true,
      });
      return;
    }

    const parties = await db.getPartiesByCountry(country.id);
    const parliament = (await db.getParliament(country.id)) || {
      senate_total: 0, house_total: 0, senate_name: '상원', house_name: '하원'
    };

    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
    const embed = buildCountryEmbed(country, parties, parliament, serverUrl);

    // 내 국가임을 강조하는 텍스트 추가
    await interaction.reply({ 
      content: `🎉 <@${userId}> 님의 국가 정보입니다.`,
      embeds: [embed] 
    });
  },
};
