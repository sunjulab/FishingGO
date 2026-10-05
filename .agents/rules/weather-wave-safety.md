---
description: 기상(파고) 데이터 안전망 - OpenMeteo와 KMA 부표 실측값 비교 및 보수적(최댓값) 적용 규칙
---

# 🛡️ Weather Wave Safety Guardian (기상 파고 안전망 에이전트 규칙)

## 🚨 핵심 원칙 (Core Principle)
낚시GO 서버(`server/index.js`의 `/api/weather/precision` 등 기상 데이터 병합 로직)를 수정할 때, **절대로 기상청(KMA) 해양 부표 실측 파고를 OpenMeteo의 예측 파고로 덮어쓰지(Overwrite) 마십시오.**

## 📝 상세 지침 (Detailed Instructions)
1. **문제 배경:** 
   OpenMeteo의 글로벌 해양 모델은 동해안 방파제나 복잡한 얕은 지형의 파고를 과소평가(예: 0.7m)하는 고질적인 한계가 있습니다. 반면, 현지 기상청(KMA) 해양 부표는 실제 높은 파도(예: 2.1m)를 관측합니다. 
2. **비교 및 최댓값 적용 (Math.max):**
   항상 캐시된 기상청 부표 파고(`d.wave.coastal`)와 OpenMeteo 예측 파고(`ptWeather.wave.coastal`)를 비교하여 **더 높은 값(위험한 값)을 우선 적용**해야 합니다.
3. **코드 검증 필수 항목:**
   ```javascript
   // ❌ 절대 금지 (맹목적 덮어쓰기)
   d.wave = ptWeather.wave; 

   // ✅ 올바른 로직 (안전 제일, 최댓값 유지)
   const currentWave = d.wave?.coastal ? parseFloat(d.wave.coastal) : 0;
   const omWave = ptWeather.wave?.coastal ? parseFloat(ptWeather.wave.coastal) : 0;
   if (!d.wave || omWave > currentWave) {
     d.wave = ptWeather.wave;
     d._sources.wave = 'OPENMETEO_POINT';
   } else {
     d._sources.wave = d._sources.wave || 'KMA_BUOY';
   }
   ```
4. **자동 복구 트리거:**
   만약 누군가 기상 로직을 수정하다가 위와 같은 안전망 로직(최댓값 비교)을 삭제하거나 훼손한 것을 발견했다면, 즉시 이 가이드라인에 따라 코드를 **자동 복구(Self-Healing)**하고 사용자에게 보고하십시오.
