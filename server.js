const express = require('express');
const app = express();
app.use(express.json());

// In-memory peer registry: pubkey_hex -> { ip, port, registered_at }
// Cleaned up on restart (no persistent storage)
const peers = new Map();
const PEER_TIMEOUT = 3600000; // 1 hour: if no heartbeat, remove entry

// Cleanup: expire old peers every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [pubkey, peer] of peers.entries()) {
        if (now - peer.registered_at > PEER_TIMEOUT) {
            peers.delete(pubkey);
            console.log(`[expire] ${pubkey.slice(0, 8)}...`);
        }
    }
}, 300000);

// Register: client announces itself
// POST /register
// Body: { pubkey: "hex...", ip: "1.2.3.4", port: 9878 }
app.post('/register', (req, res) => {
    const { pubkey, ip, port } = req.body;
    if (!pubkey || !ip || !port) {
        return res.status(400).json({ error: 'missing pubkey, ip, or port' });
    }
    peers.set(pubkey, { ip, port, registered_at: Date.now() });
    console.log(`[register] ${pubkey.slice(0, 8)}... at ${ip}:${port}`);
    res.json({ ok: true });
});

// Lookup: client asks where is peer X?
// GET /lookup/:pubkey
// Response: { ip, port } or 404
app.get('/lookup/:pubkey', (req, res) => {
    const { pubkey } = req.params;
    const peer = peers.get(pubkey);
    if (!peer) {
        return res.status(404).json({ error: 'peer not found' });
    }
    console.log(`[lookup] ${pubkey.slice(0, 8)}... -> ${peer.ip}:${peer.port}`);
    res.json({ ip: peer.ip, port: peer.port });
});

// Heartbeat: keep peer alive (prevents timeout)
// POST /heartbeat
// Body: { pubkey: "hex..." }
app.post('/heartbeat', (req, res) => {
    const { pubkey } = req.body;
    const peer = peers.get(pubkey);
    if (!peer) {
        return res.status(404).json({ error: 'not registered' });
    }
    peer.registered_at = Date.now();
    res.json({ ok: true });
});

// Deregister: client going offline
// POST /deregister
// Body: { pubkey: "hex..." }
app.post('/deregister', (req, res) => {
    const { pubkey } = req.body;
    peers.delete(pubkey);
    console.log(`[deregister] ${pubkey.slice(0, 8)}...`);
    res.json({ ok: true });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ ok: true, peers: peers.size });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Wind Relay listening on port ${PORT}`);
    console.log(`Peers currently online: 0`);
});
