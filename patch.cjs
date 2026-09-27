const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

code = code.replace(
  /async function getKmaUltraSrtNcst\(lat, lng\) \{\r?\n\s*const KEY = process\.env\.KMA_KEY \|\| process\.env\.KHOA_KEY;/,
  'async function getKmaUltraSrtNcst(lat, lng) {\n  const KEY = process.env.KHOA_CCTV_KEY || process.env.KHOA_KEY;'
);

code = code.replace(/const data = \{\r?\n\s*pty: ptyItem \? parseInt\(ptyItem\.obsrValue\) : 0,\r?\n\s*rn1: rn1Item \? parseFloat\(rn1Item\.obsrValue\) : 0\r?\n\s*\};/,
  "const wsdItem = items.find(i => i.category === 'WSD');\n" +
  "const vecItem = items.find(i => i.category === 'VEC');\n" +
  "let vecDir = 'N';\n" +
  "if (vecItem) {\n" +
  "   const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];\n" +
  "   vecDir = dirs[Math.round(parseFloat(vecItem.obsrValue) / 22.5) % 16];\n" +
  "}\n" +
  "const data = {\n" +
  "  pty: ptyItem ? parseInt(ptyItem.obsrValue) : 0,\n" +
  "  rn1: rn1Item ? parseFloat(rn1Item.obsrValue) : 0,\n" +
  "  wsd: wsdItem ? parseFloat(wsdItem.obsrValue) : null,\n" +
  "  vec: vecDir\n" +
  "};"
);

code = code.replace(
  /const ptWeather = await getMarineWeatherOpenMeteoPoint\(lat, lng, stationRegion\);\r?\n\s*if \(ptWeather\) \{\r?\n\s*d\.wind = ptWeather\.wind;\r?\n\s*d\.wave = ptWeather\.wave;\r?\n\s*if \(!d\._sources\) d\._sources = \{\};\r?\n\s*d\._sources\.wind = 'OPENMETEO_POINT';\r?\n\s*d\._sources\.wave = 'OPENMETEO_POINT';\r?\n\s*\}/,
  "const ptWeather = await getMarineWeatherOpenMeteoPoint(lat, lng, stationRegion);\n" +
  "if (ptWeather) {\n" +
  "  d.wind = ptWeather.wind;\n" +
  "  d.wave = ptWeather.wave;\n" +
  "  if (!d._sources) d._sources = {};\n" +
  "  d._sources.wind = 'OPENMETEO_POINT';\n" +
  "  d._sources.wave = 'OPENMETEO_POINT';\n" +
  "}\n" +
  "try {\n" +
  "   const kmaSrt = await getKmaUltraSrtNcst(lat, lng);\n" +
  "   if (kmaSrt && kmaSrt.wsd !== null) {\n" +
  "      d.wind = { speed: parseFloat(kmaSrt.wsd.toFixed(1)), dir: kmaSrt.vec };\n" +
  "      d._sources.wind = 'KMA_ULTRASRT_PRECISION';\n" +
  "      if (kmaSrt.pty !== undefined) d.pty = kmaSrt.pty;\n" +
  "      if (kmaSrt.rn1 !== undefined) d.rn1 = kmaSrt.rn1;\n" +
  "   }\n" +
  "} catch (e) {}\n"
);

fs.writeFileSync('server/index.js', code, 'utf8');
console.log('patched');
