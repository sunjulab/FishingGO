
const fs = require("fs");
let code = fs.readFileSync("server/index.js", "utf8");
const KHOA = "const KHOA_KEY = process.env.KHOA_KEY";
const startLine = code.lastIndexOf("\n", code.indexOf(KHOA) - 50); 
const closingBrace = code.indexOf("});\n", code.indexOf("app.get(\u0027/api/tide/obs\u0027")) + 4;
console.log("start:", startLine, "end:", closingBrace);
if (startLine > -1 && closingBrace > -1) {
  const block = code.substring(startLine, closingBrace);
  code = code.substring(0, startLine) + code.substring(closingBrace);
  const catchAll = code.indexOf("app.use((req, res, next) => {");
  console.log("catchAll:", catchAll);
  if (catchAll > -1) {
    code = code.substring(0, catchAll) + block + "\n\n  " + code.substring(catchAll);
    fs.writeFileSync("server/index.js", code, "utf8");
    console.log("Moved successfully!");
  }
}

