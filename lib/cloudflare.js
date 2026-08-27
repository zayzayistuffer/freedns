const fetch = require('node-fetch');

class Cloudflare {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.base = 'https://api.cloudflare.com/client/v4';
  }

  async request(path, method = 'GET', body) {
    const headers = { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' };
    const res = await fetch(this.base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json();
    if (!json.success) throw new Error(JSON.stringify(json.errors || json));
    return json.result;
  }

  async createZone(name) {
    // jump_start true tells Cloudflare to scan existing DNS — optional
    return this.request('/zones', 'POST', { name, jump_start: false });
  }

  async createDNSRecord(zoneId, { type, name, content, ttl = 3600 }) {
    return this.request(`/zones/${zoneId}/dns_records`, 'POST', { type, name, content, ttl });
  }
}

module.exports = Cloudflare;
