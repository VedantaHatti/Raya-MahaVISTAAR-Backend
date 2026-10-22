import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { sync, getCalls, getStatus } from './lib/raya-sync.js';
import { buildMetrics, resolveRange, callsInRange, maskNumber } from './lib/analytics.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const STATUSES = new Set(['Completed', 'Pending']);

function searchParams(req) {
  return new URL(`http://local${req.originalUrl}`).searchParams;
}

app.use(cors());
app.use(express.json());

app.get('/api/metrics', async (req, res) => {
  try {
    await sync({ force: req.query.refresh === '1' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const status = getStatus();
  const params = searchParams(req);
  const range = resolveRange(params, status.oldestLoaded);
  const metrics = buildMetrics(getCalls(), range, { oldestLoaded: status.oldestLoaded });

  res.json({ ...metrics, status, generatedAt: Date.now() });
});

app.get('/api/calls', (req, res) => {
  const params = searchParams(req);
  const range = resolveRange(params, getStatus().oldestLoaded);
  const pageSize = Math.min(100, Math.max(5, Number(params.get('pageSize')) || 20));
  const status = params.get('status');
  const q = (params.get('q') ?? '').replace(/\D/g, '');
  const showFull = process.env.SHOW_FULL_NUMBERS === 'true';

  let rows = callsInRange(getCalls(), range.from, range.to);
  if (STATUSES.has(status)) rows = rows.filter((c) => c.outcome === status);
  if (q.length >= 3) rows = rows.filter((c) => c.caller && String(c.caller).includes(q));
  rows.sort((a, b) => (b.start ?? b.created) - (a.start ?? a.created));

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1));
  const slice = rows.slice((page - 1) * pageSize, page * pageSize).map((c) => ({
    id: c.id,
    caller: showFull ? c.caller : maskNumber(c.caller),
    outcome: c.outcome,
    duration: c.dur,
    at: c.start ?? c.created,
  }));

  res.json({ rows: slice, page, pages, total: rows.length });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
