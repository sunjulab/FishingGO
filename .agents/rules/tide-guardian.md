---
name: tide-guardian
description: Self-healing rule for FishingGO tide and weather APIs.
trigger: model_decision
---

# FishingGO Tide & Weather Guardian Rule

When a user reports that "물때가 이상해요" (tide is weird) or the CI/CD deploy fails due to `guardian-tide-audit.cjs`, you are authorized to autonomously perform the self-healing routine:

## Self-Healing Routine

1. **Verify the Issue:** Run `node scripts/guardian-tide-audit.cjs` to reproduce the error.
2. **Find API Changes:** Use Haversine distance logic (similar to `remap` in `guardian-tide-audit.cjs`) against KHOA's real live observatories to identify if KHOA has changed station IDs (e.g. `DT_0006` changed coordinates).
3. **Update Map:** Edit `src/constants/fishingData.js` and `scripts/syncTides.mjs` with the newly discovered station IDs.
4. **Re-scrape Data:** Run `node scripts/syncTides.mjs` to rebuild the `TIDE_CALENDAR` cache.
5. **Verify Fix:** Run `node scripts/guardian-tide-audit.cjs` again. It must pass.
6. **Deploy:** If it passes, commit the changes using `git commit -m "fix(tide): auto-heal KHOA mapping drift"` and deploy using `npm run release:patch`.
