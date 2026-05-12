import React, { useState, useEffect, useRef } from 'react';

// ── Paleta JEJ ──────────────────────────────────────────────
const C = {
  navy:    '#1B3F7A',
  navyD:   '#122d5a',
  navyL:   '#2a5298',
  sky:     '#4A90D9',
  skyL:    '#E8F1FB',
  white:   '#FFFFFF',
  offWhite:'#F7F9FC',
  gray100: '#EEF1F6',
  gray300: '#C4CDD8',
  gray500: '#7A8899',
  gray800: '#2C3E50',
  error:   '#D64545',
  success: '#2E7D32',
};

// ── Usuarios autorizados (reemplazar con Supabase Auth en prod) ──
const USUARIOS = [
  { correo: 'operario@jej.cl',     rut: '12.345.678-9', nombre: 'Carlos Ramírez' },
  { correo: 'supervisor@jej.cl',   rut: '98.765.432-1', nombre: 'Ana Torres' },
  { correo: 'demo@jej.cl',         rut: '11.111.111-1', nombre: 'Usuario Demo' },
];

const WEBHOOK = 'https://kimozabee.app.n8n.cloud/webhook/rag-jej';

// ── Utilidades ───────────────────────────────────────────────
function formatRut(val) {
  const clean = val.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1);
  const dv   = clean.slice(-1);
  const fmt  = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${fmt}-${dv}`;
}

function sessionId() {
  let id = localStorage.getItem('jej_session');
  if (!id) { id = 'jej_' + Math.random().toString(36).slice(2); localStorage.setItem('jej_session', id); }
  return id;
}

// ── Logo SVG inline ──────────────────────────────────────────
function LogoJEJ({ color = C.white, size = 48 }) {
  return (
    <svg width={size} height={size * 0.45} viewBox="0 0 220 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="78" fontFamily="DM Serif Display, serif" fontSize="88" fill={color} letterSpacing="-4">JEJ</text>
      <text x="12" y="98" fontFamily="DM Sans, sans-serif" fontSize="13" fill={color} letterSpacing="4" opacity="0.8">INGENIERIA CONSCIENTE</text>
    </svg>
  );
}

// ── Pantalla Login ───────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [correo, setCorreo] = useState('');
  const [rut, setRut]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleRut(e) { setRut(formatRut(e.target.value)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const user = USUARIOS.find(
      u => u.correo.toLowerCase() === correo.toLowerCase().trim() && u.rut === rut.trim()
    );
    if (user) { onLogin(user); }
    else { setError('Correo o RUT no registrado. Contacta a tu supervisor.'); }
    setLoading(false);
  }

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        {/* Header azul */}
        <div style={styles.loginHeader}>
          <LogoJEJ color={C.white} size={56} />
          <p style={styles.loginSubtitle}>Asistente de Procedimientos</p>
          <p style={styles.loginProject}>Proyecto CC687 · Codelco</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Correo corporativo</label>
            <input
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="nombre@jej.cl"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>RUT</label>
            <input
              type="text"
              value={rut}
              onChange={handleRut}
              placeholder="12.345.678-9"
              maxLength={12}
              required
              style={styles.input}
            />
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button type="submit" style={{...styles.btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <p style={styles.loginFooter}>Solo personal autorizado CC687</p>
      </div>
    </div>
  );
}

// ── Burbuja de mensaje ───────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={styles.avatar}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.white }}>JEJ</span>
        </div>
      )}
      <div style={{
        ...styles.bubble,
        background:   isUser ? C.navy : C.white,
        color:        isUser ? C.white : C.gray800,
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        boxShadow:    isUser ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
        border:       isUser ? 'none' : `1px solid ${C.gray100}`,
        maxWidth:     '82%',
      }}>
        <span style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.text}</span>
        <span style={{ fontSize: 10, opacity: 0.5, display: 'block', marginTop: 4, textAlign: 'right' }}>{msg.time}</span>
      </div>
    </div>
  );
}

// ── Indicador de escritura ───────────────────────────────────
function Typing() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={styles.avatar}><span style={{ fontSize: 14, fontWeight: 600, color: C.white }}>JEJ</span></div>
      <div style={{ ...styles.bubble, background: C.white, border: `1px solid ${C.gray100}`, borderRadius: '18px 18px 18px 4px' }}>
        <div style={styles.typingDots}>
          <span style={{ ...styles.dot, animationDelay: '0s' }} />
          <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
          <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

// ── Pantalla Chat ────────────────────────────────────────────
function ChatScreen({ user, onLogout }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: `Hola ${user.nombre} 👋\n\nSoy el asistente de procedimientos del proyecto CC687. Puedo ayudarte con:\n• Procedimientos operativos\n• Instructivos de trabajo\n• Requisitos de seguridad\n\n¿En qué puedo ayudarte?`,
    time: now(),
  }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [menu, setMenu]       = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  function now() { return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }); }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text, time: now() }]);
    setLoading(true);
    try {
      const res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: text, sessionId: sessionId() }),
      });
      const data = await res.json();
      const reply = data.response || data.output || 'No pude obtener una respuesta. Intenta nuevamente.';
      setMessages(m => [...m, { role: 'assistant', text: reply, time: now() }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Error de conexión. Verifica tu red e intenta nuevamente.', time: now() }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }

  const sugerencias = ['¿Qué EPP se requiere para espacios confinados?', 'Procedimiento de bloqueo de energía', '¿Qué hacer ante una emergencia?'];

  return (
    <div style={styles.chatWrap}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <LogoJEJ color={C.white} size={36} />
        <div style={{ flex: 1, marginLeft: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Asistente CC687</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>● En línea</div>
        </div>
        <button onClick={() => setMenu(!menu)} style={styles.menuBtn}>
          <span style={{ fontSize: 20, color: C.white }}>⋮</span>
        </button>
        {menu && (
          <div style={styles.dropdown}>
            <div style={styles.dropItem}>{user.nombre}</div>
            <div style={styles.dropItem}>{user.correo}</div>
            <div style={{ ...styles.dropItem, borderTop: `1px solid ${C.gray100}`, color: C.error, cursor: 'pointer' }} onClick={onLogout}>
              Cerrar sesión
            </div>
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div style={styles.messages} onClick={() => setMenu(false)}>
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        {loading && <Typing />}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias (solo al inicio) */}
      {messages.length === 1 && (
        <div style={styles.chips}>
          {sugerencias.map((s, i) => (
            <button key={i} style={styles.chip} onClick={() => { setInput(s); inputRef.current?.focus(); }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={styles.inputBar}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe tu consulta..."
          rows={1}
          style={styles.textarea}
        />
        <button onClick={send} disabled={!input.trim() || loading} style={{
          ...styles.sendBtn,
          background: input.trim() && !loading ? C.navy : C.gray300,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}

// ── App root ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jej_user')); } catch { return null; }
  });

  function login(u)  { localStorage.setItem('jej_user', JSON.stringify(u)); setUser(u); }
  function logout()  { localStorage.removeItem('jej_user'); localStorage.removeItem('jej_session'); setUser(null); }

  return user ? <ChatScreen user={user} onLogout={logout} /> : <LoginScreen onLogin={login} />;
}

// ── Estilos ──────────────────────────────────────────────────
const styles = {
  loginWrap: {
    minHeight: '100vh', background: C.offWhite,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, fontFamily: "'DM Sans', sans-serif",
  },
  loginCard: {
    width: '100%', maxWidth: 420, borderRadius: 20,
    overflow: 'hidden', boxShadow: '0 8px 40px rgba(27,63,122,0.15)',
  },
  loginHeader: {
    background: `linear-gradient(135deg, ${C.navyD} 0%, ${C.navyL} 100%)`,
    padding: '36px 32px 28px', textAlign: 'center',
  },
  loginSubtitle: { margin: '12px 0 4px', color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: 500 },
  loginProject:  { margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  form:   { background: C.white, padding: '28px 32px 24px' },
  field:  { marginBottom: 20 },
  label:  { display: 'block', fontSize: 13, fontWeight: 500, color: C.gray500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:  {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${C.gray300}`,
    fontSize: 15, color: C.gray800, outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s',
  },
  errorBox: {
    background: '#FEF2F2', border: `1px solid #FECACA`, borderRadius: 8,
    padding: '10px 14px', color: C.error, fontSize: 13, marginBottom: 16,
  },
  btn: {
    width: '100%', padding: '14px', borderRadius: 10, border: 'none',
    background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyL} 100%)`,
    color: C.white, fontSize: 15, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", transition: 'opacity 0.2s',
  },
  loginFooter: { background: C.gray100, textAlign: 'center', padding: '14px', margin: 0, fontSize: 12, color: C.gray500 },

  chatWrap: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: C.offWhite, fontFamily: "'DM Sans', sans-serif", position: 'relative',
  },
  navbar: {
    background: `linear-gradient(135deg, ${C.navyD} 0%, ${C.navyL} 100%)`,
    padding: '12px 16px', display: 'flex', alignItems: 'center',
    boxShadow: '0 2px 12px rgba(27,63,122,0.25)', position: 'relative', zIndex: 10,
  },
  menuBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' },
  dropdown: {
    position: 'absolute', top: '100%', right: 12, background: C.white,
    borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    minWidth: 200, overflow: 'hidden', zIndex: 100,
  },
  dropItem: { padding: '12px 16px', fontSize: 14, color: C.gray800 },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 12px 8px' },
  avatar:   {
    width: 32, height: 32, borderRadius: '50%', marginRight: 8, flexShrink: 0,
    background: `linear-gradient(135deg, ${C.navy}, ${C.sky})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bubble: { padding: '10px 14px', fontSize: 14 },
  typingDots: { display: 'flex', gap: 4, padding: '2px 4px' },
  dot: {
    width: 7, height: 7, borderRadius: '50%', background: C.gray300,
    display: 'inline-block', animation: 'bounce 1.2s ease-in-out infinite',
  },
  chips: { padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 8 },
  chip: {
    background: C.skyL, border: `1px solid ${C.sky}`, borderRadius: 20,
    padding: '8px 14px', fontSize: 13, color: C.navy, cursor: 'pointer',
    textAlign: 'left', fontFamily: "'DM Sans', sans-serif",
  },
  inputBar: {
    display: 'flex', alignItems: 'flex-end', gap: 8,
    padding: '10px 12px 16px', background: C.white,
    borderTop: `1px solid ${C.gray100}`,
  },
  textarea: {
    flex: 1, padding: '10px 14px', borderRadius: 20,
    border: `1.5px solid ${C.gray300}`, fontSize: 14, resize: 'none',
    fontFamily: "'DM Sans', sans-serif", outline: 'none',
    background: C.offWhite, color: C.gray800, lineHeight: 1.5,
    maxHeight: 100, overflowY: 'auto',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: '50%', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
  },
};
