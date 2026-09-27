
const fs = require("fs");
const lines = fs.readFileSync("server/index.js", "utf8").split("\n");
const start = lines.findIndex(l => l.includes("// \u2500\u2500\u2500 KHOA"));
const end = lines.findIndex((l, i) => i > start && l.includes("graceful_shutdown"));
console.log(start, end);

