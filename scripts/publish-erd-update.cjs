const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const workspace = path.resolve(__dirname, '..');
const job = path.join(workspace, 'tmp/pdfs/erd-update');
const manifest = JSON.parse(fs.readFileSync(path.join(job, 'manifest.json'), 'utf8'));
const intendedRoot = path.resolve(workspace, '../Documentation');
const targetRoot = fs.realpathSync(manifest.source);
const stageRoot = fs.realpathSync(manifest.stage);
assert.equal(targetRoot.toLowerCase(), intendedRoot.toLowerCase(), 'Publication stays inside the named Documentation folder');
assert(stageRoot.toLowerCase().startsWith((workspace + path.sep).toLowerCase()), 'Stage belongs to the writable workspace');
const hash = filename => crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const existsHash = filename => fs.existsSync(filename) ? hash(filename) : null;
function bounded(root, relative) {
  assert(!path.isAbsolute(relative) && !relative.split(/[\\/]/).includes('..'), 'Safe relative manifest path');
  const resolved = path.resolve(root, relative);
  assert(resolved.toLowerCase().startsWith((root + path.sep).toLowerCase()), 'Resolved path remains in its intended root');
  let parent = path.dirname(resolved);
  while (!fs.existsSync(parent)) parent = path.dirname(parent);
  const realParent = fs.realpathSync(parent).toLowerCase();
  assert(realParent === root.toLowerCase() || realParent.startsWith((root + path.sep).toLowerCase()), 'Existing parent does not redirect outside the target');
  if (fs.existsSync(resolved)) assert(fs.lstatSync(resolved).isFile(), 'Target is a regular file');
  return resolved;
}
assert.equal(new Set(manifest.files.map(entry => entry.file)).size, manifest.files.length);
const files = manifest.files.map(entry => {
  const source = bounded(stageRoot, entry.file);
  const target = bounded(targetRoot, entry.file);
  assert(fs.existsSync(source), 'Complete staged file: ' + entry.file);
  assert.equal(existsHash(target), entry.original, 'Original has not changed during review: ' + entry.file);
  return { ...entry, staged: hash(source), source, target };
});
const model = require(path.join(stageRoot, 'assets/erd/model.js'));
assert.equal(model.tables.length, 30);
assert.equal(model.tables.flatMap(table => table.fields.filter(field => field.ref)).length, 61);
const qa = JSON.parse(fs.readFileSync(path.join(job, 'rendered/pdf-qa.json'), 'utf8'));
assert.equal(qa.pages, 15);
const backupRoot = path.join(job, 'backup');
fs.mkdirSync(backupRoot, { recursive: true });
for (const entry of files) if (entry.original) {
  const backup = bounded(backupRoot, entry.file);
  if (fs.existsSync(backup)) assert.equal(hash(backup), entry.original, 'Existing backup matches the reviewed original');
  else { fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.copyFileSync(entry.target, backup); }
}
const plan = files.map(({file,original,staged}) => ({file,original,staged}));
const planFile = path.join(job, 'publication-plan.json');
if (process.argv.includes('--check')) {
  fs.writeFileSync(planFile, JSON.stringify({target:targetRoot,entities:30,relationships:61,pages:15,files:plan}, null, 2));
  console.log(`Ready to publish ${files.length} reviewed ERD files. Prior originals backed up inside System. Documentation is unchanged.`);
} else {
  assert(fs.existsSync(planFile), 'Prepare and review the publication plan first');
  assert.deepEqual(JSON.parse(fs.readFileSync(planFile, 'utf8')).files, plan, 'Staged publication matches the reviewed plan');
  for (const entry of files) { fs.mkdirSync(path.dirname(entry.target), { recursive: true }); fs.copyFileSync(entry.source, entry.target); }
  for (const entry of files) assert.equal(hash(entry.target), entry.staged, 'Published file matches reviewed file: ' + entry.file);
  fs.writeFileSync(path.join(job, 'published.json'), JSON.stringify({publishedAt:new Date().toISOString(),target:targetRoot,files:plan}, null, 2));
  console.log(`Published and verified ${files.length} ERD documentation files in ${targetRoot}. Backup: ${backupRoot}`);
}
