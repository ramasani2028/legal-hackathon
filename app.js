const ICON = (name, cls = 'icon') => `<i data-lucide="${name}" class="${cls}"></i>`;

// -------------------------------------------------------------
// CORE SHARED APPLICATION STATE LAYER
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
  simSpeed: 'normal', // 'normal' | 'fast' | 'demo'
  audioEnabled: true,
  
  session: JSON.parse(sessionStorage.getItem('lexmatrix-session') || 'null'),
  
  // Shared Cases State
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
      assignee: null,
      assigneeId: null,
      status: 'Unassigned',
      passoverRisk: 'Moderate',
      walkTime: '3 mins',
      notes: 'Urgent stay application against administrative demolition notice.'
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
      notes: 'Trademark infringement ex-parte ad-interim injunction.'
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
      notes: 'Public interest litigation regarding environmental clearance.'
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
      notes: 'Appeal against commercial arbitration award stay.'
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
      notes: 'Quashing of FIR under Section 482 CrPC.'
    }
  ],

  // Shared Team State
  team: [
    { id: 'junior-001', name: 'Ananya Rao', available: true, active: 0, initials: 'AR', role: 'Junior Associate' },
    { id: 'junior-002', name: 'Rahul Sharma', available: true, active: 1, initials: 'RS', role: 'Junior Associate' },
    { id: 'junior-003', name: 'Karan Mehta', available: false, active: 1, initials: 'KM', role: 'Junior Associate' },
    { id: 'junior-004', name: 'Meera Iyer', available: true, active: 0, initials: 'MI', role: 'Junior Associate' }
  ],

  // Shared Notification Feed
  notifications: [
    { id: 1, time: '10:31', tone: 'critical', text: '5-minute warning', sub: 'WP(C) 4521/2026 is approaching (Δ 04).' },
    { id: 2, time: '10:28', tone: 'approaching', text: 'Manual correction received', sub: 'Court Hall 3 live item updated to 56 by Ananya Rao.' },
    { id: 3, time: '10:21', tone: 'approaching', text: '15-minute warning', sub: 'COMIP 182/2026 is approaching (Δ 05).' },
    { id: 4, time: '09:57', tone: 'safe', text: 'AI Brief Ready', sub: 'Ephemeral argument brief generated for WP(C) 4521/2026.' }
  ],

  // Shared Case History
  caseHistory: [
    { time: '10:15 AM', text: 'Cause list synchronized across 4 High Courts.' },
    { time: '10:28 AM', text: 'Live item corrected to 56 by Ananya Rao.' }
  ],

  // Research Assistant Chat Logs
  researchHistory: [
    { sender: 'user', text: 'Find authorities on maintainability of writ petition when alternative statutory remedy exists.' },
    { sender: 'ai', text: 'Key exceptions to the alternative remedy rule under Article 226:\n1. Breach of fundamental rights (Whirlpool Corp. v. Registrar of Trade Marks).\n2. Violation of principles of natural justice.\n3. Orders passed completely without jurisdiction.\n4. Challenge to ultra vires legislation.\nAlways cross-check citations against official law reports before citing.' }
  ]
};

// Urgency Rules: Δ = Assigned Item - Live Item
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
  } catch (e) {
    // Audio fallback
  }
}

// Brand Element
function brand() {
  return `<div class="brand"><span class="brand-mark">L</span><span><b>LEX</b>MATRIX</span></div>`;
}

// Reusable Button Component
function button(label, action, icon = '', type = '') {
  return `<button class="btn ${type}" onclick="${action}">${icon ? ICON(icon) : ''}<span>${label}</span></button>`;
}

// Reusable Urgency Badge Component
function urgencyBadge(c) {
  const u = urgency(c);
  const d = delta(c);
  return `<span class="delta-badge ${u}">Δ ${String(d).padStart(2, '0')}</span>`;
}

// Topbar Navigation Header
function topbarAuth() {
  const s = state.session || { name: 'Demo User', role: 'senior' };
  const initials = s.name.split(' ').map(x => x[0]).join('').slice(0, 2);
  const unreadCount = state.notifications.length;

  return `<header class="topbar">
    ${brand()}
    <div class="top-center">
      <span class="date">Friday, 11 September 2026</span>
      <span class="system-live"><i class="live-dot"></i> LIVE COMMAND SYSTEM</span>
      <div style="display:flex;align-items:center;gap:6px;margin-left:10px">
        <span class="caps" style="font-size:9px">Sim Speed:</span>
        <button class="tiny-btn" style="${state.simSpeed === 'demo' ? 'color:var(--gold-hi);font-weight:700' : ''}" onclick="setSimSpeed('demo')">⚡ Demo (Fast)</button>
        <button class="tiny-btn" style="${state.simSpeed === 'normal' ? 'color:var(--gold-hi);font-weight:700' : ''}" onclick="setSimSpeed('normal')">⏱️ Normal</button>
      </div>
    </div>
    <div class="top-actions">
      ${s.role === 'senior' && state.page === 'dashboard' ? button('Advance Live Items', 'advance()', 'fast-forward') : ''}
      <button class="btn btn-icon bell" aria-label="Notifications" onclick="toggleNotifications()">
        ${ICON('bell')}
        ${unreadCount > 0 ? `<b class="notification-count">${unreadCount}</b>` : ''}
      </button>
      <div class="avatar" onclick="state.profileOpen = !state.profileOpen; app()">${initials}</div>
      ${state.profileOpen ? `<div class="profile-menu glass">
        <button onclick="toast('Firm: Sharma & Associates')">Sharma & Associates</button>
        <button onclick="go('settings')">Account Settings</button>
        <button onclick="logout()">Log Out</button>
      </div>` : ''}
    </div>
  </header>`;
}

// Senior Sidebar Navigation
function sidebar() {
  const links = [
    ['dashboard', 'layout-dashboard', 'Dashboard'],
    ['cause', 'list-tree', 'Cause List'],
    ['team', 'users-round', 'My Team'],
    ['detail', 'archive', 'Case Workspace'],
    ['settings', 'settings-2', 'Settings']
  ];
  return `<aside class="sidebar">
    ${links.map(([p, i, l]) => `<button class="side-link ${state.page === p ? 'active' : ''}" onclick="go('${p}')">${ICON(i)}<span>${l}</span></button>`).join('')}
    <div class="sidebar-bottom">
      <div class="caps">Team Key</div>
      <div class="mono" style="color:var(--gold-hi);margin-top:6px;font-weight:700">LX-7F2K-9Q</div>
    </div>
  </aside>`;
}

// Junior Sidebar Navigation
function juniorSidebar() {
  const links = [
    ['junior', 'layout-dashboard', 'My Dashboard'],
    ['juniorCases', 'briefcase-business', 'My Cases'],
    ['juniorNotifications', 'bell', 'Notifications'],
    ['juniorResearch', 'search', 'Research'],
    ['juniorSettings', 'settings-2', 'Settings']
  ];
  return `<aside class="junior-sidebar">
    ${links.map(([p, i, l]) => `<button class="side-link ${state.page === p ? 'active' : ''}" onclick="go('${p}')">${ICON(i)}<span>${l}</span></button>`).join('')}
    <div class="junior-note">
      <div class="caps">Assigned Workspace</div>
      <div style="margin-top:6px;font-size:11px;line-height:1.4">Only your matters are displayed here.</div>
    </div>
  </aside>`;
}

// Demo Mode Role Switcher Bar
function demoSwitcher() {
  if (!state.session) return '';
  const isSenior = state.session.role === 'senior';
  return `<div class="demo-switcher glass">
    <span class="caps">Demo Mode</span>
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
        <span onclick="toast('Ephemeral AI processing constraint enforced.')">Security & Privacy</span>
        <span onclick="go('login')">Sign In</span>
      </div>
      ${button('Enter LexMatrix', "demoLogin('senior')", 'arrow-right', 'btn-gold')}
    </nav>
    <main class="landing-main">
      <section class="landing-copy">
        <div class="eyebrow">Litigation, coordinated in real time.</div>
        <h1>One Advocate.<br>Multiple Courtrooms.<br><em>Zero Coordination Chaos.</em></h1>
        <p>LexMatrix gives litigation teams a live command center for tracking hearings, detecting clashes, and delegating matters in real time across High Courts.</p>
        <div class="landing-actions">
          ${button('Enter as Senior Advocate', "demoLogin('senior')", 'shield', 'btn-gold')}
          ${button('Enter as Junior Associate', "demoLogin('junior')", 'user-check')}
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
// AUTHENTICATION VIEWS
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
    <div class="eyebrow">Secure Sign In</div>
    <h1>Welcome back</h1>
    <p>Sign in to your litigation command center.</p>
    <button class="btn" onclick="demoLogin('senior')">${ICON('chrome')}Continue with Google</button>
    <div class="auth-divider">OR</div>
    <form onsubmit="signIn(event)">
      <div class="field">
        <label>Email Address</label>
        <input name="email" type="email" required placeholder="name@firm.com">
      </div>
      <div class="field" style="margin-top:12px">
        <label>Password</label>
        <input name="password" type="password" required placeholder="Enter password">
      </div>
      ${state.authError ? `<div class="auth-error">${state.authError}</div>` : ''}
      <button class="btn btn-gold" style="margin-top:18px;width:100%" type="submit">Sign In</button>
    </form>
    <div class="auth-links">
      <button class="text-button" onclick="toast('Demo recovery email sent.')">Forgot password?</button>
      <span>New here? <button class="text-button" onclick="go('signup')">Create account</button></span>
    </div>
  </section>`);
}

function signup() {
  return authShell(`<section class="auth-card glass">
    <div class="eyebrow">Create Account</div>
    <h1>Build your command center</h1>
    <p>Verify your email before configuring your litigation workspace.</p>
    <button class="btn" onclick="demoLogin('senior')">${ICON('chrome')}Continue with Google</button>
    <div class="auth-divider">OR</div>
    <form onsubmit="sendOtp(event)">
      <div class="field">
        <label>Full Name</label>
        <input name="name" required placeholder="Advocate Name">
      </div>
      <div class="field" style="margin-top:12px">
        <label>Email</label>
        <input name="email" type="email" required placeholder="name@firm.com">
      </div>
      <div class="field" style="margin-top:12px">
        <label>Password</label>
        <input name="password" type="password" minlength="8" required placeholder="At least 8 characters">
      </div>
      <button class="btn btn-gold" style="margin-top:18px;width:100%" type="submit">Send Verification Code</button>
    </form>
    <div class="auth-links">
      <span>Already registered? <button class="text-button" onclick="go('login')">Sign In</button></span>
    </div>
  </section>`);
}

function otp() {
  return authShell(`<section class="auth-card glass">
    <div class="eyebrow">Email Verification</div>
    <h1>Confirm your email</h1>
    <p>We sent a 6-digit verification code to <strong>${state.pending?.email || 'your email'}</strong>.</p>
    <form onsubmit="verifyOtp(event)">
      <div class="field">
        <label>Verification Code</label>
        <input name="otp" inputmode="numeric" pattern="[0-9]{6}" required placeholder="123456" style="text-align:center;letter-spacing:4px;font-size:18px">
      </div>
      ${state.authError ? `<div class="auth-error">${state.authError}</div>` : ''}
      <button class="btn btn-gold" style="margin-top:18px;width:100%" type="submit">Verify Email</button>
    </form>
    <div class="auth-links">
      <button class="text-button" onclick="toast('Code sent: 123456')">Resend Code</button>
    </div>
  </section>`);
}

function roleSelect() {
  return authShell(`<section class="auth-card glass">
    <div class="eyebrow">Role Selection</div>
    <h1>How will you use LexMatrix?</h1>
    <p>Your chosen role determines your workspace layout and coordination permissions.</p>
    <div class="role-options">
      <button class="role-option" onclick="chooseRole('senior')">
        <h3>Senior Advocate</h3>
        <p>Create & manage a litigation team, assign matters across High Courts, and monitor live courtroom progression.</p>
        <span class="text-button" style="display:block;margin-top:10px">Continue as Senior →</span>
      </button>
      <button class="role-option" onclick="chooseRole('junior')">
        <h3>Junior Associate</h3>
        <p>Join an existing litigation team using a Team Key, receive assigned matters, and access AI briefs.</p>
        <span class="text-button" style="display:block;margin-top:10px">Join Team as Junior →</span>
      </button>
    </div>
  </section>`);
}

function seniorOnboarding() {
  return authShell(`<section class="auth-card glass">
    <div class="eyebrow">Senior Advocate Onboarding</div>
    <h1>Create your litigation team</h1>
    <p>Set up the firm workspace your associates will join.</p>
    <form onsubmit="createTeam(event)">
      <div class="field">
        <label>Firm / Team Name</label>
        <input name="firm" required value="${state.session?.teamName || ''}" placeholder="Sharma & Associates">
      </div>
      <button class="btn btn-gold" style="margin-top:18px;width:100%" type="submit">Create Team</button>
    </form>
    ${state.session?.teamKey ? `<div class="key-display">
      <div class="caps">System-Generated Team Key</div>
      <strong>${state.session.teamKey}</strong>
      ${button('Copy Team Key', "toast('Team Key copied: LX-7F2K-9Q')", 'copy')}
    </div>
    <p style="font-size:12px;color:var(--muted);margin-top:10px">Share this key with junior associates so they can join your team.</p>
    <button class="btn btn-gold" style="margin-top:14px;width:100%" onclick="go('dashboard')">Go to Command Center</button>` : ''}
  </section>`);
}

function juniorOnboarding() {
  const found = state.teamFound;
  return authShell(`<section class="auth-card glass">
    <div class="eyebrow">Junior Associate Onboarding</div>
    <h1>Join your litigation team</h1>
    <p>Enter the Team Key provided by your senior advocate.</p>
    ${found ? `<div class="key-display">
      <div class="caps">Team Found</div>
      <strong style="font-family:'Inter';font-size:18px">Sharma & Associates</strong>
      <span class="sub" style="display:block;margin-top:4px">Senior Advocate: A. Sharma</span>
    </div>
    <button class="btn btn-gold" style="width:100%" onclick="joinTeam()">Join Team Now</button>` : `<form onsubmit="findTeam(event)">
      <div class="field">
        <label>Team Key (Enter LX-7F2K-9Q)</label>
        <input name="key" required placeholder="LX-7F2K-9Q" style="text-transform:uppercase">
      </div>
      ${state.authError ? `<div class="auth-error">${state.authError}</div>` : ''}
      <button class="btn btn-gold" style="margin-top:18px;width:100%" type="submit">Find Team</button>
    </form>`}
  </section>`);
}

// -------------------------------------------------------------
// SENIOR ADVOCATE DASHBOARD & WORKSPACES
// -------------------------------------------------------------
function caseRow(c) {
  const u = urgency(c);
  return `<tr>
    <td><span class="case-number">${c.no}</span></td>
    <td class="party">${c.parties}<span class="sub">${c.bench}</span></td>
    <td>${c.court}<span class="sub">${c.hall} · Walk: ${c.walkTime}</span></td>
    <td class="mono">${c.item}</td>
    <td><span class="mono">${c.live}</span><span class="sub"><i class="live-dot"></i> LIVE</span></td>
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
        <button class="tiny-btn" title="Open Workspace" onclick="openCase(${c.id})">${ICON('arrow-up-right')}</button>
        <button class="tiny-btn" title="Assign Junior" onclick="assignModal(${c.id})">${ICON('user-plus')}</button>
        <button class="tiny-btn" title="Correct Live Item" onclick="correctModal(${c.id})">${ICON('pencil')}</button>
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
        ${button('Fetch Court Website', "modal('fetch')", 'external-link')}
        ${button('+ Add Case Manually', "modal('add')", 'plus', 'btn-gold')}
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
          <span><i class="live-dot"></i> Live synchronized</span>
        </div>
        <table class="cause-table">
          <thead>
            <tr>
              <th>Case No.</th>
              <th>Parties / Bench</th>
              <th>Court / Hall</th>
              <th>Item</th>
              <th>Live</th>
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
          ${button('Allot a Junior Now', `assignModal(${urgentCase.id})`, 'user-plus', 'btn-gold')}
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

function causeView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Firm Schedule</div>
        <h1>Full Cause List</h1>
        <p>Live progress by court hall across all pilot High Courts.</p>
      </div>
      ${button('+ Add Case Manually', "modal('add')", 'plus', 'btn-gold')}
    </div>
    <div class="table-panel glass">
      <table class="cause-table">
        <thead>
          <tr>
            <th>Case No.</th>
            <th>Parties / Bench</th>
            <th>Court / Hall</th>
            <th>Item</th>
            <th>Live</th>
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
        <h1>My Team</h1>
        <p>Associate availability and active workload management.</p>
      </div>
      ${button('Copy Team Key', "toast('Team Key copied: LX-7F2K-9Q')", 'copy', 'btn-gold')}
    </div>

    <section class="team-grid">
      ${state.team.map((m, i) => `<article class="member-card glass">
        <div class="avatar" style="width:40px;height:40px;font-size:14px">${m.initials}</div>
        <h3>${m.name}</h3>
        <p>${m.role}</p>
        <div class="status ${m.available ? 'safe' : 'critical'}" style="margin-top:14px">
          <i class="live-dot"></i>${m.available ? 'Available' : 'Unavailable'}
        </div>
        <footer>
          <span>${m.active} active matter${m.active !== 1 ? 's' : ''}</span>
          <button class="tiny-btn" onclick="toggleMember(${i})">${m.available ? 'Set Unavailable' : 'Set Available'}</button>
        </footer>
      </article>`).join('')}
    </section>

    <section class="panel glass" style="margin-top:24px;max-width:560px">
      <div class="caps">Secure Junior Onboarding</div>
      <h3 style="margin-top:8px">Your Team Key: <span class="mono" style="color:var(--gold-hi)">LX-7F2K-9Q</span></h3>
      <p style="color:var(--muted);font-size:12px;line-height:1.6">Share this key directly with junior associates. New team members appear here automatically upon registration.</p>
      <div style="display:flex;gap:10px;margin-top:16px">
        ${button('Copy Team Key', "toast('Team Key copied: LX-7F2K-9Q')", 'copy')}
        ${button('Regenerate Key', "toast('New Team Key generated securely')", 'refresh-cw')}
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
          <h3>Ephemeral Case Files</h3>
          <div class="file-row">${ICON('file-text')}<span>briefing-note.pdf <small class="sub">1.8 MB · ephemeral session input</small></span></div>
          <div class="file-row">${ICON('file-text')}<span>annexures-summary.docx <small class="sub">842 KB · ephemeral session input</small></span></div>
        </div>

        <div class="panel glass">
          <h3>Research Assistant</h3>
          <div class="research-log">
            ${state.researchHistory.map(r => `<div class="bubble ${r.sender}">${r.text.replace(/\n/g, '<br>')}</div>`).join('')}
          </div>
          <form onsubmit="submitResearch(event)" style="margin-top:12px;display:flex;gap:8px">
            <input name="q" placeholder="Ask legal question..." required style="flex:1">
            <button class="btn btn-gold" type="submit">${ICON('send')}</button>
          </form>
          <div class="disclaimer">
            Research results must be independently cross-checked before being relied upon in court.
          </div>
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
  return state.cases.filter(c => c.assignee === 'Ananya Rao' || c.assignee === 'Rahul Sharma' || c.assigneeId === 'junior-001');
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
    <p class="mono">ITEM ${c.item} &nbsp;|&nbsp; LIVE ${c.live}</p>
    <footer>
      <span class="sub">${c.status}</span>
      ${button('View Case', `openCase(${c.id})`, 'arrow-up-right')}
    </footer>
  </article>`;
}

function juniorDashboard() {
  const cases = myCases();
  const c = cases.sort((a, b) => delta(a) - delta(b))[0];

  if (!c) {
    return `<div class="main">
      <div class="junior-main">
        <div class="eyebrow">Junior Associate / ${state.session.name}</div>
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
          <div class="eyebrow">Junior Associate / ${state.session.name}</div>
          <h1>My Dashboard</h1>
          <p>Focus on the matter that needs your attention next.</p>
        </div>
        <span class="system-live"><i class="live-dot"></i> LIVE COURTROOM DATA</span>
      </div>

      <section class="junior-hero glass">
        <div>
          <div class="caps ${u}">${isAwaiting ? 'NEW MATTER ASSIGNED' : 'YOUR NEXT MATTER'} · ${c.status}</div>
          <h2>${c.no}</h2>
          <p>${c.parties}<br>${c.court} · ${c.hall}<br>Before ${c.bench} · Item No. ${c.item}</p>
          <div class="hero-actions">
            ${isAwaiting ? `
              ${button('ACCEPT', `acceptMatter(${c.id})`, 'check', 'btn-gold')}
              ${button('DECLINE — REQUEST REASSIGNMENT', `declineMatter(${c.id})`, 'repeat-2')}
            ` : `
              ${button('View Case Workspace', `openCase(${c.id})`, 'arrow-up-right', 'btn-gold')}
              ${button('VIEW AI BRIEF', `openCase(${c.id})`, 'book-open')}
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

function juniorResearchView() {
  return `<div class="main">
    <div class="page-head">
      <div>
        <div class="eyebrow">Research Workspace</div>
        <h1>Research Assistant</h1>
      </div>
    </div>
    <section class="panel glass" style="max-width:800px">
      <div class="research-log">
        ${state.researchHistory.map(r => `<div class="bubble ${r.sender}">${r.text.replace(/\n/g, '<br>')}</div>`).join('')}
      </div>
      <form onsubmit="submitResearch(event)" style="margin-top:16px;display:flex;gap:8px">
        <input name="q" placeholder="Ask legal question..." required style="flex:1">
        <button class="btn btn-gold" type="submit">${ICON('send')}</button>
      </form>
      <div class="disclaimer">
        Research results must be independently cross-checked before being relied upon in court.
      </div>
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

  if (state.modal === 'add') {
    return `<div class="modal-backdrop">
      <section class="modal glass">
        <div class="modal-head">
          <div>
            <div class="eyebrow">Manual Entry</div>
            <h2>+ Add Case Manually</h2>
          </div>
          <button class="close" onclick="closeModal()">${ICON('x')}</button>
        </div>
        <form onsubmit="addCase(event)">
          <div class="form-grid">
            <div class="field"><label>Case Number</label><input name="no" required placeholder="e.g. LPA 318/2026"></div>
            <div class="field"><label>Item Number</label><input name="item" type="number" required placeholder="60"></div>
            <div class="field full"><label>Party Names</label><input name="parties" required placeholder="Petitioner v. Respondent"></div>
            <div class="field">
              <label>Court</label>
              <select name="court">
                <option>Delhi High Court</option>
                <option>Bombay High Court</option>
                <option>Karnataka High Court</option>
                <option>Calcutta High Court</option>
              </select>
            </div>
            <div class="field"><label>Court Hall</label><input name="hall" required placeholder="Court Hall 3"></div>
            <div class="field"><label>Bench / Judge</label><input name="bench" placeholder="Justice Sharma"></div>
            <div class="field"><label>Hearing Notes</label><input name="notes" placeholder="Optional notes"></div>
          </div>
          <div class="modal-foot">
            ${button('Cancel', 'closeModal()')}
            <button class="btn btn-gold" type="submit">${ICON('plus')}Add to Cause List</button>
          </div>
        </form>
      </section>
    </div>`;
  }

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
            <h2>Assign ${c.no}</h2>
          </div>
          <button class="close" onclick="closeModal()">${ICON('x')}</button>
        </div>
        <p style="font-size:12px;color:var(--muted)">Select an associate with available capacity.</p>
        <div class="assign-list">
          <button class="assignee" onclick="assignCase('Senior Advocate', 'senior-001')">
            <span><strong>Senior Advocate</strong><small class="sub">Attend Personally</small></span>
            <span class="safe">AVAILABLE</span>
          </button>
          ${state.team.map(m => `<button class="assignee" onclick="assignCase('${m.name}', '${m.id}')">
            <span><strong>${m.name}</strong><small class="sub">${m.active} active matter${m.active !== 1 ? 's' : ''}</small></span>
            <span class="${m.available ? 'safe' : 'critical'}">${m.available ? 'FREE' : 'UNAVAILABLE'}</span>
          </button>`).join('')}
        </div>
      </section>
    </div>`;
  }

  if (state.modal === 'correct') {
    const c = state.cases.find(x => x.id === state.selectedCase);
    return `<div class="modal-backdrop">
      <section class="modal glass">
        <div class="modal-head">
          <div>
            <div class="eyebrow">Shared Live Correction</div>
            <h2>Correct Live Item Number</h2>
          </div>
          <button class="close" onclick="closeModal()">${ICON('x')}</button>
        </div>
        <p style="color:var(--muted);font-size:13px">
          ${c.court} · ${c.hall}. Current recorded live item: <strong class="mono">${c.live}</strong>
        </p>
        <form onsubmit="correctLive(event)">
          <div class="field">
            <label>Live Item Number Now Being Called</label>
            <input name="live" type="number" value="${c.live}" required>
          </div>
          <div class="modal-foot">
            ${button('Cancel', 'closeModal()')}
            <button class="btn btn-gold" type="submit">${ICON('check')}Update Live Item For Firm</button>
          </div>
        </form>
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
    content = state.page === 'signup' ? signup() :
              state.page === 'otp' ? otp() :
              state.page === 'roleSelect' ? roleSelect() :
              state.page === 'seniorOnboarding' ? seniorOnboarding() :
              state.page === 'juniorOnboarding' ? juniorOnboarding() :
              state.page === 'landing' ? landing() : login();
  } else if (!state.session.onboarded) {
    content = state.session.role === 'senior' ? seniorOnboarding() : juniorOnboarding();
  } else {
    const isJunior = state.session.role === 'junior';
    let view;

    if (isJunior) {
      view = state.page === 'juniorCases' ? juniorCasesView() :
             state.page === 'juniorNotifications' ? juniorNotificationsView() :
             state.page === 'juniorResearch' ? juniorResearchView() :
             state.page === 'juniorSettings' ? juniorSettingsView() :
             state.page === 'detail' ? detailView() : juniorDashboard();
    } else {
      view = state.page === 'dashboard' ? dashboard() :
             state.page === 'cause' ? causeView() :
             state.page === 'team' ? teamView() :
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
  if (window.lucide) window.lucide.createIcons();
}

// Global Actions & State Handlers
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

function correctModal(id) {
  state.selectedCase = id;
  modal('correct');
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

function setSimSpeed(speed) {
  state.simSpeed = speed;
  toast(`Simulation speed set to ${speed.toUpperCase()}`);
}

function demoLogin(role) {
  state.session = {
    id: `demo-${role}`,
    name: role === 'senior' ? 'S. Pranav' : 'Ananya Rao',
    email: `${role}@lexmatrix.demo`,
    role,
    onboarded: true,
    teamId: 'team-sharma',
    teamName: 'Sharma & Associates',
    teamKey: 'LX-7F2K-9Q'
  };
  saveSession();
  state.page = role === 'senior' ? 'dashboard' : 'junior';
  state.authError = '';
  app();
  toast(`Switched role to ${role === 'senior' ? 'Senior Advocate S. Pranav' : 'Junior Associate Ananya Rao'}`);
}

function signIn(e) {
  e.preventDefault();
  const email = new FormData(e.target).get('email').toLowerCase();
  if (email.includes('junior')) return demoLogin('junior');
  return demoLogin('senior');
}

function sendOtp(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  state.pending = { name: f.get('name'), email: f.get('email') };
  state.authError = '';
  go('otp');
}

function verifyOtp(e) {
  e.preventDefault();
  const otpVal = new FormData(e.target).get('otp');
  if (otpVal !== '123456') {
    state.authError = 'Incorrect OTP. Enter 123456';
    app();
    return;
  }
  state.session = { id: `user-${Date.now()}`, name: state.pending.name, email: state.pending.email, role: null, onboarded: false };
  saveSession();
  go('roleSelect');
}

function chooseRole(role) {
  state.session.role = role;
  saveSession();
  go(role === 'senior' ? 'seniorOnboarding' : 'juniorOnboarding');
}

function createTeam(e) {
  e.preventDefault();
  state.session.teamName = new FormData(e.target).get('firm');
  state.session.teamId = `team-${Date.now()}`;
  state.session.teamKey = 'LX-7F2K-9Q';
  state.session.onboarded = true;
  saveSession();
  toast('Team created! Team Key: LX-7F2K-9Q');
}

function findTeam(e) {
  e.preventDefault();
  const key = new FormData(e.target).get('key').toUpperCase();
  if (key !== 'LX-7F2K-9Q') {
    state.authError = 'Team Key not found. Use LX-7F2K-9Q';
    app();
    return;
  }
  state.teamFound = true;
  state.authError = '';
  app();
}

function joinTeam() {
  state.session.teamId = 'team-sharma';
  state.session.teamName = 'Sharma & Associates';
  state.session.teamKey = 'LX-7F2K-9Q';
  state.session.onboarded = true;
  saveSession();
  state.page = 'junior';
  toast('Successfully joined Sharma & Associates');
}

function logout() {
  sessionStorage.removeItem('lexmatrix-session');
  state.session = null;
  state.page = 'landing';
  state.profileOpen = false;
  state.teamFound = false;
  app();
}

function assignCase(name, id) {
  const c = state.cases.find(x => x.id === state.selectedCase);
  c.assignee = name;
  c.assigneeId = id;
  c.status = name === 'Senior Advocate' ? 'Self-attend' : 'Awaiting Response';

  const member = state.team.find(m => m.id === id || m.name === name);
  if (member) member.active++;

  state.notifications.unshift({
    id: Date.now(),
    time: 'Now',
    tone: 'critical',
    text: 'New Matter Assigned',
    sub: `${c.no} assigned to ${name}.`
  });

  state.modal = null;
  toast(`${c.no} assigned to ${name}. Shared state updated.`);
}

function acceptMatter(id) {
  const c = state.cases.find(x => x.id === id);
  if (c) c.status = 'Accepted';
  state.notifications.unshift({
    id: Date.now(),
    time: 'Now',
    tone: 'safe',
    text: 'Assignment Accepted',
    sub: `Ananya Rao accepted ${c?.no}.`
  });
  toast('Matter accepted. Senior dashboard updated.');
}

function declineMatter(id) {
  const c = state.cases.find(x => x.id === id);
  if (c) c.status = 'Reassignment Requested';
  state.notifications.unshift({
    id: Date.now(),
    time: 'Now',
    tone: 'critical',
    text: 'Reassignment Requested',
    sub: `Ananya Rao requested reassignment for ${c?.no}.`
  });
  toast('Reassignment request sent to Senior Advocate.');
}

function confirmAction(type, id) {
  state.confirmAction = { type, id };
  app();
}

function applyConfirmAction() {
  const action = state.confirmAction;
  const c = state.cases.find(x => x.id === action.id);
  if (!c) return;

  if (action.type === 'takeover') {
    c.status = 'Senior Takeover Requested';
    state.notifications.unshift({
      id: Date.now(),
      time: 'Now',
      tone: 'critical',
      text: 'Takeover Requested',
      sub: `Ananya Rao requested Senior Advocate for ${c.no}.`
    });
    toast('Senior takeover request sent.');
  } else {
    c.status = 'Argued';
    state.notifications.unshift({
      id: Date.now(),
      time: 'Now',
      tone: 'safe',
      text: 'Matter Marked Argued',
      sub: `${c.no} marked as argued by Ananya Rao.`
    });
    state.caseHistory.unshift({
      time: 'Just now',
      text: `Matter ${c.no} marked as argued by Ananya Rao.`
    });
    toast('Matter marked as argued.');
  }

  state.confirmAction = null;
  app();
}

function correctLive(e) {
  e.preventDefault();
  const c = state.cases.find(x => x.id === state.selectedCase);
  c.live = Number(new FormData(e.target).get('live'));
  c.eta = delta(c) <= 5 ? '~4 min' : delta(c) <= 15 ? '~12 min' : '~30 min';

  state.notifications.unshift({
    id: Date.now(),
    time: 'Now',
    tone: 'approaching',
    text: 'Manual Correction',
    sub: `${c.hall} live item updated to ${c.live} by Ananya Rao.`
  });

  state.modal = null;
  toast('Live item number updated across the entire firm.');
}

function addCase(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  const item = Number(f.get('item'));

  state.cases.push({
    id: Date.now(),
    no: f.get('no'),
    parties: f.get('parties'),
    court: f.get('court'),
    bench: f.get('bench') || 'Justice Sharma',
    hall: f.get('hall'),
    item,
    live: Math.max(1, item - 18),
    eta: '~20 min',
    assignee: null,
    assigneeId: null,
    status: 'Unassigned',
    passoverRisk: 'Low',
    walkTime: '3 mins',
    notes: f.get('notes') || 'Added manually'
  });

  state.modal = null;
  state.page = 'dashboard';
  toast('Case added to live cause list.');
}

function advance() {
  state.cases.forEach(c => {
    if (delta(c) > 0) c.live++;
    if (delta(c) <= 1) playAudioAlert();
  });

  state.notifications.unshift({
    id: Date.now(),
    time: 'Now',
    tone: 'approaching',
    text: 'Live Courtroom Advance',
    sub: 'Live item numbers advanced across active courtrooms.'
  });

  toast('Live courtroom numbers advanced.');
}

function toggleMember(i) {
  state.team[i].available = !state.team[i].available;
  toast(`${state.team[i].name} is now ${state.team[i].available ? 'available' : 'unavailable'}.`);
}

function submitResearch(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const q = input.value;
  if (!q) return;

  state.researchHistory.push({ sender: 'user', text: q });
  state.researchHistory.push({
    sender: 'ai',
    text: `AI Legal Research Assistant:\nAnalyzed precedents for "${q}". Cross-check citations in official law reporters before relying on them in court.`
  });

  input.value = '';
  app();
}

function brief() {
  toast('AI Brief regenerated from ephemeral session materials.');
}

// Background Timer for Simulated Live Court Progression
setInterval(() => {
  if (state.session && state.page !== 'landing') {
    const chance = state.simSpeed === 'demo' ? 0.85 : 0.4;
    state.cases.forEach(c => {
      if (delta(c) > 0 && Math.random() < chance) c.live++;
    });
    app();
  }
}, state.simSpeed === 'demo' ? 4000 : 15000);

// Initial App Render
app();
