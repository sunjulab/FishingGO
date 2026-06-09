// fix_r3.cjs - Round 3 Security Fixes
const fs = require('fs');
const { execSync } = require('child_process');
const FILE = 'server/index.js';

function check() {
  try { execSync(`node --check ${FILE}`, { stdio: 'pipe' }); return true; }
  catch (e) { console.error('  Syntax error:', e.stderr?.toString().slice(0, 300)); return false; }
}

function apply(desc, from, to) {
  const raw = fs.readFileSync(FILE, 'utf8');
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.includes(from)) {
    console.log('⚠️  SKIP (not found):', desc);
    return false;
  }
  const patched = normalized.replace(from, to);
  const withCRLF = patched.replace(/\r?\n/g, '\r\n');
  fs.writeFileSync(FILE, withCRLF, 'utf8');
  if (check()) { console.log('✅ OK:', desc); return true; }
  fs.writeFileSync(FILE, raw, 'utf8');
  console.log('❌ FAIL (syntax):', desc);
  return false;
}

// ─── Fix 1: /api/community/search q 길이 제한 + HPP + limit 범위 ─────────────
const searchFrom = `app.get('/api/community/search', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);`;

const searchTo = `app.get('/api/community/search', async (req, res) => {
  try {
    const rawQ = Array.isArray(req.query.q) ? req.query.q[0] : (req.query.q || ''); // ✅ FIX-SEARCH-HPP
    const q = rawQ.slice(0, 100); // ✅ FIX-SEARCH-MAXLEN-2: 검색어 최대 100자
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20)); // ✅ FIX-SEARCH-LIMIT: 최대 50개
    const category = Array.isArray(req.query.category) ? req.query.category[0] : (req.query.category || ''); // ✅ FIX-SEARCH-HPP
    const skip = (page - 1) * limit;`;

apply('SEARCH-HPP-LEN', searchFrom, searchTo);

// ─── Fix 2: community search에서 q.trim() 쓰는 부분도 수정 ─────────────────
// limit 파라미터가 이미 위에서 수정됨. parseInt(limit) → limit 로 변경
const searchLimitFrom = `          .skip(skip).limit(parseInt(limit)).lean(),
        Post.countDocuments(filter),
      ]);
    } else {
      // 인메모리 fallback
      const low = q.toLowerCase();
      const filtered = memPosts.filter(p =>
        p.content?.toLowerCase().includes(low) ||
        p.author?.toLowerCase().includes(low) ||
        p.category?.toLowerCase().includes(low)
      );
      total = filtered.length;
      results = filtered.slice(skip, skip + parseInt(limit));
    }
    res.json({ results, total, page: parseInt(page), hasMore: skip + results.length < total });`;

const searchLimitTo = `          .skip(skip).limit(limit).lean(),
        Post.countDocuments(filter),
      ]);
    } else {
      // 인메모리 fallback
      const low = q.toLowerCase();
      const filtered = memPosts.filter(p =>
        p.content?.toLowerCase().includes(low) ||
        p.author?.toLowerCase().includes(low) ||
        p.category?.toLowerCase().includes(low)
      );
      total = filtered.length;
      results = filtered.slice(skip, skip + limit);
    }
    res.json({ results, total, page, hasMore: skip + results.length < total });`;

apply('SEARCH-LIMIT-FIX', searchLimitFrom, searchLimitTo);

// ─── 최종 검증 ──────────────────────────────────────────────────────────────
console.log('\n─── 최종 문법 검사 ───');
if (check()) {
  console.log('✅ ALL DONE — node --check PASS');
} else {
  console.log('❌ SYNTAX ERROR — 롤백');
  execSync('git checkout HEAD -- server/index.js');
}

// 패치 확인
const finalContent = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
console.log('\n─── 패치 확인 ───');
console.log('FIX-SEARCH-HPP:', finalContent.includes('FIX-SEARCH-HPP'));
console.log('FIX-SEARCH-MAXLEN-2:', finalContent.includes('FIX-SEARCH-MAXLEN-2'));
console.log('FIX-SEARCH-LIMIT:', finalContent.includes('FIX-SEARCH-LIMIT'));
