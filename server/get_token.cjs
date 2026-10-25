// ✅ SEC: 운영 JWT 비밀키가 하드코딩되어 있던 파일 — 키 제거됨 (2026-10-25)
// 관리자 테스트 토큰이 필요하면 환경변수 JWT_SECRET을 설정한 뒤 실행하세요. 생성된 토큰은 파일로 저장하지 마세요.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
if (!secret) { console.error('JWT_SECRET 환경변수가 없습니다.'); process.exit(1); }
const token = jwt.sign({ id: 'admin_id', email: 'sunjulab.k@gmail.com', name: 'Admin', role: 'admin', tier: 'MASTER' }, secret, { expiresIn: '1h' });
console.log(token);
