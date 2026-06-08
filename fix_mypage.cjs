const fs = require('fs');
let c = fs.readFileSync('src/pages/MyPage.jsx', 'utf8');

// BUG-MY03 FIX 1: handleOpenBizPhone
const before1 = "/api/business/my-phone');\r\n      setBizPhone(res.data);";
const after1 = "/api/business/my-phone');\r\n      if (!isMountedRef.current) return; // BUG-MY03 FIX\r\n      setBizPhone(res.data);";
if (c.includes(before1)) { c = c.replace(before1, after1); console.log('BizPhone fix applied'); }
else { console.log('BizPhone: PATTERN NOT FOUND'); }

// BUG-MY03 FIX 2: handleOpenBizPosts
const before2 = "/api/business/my-posts');\r\n      setMyBizPosts(";
const after2 = "/api/business/my-posts');\r\n      if (!isMountedRef.current) return; // BUG-MY03 FIX\r\n      setMyBizPosts(";
if (c.includes(before2)) { c = c.replace(before2, after2); console.log('BizPosts fix applied'); }
else { console.log('BizPosts: PATTERN NOT FOUND'); }

// BUG-MY04 FIX: handleToggleNoti catch - search for unique pattern
const idx = c.indexOf('setBizPostsLoading(false); }\n  };\n\n  const handleDeleteBizPost');
const notiIdx = c.indexOf('\u2705 BUG-MY04 FIX');
if (notiIdx < 0) {
  // Find the handleToggleNoti catch block
  const toggleCatch = "    } catch (err) {\n      addToast('\uc124\uc815 \uc800\uc7a5 \uc2e4\ud328', 'error');\n      setNotiSetting(prevSettings)";
  const toggleCatchCRLF = "    } catch (err) {\r\n      addToast('\uc124\uc815 \uc800\uc7a5 \uc2e4\ud328', 'error');\r\n      setNotiSetting(prevSettings)";
  const toggleCatchFix = "    } catch (err) {\r\n      if (!isMountedRef.current) return; // BUG-MY04 FIX\r\n      addToast('\uc124\uc815 \uc800\uc7a5 \uc2e4\ud328', 'error');\r\n      setNotiSetting(prevSettings)";
  if (c.includes(toggleCatchCRLF)) { c = c.replace(toggleCatchCRLF, toggleCatchFix); console.log('ToggleNoti CRLF fix applied'); }
  else if (c.includes(toggleCatch)) { c = c.replace(toggleCatch, toggleCatchFix); console.log('ToggleNoti LF fix applied'); }
  else { console.log('ToggleNoti: PATTERN NOT FOUND'); }
} else { console.log('MY04 already applied'); }

fs.writeFileSync('src/pages/MyPage.jsx', c, 'utf8');
const v = fs.readFileSync('src/pages/MyPage.jsx', 'utf8');
console.log('MY03 count:', (v.match(/BUG-MY03 FIX/g)||[]).length);
console.log('MY04 count:', (v.match(/BUG-MY04 FIX/g)||[]).length);
