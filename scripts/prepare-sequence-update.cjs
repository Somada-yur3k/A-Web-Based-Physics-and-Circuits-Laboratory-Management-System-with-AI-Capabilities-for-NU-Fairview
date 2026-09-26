const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const workspace = path.resolve(__dirname, '..');
const source = path.resolve(workspace, '../Documentation');
const stage = path.join(workspace, 'tmp/pdfs/sequence-update');
const inputs = [
  'assets/system-diagrams/sequence-models.js', 'assets/system-diagrams/whole-sequence.js',
  'assets/system-diagrams/SEQUENCE-PLAN.md', 'assets/system-diagrams/TRACEABILITY.md',
  'integrations/system-diagrams/check-sequences.cjs', 'integrations/system-diagrams/check-whole-sequence.cjs',
  'Docs.html', 'Sequence-Overview.html', 'System-Diagrams.html',
  'assets/figures-v2/dfd-level1/dfd-level1-model.json', 'assets/figures-v2/dfd-level2-compact/dfd-level2-model.json',
];
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const originals = {};
for (const file of inputs) {
  const target = path.resolve(stage, file);
  assert(target.startsWith(stage + path.sep));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(source, file), target);
  originals[file] = hash(path.join(source, file));
}
fs.writeFileSync(path.join(stage, 'original-hashes.json'), JSON.stringify(originals, null, 2));
console.log('Copied sequence sources and checks into the System workspace; original hashes recorded.');
