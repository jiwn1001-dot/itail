const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  name: '경제성장률',
  async execute(interaction) {
    const name = interaction.options.getString('이름');
    const rate = interaction.options.getNumber('비율');

    const country = await db.getCountryByName(name);
    if (!country) {
      await interaction.reply({
        content: `❌ **${name}** 국가를 찾을 수 없습니다. \`/국가목록\`으로 확인해주세요.`,
        ephemeral: true,
      });
      return;
    }

    const success = await db.updateCountry(country.id, { growth_rate: rate });
    if (success) {
      await interaction.reply({
        content: `✅ **${country.flag_emoji} ${country.name}**의 경제성장률이 **${rate > 0 ? '+' : ''}${rate}%**로 설정되었습니다. (다음 턴부터 적용됩니다)`,
      });
    } else {
      await interaction.reply({
        content: `❌ 설정 저장에 실패했습니다.`,
        ephemeral: true,
      });
    }
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const countries = await db.searchCountriesByName(focused);
    await interaction.respond(
      countries.map(c => ({ name: `${c.flag_emoji} ${c.name}`, value: c.name }))
    );
  },
};
