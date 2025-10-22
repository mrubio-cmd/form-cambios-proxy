export default async function handler(req, res) {
  try {
    // ✅ URL de tu Apps Script Web App (actualizada con el ID correcto)
    const APP_URL = 'https://script.google.com/macros/s/AKfycby565R9Wcromh0uNr5SBE39fV8aJdMkBCp0lLh2qMr86FMwdrhIGrnQIAgkCeRiB1mu/exec';

    // Clona método y headers
    const init = {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
        'user-agent': 'vercel-proxy'
      }
    };

    // Si no es GET o HEAD, incluye el cuerpo
    if (!['GET', 'HEAD'].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
    }

    // Construye la URL con querystring original
    const inUrl = new URL(req.url, `https://${req.headers.host}`);
    const outUrl = new URL(APP_URL);
    outUrl.search = inUrl.search;

    // 🔁 Petición al Apps Script
    const response = await fetch(outUrl.toString(), init);

    // Copia estado y cabeceras
    res.status(response.status);
    for (const [key, value] of response.headers) {
      res.setHeader(key, value);
    }

    // Envía el contenido tal cual
    const data = await response.text();
    res.send(data);
  } catch (err) {
    console.error('Error en el proxy:', err);
    res.status(500).send('Error interno en el proxy: ' + err.message);
  }
}


