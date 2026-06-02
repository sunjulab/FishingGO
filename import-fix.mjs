// import-fix.mjs - Shop.jsx import만 정밀하게 수정
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/Shop.jsx';
const src = readFileSync(file, 'utf8');

// 1. 첫 3줄을 교체 (import 추가)
const oldImports = `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X } from 'lucide-react';
import apiClient from '../api/index';`;

const newImports = `import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, ShoppingBag, Search, SlidersHorizontal, X, Plus } from 'lucide-react';
import apiClient from '../api/index';
import { useUserStore, ADMIN_ID, ADMIN_EMAIL } from '../store/useUserStore';`;

if (!src.includes(oldImports)) {
  console.error('❌ import 블록을 찾을 수 없음');
  console.log('현재 첫 4줄:');
  src.split('\n').slice(0, 4).forEach((l, i) => console.log(`${i+1}: ${JSON.stringify(l)}`));
  process.exit(1);
}

const result = src.replace(oldImports, newImports);
writeFileSync(file, result, 'utf8');
console.log('✅ import 수정 완료');
console.log('첫 5줄:');
result.split('\n').slice(0, 5).forEach((l, i) => console.log(`${i+1}: ${l}`));
