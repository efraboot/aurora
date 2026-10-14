import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { stat, realpath } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const GAME_ID = 'aurora-el-camino-del-guerrero';
const directory = path.dirname(fileURLToPath(import.meta.url));
const assetRoot = path.resolve(directory, 'dist');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

function parseOptions(args) {
  const options = { port: 4173, lan: false, open: false, selfCheck: false, help: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--lan') options.lan = true;
    else if (arg === '--open') options.open = true;
    else if (arg === '--no-open') { /* applied after parsing, even if --open also appears */ }
    else if (arg === '--self-check') options.selfCheck = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--port') {
      const value = args[++i];
      if (!value || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535)
        throw new Error('--port necesita un numero entre 1 y 65535.');
      options.port = Number(value);
    } else throw new Error(`Opcion desconocida: ${arg}`);
  }
  if (args.includes('--no-open')) options.open = false;
  return options;
}

function withinRoot(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function resolveAsset(root, requestUrl) {
  // Do not let URL normalization silently remove a requested traversal.
  const pathname = decodeURIComponent(requestUrl.split('?')[0]);
  if (!pathname.startsWith('/') || /[\0\\:]/.test(pathname)) return null;
  if (pathname.split('/').includes('..')) return null;
  const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  return withinRoot(root, target) ? target : null;
}

function parseRange(header, size) {
  if (header === undefined) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || size === 0) return false;
  let start, end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return false;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return false;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}

function isAuroraServer(port) {
  return new Promise(resolve => {
    const request = http.request({ host: '127.0.0.1', port, path: '/', method: 'HEAD', timeout: 1500 }, response => {
      const matches = response.headers['x-aurora-local'] === 'true' && response.headers['x-aurora-game'] === GAME_ID;
      response.resume();
      resolve(matches);
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve(false));
    request.end();
  });
}

function openBrowser(url) {
  // Only INICIAR.cmd / explicit --open enables this. No external URLs are opened.
  const options = { stdio: 'ignore', detached: true, windowsHide: true };
  const child = process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', `start "" "${url}"`], options)
    : process.platform === 'darwin'
      ? spawn('open', [url], options)
      : spawn('xdg-open', [url], options);
  child.on('error', () => console.log(`Abre manualmente ${url}`));
  child.unref();
}

function selfCheck() {
  assert.equal(parseOptions([]).port, 4173);
  assert.equal(parseOptions(['--open', '--no-open', '--port', '4174']).open, false);
  assert.equal(parseOptions(['--lan', '--port', '4174']).port, 4174);
  assert.throws(() => parseOptions(['--port', '0']));
  assert.throws(() => parseOptions(['--port', '12x']));
  assert.throws(() => parseOptions(['--port', '65536']));
  assert.equal(resolveAsset(assetRoot, '/'), path.join(assetRoot, 'index.html'));
  assert.equal(resolveAsset(assetRoot, '/assets/audio/01.mp3?x=1'), path.join(assetRoot, 'assets', 'audio', '01.mp3'));
  assert.equal(resolveAsset(assetRoot, '/../LEEME.md'), null);
  assert.equal(resolveAsset(assetRoot, '/%2e%2e/LEEME.md'), null);
  assert.equal(resolveAsset(assetRoot, '/%5c..%5cLEEME.md'), null);
  assert.equal(resolveAsset(assetRoot, '/index.html:secret'), null);
  assert.equal(withinRoot(assetRoot, `${assetRoot}-outside`), false);
  assert.equal(parseRange(undefined, 100), null);
  assert.deepEqual(parseRange('bytes=0-9', 100), { start: 0, end: 9 });
  assert.deepEqual(parseRange('bytes=90-', 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange('bytes=-10', 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange('bytes=90-200', 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange('bytes=-200', 100), { start: 0, end: 99 });
  for (const range of ['bytes=100-', 'bytes=5-4', 'bytes=-0', 'bytes=-', 'bytes=0-2,4-6', 'other=0-1'])
    assert.equal(parseRange(range, 100), false);
  assert.equal(parseRange('bytes=0-', 0), false);
  console.log('Autopruebas correctas: opciones, rutas confinadas a dist y rangos de audio.');
}

async function start(options) {
  const realRoot = await realpath(assetRoot);
  await stat(path.join(realRoot, 'index.html'));
  const server = http.createServer(async (request, response) => {
    response.setHeader('X-Aurora-Local', 'true');
    response.setHeader('X-Aurora-Game', GAME_ID);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    let file;
    try { file = resolveAsset(realRoot, request.url || '/'); }
    catch { response.writeHead(400); response.end('Ruta invalida.'); return; }
    if (!file) { response.writeHead(403); response.end('Ruta no permitida.'); return; }
    try {
      const actualFile = await realpath(file);
      if (!withinRoot(realRoot, actualFile)) { response.writeHead(403); response.end(); return; }
      const details = await stat(actualFile);
      if (!details.isFile()) { response.writeHead(404); response.end(); return; }
      const range = parseRange(request.headers.range, details.size);
      if (range === false) {
        response.writeHead(416, { 'Content-Range': `bytes */${details.size}` }); response.end(); return;
      }
      response.setHeader('Content-Type', types[path.extname(actualFile).toLowerCase()] || 'application/octet-stream');
      response.setHeader('Accept-Ranges', 'bytes');
      response.setHeader('Cache-Control', 'no-cache');
      if (range) {
        response.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${details.size}`);
        response.setHeader('Content-Length', range.end - range.start + 1);
        response.writeHead(206);
      } else {
        response.setHeader('Content-Length', details.size);
        response.writeHead(200);
      }
      if (request.method === 'HEAD') { response.end(); return; }
      const stream = createReadStream(actualFile, range || undefined);
      stream.on('error', () => response.destroy());
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      if (!response.headersSent) response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500);
      response.end();
    }
  });
  const url = `http://127.0.0.1:${options.port}/`;
  server.on('error', async error => {
    if (error.code === 'EADDRINUSE') {
      if (await isAuroraServer(options.port)) {
        console.log(`AURORA ya esta abierto. Abre ${url}`);
        if (options.open) openBrowser(url);
      } else {
        console.log(`El puerto ${options.port} esta ocupado. Abre ${url} si ya corresponde a tu juego.`);
        console.log('Si corresponde a otra aplicacion, cierrala o usa --port 4174. No se detuvo ningun proceso.');
      }
      return;
    }
    console.error(`No se pudo iniciar AURORA: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(options.port, options.lan ? '0.0.0.0' : '127.0.0.1', async () => {
    console.log('\nAURORA - El Camino del Guerrero');
    console.log(`Juego local: ${url}`);
    console.log('Mantener esta ventana abierta. Ctrl+C o cerrar la ventana detiene el servidor.');
    console.log('El puerto 4173 conserva el mismo origen usado para guardar el avance.');
    if (options.lan) {
      console.log('\nCelular en la misma red Wi-Fi:');
      const addresses = [...new Set(Object.values(os.networkInterfaces()).flat().filter(entry => entry && !entry.internal && (entry.family === 'IPv4' || entry.family === 4)).map(entry => entry.address))];
      for (const address of addresses) console.log(`  http://${address}:${options.port}/`);
      if (!addresses.length) console.log('No se encontro una direccion IPv4 de la red local.');
      console.log('El servidor admite conexiones de la red local; no modifica el firewall ni el router.');
    }
    if (options.open && await isAuroraServer(options.port)) openBrowser(url);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
}

try {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) console.log('Uso: node iniciar-local.mjs [--open] [--no-open] [--port 4173] [--lan] [--self-check]\nINICIAR.cmd abre el juego por doble clic. --lan permite jugar en celular dentro de tu red local.');
  else if (options.selfCheck) selfCheck();
  else await start(options);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
