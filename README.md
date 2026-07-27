# Wind Relay

Minimal P2P relay server for Wind Messenger. Connects peers, stores nothing.

## What it does

- `/register` — Client announces "I'm pubkey X at IP:port Y"
- `/lookup/:pubkey` — Client asks "Where is pubkey X?"
- `/heartbeat` — Keep alive (resets timeout)
- `/deregister` — Going offline
- No message storage. No logs. Restarts purge everything.

## Deploy free

### Railway.app (recommended)
1. Fork or clone this repo
2. Push to GitHub
3. Log in to railway.app
4. New project → GitHub repo
5. Deploy. Done.

### Fly.io
```
curl -L https://fly.io/install.sh | sh
fly auth login
fly launch
fly deploy
```

### Local testing
```
npm install
npm start
# Listens on http://localhost:3000
```

## API

```bash
# Register
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"pubkey":"abc123...", "ip":"203.0.113.1", "port":9878}'

# Lookup
curl http://localhost:3000/lookup/abc123...
# Returns: {"ip":"203.0.113.1", "port":9878}

# Heartbeat (keep alive)
curl -X POST http://localhost:3000/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"pubkey":"abc123..."}'

# Deregister (going offline)
curl -X POST http://localhost:3000/deregister \
  -H "Content-Type: application/json" \
  -d '{"pubkey":"abc123..."}'

# Health check
curl http://localhost:3000/health
# Returns: {"ok":true, "peers":5}
```

## Security

- Server sees: pubkey (public info), IP (can't hide), port
- Server does NOT see: messages, usernames, encryption keys
- No database. No logs. Memory-only. Restarts = everything gone.
- Users can run their own relay and point Wind Messenger to it.

