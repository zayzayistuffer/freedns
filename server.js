const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const MockRegistrar = require('./lib/mockRegistrar');
const Cloudflare = require('./lib/cloudflare');
const cors = require('cors');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || './data/domains.json';

// ensure data dir
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ domains: [] }, null, 2));

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Serve a basic frontend
app.use(express.static(path.join(__dirname, 'public')));

// API: search availability
app.get('/api/search', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'domain query param required' });
  try {
    const available = await MockRegistrar.checkAvailability(domain);
    res.json({ domain, available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'search-failed' });
  }
});

// API: register (mock)
app.post('/api/register', async (req, res) => {
  const { domain, ownerEmail } = req.body;
  if (!domain || !ownerEmail) return res.status(400).json({ error: 'domain and ownerEmail required' });
  try {
    const already = MockRegistrar.isRegistered(domain);
    if (already) return res.status(409).json({ error: 'domain-already-registered' });
    const reg = MockRegistrar.register(domain, ownerEmail);

    // persist
    const db = JSON.parse(fs.readFileSync(DATA_FILE));
    db.domains.push(reg);
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));

    // if Cloudflare token is present, create a zone
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    if (cfToken) {
      try {
        const cf = new Cloudflare(cfToken);
        const zone = await cf.createZone(domain);
        reg.cloudflareZoneId = zone.id;
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
      } catch (cfErr) {
        console.warn('Cloudflare zone creation failed:', cfErr.message);
        // continue
      }
    }

    res.json({ success: true, registration: reg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'registration-failed' });
  }
});

app.get('/api/domains', (req, res) => {
  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(db.domains);
});

// Add DNS record via Cloudflare
app.post('/api/dns/:domain', async (req, res) => {
  const domain = req.params.domain;
  const { type, name, content, ttl = 3600 } = req.body;
  if (!type || !name || !content) return res.status(400).json({ error: 'type, name, content required' });

  const db = JSON.parse(fs.readFileSync(DATA_FILE));
  const reg = db.domains.find(d => d.domain === domain);
  if (!reg) return res.status(404).json({ error: 'domain-not-registered' });
  if (!reg.cloudflareZoneId) return res.status(400).json({ error: 'no-cloudflare-zone' });

  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!cfToken) return res.status(500).json({ error: 'missing-cloudflare-token' });
  const cf = new Cloudflare(cfToken);
  try {
    const record = await cf.createDNSRecord(reg.cloudflareZoneId, { type, name, content, ttl });
    res.json({ success: true, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'cf-dns-failed' });
  }
});

// simple health
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`FreeDNS prototype running on http://localhost:${PORT}`);
});
