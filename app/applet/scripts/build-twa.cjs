const fs = require('fs');
const http = require('http');
const path = require('path');
const core = require('@bubblewrap/core');
const crypto = require('crypto');

async function main() {
  console.log('Starting local asset server for TWA generation...');
  const server = http.createServer((req, res) => {
    let filePath = path.join(process.cwd(), 'public', req.url);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'dist', req.url);
    }
    if (fs.existsSync(filePath)) {
      if (filePath.endsWith('.json')) res.writeHead(200, { 'Content-Type': 'application/json' });
      else if (filePath.endsWith('.png')) res.writeHead(200, { 'Content-Type': 'image/png' });
      else if (filePath.endsWith('.svg')) res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
      else res.writeHead(200);
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not found: ' + req.url);
    }
  });

  const port = 18999;
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  console.log(`Local server listening on http://127.0.0.1:${port}`);

  const manifestPath = path.join(process.cwd(), 'twa-manifest.json');
  const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Ensure startUrl is /rider.html
  manifestData.startUrl = '/rider.html';
  manifestData.iconUrl = `http://127.0.0.1:${port}/icons/icon-rider-512.png`;
  manifestData.maskableIconUrl = `http://127.0.0.1:${port}/icons/icon-rider-512.png`;
  manifestData.webManifestUrl = `http://127.0.0.1:${port}/manifest.rider.json`;
  manifestData.shortcuts = [];

  // If APP_HOST is provided via env (e.g. GitHub Actions), update host
  const appHost = process.env.APP_HOST;
  if (appHost) {
    console.log(`Using APP_HOST from environment: ${appHost}`);
    manifestData.host = appHost;
  }

  const twaManifest = new core.TwaManifest(manifestData);
  const twaGenerator = new core.TwaGenerator();

  console.log('Generating TWA Android project from rider.html PWA...');
  await twaGenerator.createTwaProject(process.cwd(), twaManifest);

  // Generate checksum file
  const manifestContents = fs.readFileSync(manifestPath);
  const checksum = crypto.createHash('sha256').update(manifestContents).digest('hex');
  fs.writeFileSync(path.join(process.cwd(), 'manifest-checksum.txt'), checksum);

  server.close();
  console.log('TWA project generated successfully and checksum saved.');
}

main().catch((err) => {
  console.error('Error building TWA project:', err);
  process.exit(1);
});
