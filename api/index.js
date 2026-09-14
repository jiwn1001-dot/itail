const { createServer } = require('../server');
const db = require('../database/db');

let app;
let isDbConnected = false;

module.exports = async (req, res) => {
  if (!isDbConnected) {
    try {
      await db.connect(process.env.MONGODB_URI);
    } catch (e) {
      db.useJsonFallback();
    }
    isDbConnected = true;
  }

  if (!app) {
    app = createServer();
  }

  return app(req, res);
};
