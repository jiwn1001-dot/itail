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
  
  const uploadsDir = path.join(__dirname, 'uploads', 'leaders');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `leader_${Date.now()}${ext}`);
    }
  });
  const upload = multer({ storage });

  function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) return next();
    res.status(401).json({ error: '인증이 필요합니다' });
  }

  app.post('/api/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || 'admin1234')) {
      req.session.authenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: '비밀번호가 틀렸습니다' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
  });

  app.get('/api/auth/check', (req, res) => {
    res.json({ authenticated: !!(req.session && req.session.authenticated) });
  });

  app.get('/api/countries', requireAuth, (req, res) => {
    res.json(db.getCountries());
  });

  app.get('/api/countries/:id', requireAuth, (req, res) => {
    const country = db.getCountryById(req.params.id);
    if (!country) return res.status(404).json({ error: '국가를 찾을 수 없습니다' });
    
    const parties = db.getPartiesByCountry(country.id);
    const parliament = db.getParliament(country.id);
    res.json({ country, parties, parliament });
  });

  app.post('/api/countries', requireAuth, (req, res) => {
    const id = db.insertCountry(req.body);
    res.json({ id, success: true });
  });

  app.put('/api/countries/:id', requireAuth, (req, res) => {
    const success = db.updateCountry(req.params.id, req.body);
    if (success) res.json({ success: true });
    else res.status(400).json({ error: '수정 실패' });
  });

  app.delete('/api/countries/:id', requireAuth, (req, res) => {
    db.deleteCountry(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/upload/leader', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '이미지 필요' });
    res.json({ success: true, path: `/uploads/leaders/${req.file.filename}` });
  });

  app.put('/api/parliament/:countryId', requireAuth, (req, res) => {
    db.updateParliament(req.params.countryId, req.body);
    res.json({ success: true });
  });

  app.get('/api/parties/:countryId', requireAuth, (req, res) => {
    res.json(db.getPartiesByCountry(req.params.countryId));
  });

  app.post('/api/parties', requireAuth, (req, res) => {
    const id = db.insertParty(req.body);
    res.json({ id, success: true });
  });

  app.put('/api/parties/:id', requireAuth, (req, res) => {
    db.updateParty(req.params.id, req.body);
    res.json({ success: true });
  });

  app.delete('/api/parties/:id', requireAuth, (req, res) => {
    db.deleteParty(req.params.id);
    res.json({ success: true });
  });

  app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
  app.get('/edit/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'country-edit.html')));

  return app;
}

module.exports = { createServer };
