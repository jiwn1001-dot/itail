const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database/db');

function createServer() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: process.env.SESSION_SECRET || 'simulation-bot-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  }));

  app.use(express.static(path.join(__dirname, 'public')));
  
  const uploadsDir = process.env.VERCEL
    ? path.join('/tmp', 'uploads', 'leaders')
    : path.join(__dirname, 'uploads', 'leaders');

  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
    console.warn('⚠️ 업로드 디렉토리 생성 실패 (Vercel Read-Only 환경):', e.message);
  }

  app.use('/uploads', express.static(uploadsDir));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `leader_${Date.now()}${ext}`);
    }
  });
  const upload = multer({ storage });

  // 인증 비활성화 (관리자 전용 비공개 링크 공유 방식)

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.post('/api/login', (req, res) => {
    res.json({ success: true });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
  });

  app.get('/api/auth/check', (req, res) => {
    res.json({ authenticated: true });
  });

  app.get('/api/countries', async (req, res) => {
    res.json(await db.getCountries());
  });

  app.get('/api/countries/:id', async (req, res) => {
    const country = await db.getCountryById(req.params.id);
    if (!country) return res.status(404).json({ error: '국가를 찾을 수 없습니다' });
    
    const parties = await db.getPartiesByCountry(country.id);
    const parliament = await db.getParliament(country.id);
    res.json({ country, parties, parliament });
  });

  app.post('/api/countries', async (req, res) => {
    const id = await db.insertCountry(req.body);
    res.json({ id, success: true });
  });

  app.put('/api/countries/:id', async (req, res) => {
    const success = await db.updateCountry(req.params.id, req.body);
    if (success) res.json({ success: true });
    else res.status(400).json({ error: '수정 실패' });
  });

  app.delete('/api/countries/:id', async (req, res) => {
    await db.deleteCountry(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/upload/leader', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '이미지 필요' });
    res.json({ success: true, path: `/uploads/${req.file.filename}` });
  });

  app.put('/api/parliament/:countryId', async (req, res) => {
    await db.updateParliament(req.params.countryId, req.body);
    res.json({ success: true });
  });

  app.get('/api/parties/:countryId', async (req, res) => {
    res.json(await db.getPartiesByCountry(req.params.countryId));
  });

  app.post('/api/parties', async (req, res) => {
    const id = await db.insertParty(req.body);
    res.json({ id, success: true });
  });

  app.put('/api/parties/:id', async (req, res) => {
    await db.updateParty(req.params.id, req.body);
    res.json({ success: true });
  });

  app.delete('/api/parties/:id', async (req, res) => {
    await db.deleteParty(req.params.id);
    res.json({ success: true });
  });

  app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
  app.get('/edit/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'country-edit.html')));

  return app;
}

module.exports = { createServer };
