# Exhibition Release Notes

This release prepares Gymi coach mode for local exhibition use with the form-checking backend.

## Coach page behavior

- Coach mode includes a camera perspective selector: auto, front, side, and three-quarter.
- Each pose WebSocket frame sends `camera_view` to the backend.
- The live response displays the backend's resolved camera view.
- MediaPipe WASM files are vendored under `public/mediapipe/wasm`.
- The pose landmarker model is vendored under `public/models/pose_landmarker_lite.task`.
- Local coach mode no longer depends on jsDelivr or Google Storage at runtime for MediaPipe initialization.

## Gymi Agent

- The coach page includes `CoachAgentPanel`.
- The panel reads Firebase data for the logged-in user: coach sessions, workouts, meals, and goals.
- `/api/coach-agent` sends that compact Firebase context plus live form mistakes to Gemini.
- Successful agent responses include `source: "gemini"` and the active model name.
- If `GEMINI_API_KEY` is missing or unreachable, the API returns a clear LLM-unavailable response instead of a silent rule-based fallback.

## Local verification

From `gymi`:

```bash
npm run build
npm test -- --runInBand
npm run lint
```

Expected result for this release:

```text
build passes
70 tests pass
lint exits 0, with existing warnings
```

Run locally:

```bash
npm run dev -- -p 3000
```

Open:

```text
http://127.0.0.1:3000/coach
```

