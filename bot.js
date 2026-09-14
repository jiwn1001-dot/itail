const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');

function createBot() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  // 커맨드 컬렉션
  client.commands = new Collection();

  // 커맨드 파일 로드
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(
    f => f.endsWith('.js') && f !== 'deploy.js'
  );

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.name) {
      client.commands.set(command.name, command);
      console.log(`  📌 커맨드 로드: /${command.name}`);
    }
  }

  // 봇 준비 완료
  client.once('ready', () => {
    console.log(`\n🤖 봇 로그인 완료: ${client.user.tag}`);
    console.log(`   서버 수: ${client.guilds.cache.size}`);
    client.user.setActivity('모의 시뮬레이션 | /국가목록', { type: 3 });
  });

  // 인터랙션 처리
  client.on('interactionCreate', async (interaction) => {
    // 자동완성 처리
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command && command.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          console.error(`자동완성 오류 (${interaction.commandName}):`, error);
        }
      }
      return;
    }

    // 슬래시 커맨드 처리
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`커맨드 실행 오류 (${interaction.commandName}):`, error);
      const reply = {
        content: '❌ 커맨드 실행 중 오류가 발생했습니다.',
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });

  return client;
}

module.exports = { createBot };
