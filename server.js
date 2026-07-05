const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'domu-dev-secret-change-me';
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- простое файловое "хранилище" ----------
function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ---------- middleware авторизации ----------
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Нет токена' });
  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Неверный или истёкший токен' });
  }
}

// ---------- ТРЕКИ ----------
app.get('/api/tracks', (req, res) => {
  const db = readDB();
  res.json(db.tracks);
});

// ---------- РЕГИСТРАЦИЯ ----------
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Укажите логин и пароль' });
  }
  const db = readDB();
  if (db.users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Пользователь уже существует' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = { id: Date.now(), username, passwordHash };
  db.users.push(user);
  writeDB(db);

  const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

// ---------- ВХОД ----------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }
  const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

// ---------- ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ----------
app.get('/api/me', auth, (req, res) => {
  res.json({ username: req.user.username });
});

app.listen(PORT, () => {
  console.log(`DoMu запущен: http://localhost:${PORT}`);
});
