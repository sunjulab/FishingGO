
const fs = require('fs');
let mypage = fs.readFileSync('src/pages/MyPage.jsx', 'utf8');
mypage = mypage.replace('{(() => { const Icon = s.icon; return <Icon size={11} color={s.color} fill={s.color} />; })()}', '{/* eslint-disable-next-line react-hooks/refs */}\n                   {(() => { const Icon = s.icon; return <Icon size={11} color={s.color} fill={s.color} />; })()}');
mypage = mypage.replace('{(() => { const Icon = n.icon; return <Icon size={18} color=\\'#8E8E93\\' />; })()}', '{/* eslint-disable-next-line react-hooks/refs */}\n                                  {(() => { const Icon = n.icon; return <Icon size={18} color=\\'#8E8E93\\' />; })()}');
fs.writeFileSync('src/pages/MyPage.jsx', mypage);
console.log('done');

