require('dotenv').config();
const { createBot } = require('./bot');
const { createServer } = require('./server');
const db = require('./database/db');

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    🎮 모의전용 시뮬레이션 디스코드봇     ║');
  console.log('╚══════════════════════════════════════════╝\n');

  try {
    await db.connect(process.env.MONGODB_URI);
  } catch (err) {
    console.warn('⚠️ DB 연결 경고:', err.message);
  }

  const countries = await db.getCountries();
  console.log(`📦 등록된 국가 수: ${countries.length}개`);

  const port = process.env.PORT || 3000;
  const app = createServer();
  app.listen(port, () => {
    console.log(`\n🌐 관리자 패널: http://localhost:${port}`);
    console.log(`   대시보드: http://localhost:${port}/dashboard`);
  });

  const token = process.env.DISCORD_TOKEN;
  if (!token || token === '여기에_봇_토큰_입력') {
    console.log('\n⚠️  DISCORD_TOKEN이 설정되지 않았습니다.');
    return;
  }

  console.log('\n🤖 디스코드 봇 시작 중...');
  const client = createBot();
  try {
    await client.login(token);
  } catch (error) {
    console.error('❌ 봇 로그인 실패:', error.message);
  }
}

main().catch(console.error);
