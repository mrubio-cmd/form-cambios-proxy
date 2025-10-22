export default async function handler(req, res) {
  try {
    // URL de tu Apps Script Web App (termina en /exec)
    const APP_URL =
      'https://script.google.com/macros/s/AKfycbx0xPG3QeeYXhAN_KWR89gwZcEIAwhLVGbm9wk3SPvYzFTgOjDEwDguiWvc7tzH4FMQ/exec';

    // Clona el método y los headers
    const init = {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
        'user-agent': 'vercel-proxy',
      },
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

    // Realiza la petición al Apps Script
    const response = await fetch(outUrl.toString(), init);

    // Copia las cabeceras y estado de respuesta
    res.status(response.status);
    for (const [key, value] of response.headers) {
      res.setHeader(key, value);
    }

    const data = await response.text();
    res.send(data);
  } catch (err) {
    console.error('Error en el proxy:', err);
    res.status(500).send('Error interno en el proxy: ' + err.message);
  }
}
