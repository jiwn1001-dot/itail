const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('국가')
    .setDescription('국가 종합 정보를 조회합니다')
    .addStringOption(option =>
      option.setName('이름')
        .setDescription('조회할 국가명 (예: 미국, 한국)')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('군사력')
    .setDescription('국가 군사력 상세 정보를 조회합니다')
    .addStringOption(option =>
      option.setName('이름')
        .setDescription('조회할 국가명 (예: 미국, 한국)')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('의회')
    .setDescription('국가 의회 구성 및 정당 정보를 조회합니다')
    .addStringOption(option =>
      option.setName('이름')
        .setDescription('조회할 국가명 (예: 미국, 한국)')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  new SlashCommandBuilder()
    .setName('국가목록')
    .setDescription('등록된 모든 국가 목록을 표시합니다'),
  new SlashCommandBuilder()
    .setName('내국가')
    .setDescription('내게 배정된 국가 정보를 조회합니다'),
  new SlashCommandBuilder()
    .setName('랭킹')
    .setDescription('분야별 국가 랭킹을 조회합니다')
    .addStringOption(option =>
      option.setName('분야')
        .setDescription('조회할 랭킹 분야')
        .setRequired(true)
        .addChoices(
          { name: '💪 육군', value: 'army_power' },
          { name: '⚓ 해군', value: 'navy_power' },
          { name: '✈️ 공군', value: 'airforce_power' },
          { name: '💰 경제 (GDP)', value: 'gdp' }
        )
    ),
].map(cmd => cmd.toJSON());

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('🔄 슬래시 커맨드 등록 중...');

    if (process.env.GUILD_ID) {
      // 특정 서버에 등록 (즉시 반영)
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ 서버(${process.env.GUILD_ID})에 ${commands.length}개 커맨드 등록 완료`);
    } else {
      // 글로벌 등록 (최대 1시간 소요)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`✅ 글로벌에 ${commands.length}개 커맨드 등록 완료 (반영까지 최대 1시간)`);
    }
  } catch (error) {
    console.error('❌ 커맨드 등록 실패:', error);
  }
}

module.exports = { deployCommands };

if (require.main === module) {
  deployCommands();
}
