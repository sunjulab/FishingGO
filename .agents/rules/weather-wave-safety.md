---
description: 기상(파고) 데이터 정밀도 원칙 - 내항/방파제 지형 특성을 고려한 OpenMeteo 핀포인트 파고 최우선 적용 규칙 (수정됨)
---

# 🛡️ Weather Wave Precision Guardian (기상 파고 정밀도 에이전트 규칙)

## 🚨 핵심 원칙 (Core Principle)
낚시GO 서버(`server/index.js`의 `/api/weather/precision` 등 기상 데이터 병합 로직)를 수정할 때, **기상청(KMA) 먼바다 부표 파고와 OpenMeteo 핀포인트 파고를 `Math.max()` 등으로 묶어서 보수적으로 덮어쓰지 마십시오.** 무조건 **OpenMeteo의 핀포인트 예측 파고를 최우선 진실(Source of Truth)**로 사용해야 합니다.

## 📝 상세 지침 (Detailed Instructions)
1. **문제 배경 (과거의 실패 사례):** 
   과거에 "안전 제일"을 명목으로 기상청 해양 부표(외해 관측, 예: 2.1m)와 OpenMeteo(내항/방파제 예측, 예: 0.7m) 중 더 높은 값(`Math.max`)을 적용하는 룰이 있었습니다. 하지만 낚시 포인트는 대부분 방파제나 만(Bay) 내부에 위치하여 파도가 차단되므로, **먼바다 부표 데이터를 끌어다 쓰면 낚시가 불가능하다는 거짓 경보(False Alarm)가 발생**하여 사용자 신뢰도가 하락했습니다.
2. **OpenMeteo 핀포인트 데이터 최우선:**
   GPS 위경도가 제공되는 정밀 기상 API에서는 **반드시 OpenMeteo의 지형 반영 파고(`ptWeather.wave`)를 그대로 사용**해야 합니다. KMA 부표 데이터는 단지 참고용(outerSeaWave)으로만 남겨둘 수 있습니다.
3. **코드 검증 필수 항목:**
   ```javascript
   // ❌ 절대 금지 (외해 부표 데이터로 무조건 덮어쓰기 또는 Math.max 사용)
   if (omWave > currentWave) d.wave = ptWeather.wave; else d.wave = currentWave; // (금지)

   // ✅ 올바른 로직 (핀포인트 예측 최우선)
   d.wave = ptWeather.wave;
   
   // (선택 사항) 외해 파도가 1m 이상 더 높을 경우 참고용 너울 데이터로만 보존
   if (currentWave > parseFloat(ptWeather.wave?.coastal || 0) + 1.0) {
     d.wave.outerSeaWave = currentWave;
   }
   ```
4. **자동 복구 트리거:**
   만약 누군가 기상 로직을 수정하다가 과거처럼 `Math.max`를 부활시키거나 OpenMeteo 핀포인트 데이터를 KMA 먼바다 부표로 덮어쓰려 한다면, 이 가이드라인에 따라 즉시 코드를 **OpenMeteo 최우선 로직으로 자동 복구(Self-Healing)**하고 사용자에게 보고하십시오.
