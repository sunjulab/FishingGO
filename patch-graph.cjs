
const fs = require("fs");
let code = fs.readFileSync("src/pages/TideTab.jsx", "utf8");
const start = code.indexOf("const pts = useMemo(() => {");
const end = code.indexOf("}, []);", start) + 7;
if (start > -1 && end > -1) {
  const replacement = `const pts = useMemo(() => {
      let keyPoints = [];
      if (high) keyPoints.push({ x: timeToX(high), y: 13, type: "H" });
      if (high2) keyPoints.push({ x: timeToX(high2), y: 13, type: "H" });
      if (low) keyPoints.push({ x: timeToX(low), y: H - 13, type: "L" });
      if (low2) keyPoints.push({ x: timeToX(low2), y: H - 13, type: "L" });
      keyPoints.sort((a, b) => a.x - b.x);

      if (keyPoints.length === 0) return "";

      const cycle = (372 / 1440) * W; // Approx 6.2h
      let pFirst = keyPoints[0];
      let pLast = keyPoints[keyPoints.length - 1];
      
      const pBefore = { x: pFirst.x - cycle, y: pFirst.type === "H" ? H - 13 : 13, type: pFirst.type === "H" ? "L" : "H" };
      const pAfter = { x: pLast.x + cycle, y: pLast.type === "H" ? H - 13 : 13, type: pLast.type === "H" ? "L" : "H" };
      const pBefore2 = { x: pBefore.x - cycle, y: pBefore.type === "H" ? H - 13 : 13, type: pBefore.type === "H" ? "L" : "H" };
      const pAfter2 = { x: pAfter.x + cycle, y: pAfter.type === "H" ? H - 13 : 13, type: pAfter.type === "H" ? "L" : "H" };
      
      const full = [pBefore2, pBefore, ...keyPoints, pAfter, pAfter2];
      
      const arr = [];
      for (let i = 0; i <= W; i += 2) {
        let p1 = full[0], p2 = full[1];
        for (let j = 0; j < full.length - 1; j++) {
          if (i >= full[j].x && i <= full[j+1].x) {
            p1 = full[j]; p2 = full[j+1]; break;
          }
        }
        let mu = (i - p1.x) / (p2.x - p1.x);
        if (isNaN(mu)) mu = 0;
        mu = Math.max(0, Math.min(1, mu));
        const mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
        const y = p1.y * (1 - mu2) + p2.y * mu2;
        arr.push(i.toFixed(1) + "," + y.toFixed(1));
      }
      return arr.join(" ");
    }, [high, high2, low, low2]);`;
  code = code.substring(0, start) + replacement + code.substring(end);
  fs.writeFileSync("src/pages/TideTab.jsx", code, "utf8");
  console.log("TideGraph patched successfully!");
} else {
  console.log("Could not find useMemo block");
}

