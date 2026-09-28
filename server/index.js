import express from 'express'
import Database from 'better-sqlite3'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const db = new Database(path.join(path.dirname(fileURLToPath(import.meta.url)), 'portfolio.db'))
db.exec(`
CREATE TABLE IF NOT EXISTS profile(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS skills(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, level INTEGER);
CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, tech TEXT, link TEXT);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT, created TEXT DEFAULT CURRENT_TIMESTAMP);`)

// First run: seed starter content (edit everything later in /#/admin)
if (!db.prepare('SELECT 1 FROM profile').get()) {
  const p = db.prepare('INSERT INTO profile VALUES(?,?)')
  Object.entries({
    name: "Lets'ela Wilson Refuoe",
    title: 'Software Engineer & Multimedia Developer',
    bio: 'I build fast, clean web and mobile apps and bring them to life with graphics, animation and interaction design.',
    about: 'I hold a BSc in Software Engineering with Multimedia from Limkokwing University of Creative Technology, Lesotho. My studies cover programming (Java, C++), web and mobile development, databases, AI, computer graphics, animation and virtual reality, so I can take an idea from code to visuals.',
    degree: 'BSc in Software Engineering with Multimedia',
    university: 'Limkokwing University of Creative Technology, Lesotho',
    graduated: '17 September 2026',
    location: 'Maseru, Lesotho',
    email: 'youremail@example.com',
    phone: '+266 0000 0000',
    photo: '/me.jpg', cv: '', github: '', linkedin: '',
  }).forEach(e => p.run(...e))
  const s = db.prepare('INSERT INTO skills(name,level) VALUES(?,?)')
  ;[['JavaScript', 80], ['React', 75], ['Java', 78], ['C++', 72], ['SQL & Databases', 78], ['Mobile Apps', 80], ['Web Design', 80], ['3D & Animation', 78]].forEach(x => s.run(...x))
  const j = db.prepare('INSERT INTO projects(title,description,tech,link) VALUES(?,?,?,?)')
  j.run('Major Project', 'My final-year software engineering project. Replace this with your real description.', 'Java, SQL', '')
  j.run('Portfolio Website', 'This site: React + Vite front end with a SQLite database and an admin panel.', 'React, Vite, SQLite', '')
  j.run('Mobile App', 'A mobile application built during my studies. Edit this in the admin panel.', 'Mobile, UI/UX', '')
}

// Add new fields to databases created by the earlier version (never overwrites your edits)
const extra = {
  photo: '/me.jpg', photo2: '/me-full.jpg',
  stat1n: '5', stat1l: 'Years of study', stat2n: '40+', stat2l: 'Modules completed', stat3n: '1', stat3l: 'Degree earned',
  service1: 'Website Development', service2: 'App Development', service3: 'Multimedia & Animation',
}
const ig = db.prepare('INSERT OR IGNORE INTO profile VALUES(?,?)')
Object.entries(extra).forEach(e => ig.run(...e))
db.prepare("UPDATE profile SET value='/me.jpg' WHERE key='photo' AND value=''").run()
db.prepare("UPDATE profile SET value='Software Developer' WHERE key='title' AND value LIKE 'Software Engineer &%'").run()

const app = express()
app.use(express.json())
const tokens = new Set()
const auth = (q, s, n) => (tokens.has(q.get('x-token')) ? n() : s.status(401).send('Unauthorized'))
const ok = s => s.json({ ok: true })

app.post('/api/login', (q, s) => {
  if (q.body.password !== (process.env.ADMIN_PASSWORD || 'admin123')) return s.status(401).send('Wrong password')
  const token = crypto.randomUUID(); tokens.add(token); s.json({ token })
})
app.get('/api/data', (q, s) => s.json({
  profile: Object.fromEntries(db.prepare('SELECT * FROM profile').all().map(r => [r.key, r.value])),
  skills: db.prepare('SELECT * FROM skills').all(),
  projects: db.prepare('SELECT * FROM projects').all(),
}))
app.put('/api/profile', auth, (q, s) => {
  const up = db.prepare('INSERT INTO profile VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
  Object.entries(q.body).forEach(([k, v]) => up.run(k, String(v))); ok(s)
})
app.post('/api/skills', auth, (q, s) => { db.prepare('INSERT INTO skills(name,level) VALUES(?,?)').run(q.body.name, +q.body.level); ok(s) })
app.delete('/api/skills/:id', auth, (q, s) => { db.prepare('DELETE FROM skills WHERE id=?').run(q.params.id); ok(s) })
app.post('/api/projects', auth, (q, s) => {
  const b = q.body; db.prepare('INSERT INTO projects(title,description,tech,link) VALUES(?,?,?,?)').run(b.title, b.description, b.tech, b.link); ok(s)
})
app.delete('/api/projects/:id', auth, (q, s) => { db.prepare('DELETE FROM projects WHERE id=?').run(q.params.id); ok(s) })
app.post('/api/messages', (q, s) => {
  const { name, email, message } = q.body
  if (!name || !email || !message) return s.status(400).send('Fill in all fields')
  db.prepare('INSERT INTO messages(name,email,message) VALUES(?,?,?)').run(name, email, message); ok(s)
})
app.get('/api/messages', auth, (q, s) => s.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all()))

app.listen(3001, () => console.log('API running on http://localhost:3001'))