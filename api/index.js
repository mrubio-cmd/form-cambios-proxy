export default async function handler(req, res) {
  // ⬇️ Pega aquí tu URL pública del Apps Script (termina en /exec)
  const APP_URL = 'AKfycbw69hWYjh6TF4sHWGzz_f2kl5vDwwunvPtPcLQ8naz2OIPYWic0X8K64a1ZfCbD5Lt-';

  const inUrl = new URL(req.url, `https://${req.headers.host}`);
  const outUrl = new URL(APP_URL);
  outUrl.search = inUrl.search;

  const init = {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'] || undefined,
      'user-agent': req.headers['user-agent'] || 'vercel-proxy'
    },
    redirect: 'follow'
  };

  if (!['GET','HEAD'].includes(req.method)) {
    const buf = await buffer(req);
    init.body = buf;
  }

  const resp = await fetch(outUrl.toString(), init);

  for (const [k, v] of resp.headers) {
    if (!['content-security-policy'].includes(k.toLowerCase())) {
      res.setHeader(k, v);
    }
  }
  res.status(resp.status);
  const arr = await resp.arrayBuffer();
  res.send(Buffer.from(arr));
}

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
