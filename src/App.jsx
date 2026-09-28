import { useEffect, useState } from 'react'

const api = async (url, method = 'GET', body, token) => {
  const r = await fetch('/api' + url, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-token': token || '' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export default function App() {
  const [route, setRoute] = useState(location.hash)
  useEffect(() => {
    const f = () => setRoute(location.hash)
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return route === '#/admin' ? <Admin /> : <Site />
}

function Site() {
  const [d, setD] = useState(null)
  const [f, setF] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  useEffect(() => { api('/data').then(setD).catch(() => setD({ error: true })) }, [])
  if (!d) return <p className="load">Loading…</p>
  if (d.error) return <p className="load">Can't reach the database. Run <b>npm start</b> in the terminal.</p>
  const p = d.profile
  const send = async e => {
    e.preventDefault()
    try { await api('/messages', 'POST', f); setStatus('Message sent. Thank you!'); setF({ name: '', email: '', message: '' }) }
    catch { setStatus('Could not send. Fill in every field and try again.') }
  }
  const close = () => setOpen(false)
  const num = n => { const m = /^(\d+)(.*)$/.exec(n || ''); return m ? <>{m[1]}<i>{m[2]}</i></> : n }
  return (
    <>
      <header className="nav">
        <a href="#top" className="logo">{p.name}</a>
        <nav className={'links' + (open ? ' open' : '')}>
          {['about', 'projects', 'education', 'contact'].map(s => <a key={s} href={'#' + s} onClick={close} style={{ textTransform: 'capitalize' }}>{s}</a>)}
        </nav>
        <a className="btn" href="#contact">Got a project?</a>
        <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
      </header>

      <section id="top" className="hero" style={{ padding: '0 8%' }}>
        <div>
          <h2>{p.hello || 'Hello'}<span className="dot">.</span></h2>
          <p className="im">I'm {p.name.split(' ')[0]}</p>
          <h1>{p.title}</h1>
          <div className="row">
            <a className="btn" href="#contact">Got a project?</a>
            <a className="btn ghost" href={p.cv || '#contact'} target={p.cv ? '_blank' : undefined}>My resume</a>
          </div>
        </div>
        <div className="pic">
          <span className="chev l">&lt;</span><span className="chev r">&gt;</span>
          <div className="ring"><img src={p.photo} alt={p.name} /></div>
        </div>
      </section>

      <div className="strip">{d.skills.map(s => <span key={s.id}>{s.name}</span>)}</div>

      <section id="about" className="about">
        <div>
          {[['</>', p.service1], ['{ }', p.service2], ['▶', p.service3]].map(([i, t]) => <div className="svc" key={t}><b>{i}</b>{t}</div>)}
        </div>
        <div>
          <h3 className="t">About me</h3>
          <p>{p.about}</p>
          <div className="stats">
            {[1, 2, 3].map(n => <div key={n}><b>{num(p['stat' + n + 'n'])}</b><span>{p['stat' + n + 'l']}</span></div>)}
          </div>
        </div>
      </section>

      <section id="projects"><h3 className="t center">Projects</h3>
        <div className="grid">{d.projects.map(x => (
          <article className="card" key={x.id}>
            <h4>{x.title}</h4><p>{x.description}</p><small>{x.tech}</small>
            {x.link && <a className="btn" href={x.link} target="_blank">View project</a>}
          </article>
        ))}</div>
      </section>

      <section id="education"><h3 className="t center">Education</h3>
        <div className="edu">
          <img src={p.photo2} alt="Graduation" />
          <div className="card"><h4>{p.degree}</h4><p>{p.university}</p><small>Graduated {p.graduated}</small></div>
        </div>
      </section>

      <section id="contact"><h3 className="t center">Contact me</h3>
        <div className="contact">
          <div className="about"><p>{p.location}</p><p>{p.email}</p><p>{p.phone}</p>
            <p>{p.github && <a href={p.github} target="_blank">GitHub </a>}{p.linkedin && <a href={p.linkedin} target="_blank">LinkedIn</a>}</p></div>
          <form onSubmit={send}>
            <input placeholder="Your name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
            <input placeholder="Your email" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
            <textarea rows="4" placeholder="Your message" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} />
            <button className="btn">Send message</button>
            {status && <p className="status">{status}</p>}
          </form>
        </div>
      </section>
      <footer>© {new Date().getFullYear()} {p.name}. <a href="#/admin">Admin</a></footer>
    </>
  )
}

function Admin() {
  const [token, setToken] = useState(sessionStorage.token || '')
  const [pw, setPw] = useState('')
  const [d, setD] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [np, setNp] = useState({ title: '', description: '', tech: '', link: '' })
  const [ns, setNs] = useState({ name: '', level: 80 })

  const load = () => {
    api('/data').then(setD)
    api('/messages', 'GET', null, token).then(setMsgs).catch(() => { sessionStorage.token = ''; setToken('') })
  }
  useEffect(() => { if (token) load() }, [token])

  const login = async e => {
    e.preventDefault()
    try { const r = await api('/login', 'POST', { password: pw }); sessionStorage.token = r.token; setToken(r.token) }
    catch { alert('Wrong password') }
  }
  if (!token) return (
    <form className="admin" onSubmit={login}>
      <h2>Admin <span>login</span></h2>
      <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} />
      <button className="btn">Log in</button>
    </form>
  )
  if (!d) return <p className="load">Loading…</p>
  const act = (u, m, b) => api(u, m, b, token).then(load)

  return (
    <div className="admin">
      <h2>Admin <span>panel</span> <a href="#top" className="btn ghost">View site</a></h2>

      <div className="card"><h3>Profile</h3>
        {Object.keys(d.profile).map(k => (
          <label key={k}>{k}
            <textarea rows={k === 'bio' || k === 'about' ? 4 : 1} value={d.profile[k]}
              onChange={e => setD({ ...d, profile: { ...d.profile, [k]: e.target.value } })} />
          </label>
        ))}
        <button className="btn" onClick={() => act('/profile', 'PUT', d.profile).then(() => alert('Saved'))}>Save profile</button>
      </div>

      <div className="card"><h3>Skills</h3>
        {d.skills.map(s => <p key={s.id}>{s.name} ({s.level}%) <button className="del" onClick={() => act('/skills/' + s.id, 'DELETE')}>Delete</button></p>)}
        <input placeholder="Skill name" value={ns.name} onChange={e => setNs({ ...ns, name: e.target.value })} />
        <input type="number" min="0" max="100" value={ns.level} onChange={e => setNs({ ...ns, level: e.target.value })} />
        <button className="btn" onClick={() => act('/skills', 'POST', ns).then(() => setNs({ name: '', level: 80 }))}>Add skill</button>
      </div>

      <div className="card"><h3>Projects</h3>
        {d.projects.map(x => <p key={x.id}>{x.title} <button className="del" onClick={() => act('/projects/' + x.id, 'DELETE')}>Delete</button></p>)}
        {['title', 'description', 'tech', 'link'].map(k => (
          <input key={k} placeholder={k} value={np[k]} onChange={e => setNp({ ...np, [k]: e.target.value })} />
        ))}
        <button className="btn" onClick={() => act('/projects', 'POST', np).then(() => setNp({ title: '', description: '', tech: '', link: '' }))}>Add project</button>
      </div>

      <div className="card"><h3>Messages ({msgs.length})</h3>
        {msgs.length === 0 && <p>No messages yet.</p>}
        {msgs.map(m => <p key={m.id}><b>{m.name}</b> ({m.email}) · {m.created}<br />{m.message}</p>)}
      </div>
    </div>
  )
}