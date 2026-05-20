/**
 * 낚시GO MongoDB 마이그레이션 스크립트
 * - GitHub Actions에서 배포 후 자동 실행
 * - 로컬에서도 실행 가능: node server/migrate.js
 * - 모든 마이그레이션은 멱등(idempotent) — 여러 번 실행해도 안전
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.log('⚠️  MONGO_URI 없음 → 인메모리 모드. 마이그레이션 스킵.');
  process.exit(0);
}

async function runMigrations() {
  console.log('🔌 MongoDB 연결 중...');
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });
  console.log('✅ 연결 성공\n');

  const db = mongoose.connection.db;
  let totalRan = 0;

  // ────────────────────────────────────────────────────────────
  // Migration 001: ChatMessage — senderEmoji/senderTitle 기본값 보정
  //   type 필드 없는 구버전 메시지에 'text' 기본값 추가
  // ────────────────────────────────────────────────────────────
  {
    const col = db.collection('chatmessages');
    const result = await col.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'text', senderEmoji: '', senderTitle: '', senderLevel: '' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[M001] ChatMessage type 기본값 보정: ${result.modifiedCount}건`);
      totalRan++;
    } else {
      console.log('[M001] ChatMessage type 보정: 이미 완료됨 (skip)');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Migration 002: User — tier 기본값 보정 (null → 'FREE')
  // ────────────────────────────────────────────────────────────
  {
    const col = db.collection('users');
    const result = await col.updateMany(
      { $or: [{ tier: null }, { tier: { $exists: false } }] },
      { $set: { tier: 'FREE' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[M002] User tier 기본값 보정: ${result.modifiedCount}건`);
      totalRan++;
    } else {
      console.log('[M002] User tier 보정: 이미 완료됨 (skip)');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Migration 003: 마스터 계정 tier 보장
  //   sunjulab.k / sunjulab.k@gmail.com → MASTER tier 강제
  // ────────────────────────────────────────────────────────────
  {
    const col = db.collection('users');
    const result = await col.updateMany(
      {
        $or: [{ email: 'sunjulab.k' }, { email: 'sunjulab.k@gmail.com' }],
        tier: { $ne: 'MASTER' }
      },
      { $set: { tier: 'MASTER' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[M003] 마스터 계정 tier 보장: ${result.modifiedCount}건`);
      totalRan++;
    } else {
      console.log('[M003] 마스터 tier 보장: 이미 완료됨 (skip)');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Migration 004: Post — likes 기본값 보정 (null → 0)
  // ────────────────────────────────────────────────────────────
  {
    const col = db.collection('posts');
    const result = await col.updateMany(
      { $or: [{ likes: null }, { likes: { $exists: false } }] },
      { $set: { likes: 0 } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[M004] Post likes 기본값 보정: ${result.modifiedCount}건`);
      totalRan++;
    } else {
      console.log('[M004] Post likes 보정: 이미 완료됨 (skip)');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Migration 005: Crew — memberList 필드 없는 경우 빈 배열로 초기화
  // ────────────────────────────────────────────────────────────
  {
    const col = db.collection('crews');
    const result = await col.updateMany(
      { memberList: { $exists: false } },
      { $set: { memberList: [] } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[M005] Crew memberList 초기화: ${result.modifiedCount}건`);
      totalRan++;
    } else {
      console.log('[M005] Crew memberList 초기화: 이미 완료됨 (skip)');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Migration 006: BusinessPost — isPinned 기본값 보정
  // ────────────────────────────────────────────────────────────
  {
    const col = db.collection('businessposts');
    const result = await col.updateMany(
      { isPinned: { $exists: false } },
      { $set: { isPinned: false } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[M006] BusinessPost isPinned 기본값: ${result.modifiedCount}건`);
      totalRan++;
    } else {
      console.log('[M006] BusinessPost isPinned 보정: 이미 완료됨 (skip)');
    }
  }

  // ────────────────────────────────────────────────────────────
  // Migration 007: 인덱스 보장 — 자주 조회되는 컬렉션
  // ────────────────────────────────────────────────────────────
  {
    // posts: author 인덱스
    await db.collection('posts').createIndex({ author: 1 }, { background: true }).catch(() => {});
    // posts: createdAt 인덱스 (최신순 정렬)
    await db.collection('posts').createIndex({ createdAt: -1 }, { background: true }).catch(() => {});
    // chatmessages: crewId + createdAt 복합 인덱스
    await db.collection('chatmessages').createIndex({ crewId: 1, createdAt: -1 }, { background: true }).catch(() => {});
    // users: email 유니크 인덱스
    await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true }).catch(() => {});
    console.log('[M007] 인덱스 보장 완료');
    totalRan++;
  }

  console.log('\n──────────────────────────────────────');
  console.log(`✅ 마이그레이션 완료 — 총 ${totalRan}개 작업 실행`);
  console.log('──────────────────────────────────────\n');
}

runMigrations()
  .then(() => {
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 마이그레이션 실패:', err.message);
    mongoose.connection.close();
    process.exit(1);
  });
