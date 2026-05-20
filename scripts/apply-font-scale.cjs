const fs = require('fs');
const path = require('path');

// 재귀적으로 jsx/js 파일 수집
function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      results = results.concat(walk(p));
    } else if (p.endsWith('.jsx') || p.endsWith('.js')) {
      results.push(p);
    }
  }
  return results;
}

const files = walk(path.join(__dirname, '..', 'src'));

// fontSize: '13px' 또는 fontSize: "13px" → fontSize: `calc(13px * var(--fs, 1))`
// 단, el.style.cssText 같은 CSS 문자열 안의 font-size는 camelCase(fontSize)가 아니라 kebab-case라 안전함
const REGEX = /fontSize:\s*(['"])([\d.]+)px\1/g;

let totalFiles = 0;
let totalReplacements = 0;

files.forEach(file => {
  const original = fs.readFileSync(file, 'utf8');
  let count = 0;
  const updated = original.replace(REGEX, (match, _quote, num) => {
    count++;
    return `fontSize: \`calc(${num}px * var(--fs, 1))\``;
  });

  if (count > 0) {
    fs.writeFileSync(file, updated, 'utf8');
    totalFiles++;
    totalReplacements += count;
    console.log(`[${count}] ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\nDone: ${totalReplacements} replacements across ${totalFiles} files.`);
