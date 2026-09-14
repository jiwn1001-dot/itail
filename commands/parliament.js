const db = require('../database/db');
const { buildParliamentEmbed } = require('../utils/embeds');

module.exports = {
  name: '의회',
  async execute(interaction) {
    const name = interaction.options.getString('이름');
    const country = await db.getCountryByName(name);

    if (!country) {
      await interaction.reply({
        content: `❌ **${name}** 국가를 찾을 수 없습니다. \`/국가목록\`으로 확인해주세요.`,
        ephemeral: true,
      });
      return;
    }

    const parties = await db.getPartiesByCountry(country.id);
    const parliament = (await db.getParliament(country.id)) || {
      senate_total: 0, house_total: 0, senate_name: '상원', house_name: '하원'
    };

    const embed = buildParliamentEmbed(country, parties, parliament);
    await interaction.reply({ embeds: [embed] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const countries = await db.searchCountriesByName(focused);
    await interaction.respond(
      countries.map(c => ({ name: `${c.flag_emoji} ${c.name}`, value: c.name }))
    );
  },
};
