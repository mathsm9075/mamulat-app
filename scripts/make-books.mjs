// Builds public/books/books.json from the PDFs in public/books/sunnah and public/books/silsilah.
// Optional Urdu titles: book-titles.json in the project root, e.g. {"sunnah-1.pdf": "شمائل ترمذی"}.
import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'public/books';
let titles = {};
if (existsSync('book-titles.json')) {
  try { titles = JSON.parse(readFileSync('book-titles.json', 'utf8')); }
  catch (e) { console.error('book-titles.json is not valid JSON:', e.message); process.exit(1); }
}
const out = {};
for (const dir of ['sunnah', 'silsilah']) {
  const path = join(root, dir);
  mkdirSync(path, { recursive: true });
  out[dir] = readdirSync(path)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(file => ({
      file, dir,
      size: statSync(join(path, file)).size,
      title: titles[file] || file.replace(/\.pdf$/i, '').replace(/^(sunnah|silsilah)[-_ .]*/i, '').replace(/[-_.]+/g, ' ').trim() || file,
    }));
  console.log(`${dir}: ${out[dir].length} book(s)`);
}
writeFileSync(join(root, 'books.json'), JSON.stringify(out, null, 1));
