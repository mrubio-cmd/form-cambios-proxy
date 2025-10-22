// /api/index.js — Proxy con redirección directa al Apps Script
module.exports = async function handler(req, res) {
  try {
    // URL de tu Apps Script Web App (debe terminar en /exec)
    const APP_URL = 'https://script.google.com/macros/s/AKfycbylpo_b35stQ9XsbSUxcUA-4Log6moe8WvdCotaQX1NPB7n-XU6zAv9Kafr5vqmsa8M/exec';

    // Obtener la URL que llega al dominio (para mantener parámetros)
    const inUrl = new URL(req.url, `https://${req.headers.host}`);
    const outUrl = new URL(APP_URL);

    // Copiar querystring (por ejemplo ?id=123)
    outUrl.search = inUrl.search;

    // Redirigir al usuario al formulario real
    res.writeHead(302, {
      Location: outUrl.toString(),
      'Cache-Control': 'no-store'
    });
    res.end();
  } catch (err) {
    console.error('Error en la redirección:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Error interno al redirigir: ' + (err?.message || String(err)));
  }
};



