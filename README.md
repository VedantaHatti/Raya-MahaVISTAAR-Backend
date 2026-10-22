# MahaVISTAAR API (backend)

Express server that syncs calls from RAYA, caches them in `.data/calls.json`, and serves `/api/metrics` and `/api/calls`.

Pair with [Raya-MahaVISTAAR-Frontend](https://github.com/adisingh-ai/Raya-MahaVISTAAR-Frontend) on Vercel.

## Run

```bash
npm install
cp .env.example .env   # add RAYA_API_KEY and RAYA_AGENT_ID
npm start              # http://localhost:3001
```

Expose for the Vercel UI (keep this process running):

```bash
ngrok http 3001
# or: cloudflared tunnel --url http://localhost:3001
```

Put the public HTTPS URL in the frontend repo as `NEXT_PUBLIC_API_BASE` on Vercel.

## Optional: reuse an existing cache

Copy `.data/calls.json` from an old install into this repo root to avoid re-downloading history.

## Security

Anyone with the tunnel URL can read metrics. Do not commit `.env` or share the tunnel link publicly if the data is sensitive.
