// Publish only the reviewed six-file update to the sibling Documentation folder.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const target = path.resolve(root, '../Documentation');
const staged = path.join(root, 'tmp/pdfs/documentation-update');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sources = ['assets/system-diagrams/render.js', 'System-Diagrams.html'];
const manifestFile = path.join(staged, 'original-hashes.json');
if (process.argv.includes('--prepare')) {
  fs.writeFileSync(manifestFile, JSON.stringify(Object.fromEntries(sources.map(file => [file, hash(path.join(target, file))])), null, 2));
  console.log('Original documentation hashes recorded; no documentation files changed.');
} else {
  const originals = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  for (const file of sources) assert.equal(hash(path.join(target, file)), originals[file], 'Documentation changed since preparation: ' + file);
  const files = [
    ['output/pdf/classrep-request-activity-a4.pdf', 'assets/system-diagrams/classrep-request-activity-a4.pdf'],
    ['output/pdf/classrep-request-activity-a4.svg', 'assets/system-diagrams/classrep-request-activity-a4.svg'],
    ['output/pdf/classrep-request-activity-a4.html', 'assets/system-diagrams/classrep-request-activity-a4.html'],
    ['tmp/pdfs/documentation-update/render.js', 'assets/system-diagrams/render.js'],
    ['tmp/pdfs/documentation-update/System-Diagrams.html', 'System-Diagrams.html'],
    ['tmp/pdfs/documentation-update/CLASSREP-CONNECTED-A4.md', 'integrations/system-diagrams/CLASSREP-CONNECTED-A4.md'],
  ];
  for (const [source, destination] of files) {
    const resolvedTarget = path.resolve(target, destination);
    assert(resolvedTarget.startsWith(target + path.sep));
    assert(fs.existsSync(path.join(root, source)), 'Missing staged output: ' + source);
    if (!sources.includes(destination) && fs.existsSync(resolvedTarget)) assert.equal(hash(resolvedTarget), hash(path.join(root, source)), 'Refusing to overwrite an existing different artifact: ' + destination);
  }
  const backup = path.join(staged, 'original-backups');
  fs.mkdirSync(backup, { recursive: true });
  for (const file of sources) fs.copyFileSync(path.join(target, file), path.join(backup, path.basename(file)));
  for (const [source, destination] of files) fs.copyFileSync(path.join(root, source), path.join(target, destination));
  console.log('Published reviewed A4 HTML/SVG/PDF and linked the detail flow from Activity 2.0 and the documentation toolbar. Original sources backed up in the System workspace.');
}
