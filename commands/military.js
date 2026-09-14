const db = require('../database/db');
const { buildMilitaryEmbed } = require('../utils/embeds');

module.exports = {
  name: '군사력',
  async execute(interaction) {
    const name = interaction.options.getString('이름');
    const country = db.getCountryByName(name);

    if (!country) {
      await interaction.reply({
        content: `❌ **${name}** 국가를 찾을 수 없습니다. \`/국가목록\`으로 확인해주세요.`,
        ephemeral: true,
      });
      return;
    }

    const embed = buildMilitaryEmbed(country);
    await interaction.reply({ embeds: [embed] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const countries = db.searchCountriesByName(focused);
    await interaction.respond(
      countries.map(c => ({ name: `${c.flag_emoji} ${c.name}`, value: c.name }))
    );
  },
};
