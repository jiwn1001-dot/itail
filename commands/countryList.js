const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  name: '국가목록',
  async execute(interaction) {
    const countries = await db.getCountriesOrderByGdp();

    if (countries.length === 0) {
      await interaction.reply({
        content: '📭 등록된 국가가 없습니다.',
        ephemeral: true,
      });
      return;
    }

    const list = countries.map((c, i) => {
      const gdpText = c.gdp >= 1 ? `$${c.gdp.toFixed(1)}조` : `$${(c.gdp * 1000).toFixed(0)}십억`;
      const ownerText = c.owner_id ? ` (👤 배정됨)` : '';
      return `**${i + 1}.** ${c.flag_emoji} **${c.name}** — ${c.leader_title} ${c.leader_name} (GDP: ${gdpText})${ownerText}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🌍 등록된 국가 목록')
      .setDescription(`총 **${countries.length}개국**이 등록되어 있습니다.\n\n${list}`)
      .addFields({
        name: '💡 사용법',
        value: '`/국가 [이름]` — 국가 종합 정보\n`/군사력 [이름]` — 군사력 상세\n`/의회 [이름]` — 의회 구성\n`/내국가` — 내게 배정된 국가 보기',
        inline: false,
      })
      .setFooter({ text: '모의전용 시뮬레이션 봇' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
