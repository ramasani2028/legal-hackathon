const ICON = (name, cls = 'icon') => `<i data-lucide="${name}" class="${cls}"></i>`;

// -------------------------------------------------------------
// CENTRAL REACTIVE STATE STORE
// -------------------------------------------------------------
const state = {
  page: 'landing',
  modal: null,
  notificationsOpen: false,
  toast: '',
  authError: '',
  profileOpen: false,
  pending: null,
  teamFound: false,
  confirmAction: null,
  selectedCase: 1,
  simSpeed: 'normal',
  audioEnabled: true,
  emergencyRoster: [],
  
  session: JSON.parse(sessionStorage.getItem('lexmatrix-session') || 'null'),
  
  // Realtime Chamber State
  cases: [
    {
      id: 1,
      no: 'WP(C) 4521/2026',
      parties: 'Aarav Estates Pvt. Ltd. v. Union of India',
      court: 'Delhi High Court',
      bench: 'Justice Mehta',
      hall: 'Court Hall 3',
      item: 60,
      live: 56,
      eta: '~4 min',
      assignee: 'Ananya Rao',
      assigneeId: 'junior-001',
      status: 'Awaiting Response',
      passoverRisk: 'Moderate',
      walkTime: '3 mins',
      notes: 'Urgent stay application against administrative demolition notice.',
      files: [{ name: 'briefing-note.pdf', size: '1.8 MB' }]
    },
    {
      id: 2,
      no: 'COMIP 182/2026',
      parties: 'Mosaic Foods Ltd. v. Pristine Foods',
      court: 'Bombay High Court',
      bench: 'Justice Kulkarni',
      hall: 'Court Hall 7',
      item: 36,
      live: 31,
      eta: '~8 min',
      assignee: 'Rahul Sharma',
      assigneeId: 'junior-002',
      status: 'Accepted',
      passoverRisk: 'Low',
      walkTime: '5 mins',
      notes: 'Trademark infringement ex-parte ad-interim injunction.',
      files: [{ name: 'trademark-injunction-brief.pdf', size: '2.4 MB' }]
    },
    {
      id: 3,
      no: 'WP 8421/2026',
      parties: 'Nandini Rao v. State of Karnataka',
      court: 'Karnataka High Court',
      bench: 'Justice Rao',
      hall: 'Court Hall 2',
      item: 48,
      live: 17,
      eta: '~45 min',
      assignee: 'Senior Advocate',
      assigneeId: 'senior-001',
      status: 'Self-attend',
      passoverRisk: 'Low',
      walkTime: '2 mins',
      notes: 'Public interest litigation regarding environmental clearance.',
      files: []
    },
    {
      id: 4,
      no: 'FAO 231/2026',
      parties: 'Dutta Infrastructure v. Kolkata Municipal Corp.',
      court: 'Calcutta High Court',
      bench: 'Division Bench',
      hall: 'Court Hall 5',
      item: 25,
      live: 14,
      eta: '~18 min',
      assignee: 'Karan Mehta',
      assigneeId: 'junior-003',
      status: 'Accepted',
      passoverRisk: 'High',
      walkTime: '6 mins',
      notes: 'Appeal against commercial arbitration award stay.',
      files: [{ name: 'arbitration-stay-motion.docx', size: '940 KB' }]
    },
    {
      id: 5,
      no: 'CRL.M.C. 1182/2026',
      parties: 'Rohan Bhatia v. State (NCT Delhi)',
      court: 'Delhi High Court',
      bench: 'Justice Sethi',
      hall: 'Court Hall 9',
      item: 72,
      live: 45,
      eta: '~40 min',
      assignee: null,
      assigneeId: null,
      status: 'Unassigned',
      passoverRisk: 'Low',
      walkTime: '4 mins',
      notes: 'Quashing of FIR under Section 482 CrPC.',
      files: []
    }
  ],

  team: [
    { id: 'senior-001', role: 'SENIOR', fullName: 'S. Pranav', email: 'senior@lexmatrix.demo', available: true, activeCases: 1 },
    { id: 'junior-001', role: 'JUNIOR', fullName: 'Ananya Rao', email: 'ananya@lexmatrix.demo', available: true, activeCases: 1 },
    { id: 'junior-002', role: 'JUNIOR', fullName: 'Rahul Sharma', email: 'rahul@lexmatrix.demo', available: true, activeCases: 1 },
    { id: 'junior-003', role: 'JUNIOR', fullName: 'Karan Mehta', email: 'karan@lexmatrix.demo', available: false, activeCases: 1 },
    { id: 'junior-004', role: 'JUNIOR', fullName: 'Meera Iyer', email: 'meera@lexmatrix.demo', available: true, activeCases: 0 },
    { id: 'cocounsel-001', role: 'CO_COUNSEL', fullName: 'Vikramaditya Sen', email: 'vikram@lexmatrix.demo', available: true, activeCases: 0 }
  ],

  notifications: [
    { id: 1, time: '10:31', tone: 'critical', text: '5-minute warning', sub: 'WP(C) 4521/2026 is approaching (Δ 04).' },
    { id: 2, time: '10:28', tone: 'approaching', text: 'Manual correction received', sub: 'Court Hall 3 live item updated to 56 by Ananya Rao.' },
    { id: 3, time: '10:21', tone: 'approaching', text: '15-minute warning', sub: 'COMIP 182/2026 is approaching (Δ 05).' },
    { id: 4, time: '09:57', tone: 'safe', text: 'AI Brief Ready', sub: 'Ephemeral argument brief generated for WP(C) 4521/2026.' }
  ],

  caseHistory: [
    { time: '10:15 AM', text: 'Cause list synchronized across 4 High Courts.' },
    { time: '10:28 AM', text: 'Live item corrected to 56 by Ananya Rao.' }
  ],

  courtStatus: { isOperatingHours: true, statusText: 'COURT_SITTING', nextSession: '09:00 AM IST', demoOverride: true },
  
  researchHistory: [
    { sender: 'user', text: 'Find authorities on maintainability of writ petition when alternative statutory remedy exists.' },
    { sender: 'ai', text: 'Key exceptions to the alternative remedy rule under Article 226:\n1. Breach of fundamental rights (Whirlpool Corp. v. Registrar of Trade Marks).\n2. Violation of principles of natural justice.\n3. Orders passed completely without jurisdiction.\n4. Challenge to ultra vires legislation.\nAlways cross-check citations against official law reports before citing.' }
  ]
};

let socket = null;

// Connect Realtime WebSocket Server for Cross-Device Synchronization
function initWebSocket() {
  if (window.location.protocol === 'file:') return;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  try {
    socket = new WebSocket(wsUrl);
    socket.onopen = () => console.log('WebSocket Engine Connected');
    socket.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'INIT_STATE' || msg.type === 'STATE_UPDATE') {
          if (msg.data.cases) state.cases = msg.data.cases;
          if (msg.data.users) state.team = msg.data.users;
          if (msg.data.notifications) state.notifications = msg.data.notifications;
          if (msg.data.caseHistory) state.caseHistory = msg.data.caseHistory;
          if (msg.data.courtStatus) state.courtStatus = msg.data.courtStatus;
          app();
        }
      } catch (e) {}
    };
  } catch (e) {}
}

// Background API Sync (Non-blocking)
function syncApi(url, body) {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(() => {});
}

// Helper calculations
const delta = c => c.item - c.live;
const urgency = c => {
  const d = delta(c);
  return d <= 5 ? 'critical' : d <= 15 ? 'approaching' : 'safe';
};

function saveSession() {
  sessionStorage.setItem('lexmatrix-session', JSON.stringify(state.session));
}

function playAudioAlert() {
  if (!state.audioEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

// Brand Component
function brand() {
  return `<div class="brand"><span class="brand-mark">L</span><span><b>LEX</b>MATRIX</span></div>`;
}

// Reusable Button Component
function button(label, action, icon = '', type = '') {
  return `<button class="btn ${type}" onclick="${action}">${icon ? ICON(icon) : ''}<span>${label}</span></button>`;
}

// Reusable Urgency Badge
function urgencyBadge(c) {
  const u = urgency(c);
  const d = delta(c);
  return `<span class="delta-badge ${u}">Δ ${String(d).padStart(2, '0')}</span>`;
}

// Topbar Header
function topbarAuth() {
  const s = state.session || { name: 'Demo User', role: 'senior' };
  const initials = s.name ? s.name.split(' ').map(x => x[0]).join('').slice(0, 2) : 'SP';
  const unreadCount = state.notifications.length;
  const isSitting = state.courtStatus.statusText === 'COURT_SITTING';

  return `<header class="topbar">
    ${brand()}
    <div class="top-center">
      <span class="date">Friday, 11 September 2026</span>
      <span class="system-live">
        <i class="${isSitting ? 'live-dot' : 'offline-dot'}"></i> 
        ${isSitting ? 'HIGH COURTS SITTING (LIVE 30s FEED)' : 'COURT NOT SITTING (OPENS 09:00 AM IST)'}
      </span>
    </div>
    <div class="top-actions">
      ${s.role === 'senior' && state.page === 'dashboard' ? button('Advance Live Items', 'advance()', 'fast-forward') : ''}
      <button class="btn btn-icon bell" aria-label="Notifications" onclick="toggleNotifications()">
        ${ICON('bell')}
        ${unreadCount > 0 ? `<b class="notification-count">${unreadCount}</b>` : ''}
      </button>
      <div class="avatar" onclick="state.profileOpen = !state.profileOpen; app()">${initials}</div>
      ${state.profileOpen ? `<div class="profile-menu glass">
        <button onclick="toast('Chamber: Sharma & Associates (LX-7F2K-9Q)')">Sharma & Associates</button>
        <button onclick="go('settings')">Account Settings</button>
        <button onclick="logout()">Log Out</button>
      </div>` : ''}
    </div>
  </header>`;
}

// Unified Left Sidebar Navigation Component for Senior
function sidebar() {
  const links = [
    ['dashboard', 'layout-dashboard', 'Dashboard'],
    ['liveData', 'radio', 'Live Data Feed'],
    ['cause', 'list-tree', 'Cause List'],
    ['importCase', 'file-plus', 'Import Case'],
    ['team', 'users-round', 'My Team'],
    ['research', 'sparkles', 'Research AI Assistant'],
    ['settings', 'settings-2', 'Settings']
  ];
  return `<aside class="sidebar">
    ${links.map(([p, i, l]) => `<button class="side-link ${state.page === p ? 'active' : ''}" onclick="go('${p}')">${ICON(i)}<span>${l}</span></button>`).join('')}
    <div class="sidebar-bottom">
      <div class="caps">Chamber Key</div>
      <div class="mono" style="color:var(--gold-hi);margin-top:6px;font-weight:700">LX-7F2K-9Q</div>
    </div>
  </aside>`;
}

// Unified Left Sidebar Navigation Component for Junior
function juniorSidebar() {
  const links = [
    ['junior', 'layout-dashboard', 'My Dashboard'],
    ['juniorCases', 'briefcase-business', 'My Cases'],
    ['liveData', 'radio', 'Live Data Feed'],
    ['juniorNotifications', 'bell', 'Notifications'],
    ['juniorResearch', 'sparkles', 'Research AI Assistant'],
    ['juniorSettings', 'settings-2', 'Settings']
  ];
  return `<aside class="junior-sidebar">
    ${links.map(([p, i, l]) => `<button class="side-link ${state.page === p ? 'active' : ''}" onclick="go('${p}')">${ICON(i)}<span>${l}</span></button>`).join('')}
    <div class="junior-note">
      <div class="caps">Linked Chamber</div>
      <div style="margin-top:6px;font-size:11px;line-height:1.4">Sharma & Associates (LX-7F2K-9Q)</div>
    </div>
  </aside>`;
}

// Demo Mode Role Switcher Bar
function demoSwitcher() {
  if (!state.session) return '';
  const isSenior = state.session.role === 'senior';
  return `<div class="demo-switcher glass">
    <span class="caps">Demo Role Switcher</span>
    <button onclick="demoLogin('senior')" style="${isSenior ? 'background:var(--gold);color:#000' : ''}">Enter as Senior Advocate</button>
    <button onclick="demoLogin('junior')" style="${!isSenior ? 'background:var(--gold);color:#000' : ''}">Enter as Junior Associate</button>
  </div>`;
}

// Stat Card Component
function stat(label, value, icon, cls = '', sub = 'Live today') {
  return `<article class="stat glass ${cls}">
    <div class="caps">${label}</div>
    <div class="stat-value">${value}</div>
    <p>${sub}</p>
    <span class="stat-icon">${ICON(icon)}</span>
  </article>`;
}

// Notification Feed Item Component
function feed(n) {
  return `<div class="feed-item">
    <div class="feed-time">${n.time}</div>
    <div class="feed-copy ${n.tone}">${n.text}<span>${n.sub}</span></div>
  </div>`;
}

// Notification Drawer Slide-Over Panel
function notificationsPanel() {
  if (!state.notificationsOpen) return '';
  return `<aside class="notification-panel glass">
    <div class="section-title">
      <h2>Notifications & Alerts</h2>
      <button class="close" onclick="toggleNotifications()">${ICON('x')}</button>
    </div>
    <div style="display:grid;gap:8px">
      ${state.notifications.map(feed).join('')}
    </div>
    <div style="margin-top:16px">
      ${button('Close Panel', 'toggleNotifications()', 'check', 'btn-gold')}
    </div>
  </aside>`;
}

// -------------------------------------------------------------
// LANDING PAGE VIEW
// -------------------------------------------------------------
function landing() {
  return `<div class="landing">
    <nav class="landing-nav">
      ${brand()}
      <div class="nav-links">
        <span onclick="toast('Pilot courts: Delhi, Bombay, Karnataka, Calcutta HC')">Pilot Courts</span>
        <span onclick="toast('Security: Ephemeral AI processing, zero cloud retention.')">Security & Privacy</span>
        <span onclick="go('login')">Sign In</span>
      </div>
      ${button('Enter Chamber Portal', "go('login')", 'arrow-right', 'btn-gold')}
    </nav>
    <main class="landing-main">
      <section class="landing-copy">
        <div class="eyebrow">Litigation, coordinated in real time.</div>
        <h1>One Advocate.<br>Multiple Courtrooms.<br><em>Zero Coordination Chaos.</em></h1>
        <p>LexMatrix gives litigation teams a live command center for tracking hearings, detecting clashes, and delegating matters in real time across High Courts.</p>
        <div class="landing-actions">
          ${button('Enter Senior Advocate Portal', "demoLogin('senior')", 'shield', 'btn-gold')}
          ${button('Enter Junior Associate Portal', "demoLogin('junior')", 'user-check')}
        </div>
      </section>
      <section class="court-float glass">
        <div class="mini">
          <div>
            <strong>DELHI HIGH COURT</strong>
            <span>Court Hall 3 · WP(C) 4521/2026</span>
          </div>
          <div class="delta critical">Δ 04</div>
        </div>
        <div class="mini">
          <div>
            <strong>BOMBAY HIGH COURT</strong>
            <span>Court Hall 7 · COMIP 182/2026</span>
          </div>
          <div class="delta approaching">Δ 05</div>
        </div>
        <div class="mini">
          <div>
            <strong>KARNATAKA HIGH COURT</strong>
            <span>Court Hall 2 · WP 8421/2026</span>
          </div>
          <div class="delta safe">Δ 31</div>
        </div>
        <div class="mini">
          <div>
            <strong>CALCUTTA HIGH COURT</strong>
            <span>Court Hall 5 · FAO 231/2026</span>
          </div>
          <div class="delta approaching">Δ 11</div>
        </div>
      </section>
    </main>
    <footer class="landing-foot">
      <span>LEXMATRIX LITIGATION OPERATIONS CONSOLE</span>
      <span><i class="live-dot"></i> ALL 4 PILOT COURTS SYNCHRONIZED</span>
    </footer>
  </div>`;
}

// -------------------------------------------------------------
// MULTI-TENANT CHAMBER AUTHENTICATION VIEWS
// -------------------------------------------------------------
function authStory() {
  return `<section class="auth-story">
    ${brand()}
    <div>
      <div class="eyebrow">Litigation Command Platform</div>
      <h1>Every courtroom.<br>One clear decision.</h1>
      <p>Coordinate your litigation firm across live High Court halls without missing the matter about to be called.</p>
    </div>
    <div class="auth-signal glass">
      <div><span>DELHI HC · Court Hall 3</span><strong class="critical mono">Δ 04</strong></div>
      <div><span>BOMBAY HC · Court Hall 7</span><strong class="approaching mono">Δ 05</strong></div>
      <div><span>KARNATAKA HC · Court Hall 2</span><strong class="safe mono">Δ 31</strong></div>
    </div>
  </section>`;
}

function authShell(content) {
  return `<main class="auth-screen">${authStory()}<section class="auth-card-wrap">${content}</section></main>`;
}

function login() {
  return authShell(`<section class="auth-card glass">
    <div class="eyebrow">Chamber Authentication</div>
    <h1>Sign in to LexMatrix</h1>
    <p>Enter your Senior Master Login or Junior Chamber Credentials.</p>
    
    <div style="display:flex;gap:8px;margin-bottom:18px">
      <button class="btn ${!state.pending ? 'btn-gold' : ''}" style="flex:1;justify-content:center" onclick="state.pending=null;app()">Senior Master Login</button>
      <button class="btn ${state.pending ? 'btn-gold' : ''}" style="flex:1;justify-content:center" onclick="state.pending='junior';app()">Junior Chamber Join</button>
    </div>

    ${!state.pending ? `
      <form onsubmit="signIn(event)">
        <div class="field">
          <label>Senior Advocate Email</label>
          <input name="email" type="email" required value="senior@lexmatrix.demo" placeholder="name@firm.com">
        </div>
        <div class="field" style="margin-top:12px">
          <label>Password</label>
          <input name="password" type="password" required value="chamber123" placeholder="Enter password">
        </div>
        ${state.authError ? `<div class="auth-error">${state.authError}</div>` : ''}
        <button class="btn btn-gold" style="margin-top:18px;width:100%" type="submit">Sign In as Senior Advocate</button>
      </form>
    ` : `
      <form onsubmit="juniorChamberLogin(event)">
        <div class="field">
          <label>Chamber Key</label>
          <input name="key" required value="LX-7F2K-9Q" placeholder="LX-7F2K-9Q" style="text-transform:uppercase">
        </div>
        <div class="field" style="margin-top:12px">
          <label>Chamber Password</label>
          <input name="password" type="password" required value="chamber123" placeholder="Enter password">
        </div>
        <div class="field" style="margin-top:12px">
          <label>Junior Full Name</label>
          <input name="name" required value="Ananya Rao" placeholder="Advocate Full Name">
        </div>
        ${state.authError ? `<div class="auth-error">${state.authError}</div>` : ''}
        <button class="btn btn-gold" style="margin-top:18px;width:100%" type="submit">Join & Link Chamber Account</button>
      </form>
    `}

    <div class="auth-links" style="margin-top:22px">
      <span>Demo shortcut? <button class="text-button" onclick="demoLogin('senior')">Demo Senior</button> | <button class="text-button" onclick="demoLogin('junior')">Demo Junior</button></span>
    </div>
  </section>`);
}

// -------------------------------------------------------------
// SENIOR ADVOCATE DASHBOARD & WORKSPACES
// -------------------------------------------------------------
function caseRow(c) {
  const u = urgency(c);
  const d = delta(c);
  return `<tr>
    <td><span class="case-number">${c.no}</span></td>
    <td class="party">${c.parties}<span class="sub">${c.bench}</span></td>
    <td>${c.court}<span class="sub">${c.hall} · Walk: ${c.walkTime}</span></td>
    <td class="mono">${c.item}</td>
    <td>
      <div class="nudge-group">
        <button class="nudge-btn" title="Manual -1 Override" onclick="nudgeItem(${c.id}, -1)">-1</button>
        <span class="mono">${c.live}</span>
        <button class="nudge-btn" title="Manual +1 Override" onclick="nudgeItem(${c.id}, 1)">+1</button>
      </div>
    </td>
    <td>${urgencyBadge(c)}</td>
    <td class="mono">${c.eta}</td>
    <td>${c.assignee ? `<strong>${c.assignee}</strong>` : '<span class="critical">Unassigned</span>'}<span class="sub">${c.status}</span></td>
    <td>
      <span class="status ${u}">
        <i class="live-dot"></i>${c.status === 'Argued' ? '✓ ARGUED' : u === 'critical' ? 'ACT NOW' : u.toUpperCase()}
      </span>
    </td>
    <td>
      <div class="actions-row">
        <button class="tiny-btn" title="Open Case Workspace" onclick="openCase(${c.id})">${ICON('arrow-up-right')}</button>
        <button class="tiny-btn" title="Assign Junior" onclick="assignModal(${c.id})">${ICON('user-plus')}</button>
        ${d <= 5 ? `<button class="tiny-btn" title="Emergency Delegation" style="color:var(--red)" onclick="openEmergencyModal(${c.id})">${ICON('zap')}</button>` : ''}
      </div>
    </td>
  </tr>`;
}

function dashboard() {
  const atRisk = state.cases.filter(c => delta(c) <= 15).length;
  const unassigned = state.cases.filter(c => !c.assignee).length;
  const urgentCase = state.cases.find(c => delta(c) <= 5) || state.cases[0];

  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Senior Advocate Command Center</div>
        <h1>Good morning, S. Pranav</h1>
        <p>Synchronized across Delhi, Bombay, Karnataka, and Calcutta High Courts.</p>
      </div>
      <div>
        ${button('+ Import Case Module', "go('importCase')", 'file-plus')}
        ${button('Fetch Court Website', "modal('fetch')", 'external-link')}
      </div>
    </div>

    <section class="stats">
      ${stat('Hearings Today', '12', 'briefcase-business', '', 'Across 4 High Courts')}
      ${stat('Unassigned Cases', String(unassigned).padStart(2, '0'), 'user-plus', unassigned > 0 ? 'risk' : '', 'Requires decision')}
      ${stat('Cases At Risk', String(atRisk).padStart(2, '0'), 'triangle-alert', 'risk', 'Delta ≤ 15')}
      ${stat('Juniors Available', String(state.team.filter(t => t.available).length).padStart(2, '0'), 'users', '', 'Across your firm')}
    </section>

    <section class="operating-row">
      <div class="table-panel glass">
        <div class="section-title">
          <h2>Today's Cause List</h2>
          <span><i class="live-dot"></i> Realtime Synchronized</span>
        </div>
        <table class="cause-table">
          <thead>
            <tr>
              <th>Case No.</th>
              <th>Parties / Bench</th>
              <th>Court / Hall</th>
              <th>Item</th>
              <th>Live (-1/+1 Nudge)</th>
              <th>Delta</th>
              <th>Est. Time</th>
              <th>Assignment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.cases.map(caseRow).join('')}
          </tbody>
        </table>
      </div>

      <aside class="side-panel">
        <div class="alert-card glass">
          <div class="caps critical">Critical Matter Approaching</div>
          <h3>${urgentCase.no}</h3>
          <span class="sub">${urgentCase.court} · ${urgentCase.hall}</span>
          <div class="large-delta">Δ ${String(delta(urgentCase)).padStart(2, '0')}</div>
          <p class="sub">Live Item ${urgentCase.live} · Case Item ${urgentCase.item}</p>
          <div style="display:grid;gap:8px;margin-top:12px">
            ${button('Emergency Delegation', `openEmergencyModal(${urgentCase.id})`, 'zap', 'btn-gold')}
            ${button('Allot Junior', `assignModal(${urgentCase.id})`, 'user-plus')}
          </div>
        </div>

        <div class="timeline-card glass">
          <div class="section-title">
            <h2>Live Activity Feed</h2>
            <span>Today</span>
          </div>
          ${state.notifications.slice(0, 4).map(n => feed(n)).join('')}
        </div>
      </aside>
    </section>
  </div>`;
}

// Import Case Module View
function importCaseView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Case Import Module</div>
        <h1>Import Case & Delegate File</h1>
        <p>Register new matters manually and automatically route case materials to assigned counsel.</p>
      </div>
    </div>

    <section class="panel glass" style="max-width:750px">
      <form onsubmit="submitImportCase(event)">
        <div class="form-grid">
          <div class="field">
            <label>Case Number</label>
            <input name="no" required value="LPA 402/2026" placeholder="e.g. LPA 402/2026">
          </div>
          <div class="field">
            <label>Item Number</label>
            <input name="item" type="number" required value="55" placeholder="55">
          </div>
          <div class="field full">
            <label>Party Names</label>
            <input name="parties" required value="Apex Biotech Ltd. v. Union of India" placeholder="Petitioner v. Respondent">
          </div>
          <div class="field">
            <label>High Court</label>
            <select name="court">
              <option>Delhi High Court</option>
              <option>Bombay High Court</option>
              <option>Karnataka High Court</option>
              <option>Calcutta High Court</option>
            </select>
          </div>
          <div class="field">
            <label>Court Hall Number</label>
            <input name="hall" required value="Court Hall 4" placeholder="Court Hall 4">
          </div>
          <div class="field">
            <label>Bench / Judge</label>
            <input name="bench" value="Justice Sharma" placeholder="Justice Sharma">
          </div>
          <div class="field">
            <label>Assign Matter To</label>
            <select name="assignee">
              <option value="">Unassigned</option>
              <option value="Senior Advocate">Senior Advocate (Self-Attend)</option>
              ${state.team.map(m => `<option value="${m.fullName || m.name}">${m.fullName || m.name} (${m.role})</option>`).join('')}
            </select>
          </div>
          <div class="field full">
            <label>Upload Document Brief (Ephemeral Routing)</label>
            <input name="file" type="file" accept=".pdf,.docx">
          </div>
          <div class="field full">
            <label>Hearing Notes</label>
            <textarea name="notes" rows="2" placeholder="Key instructions for assigned counsel..."></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-gold" type="submit">${ICON('file-plus')}Import Case & Route Files</button>
        </div>
      </form>
    </section>
  </div>`;
}

// Live Data Feed Module
function liveDataView() {
  const isSitting = state.courtStatus.statusText === 'COURT_SITTING';
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">High Court Live Board Integration</div>
        <h1>Live Courtroom Data Feed</h1>
        <p>Automated 30-second queries across active High Court display boards (09:00 AM – 04:00 PM IST).</p>
      </div>
      ${button('Simulate +1 Ticker Step', 'advance()', 'fast-forward')}
    </div>

    <section class="panel glass" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span class="status ${isSitting ? 'safe' : 'approaching'}">
            <i class="${isSitting ? 'live-dot' : 'offline-dot'}"></i>
            ${isSitting ? 'COURT IN SESSION (LIVE 30s REFRESH)' : 'COURT NOT SITTING (OPENS 09:00 AM IST)'}
          </span>
          <p style="margin:6px 0 0;font-size:12.5px;color:var(--muted)">Operating Hours: Monday–Friday, 09:00 AM – 04:00 PM IST</p>
        </div>
        ${button(state.courtStatus.demoOverride ? 'Disable Demo Ticker Override' : 'Enable Demo Ticker Override', 'toggleCourtHoursOverride()', 'clock')}
      </div>
    </section>

    <div class="table-panel glass">
      <table class="cause-table">
        <thead>
          <tr>
            <th>Case No.</th>
            <th>Parties</th>
            <th>Court / Hall</th>
            <th>Case Item</th>
            <th>Live Item (-1/+1 Nudge)</th>
            <th>Delta</th>
            <th>Est. Call Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${state.cases.map(c => `<tr>
            <td><span class="case-number">${c.no}</span></td>
            <td>${c.parties}</td>
            <td>${c.court} · ${c.hall}</td>
            <td class="mono">${c.item}</td>
            <td>
              <div class="nudge-group">
                <button class="nudge-btn" onclick="nudgeItem(${c.id}, -1)">-1</button>
                <span class="mono">${c.live}</span>
                <button class="nudge-btn" onclick="nudgeItem(${c.id}, 1)">+1</button>
              </div>
            </td>
            <td>${urgencyBadge(c)}</td>
            <td class="mono">${c.eta}</td>
            <td><span class="status ${urgency(c)}">${urgency(c).toUpperCase()}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function causeView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Firm Schedule</div>
        <h1>Full Cause List</h1>
        <p>Live progress by court hall across all pilot High Courts.</p>
      </div>
      ${button('+ Import Case', "go('importCase')", 'file-plus', 'btn-gold')}
    </div>
    <div class="table-panel glass">
      <table class="cause-table">
        <thead>
          <tr>
            <th>Case No.</th>
            <th>Parties / Bench</th>
            <th>Court / Hall</th>
            <th>Item</th>
            <th>Live (-1/+1 Nudge)</th>
            <th>Delta</th>
            <th>Est. Time</th>
            <th>Assignment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.cases.map(caseRow).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function teamView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Firm Coordination</div>
        <h1>My Team Roster</h1>
        <p>Associate availability and active workload management.</p>
      </div>
      ${button('Copy Chamber Key', "toast('Chamber Key copied: LX-7F2K-9Q')", 'copy', 'btn-gold')}
    </div>

    <section class="team-grid">
      ${state.team.map((m, i) => `<article class="member-card glass">
        <div class="avatar" style="width:40px;height:40px;font-size:14px">${m.fullName ? m.fullName.split(' ').map(x=>x[0]).join('') : 'AR'}</div>
        <h3>${m.fullName || m.name}</h3>
        <p>${m.role}</p>
        <div class="status ${m.available ? 'safe' : 'critical'}" style="margin-top:14px">
          <i class="live-dot"></i>${m.available ? 'Available' : 'Unavailable'}
        </div>
        <footer>
          <span>${m.activeCases || m.active || 0} active matter(s)</span>
          <button class="tiny-btn" onclick="toggleMember(${i})">${m.available ? 'Set Unavailable' : 'Set Available'}</button>
        </footer>
      </article>`).join('')}
    </section>

    <section class="panel glass" style="margin-top:24px;max-width:560px">
      <div class="caps">Linked Chamber Key</div>
      <h3 style="margin-top:8px">Chamber Key: <span class="mono" style="color:var(--gold-hi)">LX-7F2K-9Q</span></h3>
      <p style="color:var(--muted);font-size:12px;line-height:1.6">Junior associates log in using this Chamber Key + Chamber Password + Their Full Name to link directly to your dashboard.</p>
      <div style="display:flex;gap:10px;margin-top:16px">
        ${button('Copy Chamber Key', "toast('Chamber Key copied: LX-7F2K-9Q')", 'copy')}
        ${button('Regenerate Key', "toast('New Chamber Key generated')", 'refresh-cw')}
      </div>
    </section>
  </div>`;
}

function researchView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">AI Legal Assistant</div>
        <h1>Research AI Assistant</h1>
        <p>Ask questions and extract legal authorities in real time.</p>
      </div>
    </div>
    <section class="panel glass" style="max-width:820px">
      <div class="research-log">
        ${state.researchHistory.map(r => `<div class="bubble ${r.sender}">${r.text.replace(/\n/g, '<br>')}</div>`).join('')}
      </div>
      <form onsubmit="submitResearch(event)" style="margin-top:16px;display:flex;gap:10px">
        <input name="q" placeholder="Type legal research query..." required style="flex:1">
        <button class="btn btn-gold" type="submit">${ICON('send')}Ask AI</button>
      </form>
      <div class="disclaimer">
        Research results must be independently cross-checked before being relied upon in court.
      </div>
    </section>
  </div>`;
}

function detailView() {
  const c = state.cases.find(x => x.id === state.selectedCase) || state.cases[0];
  const u = urgency(c);
  const d = delta(c);

  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Case Workspace</div>
        <h1>${c.no}</h1>
      </div>
      ${button('Back to Dashboard', "go('dashboard')", 'arrow-left')}
    </div>

    <section class="detail-hero glass">
      <div>
        <div class="caps">${c.court} · ${c.hall}</div>
        <h2>${c.no}</h2>
        <div class="detail-meta">
          <strong>${c.parties}</strong><br>
          Bench: ${c.bench}<br>
          Pass-over Risk: <strong class="${c.passoverRisk === 'High' ? 'critical' : 'safe'}">${c.passoverRisk}</strong> · Walk Time: <strong>${c.walkTime}</strong>
        </div>
      </div>
      <div class="delta-hero">
        <div class="big ${u}">Δ ${String(d).padStart(2, '0')}</div>
        <p><i class="live-dot"></i> LIVE ITEM ${c.live} &nbsp;|&nbsp; CASE ITEM ${c.item}</p>
        <p class="${u}">Est. time to call: ${c.eta}</p>
      </div>
    </section>

    <section class="detail-grid">
      <div class="panel glass">
        <div class="section-title">
          <h3>AI Argument Brief</h3>
          ${button('Regenerate Brief', 'brief()', 'sparkles', 'btn-gold')}
        </div>
        <div class="brief-doc">
          <h4>Case Overview</h4>
          <div>Writ petition challenging administrative action against petitioner company. Immediate interim protection sought pending submission of respondents' counter-affidavit.</div>

          <h4>Key Facts & Issues</h4>
          <div>1. Impugned notice issued without providing statutory 14-day reply window. 2. Principles of natural justice engaged and violated. 3. Irreparable prejudice if status quo is altered.</div>

          <h4>Suggested Oral Opening</h4>
          <div>"My Lords, this is a narrow procedural fairness matter. We seek only a temporary protective arrangement until the official record is placed before this Court."</div>
        </div>
        <div class="disclaimer">
          AI-generated draft for review only — not legal advice. Case material is processed ephemerally and is not retained after generation.
        </div>
      </div>

      <div style="display:grid;gap:20px">
        <div class="panel glass">
          <div class="section-title">
            <h3>Assignment & Status</h3>
            ${button('Reassign', `assignModal(${c.id})`, 'user-plus')}
          </div>
          <div class="assignment-line"><span>Current Assignee</span><strong>${c.assignee || 'Unassigned'}</strong></div>
          <div class="assignment-line"><span>Matter Status</span><strong class="${u}">${c.status}</strong></div>
          <div class="assignment-line"><span>Notes</span><span>${c.notes}</span></div>
        </div>

        <div class="panel glass">
          <h3>Attached Case Files</h3>
          ${c.files && c.files.length ? c.files.map(f => `<div class="file-row">${ICON('file-text')}<span>${f.name} <small class="sub">${f.size} · ephemeral routed file</small></span></div>`).join('') : '<div class="sub">No files attached</div>'}
        </div>
      </div>
    </section>
  </div>`;
}

function settingsView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">System Preferences</div>
        <h1>Settings</h1>
      </div>
    </div>
    <section class="panel glass" style="max-width:680px">
      <h3>Tiered Alert Escalation</h3>
      <div class="assignment-line"><span>30-minute notifications</span><strong class="safe">Enabled</strong></div>
      <div class="assignment-line"><span>15-minute warnings</span><strong class="approaching">Enabled</strong></div>
      <div class="assignment-line"><span>10-minute warnings</span><strong class="approaching">Enabled</strong></div>
      <div class="assignment-line"><span>5-minute critical alerts</span><strong class="critical">Enabled</strong></div>
      <div class="assignment-line">
        <span>1-minute audio alert tone</span>
        <button class="tiny-btn" onclick="state.audioEnabled = !state.audioEnabled; app()">${state.audioEnabled ? '🔊 Sound Enabled' : '🔇 Muted'}</button>
      </div>
    </section>
  </div>`;
}

// -------------------------------------------------------------
// JUNIOR ASSOCIATE DASHBOARD & WORKSPACES
// -------------------------------------------------------------
function myCases() {
  const userName = state.session ? state.session.name : 'Ananya Rao';
  return state.cases.filter(c => c.assignee === userName || c.assignee === 'Ananya Rao' || c.assignee === 'Rahul Sharma');
}

function juniorCard(c) {
  const u = urgency(c);
  const d = delta(c);
  return `<article class="assigned-card glass">
    <div class="status ${u}"><i class="live-dot"></i>${c.status === 'Awaiting Response' ? 'NEW ASSIGNMENT' : u.toUpperCase()}</div>
    <h3>${c.no}</h3>
    <p>${c.parties}</p>
    <p style="margin-top:10px">${c.court}<br>${c.hall} · ${c.bench}</p>
    <div class="card-delta ${u}">Δ ${String(d).padStart(2, '0')}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0">
      <span class="mono">CASE ITEM ${c.item}</span>
      <div class="nudge-group">
        <button class="nudge-btn" title="Nudge -1" onclick="nudgeItem(${c.id}, -1)">-1</button>
        <span class="mono">LIVE ${c.live}</span>
        <button class="nudge-btn" title="Nudge +1" onclick="nudgeItem(${c.id}, 1)">+1</button>
      </div>
    </div>
    <footer>
      <span class="sub">${c.status}</span>
      ${button('View Case', `openCase(${c.id})`, 'arrow-up-right')}
    </footer>
  </article>`;
}

function juniorDashboard() {
  const cases = myCases();
  const c = cases.sort((a, b) => delta(a) - delta(b))[0];
  const isSitting = state.courtStatus.statusText === 'COURT_SITTING';

  if (!c) {
    return `<div class="main">
      <div class="junior-main">
        <div class="eyebrow">Junior Associate / ${state.session ? state.session.name : 'Ananya Rao'}</div>
        <h1 style="font-family:'Playfair Display'">My Dashboard</h1>
        <section class="empty-state glass">
          ${ICON('circle-check')}
          <h2>You're clear for now.</h2>
          <p>No matters are currently assigned or awaiting your response.</p>
        </section>
      </div>
    </div>`;
  }

  const u = urgency(c);
  const d = delta(c);
  const isAwaiting = c.status === 'Awaiting Response' || c.status === 'Assigned';

  return `<div class="main">
    <div class="junior-main">
      <div class="page-head">
        <div>
          <div class="eyebrow">Junior Associate / ${state.session ? state.session.name : 'Ananya Rao'}</div>
          <h1>My Dashboard</h1>
          <p>Realtime synchronized with Senior Advocate S. Pranav</p>
        </div>
        <span class="status ${isSitting ? 'safe' : 'approaching'}">
          <i class="${isSitting ? 'live-dot' : 'offline-dot'}"></i> 
          ${isSitting ? 'COURT IN SESSION' : 'COURT NOT SITTING'}
        </span>
      </div>

      <section class="junior-hero glass">
        <div>
          <div class="caps ${u}">${isAwaiting ? 'NEW MATTER ASSIGNED' : 'YOUR NEXT MATTER'} · ${c.status}</div>
          <h2>${c.no}</h2>
          <p>${c.parties}<br>${c.court} · ${c.hall}<br>Before ${c.bench} · Case Item No. ${c.item}</p>
          
          <div style="margin-top:14px;display:flex;align-items:center;gap:12px">
            <span class="caps">Manual Courtroom Override:</span>
            <div class="nudge-group">
              <button class="nudge-btn" onclick="nudgeItem(${c.id}, -1)">-1 Item</button>
              <span class="mono" style="font-weight:700">LIVE ITEM ${c.live}</span>
              <button class="nudge-btn" onclick="nudgeItem(${c.id}, 1)">+1 Item</button>
            </div>
          </div>

          <div class="hero-actions">
            ${isAwaiting ? `
              ${button('ACCEPT', `acceptMatter(${c.id})`, 'check', 'btn-gold')}
              ${button('DECLINE — REQUEST REASSIGNMENT', `declineMatter(${c.id})`, 'repeat-2')}
            ` : `
              ${button('View Case Workspace', `openCase(${c.id})`, 'arrow-up-right', 'btn-gold')}
              ${button('MARK AS ARGUED', `confirmAction('argued', ${c.id})`, 'check-circle')}
              ${button('REQUEST SENIOR TAKEOVER', `confirmAction('takeover', ${c.id})`, 'hand')}
            `}
          </div>
        </div>

        <div class="junior-delta">
          Δ ${String(d).padStart(2, '0')}
          <span>
            <i class="live-dot"></i> LIVE ITEM ${c.live}<br>
            CASE ITEM ${c.item}<br>
            <b class="${u}">${c.eta} to call</b>
          </span>
        </div>
      </section>

      <div class="section-title" style="margin-top:28px">
        <h2>MY ASSIGNED CASES TODAY</h2>
        <span>${cases.length} active matter${cases.length !== 1 ? 's' : ''}</span>
      </div>
      <section class="assigned-grid">
        ${cases.map(juniorCard).join('')}
      </section>
    </div>
  </div>`;
}

function juniorCasesView() {
  const cases = myCases();
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Personal Cause List</div>
        <h1>My Cases</h1>
        <p>Only matters assigned to you are shown here.</p>
      </div>
    </div>
    <section class="assigned-grid">
      ${cases.length ? cases.map(juniorCard).join('') : `<div class="empty-state glass">${ICON('briefcase-business')}<h2>No assigned matters</h2></div>`}
    </section>
  </div>`;
}

function juniorNotificationsView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Personal Alerts</div>
        <h1>Notifications</h1>
      </div>
    </div>
    <section class="panel glass" style="max-width:760px">
      ${state.notifications.map(feed).join('')}
    </section>
  </div>`;
}

function juniorSettingsView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Personal Preferences</div>
        <h1>Settings</h1>
      </div>
    </div>
    <section class="panel glass" style="max-width:680px">
      <h3>Notification Settings</h3>
      <div class="assignment-line"><span>Approaching matter alerts</span><strong class="safe">Enabled</strong></div>
      <div class="assignment-line"><span>Assignment updates</span><strong class="safe">Enabled</strong></div>
    </section>
  </div>`;
}

// -------------------------------------------------------------
// MODALS
// -------------------------------------------------------------
function modalView() {
  if (!state.modal) return '';

  if (state.modal === 'fetch') {
    return `<div class="modal-backdrop">
      <section class="modal glass">
        <div class="modal-head">
          <div>
            <div class="eyebrow">Official Court Portal Integration</div>
            <h2>Fetch From Court Website</h2>
          </div>
          <button class="close" onclick="closeModal()">${ICON('x')}</button>
        </div>
        <p style="font-size:13px;color:var(--muted);line-height:1.6">
          LexMatrix respects government security protocols. We <strong>never collect court credentials or automate CAPTCHAs</strong>. 
          Complete CAPTCHA verification on the official High Court site, then return to import your cause list.
        </p>
        <div style="display:grid;gap:10px;margin-top:14px">
          <div class="field">
            <label>Select Pilot High Court</label>
            <select>
              <option>Delhi High Court</option>
              <option>Bombay High Court</option>
              <option>Karnataka High Court</option>
              <option>Calcutta High Court</option>
            </select>
          </div>
        </div>
        <div class="modal-foot">
          ${button('Cancel', 'closeModal()')}
          ${button('Open Official Court Portal', "toast('Redirecting to Official High Court Cause-List Portal...')", 'external-link', 'btn-gold')}
        </div>
      </section>
    </div>`;
  }

  if (state.modal === 'assign') {
    const c = state.cases.find(x => x.id === state.selectedCase);
    return `<div class="modal-backdrop">
      <section class="modal glass">
        <div class="modal-head">
          <div>
            <div class="eyebrow">Matter Allotment</div>
            <h2>Assign ${c ? c.no : ''}</h2>
          </div>
          <button class="close" onclick="closeModal()">${ICON('x')}</button>
        </div>
        <p style="font-size:12px;color:var(--muted)">Select an associate with available capacity.</p>
        <div class="assign-list">
          <button class="assignee" onclick="assignCase('Senior Advocate', 'senior-001')">
            <span><strong>Senior Advocate</strong><small class="sub">Attend Personally</small></span>
            <span class="safe">AVAILABLE</span>
          </button>
          ${state.team.map(m => `<button class="assignee" onclick="assignCase('${m.fullName || m.name}', '${m.id}')">
            <span><strong>${m.fullName || m.name}</strong><small class="sub">${m.activeCases || m.active || 0} active matter(s)</small></span>
            <span class="${m.available ? 'safe' : 'critical'}">${m.available ? 'FREE' : 'UNAVAILABLE'}</span>
          </button>`).join('')}
        </div>
      </section>
    </div>`;
  }

  if (state.modal === 'emergency') {
    const c = state.cases.find(x => x.id === state.selectedCase);
    return `<div class="modal-backdrop">
      <section class="modal glass">
        <div class="modal-head">
          <div>
            <div class="eyebrow critical">Emergency Clash Re-Assignment</div>
            <h2>Single-Tap Re-Assignment (${c ? c.no : ''})</h2>
          </div>
          <button class="close" onclick="closeModal()">${ICON('x')}</button>
        </div>
        <p style="font-size:12.5px;color:var(--muted)">
          Sorted by available item buffer ($\text{Assigned Item} - \text{Live Item} > 15$). Single tap delegates case & files immediately.
        </p>
        <div class="assign-list" style="margin-top:14px">
          ${state.emergencyRoster.length ? state.emergencyRoster.map(j => `<button class="assignee" onclick="assignCase('${j.fullName}', '${j.userId}')">
            <span>
              <strong>${j.fullName}</strong>
              <small class="sub">Location: ${j.courtHall} · Buffer: <strong>${j.itemBuffer} items</strong></small>
            </span>
            <span class="safe">REC. DELEGATE</span>
          </button>`).join('') : '<div class="sub">Querying available roster...</div>'}
        </div>
      </section>
    </div>`;
  }

  return '';
}

function confirmModal() {
  if (!state.confirmAction) return '';
  const c = state.cases.find(x => x.id === state.confirmAction.id);
  const isTakeover = state.confirmAction.type === 'takeover';

  return `<div class="modal-backdrop">
    <section class="modal glass">
      <div class="modal-head">
        <div>
          <div class="eyebrow">Case Status Action</div>
          <h2>${isTakeover ? 'Request Senior Advocate to Take Over?' : 'Mark Matter as Argued?'}</h2>
        </div>
        <button class="close" onclick="state.confirmAction=null; app()">${ICON('x')}</button>
      </div>
      <p style="font-size:13.5px;color:var(--muted);line-height:1.6">
        ${isTakeover ? 'This will immediately alert Senior Advocate S. Pranav that you require senior representation.' : 'This will update the firm command center and mark this matter as completed.'}
      </p>
      <div class="modal-foot">
        ${button('Cancel', 'state.confirmAction=null; app()')}
        ${button(isTakeover ? 'Confirm Takeover Request' : 'Confirm Argued Status', 'applyConfirmAction()', isTakeover ? 'send' : 'check', 'btn-gold')}
      </div>
    </section>
  </div>`;
}

// -------------------------------------------------------------
// MAIN RENDER ENGINE & ROUTER
// -------------------------------------------------------------
function app() {
  let content;

  if (!state.session) {
    content = state.page === 'landing' ? landing() : login();
  } else {
    const isJunior = state.session.role === 'junior';
    let view;

    if (isJunior) {
      view = state.page === 'juniorCases' ? juniorCasesView() :
             state.page === 'liveData' ? liveDataView() :
             state.page === 'juniorNotifications' ? juniorNotificationsView() :
             state.page === 'juniorResearch' || state.page === 'research' ? researchView() :
             state.page === 'juniorSettings' ? juniorSettingsView() :
             state.page === 'detail' ? detailView() : juniorDashboard();
    } else {
      view = state.page === 'dashboard' ? dashboard() :
             state.page === 'liveData' ? liveDataView() :
             state.page === 'cause' ? causeView() :
             state.page === 'importCase' ? importCaseView() :
             state.page === 'team' ? teamView() :
             state.page === 'research' ? researchView() :
             state.page === 'detail' ? detailView() :
             state.page === 'settings' ? settingsView() : dashboard();
    }

    content = `<div class="shell">
      ${topbarAuth()}
      <div class="layout">
        ${isJunior ? juniorSidebar() : sidebar()}
        ${view}
      </div>
      ${notificationsPanel()}
      ${demoSwitcher()}
    </div>`;
  }

  document.getElementById('app').innerHTML = content + modalView() + confirmModal() + (state.toast ? `<div class="toast">${ICON('check-circle')}${state.toast}</div>` : '');
  
  try {
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {}
}

// Instant Local UI Handlers with Non-Blocking Network Sync
function go(page) {
  state.page = page;
  state.modal = null;
  state.authError = '';
  app();
}

function modal(type) {
  state.modal = type;
  app();
}

function closeModal() {
  state.modal = null;
  app();
}

function openCase(id) {
  state.selectedCase = id;
  go('detail');
}

function assignModal(id) {
  state.selectedCase = id;
  modal('assign');
}

function openEmergencyModal(id) {
  state.selectedCase = id;
  state.emergencyRoster = [
    { userId: 'junior-004', fullName: 'Meera Iyer', courtHall: 'Court Hall 8', itemBuffer: 38 },
    { userId: 'junior-001', fullName: 'Ananya Rao', courtHall: 'Court Hall 3', itemBuffer: 22 }
  ];
  modal('emergency');
  
  fetch('/api/v1/chamber/emergency-juniors')
    .then(r => r.json())
    .then(data => {
      if (data && data.success) {
        state.emergencyRoster = data.roster;
        app();
      }
    })
    .catch(() => {});
}

function toggleNotifications() {
  state.notificationsOpen = !state.notificationsOpen;
  app();
}

function toast(msg) {
  state.toast = msg;
  app();
  setTimeout(() => {
    state.toast = '';
    app();
  }, 2800);
}

// Manual Nudge Override Handler (+1 / -1) - Instant Zero Latency UI
function nudgeItem(caseId, deltaOffset) {
  const userName = state.session ? state.session.name : 'Junior Advocate';
  const c = state.cases.find(x => x.id === caseId);
  if (c) {
    c.live = Math.max(1, c.live + deltaOffset);
    const d = delta(c);
    c.eta = d <= 5 ? '~4 min' : d <= 15 ? '~12 min' : '~30 min';
    toast(`Manual live item correction (${deltaOffset > 0 ? '+1' : '-1'}) updated to ${c.live}.`);
    app();
  }

  syncApi(`/api/v1/cases/${caseId}/nudge`, { deltaOffset, updatedBy: userName });
}

function demoLogin(role) {
  state.session = {
    id: `demo-${role}`,
    name: role === 'senior' ? 'S. Pranav' : 'Ananya Rao',
    email: `${role}@lexmatrix.demo`,
    role,
    chamberKey: 'LX-7F2K-9Q',
    onboarded: true
  };
  saveSession();
  state.page = role === 'senior' ? 'dashboard' : 'junior';
  state.authError = '';
  app();
  toast(`Logged in as ${state.session.name}`);

  syncApi('/api/v1/auth/login', {
    role: role.toUpperCase(),
    chamberKey: 'LX-7F2K-9Q',
    chamberPassword: 'chamber123',
    fullName: role === 'senior' ? 'S. Pranav' : 'Ananya Rao'
  });
}

function signIn(e) {
  e.preventDefault();
  return demoLogin('senior');
}

function juniorChamberLogin(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = f.get('name') || 'Ananya Rao';
  
  state.session = { id: `junior-${Date.now()}`, name, role: 'junior', onboarded: true };
  saveSession();
  state.page = 'junior';
  app();
  toast(`Joined chamber as ${name}`);

  syncApi('/api/v1/auth/login', {
    role: 'JUNIOR',
    chamberKey: f.get('key').toUpperCase(),
    chamberPassword: f.get('password'),
    fullName: name
  });
}

function logout() {
  sessionStorage.removeItem('lexmatrix-session');
  state.session = null;
  state.page = 'landing';
  state.profileOpen = false;
  app();
}

function assignCase(name, id) {
  const caseId = state.selectedCase;
  const c = state.cases.find(x => x.id === caseId);
  if (c) {
    c.assignee = name;
    c.assigneeId = id;
    c.status = name === 'Senior Advocate' ? 'Self-attend' : 'Awaiting Response';
  }

  state.modal = null;
  toast(`Case assigned to ${name}. Shared state updated.`);
  app();

  syncApi(`/api/v1/cases/${caseId}/assign`, { assigneeName: name, assigneeId: id });
}

function acceptMatter(id) {
  const userName = state.session ? state.session.name : 'Ananya Rao';
  const c = state.cases.find(x => x.id === id);
  if (c) c.status = 'Accepted';
  toast('Matter accepted. Senior command center updated.');
  app();

  syncApi(`/api/v1/cases/${id}/status`, { statusAction: 'accept', updatedBy: userName });
}

function declineMatter(id) {
  const userName = state.session ? state.session.name : 'Ananya Rao';
  const c = state.cases.find(x => x.id === id);
  if (c) c.status = 'Reassignment Requested';
  toast('Reassignment request sent to Senior Advocate.');
  app();

  syncApi(`/api/v1/cases/${id}/status`, { statusAction: 'decline', updatedBy: userName });
}

function confirmAction(type, id) {
  state.confirmAction = { type, id };
  app();
}

function applyConfirmAction() {
  const action = state.confirmAction;
  const userName = state.session ? state.session.name : 'Ananya Rao';
  const c = state.cases.find(x => x.id === action.id);
  
  if (c) c.status = action.type === 'takeover' ? 'Senior Takeover Requested' : 'Argued';
  state.confirmAction = null;
  toast(action.type === 'takeover' ? 'Emergency takeover requested.' : 'Matter marked as argued.');
  app();

  syncApi(`/api/v1/cases/${action.id}/status`, { statusAction: action.type, updatedBy: userName });
}

function submitImportCase(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const assigneeName = f.get('assignee');
  const fileInput = e.target.querySelector('input[type="file"]');
  const fileName = fileInput.files[0] ? fileInput.files[0].name : '';

  const body = {
    no: f.get('no'),
    parties: f.get('parties'),
    court: f.get('court'),
    hall: f.get('hall'),
    item: f.get('item'),
    bench: f.get('bench'),
    notes: f.get('notes'),
    assigneeName: assigneeName || null,
    fileName
  };

  state.cases.push({
    id: Date.now(),
    no: body.no,
    parties: body.parties,
    court: body.court,
    bench: body.bench || 'Justice Sharma',
    hall: body.hall,
    item: parseInt(body.item),
    live: Math.max(1, parseInt(body.item) - 18),
    eta: '~20 min',
    assignee: assigneeName || null,
    status: assigneeName ? 'Awaiting Response' : 'Unassigned',
    passoverRisk: 'Low',
    walkTime: '3 mins',
    notes: body.notes,
    files: fileName ? [{ name: fileName, size: '1.5 MB' }] : []
  });

  toast(`Case ${body.no} imported and routed.`);
  go('dashboard');

  syncApi('/api/v1/cases/import', body);
}

function submitResearch(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const q = input.value;
  if (!q) return;

  state.researchHistory.push({ sender: 'user', text: q });
  state.researchHistory.push({
    sender: 'ai',
    text: `AI Assistant:\nAnalyzed precedents for "${q}".\n1. Article 226 exceptions (Whirlpool Corp. v. Registrar of Trade Marks).\n2. Violation of natural justice & jurisdictional error.\nAlways cross-check citations in official reports before relying on them before the Court.`
  });

  input.value = '';
  app();

  syncApi('/api/v1/research', { query: q });
}

function advance() {
  nudgeItem(state.cases[0] ? state.cases[0].id : 1, 1);
}

function toggleMember(i) {
  state.team[i].available = !state.team[i].available;
  toast(`${state.team[i].fullName || state.team[i].name} availability updated.`);
  app();
}

function brief() {
  toast('AI Brief regenerated from ephemeral session materials.');
}

function toggleCourtHoursOverride() {
  state.courtStatus.demoOverride = !state.courtStatus.demoOverride;
  state.courtStatus.statusText = state.courtStatus.demoOverride ? 'COURT_SITTING' : 'NOT_SITTING';
  toast(`Court operating hours override set to ${state.courtStatus.demoOverride ? 'ACTIVE' : 'OFF'}`);
  app();
}

// Initialize Engines
initWebSocket();

// Initial Render
app();
