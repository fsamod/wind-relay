const express = require('express');
const app = express();
app.use(express.json());

// this will svae on mem
const peers = new Map();
const PEER_TIMEOUT = 3600000; // 1 hour: if no heartbeat, remove entry

// cleans up da expired things
setInterval(() => {
    const now = Date.now();
    for (const [pubkey, peer] of peers.entries()) {
        if (now - peer.registered_at > PEER_TIMEOUT) {
            peers.delete(pubkey);
            console.log(`[expire] ${pubkey.slice(0, 8)}...`);
        }
    }
}, 300000);

// helps to announce clinets to eachother
app.post('/register', (req, res) => {
    const { pubkey, ip, port } = req.body;
    if (!pubkey || !ip || !port) {
        return res.status(400).json({ error: 'missing pubkey, ip, or port' });
    }
    peers.set(pubkey, { ip, port, registered_at: Date.now() });
    console.log(`[register] ${pubkey.slice(0, 8)}... at ${ip}:${port}`);
    res.json({ ok: true });
});

// reponse
app.get('/lookup/:pubkey', (req, res) => {
    const { pubkey } = req.params;
    const peer = peers.get(pubkey);
    if (!peer) {
        return res.status(404).json({ error: 'peer not found' });
    }
    console.log(`[lookup] ${pubkey.slice(0, 8)}... -> ${peer.ip}:${peer.port}`);
    res.json({ ip: peer.ip, port: peer.port });
});

//ni tiemout
app.post('/heartbeat', (req, res) => {
    const { pubkey } = req.body;
    const peer = peers.get(pubkey);
    if (!peer) {
        return res.status(404).json({ error: 'not registered' });
    }
    peer.registered_at = Date.now();
    res.json({ ok: true });
});

//when it goes offline
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
