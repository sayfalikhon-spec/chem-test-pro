const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const TEST_SIZE = 10;

app.disable("x-powered-by");
app.use(express.json({ limit: "30kb" }));

const SEED = [
  ["Анорганикӣ","Формулаи кислотаи сулфат кадом аст?",["HCl","H2SO4","HNO3","H3PO4"],1],
  ["Сохти атом","Рақами тартибии оксиген чанд аст?",["6","7","8","16"],2],
  ["Анорганикӣ","Валентнокии азот дар NH3 чанд аст?",["I","II","III","V"],2],
  ["Маҳлулҳо","pH-и маҳлули нейтралӣ дар 25°C чанд аст?",["0","7","10","14"],1],
  ["Металлҳо","Кадом металл дар шароити муқаррарӣ моеъ аст?",["Алюминий","Оҳан","Симоб","Мис"],2],
  ["Ҳисобкунӣ","Массаи молии об (H2O) чанд г/мол аст?",["16","17","18","20"],2],
  ["Пайвастагӣ","Дар NaCl кадом навъи пайвастагӣ мавҷуд аст?",["Ковалентии қутбӣ","Ковалентии ғайриқутбӣ","Ионӣ","Металлӣ"],2],
  ["Реаксияҳо","Ҳангоми реаксияи Zn бо HCl кадом газ ҷудо мешавад?",["O2","Cl2","CO2","H2"],3],
  ["Органикӣ","Формулаи этанол кадом аст?",["CH3OH","C2H5OH","CH3COOH","C3H7OH"],1],
  ["Сохти атом","Дар атоми калсий (Ca) чанд электрон ҳаст?",["10","18","20","40"],2],
  ["Реаксияҳо","Ҳангоми гармкунии CaCO3 чӣ ҳосил мешавад?",["CaO ва CO2","Ca ва O2","CaCl2 ва H2","Ca(OH)2"],0],
  ["Органикӣ","Формулаи умумии алканҳо кадом аст?",["CnH2n","CnH2n+2","CnH2n-2","CnHn"],1],
  ["Металлҳо","Кадом металл аз инҳо фаъолтар аст?",["Мис","Натрий","Оҳан","Нуқра"],1],
  ["Реаксияҳо","Реаксияи байни кислота ва асос чӣ ном дорад?",["Оксидшавӣ","Нейтрализатсия","Пошхӯрӣ","Полимеризатсия"],1],
  ["Ҳисобкунӣ","Массаи молии CO2 чанд г/мол аст?",["28","32","44","46"],2],
  ["Маҳлулҳо","Лакмус дар муҳити кислотагӣ чӣ ранг мегирад?",["Кабуд","Сурх","Зард","Сабз"],1],
  ["Анорганикӣ","Формулаи намаки ошӣ кадом аст?",["NaOH","NaCl","Na2CO3","KCl"],1],
  ["Сохти атом","Заряди протон чӣ гуна аст?",["Манфӣ","Мусбат","Нейтралӣ","Тағйирёбанда"],1],
  ["Сохти атом","Кадом элементҳо галогенанд?",["Li, Na, K","He, Ne, Ar","F, Cl, Br","Be, Mg, Ca"],2],
  ["Органикӣ","Формулаи метан кадом аст?",["C2H6","CH4","C2H4","C6H6"],1],
  ["Органикӣ","Формулаи бензол кадом аст?",["C6H12","C6H6","C5H10","C7H8"],1],
  ["Анорганикӣ","Кадом газ барои нафаскашӣ зарур аст?",["N2","CO2","O2","H2"],2],
  ["Реаксияҳо","Ҳангоми сӯхтани гидроген чӣ ҳосил мешавад?",["H2O","H2O2","HCl","NH3"],0],
  ["Пайвастагӣ","Дар молекулаи O2 кадом навъи пайвастагӣ ҳаст?",["Ионӣ","Ковалентии ғайриқутбӣ","Металлӣ","Гидрогенӣ"],1],
  ["Маҳлулҳо","Консентратсияи молярӣ бо кадом воҳид чен мешавад?",["г/л","моль/л","%","г/мол"],1],
  ["Металлҳо","Зангзании оҳан кадом раванд аст?",["Оксидшавӣ","Барқароршавӣ","Пошхӯрӣ","Ҳалшавӣ"],0],
  ["Ҳисобкунӣ","Адади Авогадро тақрибан чанд аст?",["6,02·10^23","3,14·10^8","9,8·10^2","1,6·10^-19"],0],
  ["Анорганикӣ","Формулаи оксиди алюминий кадом аст?",["AlO","Al2O3","Al3O2","AlO2"],1]
];

function loadDB() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return {
      users: Array.isArray(raw.users) ? raw.users : [],
      posts: Array.isArray(raw.posts) ? raw.posts : [],
      sessions: raw.sessions && typeof raw.sessions === "object" ? raw.sessions : {},
      questions: Array.isArray(raw.questions) ? raw.questions : SEED.map((x,i)=>({id:i+1,t:x[0],q:x[1],o:x[2],a:x[3]}))
    };
  } catch {
    return { users: [], posts: [], sessions: {}, questions: SEED.map((x,i)=>({id:i+1,t:x[0],q:x[1],o:x[2],a:x[3]})) };
  }
}
let db = loadDB();
function save() {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}
save();

const activeTests = new Map();
const validText = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.length <= max;

function authUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const username = db.sessions[token];
  const user = db.users.find(u => u.name === username);
  if (!user) return res.status(401).json({ error: "Аввал ворид шавед." });
  req.user = user;
  next();
}
function adminOnly(req, res, next) {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Танҳо администратор." });
  next();
}

app.post("/api/auth", (req, res) => {
  const { mode, name, pass } = req.body || {};
  if (!validText(name, 3, 30) || !validText(pass, 4, 100))
    return res.status(400).json({ error: "Ном 3–30 аломат ва рамз камаш 4 аломат бошад." });
  const cleanName = name.trim();
  let user = db.users.find(u => u.name.toLowerCase() === cleanName.toLowerCase());

  if (mode === "reg") {
    if (user) return res.status(409).json({ error: "Ин ном аллакай истифода мешавад." });
    user = {
      name: cleanName,
      hash: bcrypt.hashSync(pass, 10),
      results: [],
      isAdmin: db.users.length === 0
    };
    db.users.push(user);
  } else if (mode === "login") {
    if (!user || !bcrypt.compareSync(pass, user.hash))
      return res.status(400).json({ error: "Ном ё рамз нодуруст аст." });
  } else {
    return res.status(400).json({ error: "Амалиёт нодуруст аст." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  db.sessions[token] = user.name;
  save();
  res.json({ token, name: user.name });
});

app.post("/api/logout", authUser, (req, res) => {
  const token = (req.headers.authorization || "").slice(7);
  delete db.sessions[token];
  save();
  res.json({ ok: true });
});
app.get("/api/me", authUser, (req, res) => {
  res.json({ name: req.user.name, results: req.user.results || [], isAdmin: !!req.user.isAdmin });
});
app.get("/api/topics", authUser, (req, res) => {
  res.json([...new Set(db.questions.map(q => q.t))].sort());
});

app.post("/api/test/start", authUser, (req, res) => {
  const topic = typeof req.body?.topic === "string" ? req.body.topic : "all";
  const pool = db.questions.filter(q => topic === "all" || q.t === topic);
  if (!pool.length) return res.status(400).json({ error: "Дар ин мавзӯъ савол нест." });
  const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(TEST_SIZE, pool.length));
  const id = crypto.randomBytes(12).toString("hex");
  activeTests.set(id, { user: req.user.name, ids: selected.map(q => q.id), topic, createdAt: Date.now() });
  res.json({ id, questions: selected.map(({id,q,o,t}) => ({id,q,o,t})) });
});

app.post("/api/test/finish", authUser, (req, res) => {
  const { id, answers } = req.body || {};
  const record = activeTests.get(id);
  if (!record || record.user !== req.user.name || !Array.isArray(answers) || answers.length !== record.ids.length)
    return res.status(400).json({ error: "Тест ёфт нашуд ё ҷавобҳо нодурустанд." });
  const correct = record.ids.map(qid => db.questions.find(q => q.id === qid)?.a);
  const score = correct.reduce((sum, answer, i) => sum + (answers[i] === answer ? 1 : 0), 0);
  req.user.results.push({ date: new Date().toISOString(), score, total: record.ids.length, topic: record.topic });
  activeTests.delete(id);
  save();
  res.json({ score, total: record.ids.length, correct });
});

app.get("/api/rank", authUser, (req, res) => {
  const rows = db.users.map(u => {
    const results = u.results || [];
    const percentages = results.map(r => r.total ? r.score / r.total * 100 : 0);
    return { name: u.name, avg: percentages.length ? Math.round(percentages.reduce((a,b)=>a+b,0)/percentages.length) : 0, n: results.length };
  }).sort((a,b) => b.avg - a.avg || b.n - a.n);
  res.json(rows);
});

app.get("/api/posts", authUser, (req, res) => res.json(db.posts));
app.post("/api/posts", authUser, (req, res) => {
  const { q } = req.body || {};
  if (!validText(q, 1, 1000)) return res.status(400).json({ error: "Саволро нависед (то 1000 аломат)." });
  db.posts.push({ id: Date.now() + Math.floor(Math.random()*1000), q: q.trim(), by: req.user.name, date: new Date().toISOString(), answers: [] });
  save();
  res.json({ ok: true });
});
app.post("/api/posts/:id/answers", authUser, (req, res) => {
  const post = db.posts.find(p => p.id === Number(req.params.id));
  const { text } = req.body || {};
  if (!post || !validText(text, 1, 1000)) return res.status(400).json({ error: "Ҷавоб нодуруст аст." });
  post.answers.push({ text: text.trim(), by: req.user.name, date: new Date().toISOString() });
  save();
  res.json({ ok: true });
});

app.get("/api/admin/questions", authUser, adminOnly, (req, res) => res.json(db.questions));
app.post("/api/admin/questions", authUser, adminOnly, (req, res) => {
  const { t, q, o, a } = req.body || {};
  if (!validText(t,1,40) || !validText(q,1,500) || !Array.isArray(o) || o.length !== 4 ||
      !o.every(x => validText(x,1,200)) || !Number.isInteger(a) || a < 0 || a > 3)
    return res.status(400).json({ error: "Мавзӯъ, савол, 4 вариант ва ҷавоби дурустро пур кунед." });
  const id = db.questions.reduce((m,x)=>Math.max(m,x.id),0)+1;
  db.questions.push({ id, t:t.trim(), q:q.trim(), o:o.map(x=>x.trim()), a });
  save();
  res.json({ ok: true });
});
app.delete("/api/admin/questions/:id", authUser, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const before = db.questions.length;
  db.questions = db.questions.filter(q => q.id !== id);
  if (before === db.questions.length) return res.status(404).json({ error: "Савол ёфт нашуд." });
  save();
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req,res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`CHEM TEST PRO фаъол аст: http://localhost:${PORT}`));
