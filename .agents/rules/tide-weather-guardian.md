---
name: Tide & Weather Guardian
description: Enforces that KHOA Tide, Lunar phase, and KMA Weather logic remains intact.
trigger: always_on
---

# ?? 물때/날씨 로직 수호(Guardian) 규칙

이 프로젝트(낚시GO)의 핵심인 **조석(물때)**과 **기상(날씨)** 로직은 수많은 엣지 케이스를 극복하고 완벽하게 최적화된 상태입니다. 
앞으로 이 프로젝트를 다루는 모든 AI 에이전트는 아래 규칙을 엄격하게 준수해야 합니다.

## ?? 절대 변경 금지 (Do Not Modify)
1. **백엔드 조석 API (server/index.js의 /api/tide/obs)**
   - 반드시 KHOA API(\	ideFcstHghLw\)를 사용해야 합니다.
   - 관측소 맵핑 함수 \getNearestKhoaStation(lat, lng)\ 호출은 절대 삭제하면 안 됩니다.
   - 수학적 백업(Fallback) 로직의 \+372\ 분 보정값(offset)을 유지해야 합니다.
2. **프론트엔드 물때 계산 (src/constants/fishingData.js)**
   - 물때(N물, 사리/조금 등)는 무조건 천문학 모듈인 \Lunar.fromDate()\ (\lunar-javascript\)를 사용하여 정확한 음력 날짜를 기반으로 계산해야 합니다.
   - 단순한 나누기 연산(\% 29.53\)으로 롤백(Rollback)하는 것을 절대 금지합니다.
3. **날씨 풍속 계산 (server/index.js의 기상청 동네예보)**
   - 풍속 데이터는 해양관측(OpenMeteo) 대신 육상관측(KMA 동네예보 - \getDongnaeUltraSrtNcst\)을 우선 적용하는 덮어쓰기 로직이 유지되어야 합니다.

## ??? 의도치 않은 훼손 발생 시 복구 지침 (Self-Healing)
만약 다른 작업을 하다가 실수로 위 로직이 훼손되었거나, \update-version.cjs\ 배포 과정에서 감찰관 스크립트(\scripts/guardian-check.cjs\)에 의해 배포가 차단(Block)되었다면:
1. 즉시 \git restore server/index.js\ 또는 \git restore src/constants/fishingData.js\를 통해 코드를 원상 복구하십시오.
2. 복구 후 반드시 \
ode scripts/guardian-check.cjs\를 직접 실행하여 **Success: 21**이 뜨는지 확인한 뒤에 배포를 재개하십시오.

이 규정은 낚시GO의 데이터 신뢰도를 좌우하는 가장 중요한 사내 규정입니다.

