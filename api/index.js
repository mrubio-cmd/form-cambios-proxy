// /api/index.js — Vercel Serverless (CommonJS)
module.exports = async function handler(req, res) {
  try {
    const APP_URL = 'https://script.google.com/macros/s/AKfycbylpo_b35stQ9XsbSUxcUA-4Log6moe8WvdCotaQX1NPB7n-XU6zAv9Kafr5vqmsa8M/exec';

    // CORS básico
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();

    // Construir request upstream
    const init = { method: req.method, headers: { 'user-agent': 'vercel-proxy' } };
    if (!['GET', 'HEAD'].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
      const ct = req.headers['content-type'] || 'application/json';
      init.headers['content-type'] = ct;
    }

    // Copiar querystring original
    const inUrl = new URL(req.url, `https://${req.headers.host}`);
    const outUrl = new URL(APP_URL);
    outUrl.search = inUrl.search;

    const upstream = await fetch(outUrl.toString(), init);
    const ctUp = (upstream.headers.get('content-type') || '').toLowerCase();
    const text = await upstream.text();

    // Devolución: solo fijamos el Content-Type correcto y el status
    res.status(upstream.status);

    if (ctUp.includes('application/json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(text);
    }

    // Para HTML y cualquier otra cosa, forzamos HTML (evita headers que “rompen”)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(text);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).send('Error interno en el proxy: ' + (err?.message || String(err)));
  }
};

