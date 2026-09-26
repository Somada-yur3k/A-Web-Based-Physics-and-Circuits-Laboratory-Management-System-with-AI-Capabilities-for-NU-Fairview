const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const pdfjsRoot = process.env.PDFJS_ROOT;
if (!pdfjsRoot) throw Error('Set PDFJS_ROOT to an installed pdfjs-dist directory.');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local');
  if (url.pathname === '/') return res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><html><body style="margin:0"><canvas id="page"></canvas></body></html>');
  const file = url.pathname === '/flow.pdf' ? path.join(root, 'output/pdf/classrep-request-activity-a4.pdf') : path.resolve(pdfjsRoot, '.' + url.pathname.replace(/^\/pdfjs/, ''));
  if (url.pathname !== '/flow.pdf' && !file.startsWith(path.resolve(pdfjsRoot) + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, bytes) => {
    if (error) return res.writeHead(404).end();
    res.setHeader('Content-Type', file.endsWith('.mjs') ? 'text/javascript' : file.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    res.end(bytes);
  });
});
(async () => {
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 1650 } });
    await page.goto('http://127.0.0.1:' + server.address().port);
    const result = await page.evaluate(async () => {
      const pdfjs = await import('/pdfjs/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';
      const pdf = await pdfjs.getDocument({ url: '/flow.pdf', standardFontDataUrl: '/pdfjs/standard_fonts/' }).promise;
      const first = await pdf.getPage(1), view = first.getViewport({ scale: 1.8 });
      const canvas = document.getElementById('page');
      canvas.width = Math.ceil(view.width); canvas.height = Math.ceil(view.height);
      await first.render({ canvasContext: canvas.getContext('2d'), viewport: view }).promise;
      const items = (await first.getTextContent()).items;
      return { pages: pdf.numPages, dimensions: first.view, text: items.map(item => item.str).join(' '), items: items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], width: item.width })) };
    });
    assert.equal(result.pages, 1);
    assert(Math.abs(result.dimensions[2] - 595.28) < 1 && Math.abs(result.dimensions[3] - 841.89) < 1);
    for (const term of ['Group', 'Student Only', 'exactly one student', 'On-Schedule', 'Out-of-Schedule', 'Available', 'Unavailable', 'Assigned Faculty reviews', 'Dean reviews directly', 'Rejected: release reservation hold']) assert(result.text.includes(term), 'Missing PDF text: ' + term);
    for (const item of result.items) assert(item.x >= 0 && item.x + item.width <= 596 && item.y >= 0 && item.y <= 843, 'PDF text outside A4: ' + item.text);
    await page.locator('#page').screenshot({ path: path.join(root, 'tmp/pdfs/classrep-request-activity-a4-rendered.png') });
    console.log('Actual PDF verified: one A4 portrait page, connected rule labels, text within page bounds, and rendered PNG ready for visual review.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
