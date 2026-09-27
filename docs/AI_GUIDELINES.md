# 🎣 낚시GO AI 에이전트 및 개발자 가이드라인 (AI_GUIDELINES)

이 문서는 낚시GO 프로젝트를 수정하는 모든 AI 어시스턴트(Antigravity, Cursor, Copilot 등)와 개발자가 반드시 준수해야 하는 핵심 무결성 규칙입니다.

## 🚨 절대 수정 금지 구역 (Do Not Modify)

아래 명시된 핵심 해양/기상 로직은 바다타임 및 KMA 실측 데이터와 100% 동기화되어 있으므로, **다른 기능을 개발할 때 절대 이 부분을 수정하거나 삭제, 간소화하지 마십시오.**

1. **조석예보 (KHOA API) 프록시 로직**
   - **위치:** server/index.js 내부 /api/tide/obs 라우터
   - **핵심 요소:** pis.data.go.kr/1192136/tideFcstHghLw 엔드포인트 호출, getNearestKhoaStation() 매핑 함수, 수학적 Fallback 오프셋(+372) 코드.

2. **물때 달력 (Lunar Phase) 정밀 계산 로직**
   - **위치:** src/constants/fishingData.js 내부
   - **핵심 요소:** lunar-javascript 모듈을 통한 Lunar.fromDate() 호출 및 물때(1~15물) 계산 로직. 기존의 단순 나눗셈(% 29.53)으로 절대 롤백하지 말 것.

## ✅ 다른 기능 반영 시 원칙
- 위 2가지 핵심 로직 외의 다른 UI/UX, 백엔드 API, 커뮤니티 기능 등은 자유롭게 수정 및 반영해도 좋습니다.
- 단, server/index.js나 src/constants/fishingData.js 파일에 새로운 기능을 추가할 때는 **반드시 기존 조석/기상 로직 영역을 건드리지 않고, 안전한 영역(새로운 줄)에 코드를 삽입**해야 합니다.
