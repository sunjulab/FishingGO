
const fs = require("fs");
const lines = fs.readFileSync("server/index.js", "utf8").split("\n");
const start = lines.findIndex(l => l.includes("FIX-404-HANDLER"));
console.log(start);

