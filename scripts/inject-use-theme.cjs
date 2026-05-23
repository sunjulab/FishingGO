/**
 * inject-use-theme.cjs
 * 각 파일에 useTheme import + const T = useTheme() 자동 주입
 */
const fs = require('fs');
const path = require('path');
const root = process.cwd();

// [파일경로, import상대경로, T를 삽입할 기준 훅 패턴]
const targets = [
  { file: 'src/pages/DashboardView.jsx', importPath: '../hooks/useTheme', anchor: 'const navigate = useNavigate()' },
  { file: 'src/pages/Channel.jsx',        importPath: '../hooks/useTheme', anchor: 'export default function Channel' },
  { file: 'src/pages/Shop.jsx',           importPath: '../hooks/useTheme', anchor: 'export default function Shop' },
  { file: 'src/pages/CatchRankingPage.jsx',importPath: '../hooks/useTheme', anchor: 'export default function CatchRankingPage' },
  { file: 'src/pages/CommunityTab.jsx',   importPath: '../hooks/useTheme', anchor: 'export default function CommunityTab' },
  { file: 'src/pages/PostDetail.jsx',     importPath: '../hooks/useTheme', anchor: 'export default function PostDetail' },
  { file: 'src/pages/MediaTab.jsx',       importPath: '../hooks/useTheme', anchor: 'export default function MediaTab' },
  { file: 'src/pages/CrewChat.jsx',       importPath: '../hooks/useTheme', anchor: 'export default function CrewChat' },
  { file: 'src/pages/CatchDetail.jsx',    importPath: '../hooks/useTheme', anchor: 'export default function CatchDetail' },
  { file: 'src/pages/ContestPage.jsx',    importPath: '../hooks/useTheme', anchor: 'export default function ContestPage' },
  { file: 'src/pages/WritePost.jsx',      importPath: '../hooks/useTheme', anchor: 'export default function WritePost' },
  { file: 'src/pages/UserProfile.jsx',    importPath: '../hooks/useTheme', anchor: 'export default function UserProfile' },
  { file: 'src/components/FishingPointBottomSheet.jsx', importPath: '../hooks/useTheme', anchor: 'export default function FishingPointBottomSheet' },
  { file: 'src/components/SkeletonCard.jsx',  importPath: '../hooks/useTheme', anchor: 'export default function SkeletonCard' },
  { file: 'src/components/CsInquirySection.jsx', importPath: '../hooks/useTheme', anchor: 'export default function CsInquirySection' },
  { file: 'src/components/AnnouncementPopup.jsx', importPath: '../hooks/useTheme', anchor: 'export default function AnnouncementPopup' },
];

const importLine = (p) => `import { useTheme } from '${p}';`;
const tLine = '  const T = useTheme(); // ✅ DARK-MODE';

let ok = 0;
targets.forEach(({ file, importPath, anchor }) => {
  const fp = path.join(root, file);
  if (!fs.existsSync(fp)) { console.log('SKIP:' + file); return; }
  let c = fs.readFileSync(fp, 'utf8');

  // 이미 import 있으면 skip
  if (c.includes("from '../hooks/useTheme'") || c.includes('from "../hooks/useTheme"')) {
    console.log('ALREADY_HAS_IMPORT:' + file);
  } else {
    // 첫 번째 import 줄 찾아 바로 앞에 삽입
    const firstImportIdx = c.indexOf('import ');
    if (firstImportIdx === -1) { console.log('NO_IMPORT_FOUND:' + file); return; }
    c = c.slice(0, firstImportIdx) + importLine(importPath) + '\n' + c.slice(firstImportIdx);
    console.log('  + import added: ' + file);
  }

  // 이미 T = useTheme() 있으면 skip
  if (c.includes('const T = useTheme()')) {
    console.log('ALREADY_HAS_T:' + file);
  } else {
    // anchor 줄 찾아 그 다음 줄에 T 삽입
    const anchorIdx = c.indexOf(anchor);
    if (anchorIdx === -1) {
      // 대안: 함수 시작 후 첫 { 다음에 삽입
      console.log('  ANCHOR_NOT_FOUND for ' + file + ' — trying function {');
      const funcMatch = c.match(/export default function \w+[^{]*\{/);
      if (funcMatch) {
        const insertAt = c.indexOf(funcMatch[0]) + funcMatch[0].length;
        c = c.slice(0, insertAt) + '\n' + tLine + c.slice(insertAt);
        console.log('  + T added via function{: ' + file);
      }
    } else {
      // anchor 줄 끝 찾기
      const lineEnd = c.indexOf('\n', anchorIdx);
      c = c.slice(0, lineEnd) + '\n' + tLine + c.slice(lineEnd);
      console.log('  + T added: ' + file);
    }
  }

  fs.writeFileSync(fp, c, 'utf8');
  ok++;
});
console.log('\nDone. Processed: ' + ok);
