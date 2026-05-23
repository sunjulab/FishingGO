const fs = require('fs');
const path = require('path');
const root = process.cwd();

const files = [
  'src/pages/MyPage.jsx',
  'src/pages/DashboardView.jsx',
  'src/pages/Channel.jsx',
  'src/pages/Shop.jsx',
  'src/pages/CatchRankingPage.jsx',
  'src/pages/CommunityTab.jsx',
  'src/pages/PostDetail.jsx',
  'src/pages/MediaTab.jsx',
  'src/pages/CrewChat.jsx',
  'src/pages/CatchDetail.jsx',
  'src/pages/ContestPage.jsx',
  'src/pages/WritePost.jsx',
  'src/pages/CatchUploadPage.jsx',
  'src/pages/UserProfile.jsx',
  'src/components/FishingPointBottomSheet.jsx',
  'src/components/AdUnit.jsx',
  'src/components/SkeletonCard.jsx',
  'src/components/UpgradeModal.jsx',
  'src/components/CsInquirySection.jsx',
  'src/components/AnnouncementPopup.jsx',
];

const rep = [
  // 카드 배경
  [/backgroundColor:\s*['"]#fff['"]/g,      "backgroundColor: T.card"],
  [/backgroundColor:\s*['"]#ffffff['"]/g,   "backgroundColor: T.card"],
  [/backgroundColor:\s*['"]#FFFFFF['"]/g,   "backgroundColor: T.card"],
  [/background:\s*['"]#fff['"]/g,           "background: T.card"],
  // 서브 카드 / 입력
  [/backgroundColor:\s*['"]#F2F2F7['"]/g,   "backgroundColor: T.cardSub"],
  [/background:\s*['"]#F2F2F7['"]/g,        "background: T.cardSub"],
  [/backgroundColor:\s*['"]#F8F9FC['"]/g,   "backgroundColor: T.cardSub"],
  [/background:\s*['"]#F8F9FC['"]/g,        "background: T.cardSub"],
  [/backgroundColor:\s*['"]#F8F9FA['"]/g,   "backgroundColor: T.cardSub"],
  [/background:\s*['"]#F8F9FA['"]/g,        "background: T.cardSub"],
  // 본문 텍스트
  [/color:\s*['"]#1c1c1e['"]/g,             "color: T.text"],
  [/color:\s*['"]#1C1C1E['"]/g,             "color: T.text"],
  [/color:\s*['"]#1A1A2E['"]/g,             "color: T.text"],
  // 보조 텍스트
  [/color:\s*['"]#8E8E93['"]/g,             "color: T.textSub"],
  [/color:\s*['"]#888['"]/g,                "color: T.textSub"],
  [/color:\s*['"]#555['"]/g,                "color: T.textSub"],
  [/color:\s*['"]#666['"]/g,                "color: T.textSub"],
  // 연한 텍스트
  [/color:\s*['"]#C7C7CC['"]/g,             "color: T.textLight"],
  [/color:\s*['"]#AEAEB2['"]/g,             "color: T.textLight"],
  [/color:\s*['"]#aaa['"]/g,                "color: T.textLight"],
  [/color:\s*['"]#AAB0BE['"]/g,             "color: T.textLight"],
  // 구분선
  [/borderBottom:\s*['"]1px solid #F8F9FA['"]/g,  "borderBottom: `1px solid ${T.border}`"],
  [/borderTop:\s*['"]1px solid #F8F9FA['"]/g,     "borderTop: `1px solid ${T.border}`"],
  [/border:\s*['"]1\.5px solid #F2F2F7['"]/g,     "border: `1.5px solid ${T.border}`"],
  [/border:\s*['"]1px solid #F2F2F7['"]/g,        "border: `1px solid ${T.border}`"],
  [/borderColor:\s*['"]#F2F2F7['"]/g,             "borderColor: T.border"],
  [/border:\s*['"]1\.5px solid #E5E5EA['"]/g,     "border: `1.5px solid ${T.borderMid}`"],
  [/border:\s*['"]2px solid #E5E5EA['"]/g,        "border: `2px solid ${T.borderMid}`"],
  [/border:\s*['"]1px solid #E5E5EA['"]/g,        "border: `1px solid ${T.borderMid}`"],
  [/borderColor:\s*['"]#E5E5EA['"]/g,             "borderColor: T.borderMid"],
  // 딤/오버레이
  [/background:\s*['"]rgba\(0,0,0,0\.5\)['"]/g,   "background: T.overlay"],
  [/background:\s*['"]rgba\(0,0,0,0\.45\)['"]/g,  "background: T.overlay"],
  [/background:\s*['"]rgba\(0,0,0,0\.6\)['"]/g,   "background: T.overlay"],
];

let total = 0;
files.forEach(rel => {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) { console.log('SKIP:' + rel); return; }
  let c = fs.readFileSync(fp, 'utf8');
  let changed = false;
  rep.forEach(([p, r]) => {
    const b = c;
    c = c.replace(p, r);
    if (c !== b) changed = true;
  });
  if (changed) {
    fs.writeFileSync(fp, c, 'utf8');
    console.log('OK:' + rel);
    total++;
  } else {
    console.log('NO_CHANGE:' + rel);
  }
});
console.log('\nDone. Changed files: ' + total);
