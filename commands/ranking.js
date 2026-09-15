const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  name: '랭킹',
  async execute(interaction) {
    const field = interaction.options.getString('분야');
    const countries = await db.getCountries();

    if (countries.length === 0) {
      await interaction.reply({
        content: '📭 등록된 국가가 없습니다.',
        ephemeral: true,
      });
      return;
    }

    // 선택된 분야에 따라 정렬 및 표시 포맷 결정
    let sortedCountries = [...countries];
    let title = '';
    let emoji = '';
    
    if (field === 'gdp') {
      sortedCountries.sort((a, b) => b.gdp - a.gdp);
      title = '세계 경제 (GDP) 랭킹';
      emoji = '💰';
    } else if (field === 'army_power') {
      sortedCountries.sort((a, b) => b.army_power - a.army_power);
      title = '세계 육군력 랭킹';
      emoji = '💪';
    } else if (field === 'navy_power') {
      sortedCountries.sort((a, b) => b.navy_power - a.navy_power);
      title = '세계 해군력 랭킹';
      emoji = '⚓';
    } else if (field === 'airforce_power') {
      sortedCountries.sort((a, b) => b.airforce_power - a.airforce_power);
      title = '세계 공군력 랭킹';
      emoji = '✈️';
    }

    // 상위 10개국만 추출
    const topCountries = sortedCountries.slice(0, 10);

    const list = topCountries.map((c, i) => {
      let valueText = '';
      if (field === 'gdp') {
        valueText = c.gdp >= 1 ? `$${c.gdp.toFixed(1)}조` : `$${(c.gdp * 1000).toFixed(0)}십억`;
      } else {
        valueText = `${c[field]} (전투력)`;
      }
      return `**${i + 1}위.** ${c.flag_emoji} **${c.name}** — ${valueText}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`${emoji} ${title}`)
      .setDescription(`상위 10개국 랭킹입니다.\n\n${list}`)
      .setFooter({ text: '모의전용 시뮬레이션 봇' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
