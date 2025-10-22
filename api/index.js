// /api/index.js — Reverse proxy para Apps Script manteniendo TU dominio visible
// CommonJS para Vercel
const APP_URL = 'https://script.google.com/macros/s/AKfycbylpo_b35stQ9XsbSUxcUA-4Log6moe8WvdCotaQX1NPB7n-XU6zAv9Kafr5vqmsa8M/exec';

function buildTargetUrl(req) {
  const inUrl = new URL(req.url, `https://${req.headers.host}`);
  const outUrl = new URL(APP_URL);
  // Copiamos el querystring original (?token=..., etc.)
  outUrl.search = inUrl.search;
  return outUrl.toString();
}

function injectBase(html, baseHref) {
  // Si ya trae <base>, no duplicamos
  if (/<base\s/i.test(html)) return html;
  // Insertamos justo después de <head>
  return html.replace(/<head[^>]*>/i, match => `${match}\n<base href="${baseHref}">`);
}

module.exports = async function handler(req, res) {
  try {
    // CORS básico (por si lo llamas vía fetch desde otros orígenes)
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(204).end();

    const target = buildTargetUrl(req);

    // Construimos la request upstream
    const init = { method: req.method, headers: { 'user-agent': 'vercel-proxy' } };

    if (!['GET', 'HEAD'].includes(req.method)) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      init.body = Buffer.concat(chunks);
      const ct = req.headers['content-type'] || 'application/json';
      init.headers['content-type'] = ct;
    }

    const upstream = await fetch(target, init);

    // Leemos el cuerpo como texto para poder inyectar <base> cuando sea HTML
    const text = await upstream.text();
    const ctUp = (upstream.headers.get('content-type') || '').toLowerCase();

    // Pasamos el status del upstream
    res.status(upstream.status);

    if (ctUp.includes('application/json')) {
      // Devolvemos JSON tal cual
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(text);
    }

    // Para HTML u otros tipos de texto: inyectamos <base> apuntando al Apps Script
    // Esto hace que TODOS los recursos relativos (CSS/JS/img/form actions) funcionen
    const html = injectBase(text, APP_URL);

    // Forzamos content-type HTML (evitamos headers de Google que bloquean)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    return res.send(html);
  } catch (err) {
    console.error('Proxy failed:', err);
    return res
      .status(500)
      .send('Error interno en el proxy: ' + (err?.message || String(err)));
  }
};


