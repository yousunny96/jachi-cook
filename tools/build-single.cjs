// dist/를 파일 하나(sobok-prototype.html)로 묶는다. 실행: node tools/build-single.cjs [출력 경로]
// - styles.css와 스크립트를 인라인하고, 코드에서 실제로 참조하는 assets/만 data URI로 넣는다.
const fs = require('node:fs'), path = require('node:path');
const DIST = path.join(__dirname, '..', 'dist');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'sobok-prototype.html'));
const MIME = { '.png': 'image/png', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const read = f => fs.readFileSync(path.join(DIST, f), 'utf8');
const inlineAssets = text => text.replace(/assets\/([A-Za-z0-9._-]+\.(?:png|ttf|webp|jpg|svg))/g, (m, file) => {
  const p = path.join(DIST, 'assets', file);
  if (!fs.existsSync(p)) throw new Error('missing asset: ' + file);
  return `data:${MIME[path.extname(file)]};base64,${fs.readFileSync(p).toString('base64')}`;
});
let html = read('index.html');
const scripts = [...html.matchAll(/<script defer src="([^"]+)"><\/script>/g)].map(m => m[1]);
html = html.replace(/<script defer src="[^"]+"><\/script>/g, '');
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${inlineAssets(read('styles.css'))}\n</style>`);
const js = scripts.map(f => { const code = inlineAssets(read(f)); if (/<\/script/i.test(code)) throw new Error('</script> inside ' + f); return `<script>\n${code}\n</script>`; }).join('\n');
html = html.replace('</body>', () => `${js}\n</body>`);
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB, scripts: ${scripts.join(', ')})`);
