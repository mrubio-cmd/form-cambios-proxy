// /api/index.js — Vercel Serverless (CommonJS) con modo debug
module.exports = async function handler(req, res) {
  try {
    const APP_URL = 'https://script.google.com/macros/s/AKfycbylpo_b35stQ9XsbSUxcUA-4Log6moe8WvdCotaQX1NPB7n-XU6zAv9Kafr5vqmsa8M/exec';

    // CORS básico
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();

    // Request upstream
    const init = { method: req.method, headers: { 'user-agent': 'vercel-proxy' } };
    if (!['GET', 'HEAD'].includes(req.method)) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      init.body = Buffer.concat(chunks);
      init.headers['content-type'] = req.headers['content-type'] || 'application/json';
    }

    // Querystring original
    const inUrl = new URL(req.url, `https://${req.headers.host}`);
    const outUrl = new URL(APP_URL);
    outUrl.search = inUrl.search;

    const upstream = await fetch(outUrl.toString(), init);
    const status = upstream.status;
    const headers = Object.fromEntries(upstream.headers.entries());
    const text = await upstream.text();
    const ctUp = (headers['content-type'] || '').toLowerCase();

    // DEBUG: /api?debug=1
    if (inUrl.searchParams.get('debug') === '1') {
      return res.status(200).json({
        ok: true,
        upstreamStatus: status,
        upstreamContentType: headers['content-type'] || null,
        upstreamLength: text.length,
        head: text.slice(0, 400)
      });
    }

    res.status(status);
    if (ctUp.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(text);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(text);

  } catch (err) {
    return res.status(500).json({ ok:false, error:'Proxy failed', detail: String(err?.message || err) });
  }
};


