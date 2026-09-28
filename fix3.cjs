const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

const target = "    const globalCctv = global.cctvOverrides || {};\n    const override = pointId\n      ? (globalCctv[pointId] || null)   // pointId  pointId ̵常 ( null  CCTV_MAP )\n      : (globalCctv[stationId] || null); // pointId  stationId ̵  (   )";

// If encoding makes exact match fail, use regex
code = code.replace(/const globalCctv = global\.cctvOverrides \|\| \{\};\s*const override = pointId\s*\? \(globalCctv\[pointId\] \|\| null\)[^\n]*\n\s*: \(globalCctv\[stationId\] \|\| null\);[^\n]*/, 
  "const globalCctv = global.cctvOverrides || {};\n    let override = null;\n    if (pointId && globalCctv[pointId]) {\n      override = globalCctv[pointId];\n    } else if (stationId && globalCctv[stationId]) {\n      override = globalCctv[stationId];\n    }");

fs.writeFileSync('server/index.js', code, 'utf8');
console.log('Fixed ternary logic');
