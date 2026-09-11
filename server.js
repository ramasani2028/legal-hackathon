const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// -------------------------------------------------------------
// IN-MEMORY CHAMBERS & MULTI-TENANT DATABASE SCHEMA
// -------------------------------------------------------------
const db = {
  chambers: {
    'team-sharma': {
      id: 'team-sharma',
      name: 'Sharma & Associates',
      seniorId: 'senior-001',
      seniorName: 'S. Pranav',
      chamberKey: 'LX-7F2K-9Q',
      chamberPasswordHash: 'chamber123', // In-memory hash for demo
      createdAt: '2026-09-11T01:00:00Z'
    }
  },
  
  users: [
    { id: 'senior-001', role: 'SENIOR', chamberId: 'team-sharma', fullName: 'S. Pranav', email: 'senior@lexmatrix.demo' },
    { id: 'junior-001', role: 'JUNIOR', chamberId: 'team-sharma', fullName: 'Ananya Rao', email: 'ananya@lexmatrix.demo', available: true, activeCases: 1 },
    { id: 'junior-002', role: 'JUNIOR', chamberId: 'team-sharma', fullName: 'Rahul Sharma', email: 'rahul@lexmatrix.demo', available: true, activeCases: 1 },
    { id: 'junior-003', role: 'JUNIOR', chamberId: 'team-sharma', fullName: 'Karan Mehta', email: 'karan@lexmatrix.demo', available: false, activeCases: 1 },
    { id: 'junior-004', role: 'JUNIOR', chamberId: 'team-sharma', fullName: 'Meera Iyer', email: 'meera@lexmatrix.demo', available: true, activeCases: 0 },
    { id: 'cocounsel-001', role: 'CO_COUNSEL', chamberId: 'team-sharma', fullName: 'Vikramaditya Sen', email: 'vikram@lexmatrix.demo', available: true, activeCases: 0 }
  ],

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

  courtStatus: {
    isOperatingHours: true,
    statusText: 'COURT_SITTING',
    nextSession: '09:00 AM IST',
    demoOverride: true
  }
};

// Calculate delta
const delta = c => c.item - c.live;

// Check Operating Hours (09:00 to 16:00 IST)
function checkCourtOperatingHours() {
  if (db.courtStatus.demoOverride) return true;
  const now = new Date();
  // IST offset UTC + 5:30
  const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
  const day = now.getUTCDay(); // 0 Sunday, 6 Saturday
  const isWeekday = day >= 1 && day <= 5;
  const isHours = istHours >= 9 && istHours < 16;
  return isWeekday && isHours;
}

// Broadcast Realtime State to all connected WebSocket Clients across all devices
function broadcastState(chamberId = 'team-sharma') {
  const payload = JSON.stringify({
    type: 'STATE_UPDATE',
    chamberId,
    timestamp: new Date().toISOString(),
    data: {
      cases: db.cases,
      users: db.users,
      notifications: db.notifications,
      caseHistory: db.caseHistory,
      courtStatus: db.courtStatus
    }
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// -------------------------------------------------------------
// WEBSOCKET REAL-TIME SYNC ARCHITECTURE
// -------------------------------------------------------------
wss.on('connection', ws => {
  // Send initial state snapshot on connection
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    data: {
      cases: db.cases,
      users: db.users,
      notifications: db.notifications,
      caseHistory: db.caseHistory,
      courtStatus: db.courtStatus
    }
  }));

  ws.on('message', message => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {
      // Parse error fallback
    }
  });
});

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// State query
app.get('/api/v1/state', (req, res) => {
  res.json({
    success: true,
    data: {
      cases: db.cases,
      users: db.users,
      notifications: db.notifications,
      caseHistory: db.caseHistory,
      courtStatus: db.courtStatus
    }
  });
});

// Multi-Tenant Authentication & Chamber Account Linking
app.post('/api/v1/auth/login', (req, res) => {
  const { role, email, chamberKey, chamberPassword, fullName } = req.body;
  const chamber = Object.values(db.chambers).find(c => c.chamberKey === chamberKey);

  if (!chamber || chamber.chamberPasswordHash !== chamberPassword) {
    return res.status(401).json({ success: false, message: 'Invalid Chamber Key or Chamber Password. Try LX-7F2K-9Q and chamber123' });
  }

  if (role === 'SENIOR') {
    return res.json({
      success: true,
      token: `jwt-senior-${Date.now()}`,
      user: {
        id: 'senior-001',
        role: 'SENIOR',
        chamberId: chamber.id,
        chamberName: chamber.name,
        fullName: chamber.seniorName,
        email: email || chamber.seniorName.toLowerCase().replace(' ', '') + '@lexmatrix.demo'
      }
    });
  }

  // Junior / Co-Counsel Login
  let user = db.users.find(u => u.fullName.toLowerCase() === (fullName || '').toLowerCase() && u.chamberId === chamber.id);
  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      role: role === 'CO_COUNSEL' ? 'CO_COUNSEL' : 'JUNIOR',
      chamberId: chamber.id,
      fullName: fullName || 'Junior Associate',
      email: `${(fullName || 'junior').toLowerCase().replace(/\s+/g, '')}@lexmatrix.demo`,
      available: true,
      activeCases: 0
    };
    db.users.push(user);
  }

  broadcastState(chamber.id);

  return res.json({
    success: true,
    token: `jwt-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      role: user.role,
      chamberId: chamber.id,
      chamberName: chamber.name,
      fullName: user.fullName,
      email: user.email
    }
  });
});

// Manual Live Item Override (+1 / -1 Nudge Buttons Endpoint)
app.post('/api/v1/cases/:id/nudge', (req, res) => {
  const caseId = parseInt(req.params.id);
  const { deltaOffset, updatedBy } = req.body; // deltaOffset: +1 or -1
  const targetCase = db.cases.find(c => c.id === caseId);

  if (!targetCase) {
    return res.status(404).json({ success: false, message: 'Case not found' });
  }

  const oldLive = targetCase.live;
  targetCase.live = Math.max(1, targetCase.live + (deltaOffset || 1));
  const newDelta = delta(targetCase);
  targetCase.eta = newDelta <= 5 ? '~4 min' : newDelta <= 15 ? '~12 min' : '~30 min';

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  db.notifications.unshift({
    id: Date.now(),
    time: timeStr,
    tone: 'approaching',
    text: 'Manual Courtroom Override',
    sub: `${targetCase.hall} item manually adjusted (${oldLive} → ${targetCase.live}) by ${updatedBy || 'Junior Advocate'}.`
  });

  db.caseHistory.unshift({
    time: timeStr,
    text: `${targetCase.hall} live item corrected from ${oldLive} to ${targetCase.live} by ${updatedBy || 'Junior Advocate'}.`
  });

  broadcastState();

  return res.json({
    success: true,
    message: 'Manual override applied and synchronized across all chamber devices.',
    case: targetCase
  });
});

// Emergency Delegation Query Endpoint
app.get('/api/v1/chamber/emergency-juniors', (req, res) => {
  // Query: SELECT user_id, full_name, court_hall, (assigned_item - live_item) AS item_buffer FROM chamber_roster_status WHERE item_buffer > 15 ORDER BY item_buffer DESC
  const emergencyRoster = db.users
    .filter(u => u.role === 'JUNIOR' && u.available)
    .map(u => {
      const assignedCase = db.cases.find(c => c.assigneeId === u.id);
      const buffer = assignedCase ? delta(assignedCase) : 40; // Default slack if no active matter
      return {
        userId: u.id,
        fullName: u.fullName,
        courtHall: assignedCase ? assignedCase.hall : 'Slack / Unassigned',
        assignedItem: assignedCase ? assignedCase.item : 0,
        liveItem: assignedCase ? assignedCase.live : 0,
        itemBuffer: buffer
      };
    })
    .filter(u => u.itemBuffer > 15)
    .sort((a, b) => b.itemBuffer - a.itemBuffer);

  return res.json({
    success: true,
    roster: emergencyRoster
  });
});

// Import Case Endpoint
app.post('/api/v1/cases/import', (req, res) => {
  const { no, parties, court, bench, hall, item, notes, assigneeName, assigneeId, fileName } = req.body;
  const itemNum = parseInt(item);

  const newCase = {
    id: Date.now(),
    no,
    parties,
    court,
    bench: bench || 'Justice Sharma',
    hall,
    item: itemNum,
    live: Math.max(1, itemNum - 18),
    eta: '~25 min',
    assignee: assigneeName || null,
    assigneeId: assigneeId || null,
    status: assigneeName ? 'Awaiting Response' : 'Unassigned',
    passoverRisk: 'Low',
    walkTime: '3 mins',
    notes: notes || 'Imported case file',
    files: fileName ? [{ name: fileName, size: '1.5 MB' }] : []
  };

  db.cases.push(newCase);

  if (assigneeId) {
    const u = db.users.find(usr => usr.id === assigneeId);
    if (u) u.activeCases++;
  }

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  db.notifications.unshift({
    id: Date.now(),
    time: timeStr,
    tone: 'safe',
    text: 'Case Imported & Assigned',
    sub: `${no} imported and routed to ${assigneeName || 'Unassigned'}.`
  });

  broadcastState();

  return res.json({ success: true, case: newCase });
});

// Case Assignment Endpoint
app.post('/api/v1/cases/:id/assign', (req, res) => {
  const caseId = parseInt(req.params.id);
  const { assigneeName, assigneeId } = req.body;
  const c = db.cases.find(x => x.id === caseId);

  if (!c) return res.status(404).json({ success: false, message: 'Case not found' });

  c.assignee = assigneeName;
  c.assigneeId = assigneeId;
  c.status = assigneeName === 'Senior Advocate' ? 'Self-attend' : 'Awaiting Response';

  const u = db.users.find(usr => usr.id === assigneeId || usr.fullName === assigneeName);
  if (u) u.activeCases++;

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  db.notifications.unshift({
    id: Date.now(),
    time: timeStr,
    tone: 'critical',
    text: 'New Assignment Dispatched',
    sub: `${c.no} assigned to ${assigneeName}.`
  });

  broadcastState();
  return res.json({ success: true, case: c });
});

// Case Status Action Endpoint (Accept, Decline, Mark Argued, Takeover Request)
app.post('/api/v1/cases/:id/status', (req, res) => {
  const caseId = parseInt(req.params.id);
  const { statusAction, updatedBy } = req.body;
  const c = db.cases.find(x => x.id === caseId);

  if (!c) return res.status(404).json({ success: false, message: 'Case not found' });

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (statusAction === 'accept') {
    c.status = 'Accepted';
    db.notifications.unshift({
      id: Date.now(),
      time: timeStr,
      tone: 'safe',
      text: 'Assignment Accepted',
      sub: `${updatedBy || 'Junior Advocate'} accepted ${c.no}.`
    });
  } else if (statusAction === 'decline') {
    c.status = 'Reassignment Requested';
    db.notifications.unshift({
      id: Date.now(),
      time: timeStr,
      tone: 'critical',
      text: 'Reassignment Requested',
      sub: `${updatedBy || 'Junior Advocate'} requested reassignment for ${c.no}.`
    });
  } else if (statusAction === 'argued') {
    c.status = 'Argued';
    db.notifications.unshift({
      id: Date.now(),
      time: timeStr,
      tone: 'safe',
      text: 'Matter Marked Argued',
      sub: `${c.no} marked as argued by ${updatedBy || 'Junior Advocate'}.`
    });
    db.caseHistory.unshift({
      time: timeStr,
      text: `Matter ${c.no} marked as argued by ${updatedBy || 'Junior Advocate'}.`
    });
  } else if (statusAction === 'takeover') {
    c.status = 'Senior Takeover Requested';
    db.notifications.unshift({
      id: Date.now(),
      time: timeStr,
      tone: 'critical',
      text: 'Emergency Takeover Requested',
      sub: `${updatedBy || 'Junior Advocate'} requested Senior Advocate for ${c.no}.`
    });
  }

  broadcastState();
  return res.json({ success: true, case: c });
});

// AI Research Assistant Proxy Endpoint
app.post('/api/v1/research', (req, res) => {
  const { query } = req.body;
  const responseText = `AI Legal Research Assistant:\nAnalyzed precedents for "${query}".\n1. Article 226 exceptions (Whirlpool Corp. v. Registrar of Trade Marks).\n2. Violation of natural justice & jurisdictional error.\nAlways cross-check citations in official reports before relying on them before the Court.`;

  return res.json({
    success: true,
    answer: responseText,
    disclaimer: 'Research results must be independently cross-checked before being relied upon in court.'
  });
});

// -------------------------------------------------------------
// TIME-GATED HIGH COURT SCRAPING CRON WORKER
// -------------------------------------------------------------
setInterval(() => {
  const isSitting = checkCourtOperatingHours();
  
  if (isSitting) {
    db.courtStatus.statusText = 'COURT_SITTING';
    // Increment live items periodically to simulate High Court progress
    db.cases.forEach(c => {
      if (delta(c) > 0 && Math.random() < 0.5) {
        c.live++;
        const d = delta(c);
        c.eta = d <= 5 ? '~4 min' : d <= 15 ? '~12 min' : '~30 min';
      }
    });
    broadcastState();
  } else {
    db.courtStatus.statusText = 'NOT_SITTING';
    db.courtStatus.nextSession = '09:00 AM IST';
  }
}, 30000);

// Fallback route to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`LexMatrix Chamber Realtime Server running on port ${PORT}`);
});
