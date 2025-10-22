// /api/index.js  — Vercel Serverless Function (CommonJS)
module.exports = async function handler(req, res) {
  try {
    // Tu Web App de Apps Script (debe terminar en /exec)
    const APP_URL = 'https://script.google.com/macros/s/AKfycbylpo_b35stQ9XsbSUxcUA-4Log6moe8WvdCotaQX1NPB7n-XU6zAv9Kafr5vqmsa8M/exec';

    // Preflight CORS (por si algún cliente hace OPTIONS)
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') return res.status(204).end();

    // Construir init y body solo cuando corresponde
    const init = {
      method: req.method,
      headers: {
        'user-agent': 'vercel-proxy'
      }
    };

    if (!['GET', 'HEAD'].includes(req.method)) {
      // Solo enviamos Content-Type si hay body
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
      const ct = req.headers['content-type'] || 'application/json';
      init.headers['content-type'] = ct;
    }

    // Mantener querystring original
    const inUrl = new URL(req.url, `https://${req.headers.host}`);
    const outUrl = new URL(APP_URL);
    outUrl.search = inUrl.search; // copia ?a=1&b=2

    // Llamar al Apps Script
    const upstream = await fetch(outUrl.toString(), init);

    // Propagar headers útiles y status
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      // Evita duplicar headers de control hop-by-hop si hiciera falta
      if (!['content-encoding', 'transfer-encoding'].includes(key)) {
        res.setHeader(key, value);
      }
    });

    const text = await upstream.text();
    res.send(text);
  } catch (err) {
    console.error('Error en el proxy:', err);
    res.status(500).send('Error interno en el proxy: ' + (err && err.message ? err.message : String(err)));
  }
};
