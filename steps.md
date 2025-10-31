
## Strategy: Add new endpoints alongside existing ones

**Keep working:**
- ✅ `/ai-consultant/` (current working endpoint)
- ✅ Authentication, credits, profile, settings
- ✅ All existing functionality

**Add new:**
- 🆕 `POST /api/run` (new async orchestrator)
- 🆕 `GET /api/run/{run_id}/events` (SSE progress)
- 🆕 `GET /api/run/{run_id}/recommendation` (efficiency)
- 🆕 `GET /api/run/{run_id}/quality` (web insights)
- 🆕 `GET /api/run/{run_id}/analytics` (graphs data)

**Frontend:**
- Create NEW component: `BenchmindLanding.tsx` (single card workflow)
- Keep existing: [AIConsultantCompact.tsx](cci:7://file:///Users/abdu07/Desktop/PROJECTS/Benchmind/frontend/src/components/AIConsultantCompact.tsx:0:0-0:0) (still works)
- Add new routes: `/`, `/efficiency`, `/quality`, `/analytics`
- Old route becomes: `/consultant` (existing functionality)

## Implementation Plan:

1. **Backend:** Create new `run.py` router with async job system
2. **Frontend:** Build single-card landing with SSE progress
3. **Frontend:** Build three result card components
4. **Frontend:** Build three detail pages

This way:
- Nothing breaks
- You can test new workflow
- Switch between old/new
- Eventually deprecate old when ready
