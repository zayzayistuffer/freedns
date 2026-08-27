const fs = require('fs');

// Very small mock registrar for testing/demo purposes.

const DATA_FILE = './data/mock_registrar.json';
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ regs: [] }, null, 2));

function normalize(domain) {
  return domain.trim().toLowerCase();
}

function checkAvailability(domain) {
  domain = normalize(domain);
  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  const taken = db.regs.find(r => r.domain === domain);
  // if taken return false; otherwise randomize available for demo
  if (taken) return Promise.resolve(false);
  return Promise.resolve(true);
}

function isRegistered(domain) {
  domain = normalize(domain);
  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  return !!db.regs.find(r => r.domain === domain);
}

function register(domain, ownerEmail) {
  domain = normalize(domain);
  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  const now = new Date();
  const expiry = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
  const reg = { domain, ownerEmail, registeredAt: now.toISOString(), expiresAt: expiry.toISOString(), id: `mock-${Date.now()}` };
  db.regs.push(reg);
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  return reg;
}

module.exports = { checkAvailability, register, isRegistered };
