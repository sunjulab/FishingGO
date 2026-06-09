const fs = require("fs");
const content = fs.readFileSync("server/index.js", "utf8");
const lines = content.split(/\r?\n/);

// 1. OTP 만료 + 1회 사용
console.log("\n=== 1. OTP 만료 + 1회 사용 제한 ===");
const hasOtpExpiry = content.includes("otpExpiry") || content.includes("otpExpiresAt") || content.includes("OTP_EXPIRY");
const hasOtpDelete = content.includes("otpMap.delete") || content.includes("delete.*otp") || content.includes("otp.*delete");
const otpMap = content.includes("otpMap") || content.includes("OtpMap") || content.includes("smsOtp");
console.log("  otpMap 존재:", otpMap);
console.log("  OTP 만료 체크:", hasOtpExpiry);
console.log("  OTP 1회 사용(삭제):", hasOtpDelete);
lines.forEach((line, i) => {
  if (/otpMap|smsOtp|OTP_EXPIRY|otpExpiry/.test(line)) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 90));
  }
});

// 2. bcrypt 라운드 확인
console.log("\n=== 2. bcrypt 라운드 ===");
lines.forEach((line, i) => {
  if (/bcrypt\.hash\(|bcrypt\.genSalt/.test(line) && !line.trim().startsWith("//")) {
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80));
  }
});

// 3. 소켓 이벤트 데이터 타입 검증
console.log("\n=== 3. 소켓 데이터 타입 검증 ===");
lines.forEach((line, i) => {
  if (/socket\.on\(/.test(line) && !line.trim().startsWith("//")) {
    const next5 = lines.slice(i, i+5).join("\n");
    const hasTypeCheck = /typeof|Array\.isArray|instanceof/.test(next5);
    if (!hasTypeCheck) {
      console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " ← 타입검증 없음");
    }
  }
});

// 4. tags 배열 길이/크기 제한
console.log("\n=== 4. tags 배열 길이 제한 ===");
lines.forEach((line, i) => {
  if (/tags.*req\.body|req\.body.*tags/.test(line) && !line.trim().startsWith("//")) {
    const next5 = lines.slice(i, i+5).join("\n");
    const hasLimit = /slice|length|MAX.*tag|filter/.test(next5);
    console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " | 길이제한:" + hasLimit);
  }
});

// 5. 날짜 파라미터 주입
console.log("\n=== 5. 날짜 파라미터 검증 ===");
lines.forEach((line, i) => {
  if (/new Date\(req\.(body|query|params)/.test(line) && !line.trim().startsWith("//")) {
    const prev3 = lines.slice(Math.max(0, i-3), i).join("\n");
    const hasValidate = /isValid|isNaN|Number\.isFinite|Date\.parse|timestamp/.test(prev3 + line);
    if (!hasValidate) {
      console.log("  L" + (i+1) + ": " + line.trim().slice(0, 80) + " ← 검증 없음");
    }
  }
});

console.log("\n=== R30 완료 ===");
