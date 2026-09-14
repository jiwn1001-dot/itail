const { createServer } = require('../server');
const db = require('../database/db');

let isDbInitialized = false;

module.exports = async (req, res) => {
  if (!isDbInitialized) {
    try {
      await db.connect(process.env.MONGODB_URI);
    } catch (e) {
      db.useJsonFallback();
    }
    isDbInitialized = true;
  }
  const app = createServer();
  return app(req, res);
};
