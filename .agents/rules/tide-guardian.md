---
name: tide-guardian
description: 100-Point Self-healing rule for FishingGO tide and weather APIs.
trigger: model_decision
---

# FishingGO Tide & Weather Guardian Rule (100-Point Architecture)

When a user reports that "물때가 이상해요" (tide is weird) or scheduled audit fails, autonomously perform the 100-point self-healing routine:

## 100-Point Self-Healing Routine

1. **Verify 21 Core Stations:** Run `node scripts/guardian-tide-21.mjs` to cross-check against BadaTime.
2. **Safe Auto-Heal:** If discrepancies exist, run `node scripts/auto-heal-tide.mjs` to safely patch `src/constants/tideOverrideData.js` without touching core code.
3. **Verify 3-Way Integrity:** Run `node scripts/guardian-check.cjs` and `node scripts/guardian-tide-audit.cjs`. Must pass 100%.
4. **Build Verification:** Run `node build-esbuild.mjs`.
5. **Deploy:** If all pass, commit with `chore(tide): auto-healed tide discrepancies` and deploy to gh-pages & trigger Render backend hot-reload.
