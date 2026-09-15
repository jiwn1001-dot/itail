const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const { formatGdp } = require('../utils/embeds');

module.exports = {
  name: '턴넘기기',
  async execute(interaction) {
    // 권한 체크 등 필요하다면 추가 (현재는 모든 사용자가 쓸 수 있음)
    const turns = interaction.options.getInteger('턴수') || 1;
    
    await interaction.deferReply();

    const changed = await db.passTurn(turns);

    if (changed.length === 0) {
      await interaction.editReply({
        content: `⏳ **${turns}턴**이 지났지만 성장률이 설정된 국가가 없어 변화가 없습니다.`,
      });
      return;
    }

    // 변경된 국가 목록 문자열 생성
    const list = changed.map((c, i) => {
      const oldStr = formatGdp(c.oldGdp);
      const newStr = formatGdp(c.newGdp);
      const diffStr = formatGdp(c.newGdp - c.oldGdp);
      return `**${i + 1}.** ${c.name} (${c.rate}% 성장)\n┗ ${oldStr} ➡️ **${newStr}** (+${diffStr})`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor('#51cf66')
      .setTitle(`⏳ ${turns}턴 경과 - 국가 경제 변동`)
      .setDescription(`시간이 흘러 각 국가의 GDP가 성장률에 맞게 변경되었습니다.\n\n${list}`)
      .setFooter({ text: '모의전용 시뮬레이션 봇' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
