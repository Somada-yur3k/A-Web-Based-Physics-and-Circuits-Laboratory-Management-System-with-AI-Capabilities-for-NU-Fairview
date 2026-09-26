const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'output/pdf');
const staging = path.join(root, 'tmp/pdfs/documentation-update');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(staging, { recursive: true });
const nodes = {}, routes = [], texts = [];
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function text(x, y, lines, size = 9.4, bold = false) {
  const rows = lines.split('\n');
  return `<text text-anchor="middle" font-size="${size}" font-weight="${bold ? 700 : 400}">${rows.map((row, i) => `<tspan x="${x}" y="${y + (i - (rows.length - 1) / 2) * size * 1.15 + size * .33}">${escape(row)}</tspan>`).join('')}</text>`;
}
function node(id, kind, x, y, label, w = 155, h = 34) {
  nodes[id] = { id, kind, x, y, w, h, label };
}
function action(id, x, y, label, w = 155, h = 34) { node(id, 'action', x, y, label, w, h); }
function decision(id, x, y, label, w = 104, h = 46) { node(id, 'decision', x, y, label, w, h); }
function merge(id, x, y) { node(id, 'merge', x, y, '', 14, 14); }
node('start', 'initial', 297.5, 94, '', 12, 12);
action('laboratory', 297.5, 132, 'Choose laboratory;\nidentify assigned class');
decision('request-type', 297.5, 190, 'Group or\nStudent Only?');
action('group', 145, 252, 'Select one or more students\nfrom the assigned class');
action('student-only', 445, 252, 'Select exactly one student\nfrom the assigned class');
merge('type-merge', 297.5, 299);
action('schedule-type', 297.5, 326, 'Choose Schedule Type', 155, 28);
merge('input-merge', 297.5, 356);
action('room-time', 297.5, 386, 'Select room, date and time;\ncheck schedule availability');
action('review', 297.5, 430, 'Add equipment / materials;\nreview request information');
decision('valid', 297.5, 483, 'Request\nvalid?');
action('correct', 100, 483, 'Correct request details');
action('save', 297.5, 532, 'Save valid request as Pending;\ncreate reservation hold', 185);
decision('on-schedule', 297.5, 586, 'On-Schedule?');
decision('faculty-available', 480, 586, 'Assigned Faculty\navailable?');
merge('faculty-merge', 145, 643);
action('faculty', 145, 683, 'Assigned Faculty reviews;\nApprove or Reject', 175, 40);
action('dean', 445, 683, 'Dean reviews directly;\nApprove or Reject', 175, 40);
merge('decision-merge', 297.5, 730);
action('final-status', 297.5, 772, 'Save final decision; notify Class Rep.\nApproved: allow laboratory processing\nRejected: release reservation hold', 270, 44);
node('end', 'final', 297.5, 812, '', 15, 15);
function point(id, side) {
  const n = nodes[id];
  return side === 'top' ? [n.x, n.y - n.h / 2] : side === 'bottom' ? [n.x, n.y + n.h / 2] : side === 'left' ? [n.x - n.w / 2, n.y] : [n.x + n.w / 2, n.y];
}
function edge(from, fromSide, to, toSide, bends = [], guard = '', labelPosition) {
  routes.push({ from, to, guard, points: [point(from, fromSide), ...bends, point(to, toSide)] });
  if (guard) texts.push(text(...labelPosition, guard, 8.5));
}
edge('start', 'bottom', 'laboratory', 'top');
edge('laboratory', 'bottom', 'request-type', 'top');
edge('request-type', 'left', 'group', 'top', [[145, 190]], 'Group', [182, 210]);
edge('request-type', 'right', 'student-only', 'top', [[445, 190]], 'Student Only', [393, 210]);
edge('group', 'bottom', 'type-merge', 'left', [[145, 299]]);
edge('student-only', 'bottom', 'type-merge', 'right', [[445, 299]]);
edge('type-merge', 'bottom', 'schedule-type', 'top');
edge('schedule-type', 'bottom', 'input-merge', 'top');
edge('input-merge', 'bottom', 'room-time', 'top');
edge('room-time', 'bottom', 'review', 'top');
edge('review', 'bottom', 'valid', 'top');
edge('valid', 'left', 'correct', 'right', [], 'No', [210, 471]);
edge('correct', 'left', 'input-merge', 'left', [[16, 483], [16, 356]]);
edge('valid', 'bottom', 'save', 'top', [], 'Yes', [315, 512]);
edge('save', 'bottom', 'on-schedule', 'top');
edge('on-schedule', 'left', 'faculty-merge', 'top', [[145, 586]], 'On-Schedule', [190, 574]);
edge('on-schedule', 'right', 'faculty-available', 'left', [], 'Out-of-Schedule', [389, 574]);
edge('faculty-available', 'bottom', 'faculty-merge', 'right', [[480, 643]], 'Available', [370, 632]);
edge('faculty-available', 'right', 'dean', 'top', [[565, 586], [565, 650], [445, 650]], 'Unavailable', [522, 618]);
edge('faculty-merge', 'bottom', 'faculty', 'top');
edge('faculty', 'bottom', 'decision-merge', 'left', [[145, 730]]);
edge('dean', 'bottom', 'decision-merge', 'right', [[445, 730]]);
edge('decision-merge', 'bottom', 'final-status', 'top');
edge('final-status', 'bottom', 'end', 'top');

// Validate connected alternatives and reject detached or intersecting paths.
for (const id of Object.keys(nodes)) {
  const n = nodes[id], incoming = routes.filter(r => r.to === id), outgoing = routes.filter(r => r.from === id);
  assert(n.x - n.w / 2 >= 15 && n.x + n.w / 2 <= 580 && n.y - n.h / 2 >= 85 && n.y + n.h / 2 <= 821);
  if (n.kind === 'action') { assert.equal(incoming.length, 1); assert.equal(outgoing.length, 1); }
  if (n.kind === 'decision') { assert.equal(incoming.length, 1); assert.equal(outgoing.length, 2); assert(outgoing.every(r => r.guard)); }
  if (n.kind === 'merge') { assert.equal(incoming.length, 2); assert.equal(outgoing.length, 1); }
}
for (const r of routes) for (let i = 1; i < r.points.length; i++) {
  const a = r.points[i - 1], b = r.points[i];
  assert(a[0] === b[0] || a[1] === b[1], 'Only orthogonal control flow');
  for (const n of Object.values(nodes)) {
    if ([r.from, r.to].includes(n.id)) continue;
    const left = n.x - n.w / 2, right = n.x + n.w / 2, top = n.y - n.h / 2, bottom = n.y + n.h / 2;
    const crosses = a[0] === b[0] ? a[0] > left && a[0] < right && Math.max(a[1], b[1]) > top && Math.min(a[1], b[1]) < bottom : a[1] > top && a[1] < bottom && Math.max(a[0], b[0]) > left && Math.min(a[0], b[0]) < right;
    assert(!crosses, `${r.from} -> ${r.to} crosses ${n.id}`);
  }
}
function reachableFrom(start) {
  const seen = new Set([start]);
  for (let i = 0; i < Object.keys(nodes).length; i++) for (const r of routes) if (seen.has(r.from)) seen.add(r.to);
  return seen;
}
assert.equal(reachableFrom('start').size, Object.keys(nodes).length);
for (const id of Object.keys(nodes)) assert(reachableFrom(id).has('end'), `${id} cannot finish`);
assert.equal(routes.find(r => r.from === 'on-schedule' && r.guard === 'On-Schedule').to, 'faculty-merge');
assert.equal(routes.find(r => r.from === 'on-schedule' && r.guard === 'Out-of-Schedule').to, 'faculty-available');
assert.equal(routes.find(r => r.from === 'faculty-available' && r.guard === 'Available').to, 'faculty-merge');
assert.equal(routes.find(r => r.from === 'faculty-available' && r.guard === 'Unavailable').to, 'dean');
assert(!routes.some(r => r.from === 'faculty' && r.to === 'dean'), 'No Faculty-to-Dean escalation');

const paths = routes.map(r => `<path d="${r.points.map((p, i) => `${i ? 'L' : 'M'}${p.join(' ')}`).join(' ')}" fill="none" stroke="#111" stroke-width="1.05" marker-end="url(#arrow)" data-from="${r.from}" data-to="${r.to}" data-guard="${escape(r.guard)}"/>`).join('');
const shapes = Object.values(nodes).map(n => {
  let shape;
  if (n.kind === 'initial') shape = `<circle cx="${n.x}" cy="${n.y}" r="6" fill="#111"/>`;
  else if (n.kind === 'final') shape = `<circle cx="${n.x}" cy="${n.y}" r="7.5" fill="white" stroke="#111" stroke-width="1.2"/><circle cx="${n.x}" cy="${n.y}" r="4.5" fill="#111"/>`;
  else if (n.kind === 'decision' || n.kind === 'merge') shape = `<path d="M${n.x} ${n.y - n.h / 2} L${n.x + n.w / 2} ${n.y} L${n.x} ${n.y + n.h / 2} L${n.x - n.w / 2} ${n.y} Z" fill="white" stroke="#111" stroke-width="1.05"/>`;
  else shape = `<rect x="${n.x - n.w / 2}" y="${n.y - n.h / 2}" width="${n.w}" height="${n.h}" rx="6" fill="white" stroke="#111" stroke-width="1.05"/>`;
  return `<g data-node="${n.id}" data-kind="${n.kind}">${shape}${n.label ? text(n.x, n.y, n.label, n.kind === 'decision' ? 9 : 9.4) : ''}</g>`;
}).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595 842" role="img" aria-labelledby="diagram-title diagram-description"><title id="diagram-title">Activity 2.0 - Class Representative Service Request</title><desc id="diagram-description">Group and Student Only converge before choosing either schedule variant. On-Schedule goes to assigned Faculty. Out-of-Schedule goes to available assigned Faculty, otherwise directly to Dean. The selected reviewer makes a final approval or rejection.</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 L9 5 L1 9 Z" fill="#111"/></marker><style>text{font-family:Arial,Helvetica,sans-serif;fill:#111} .guards text{paint-order:stroke;stroke:white;stroke-width:3px;stroke-linejoin:round}</style></defs><rect width="595" height="842" fill="white"/>${text(297.5, 28, 'Activity 2.0 - Class Representative Service Request', 14, true)}${text(297.5, 49, 'Connected detail: request type, schedule choice and final approval', 9.5)}${text(297.5, 67, 'Precondition: signed-in Class Representative; assigned class and eligible students.', 8.7)}${paths}${shapes}<g class="guards">${texts.join('')}</g>${text(297.5, 831, 'UML activity detail | A4 portrait | Group / Student Only applies to BOTH schedule variants', 7.7)}</svg>`;
fs.writeFileSync(path.join(output, 'classrep-request-activity-a4.svg'), svg);
fs.writeFileSync(path.join(output, 'classrep-request-activity-a4.json'), JSON.stringify({ nodes, routes }, null, 2));
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Class Representative Request - Connected A4 Activity Flow</title><style>*{box-sizing:border-box}body{margin:0;background:#eef2f7;font-family:Arial,sans-serif}.tools{max-width:794px;margin:20px auto;padding:0 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}a{color:#143b85}button{border:0;border-radius:6px;padding:10px 18px;background:#143b85;color:white;font:inherit;cursor:pointer}.paper{width:210mm;height:297mm;margin:0 auto;background:white;box-shadow:0 5px 24px #21324b20}.paper svg{display:block;width:100%;height:100%}.scroll{overflow-x:auto;padding:12px}@page{size:A4 portrait;margin:0}@media print{body{background:white}.tools{display:none}.scroll{overflow:visible;padding:0}.paper{box-shadow:none;margin:0;width:210mm;height:297mm;break-inside:avoid}}</style></head><body><nav class="tools" aria-label="Diagram tools"><button onclick="window.print()">Print / Save A4 PDF</button><a href="classrep-request-activity-a4.pdf" download>Download PDF</a><a href="../../System-Diagrams.html#activity-p2">Activity 2.0</a></nav><main class="scroll"><article class="paper">${svg}</article></main></body></html>`;
fs.writeFileSync(path.join(output, 'classrep-request-activity-a4.html'), html);

// Prepare reviewable copies. Publishing to the sibling Documentation folder needs workspace approval.
const docRoot = path.resolve(root, '../Documentation');
const renderPath = 'assets/system-diagrams/render.js';
let render = fs.readFileSync(path.join(docRoot, renderPath), 'utf8');
const anchor = '  reference.append(downloads);';
assert.equal(render.split(anchor).length, 2);
render = render.replace(anchor, anchor + `\n  if(processPage&&s.id==='p2'){\n   const detail=html('p','','Class Representative: connected request-type and approval flow on one A4 page. ');\n   const view=html('a','','Open connected A4 flow');view.href='assets/system-diagrams/classrep-request-activity-a4.html';\n   const pdf=html('a','','Download connected A4 PDF');pdf.href='assets/system-diagrams/classrep-request-activity-a4.pdf';pdf.download='classrep-request-activity-a4.pdf';\n   detail.append(view,document.createTextNode(' · '),pdf);reference.append(detail);\n  }`);
fs.writeFileSync(path.join(staging, 'render.js'), render);
let index = fs.readFileSync(path.join(docRoot, 'System-Diagrams.html'), 'utf8');
const toolbar = '<a href="Activity-Editor.html">Edit Activity Diagrams</a>';
assert(index.includes(toolbar));
index = index.replace(toolbar, toolbar + '<a href="assets/system-diagrams/classrep-request-activity-a4.html">Class Rep. connected A4 flow</a>');
fs.writeFileSync(path.join(staging, 'System-Diagrams.html'), index);
fs.writeFileSync(path.join(staging, 'CLASSREP-CONNECTED-A4.md'), '# Class Representative connected A4 activity detail\n\nActivity 2.0 now links a standalone A4 portrait flow from its reference panel and the System Diagrams toolbar. The existing five major-process pages, Faculty requester operations, and static supplement remain unchanged.\n\nGroup and Student Only are mutually exclusive alternatives and merge before Schedule Type. Group selects one or more assigned-class students; Student Only selects exactly one. Both modes can be On-Schedule or Out-of-Schedule. A valid final submission saves Pending and a hold. On-Schedule routes to the assigned class Faculty. Out-of-Schedule checks assigned Faculty availability: available routes to that Faculty, unavailable routes directly to Dean. The selected reviewer decides finally; no Faculty-to-Dean escalation. Rejection releases the hold; approval permits laboratory processing. Invalid requests return for correction without creating a hold.\n\nThis follows the approval rule explicitly quoted for this diagram request. It does not change the separate System demo UI, whose latest review screen allows an explicit Faculty/Dean choice for Out-of-Schedule.\n\nFiles: `assets/system-diagrams/classrep-request-activity-a4.{html,svg,pdf}`. The PDF is a one-page A4 portrait detail, not a replacement for the 12-page general supplement. No shared editor database or Google Docs changes are made.\n');

const server = http.createServer((req, res) => {
  const filename = path.join(output, path.basename(new URL(req.url, 'http://local').pathname));
  fs.readFile(filename, (error, data) => {
    if (error) return res.writeHead(404).end();
    res.setHeader('Content-Type', filename.endsWith('.html') ? 'text/html' : 'image/svg+xml');
    res.end(data);
  });
});
(async () => {
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 850, height: 1200 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/classrep-request-activity-a4.html`);
    assert.equal(await page.locator('[data-node]').count(), Object.keys(nodes).length);
    await page.locator('.paper').screenshot({ path: path.join(root, 'tmp/pdfs/classrep-request-activity-a4-preview.png') });
    await page.pdf({ path: path.join(output, 'classrep-request-activity-a4.pdf'), preferCSSPageSize: true, printBackground: true });
    const pdf = fs.readFileSync(path.join(output, 'classrep-request-activity-a4.pdf')).toString('latin1');
    assert.equal((pdf.match(/\/Type\s*\/Page\b/g) || []).length, 1, 'Exactly one PDF page');
    const media = pdf.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
    assert(media && Math.abs(Number(media[1]) - 595.28) < 1 && Math.abs(Number(media[2]) - 841.89) < 1, 'A4 portrait dimensions');
    console.log(`Created connected A4 flow: ${Object.keys(nodes).length} nodes, ${routes.length} attached routes; one A4 portrait PDF page. Documentation updates staged for publication.`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
