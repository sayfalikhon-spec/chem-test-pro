const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "20kb" }));

const TEST_SIZE = 10;

// ---------- Саволҳои аввалия: [мавзӯъ, савол, [вариантҳо], индекси ҷавоби дуруст] ----------
const SEED = [
["Анорганикӣ","Формулаи кислотаи сулфат кадом аст?",["HCl","H2SO4","HNO3","H3PO4"],1],
["Сохти атом","Рақами тартибии оксиген дар ҷадвали Менделеев?",["6","7","8","16"],2],
["Анорганикӣ","Валентнокии азот дар аммиак (NH3) чанд аст?",["I","II","III","V"],2],
["Маҳлулҳо","pH-и маҳлули нейтралӣ дар 25°C чанд аст?",["0","7","10","14"],1],
["Металлҳо","Кадом металл дар шароити муқаррарӣ моеъ аст?",["Алюминий","Оҳан","Симоб","Мис"],2],
["Ҳисобкунӣ","Массаи молии об (H2O) чанд г/мол аст?",["16","17","18","20"],2],
["Пайвастагӣ","Дар NaCl кадом навъи пайвастагӣ мавҷуд аст?",["Ковалентии қутбӣ","Ковалентии ғайриқутбӣ","Ионӣ","Металлӣ"],2],
["Реаксияҳо","Ҳангоми реаксияи Zn бо HCl кадом газ ҷудо мешавад?",["O2","Cl2","CO2","H2"],3],
["Органикӣ","Формулаи этанол кадом аст?",["CH3OH","C2H5OH","CH3COOH","C3H7OH"],1],
["Сохти атом","Дар атоми калсий (Ca) чанд электрон ҳаст?",["10","18","20","40"],2],
["Реаксияҳо","Ҳангоми гармкунии CaCO3 чӣ ҳосил мешавад?",["CaO ва CO2","Ca ва O2","CaCl2 ва H2","Ca(OH)2"],0],
["Органикӣ","Формулаи умумии алканҳо кадом аст?",["CnH2n","CnH2n+2","CnH2n-2","CnHn"],1],
["Металлҳо","Кадом металл фаъолтарин аст?",["Мис","Натрий","Оҳан","Нуқра"],1],
["Реаксияҳо","Реаксияи байни кислота ва асос чӣ ном дорад?",["Оксидшавӣ","Нейтрализатсия","Пошхӯрӣ","Полимеризатсия"],1],
["Ҳисобкунӣ","Массаи молии CO2 чанд г/мол аст?",["28","32","44","46"],2],
["Маҳлулҳо","Лакмус дар муҳити кислотагӣ чӣ ранг мегирад?",["Кабуд","Сурх","Зард","Сабз"],1],
["Анорганикӣ","Формулаи намаки ошӣ кадом аст?",["NaOH","NaCl","Na2CO3","KCl"],1],
["Сохти атом","Заряди протон чӣ гуна аст?",["Манфӣ","Мусбат","Нейтралӣ","Тағйирёбанда"],1],
["Сохти атом","Кадом элементҳо галогенанд?",["Li, Na, K","He, Ne, Ar","F, Cl, Br","Be, Mg, Ca"],2],
["Органикӣ","Формулаи метан кадом аст?",["C2H6","CH4","C2H4","C6H6"],1],
["Органикӣ","Формулаи бензол кадом аст?",["C6H12","C6H6","C5H10","C7H8"],1],
["Анорганикӣ","Кадом газ барои нафаскашӣ зарур аст?",["N2","CO2","O2","H2"],2],
["Реаксияҳо","Ҳангоми сӯхтани гидроген (H2) чӣ ҳосил мешавад?",["H2O","H2O2","HCl","NH3"],0],
["Пайвастагӣ","Дар молекулаи O2 кадом навъи пайвастагӣ ҳаст?",["Ионӣ","Ковалентии ғайриқутбӣ","Металлӣ","Гидрогенӣ"],1],
["Маҳлулҳо","Консентратсияи молярӣ бо кадом воҳид ченида мешавад?",["г/л","моль/л","%","г/мол"],1],
["Металлҳо","Зангзании оҳан кадом раванд аст?",["Оксидшавӣ","Барқароршавӣ","Пошхӯрӣ","Ҳалшавӣ"],0],
["Ҳисобкунӣ","Адади Авогадро тақрибан чанд аст?",["6,02·10^23","3,14·10^8","9,8·10^2","1,6·10^-19"],0],
["Анорганикӣ","Формулаи оксиди алюминий кадом аст?",["AlO","Al2O3","Al3O2","AlO2"],1]
];

// ---------- Захира дар data.json ----------
const FILE = path.join(__dirname, "data.json");
let db = { users: [], posts: [], sessions: {} };
try { db = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) {}
if (!db.questions) db.questions = SEED.map(([t, q, o, a], i) => ({ id: i + 1, t, q, o, a }));
// Агар администратор набошад, аввалин корбар администратор мешавад
if (db.users.length && !db.users.some(u => u.isAdmin)) db.users[0].isAdmin = true;
const save = () => fs.writeFileSync(FILE, JSON.stringify(db));
save();

const tests = {}; // тестҳои ҷорӣ (дар хотира)
const str = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

function needUser(req, res, next) {
  const token = (req.headers.authorization || "").slice(7);
  const u = db.users.find(x => x.name === db.sessions[token]);
  if (!u) return res.status(401).json({ error: "Аввал ворид шавед." });
  req.u = u;
  next();
}
function needAdmin(req, res, next) {
  if (!req.u.isAdmin) return res.status(403).json({ error: "Танҳо администратор." });
  next();
}

// ---------- Сабти ном / воридшавӣ ----------
app.post("/api/auth", (req, res) => {
  const { mode, name, pass } = req.body || {};
  if (!str(name, 30) || name.trim().length < 3 || !str(pass, 100) || pass.length < 4)
    return res.status(400).json({ error: "Ном: камаш 3 ҳарф, рамз: камаш 4 аломат." });
  const n = name.trim();
  let u = db.users.find(x => x.name === n);
  if (mode === "reg") {
    if (u) return res.status(400).json({ error: "Ин ном банд аст." });
    u = { name: n, hash: bcrypt.hashSync(pass, 10), results: [], isAdmin: db.users.length === 0 };
    db.users.push(u);
  } else if (!u || !bcrypt.compareSync(pass, u.hash)) {
    return res.status(400).json({ error: "Ном ё рамз нодуруст аст." });
  }
  const token = crypto.randomBytes(24).toString("hex");
  db.sessions[token] = n;
  save();
  res.json({ token, name: n });
});

app.get("/api/me", needUser, (req, res) => {
  res.json({ name: req.u.name, results: req.u.results, isAdmin: !!req.u.isAdmin });
});

// ---------- Тест: хол дар сервер ҳисоб мешавад ----------
app.get("/api/topics", needUser, (req, res) => {
  res.json([...new Set(db.questions.map(q => q.t))]);
});

app.post("/api/test/start", needUser, (req, res) => {
  const topic = (req.body && req.body.topic) || "all";
  const pool = db.questions.filter(q => topic === "all" || q.t === topic);
  if (!pool.length) return res.status(400).json({ error: "Саволе ёфт нашуд." });
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, TEST_SIZE);
  const id = crypto.randomBytes(8).toString("hex");
  for (const k in tests) if (Date.now() - tests[k].t0 > 2 * 3600 * 1000) delete tests[k];
  tests[id] = { user: req.u.name, ids: picked.map(q => q.id), topic: String(topic).slice(0, 40), t0: Date.now() };
  res.json({ id, questions: picked.map(q => ({ id: q.id, q: q.q, o: q.o, t: q.t })) });
});

app.post("/api/test/finish", needUser, (req, res) => {
  const { id, answers } = req.body || {};
  const t = tests[id];
  if (!t || t.user !== req.u.name || !Array.isArray(answers) || answers.length !== t.ids.length)
    return res.status(400).json({ error: "Тест ёфт нашуд." });
  const correct = t.ids.map(qid => (db.questions.find(q => q.id === qid) || {}).a);
  const score = correct.reduce((s, c, i) => s + (answers[i] === c ? 1 : 0), 0);
  req.u.results.push({ date: new Date().toISOString(), score, total: t.ids.length, topic: t.topic });
  delete tests[id];
  save();
  res.json({ score, total: t.ids.length, correct });
});

// ---------- Рейтинг ----------
app.get("/api/rank", needUser, (req, res) => {
  const rows = db.users.map(u => {
    const p = u.results.map(r => (r.score / r.total) * 100);
    const avg = p.length ? Math.round(p.reduce((a, b) => a + b) / p.length) : 0;
    return { name: u.name, avg, n: p.length };
  }).sort((a, b) => b.avg - a.avg);
  res.json(rows);
});

// ---------- Саволу ҷавоб ----------
app.get("/api/posts", needUser, (req, res) => res.json(db.posts));

app.post("/api/posts", needUser, (req, res) => {
  const { q } = req.body || {};
  if (!str(q, 1000)) return res.status(400).json({ error: "Матни савол нодуруст аст." });
  db.posts.push({ id: Date.now(), q: q.trim(), by: req.u.name, date: new Date().toISOString(), answers: [] });
  save();
  res.json({ ok: true });
});

app.post("/api/posts/:id/answers", needUser, (req, res) => {
  const p = db.posts.find(x => x.id === Number(req.params.id));
  const { text } = req.body || {};
  if (!p || !str(text, 1000)) return res.status(400).json({ error: "Ҷавоб нодуруст аст." });
  p.answers.push({ text: text.trim(), by: req.u.name });
  save();
  res.json({ ok: true });
});

// ---------- Администратор ----------
app.get("/api/admin/questions", needUser, needAdmin, (req, res) => res.json(db.questions));

app.post("/api/admin/questions", needUser, needAdmin, (req, res) => {
  const { t, q, o, a } = req.body || {};
  if (!str(t, 40) || !str(q, 500) || !Array.isArray(o) || o.length !== 4 || !o.every(x => str(x, 200)) || !Number.isInteger(a) || a < 0 || a > 3)
    return res.status(400).json({ error: "Ҳамаи майдонҳоро пур кунед." });
  const id = db.questions.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  db.questions.push({ id, t: t.trim(), q: q.trim(), o: o.map(x => x.trim()), a });
  save();
  res.json({ ok: true });
});

app.delete("/api/admin/questions/:id", needUser, needAdmin, (req, res) => {
  db.questions = db.questions.filter(q => q.id !== Number(req.params.id));
  save();
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Сервер омода аст: http://localhost:" + PORT));
