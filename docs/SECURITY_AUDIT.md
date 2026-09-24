# VoiceShield AI — Security Audit (STEP 1, READ-ONLY)

**Project:** VoiceShield AI (SIH 2026, PS SIH26104) — React 18 + TypeScript + Vite / Supabase / FastAPI
**Date:** 2026-09-24
**Auditor:** Automated read-only audit (no code changes, no secret values disclosed)
**Commit audited:** `7a69d8e` (`feat: deploy backend schema and edge functions to Supabase, add FastAPI service, and update UI`) — full history `8d8c5d8 → d72b122 → 7a69d8e` (3 commits, public repo)
**Scope:** CONTEXT rules — do not change UI design or detection logic; show diff before editing; never print/log/commit secrets; re-run checks for real.

> **Status of this document:** AUDIT ONLY. No fixes have been applied. Section `8. Fix Plan vs. Already Tested` distinguishes "implemented and tested" from "planned". Everything below is **planned/open**.

---

## 0. Methodology & Evidence

All checks were executed for real on the working tree and full git history. Tool availability on this host:

```
python --version          => Python 3.13.6
pip --version             => pip 25.2
bun / npm                 => not on PATH (see §6)
gitleaks / trufflehog     => not on PATH (manual grep + git log used)
pip-audit 2.10.1 / bandit 1.9.4 => installed during audit
```

Real command outputs are quoted inline. No finding is asserted without a file:line or command citation.

---

## 1. Secrets & Configuration Audit

### 1.1 Tracked files

```
$ git ls-files | grep -i env
.env.example
backend/.env.example

$ ls -Force -Recurse .env*
D:\VoiceShieldAI\.env.example
D:\VoiceShieldAI\backend\.env.example

# No .env file is tracked. .gitignore correctly ignores .env* with !.env.example:
# .gitignore:7-8
.env*
!.env.example
```

### 1.2 .env.example contents (placeholders only — no real secret committed)

**`/.env.example` (root, frontend):**
```ini
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_AI_BACKEND_URL="http://localhost:8000"
VITE_AI_BACKEND_WS_URL="ws://localhost:8000/ws/v1/live-detection"
VITE_ENABLE_DEMO_MODE="true"
```

**`/backend/.env.example`:**
```ini
# ⚠️ SECURITY: NEVER prefix these backend secrets with "VITE_".
REALITY_DEFENDER_API_KEY=""
HF_TOKEN=""
```

Both contain **empty/placeholder** values. No JWT (`eyJhbG...`), no `sk-` key, no `service_role` key found in tracked history.

### 1.3 Full git history scan

```
$ git log --all --oneline          => 8d8c5d8 Initial commit | d72b122 | 7a69d8e
$ git log --all -p --full-history -- .env.example backend/.env.example
# Only placeholder values ever appear; no real secret added then removed.

Manual grep on full patch history:
  eyJhbG (JWT)        : no hits
  sk-                : no hits
  service_role       : 3 hits — all in docs/skill references, not in code or config
  REALITY_DEFENDER_API_KEY : 18 hits — all template/empty assignments
  HF_TOKEN                 : 4 hits — all empty assignments
```

**Finding:** ✅ No leaked secret is currently in git. However the **absence** is fragile — see §1.5.

### 1.4 Supabase config.toml secrets hygiene

`supabase/config.toml` uses `env()` substitution correctly for all secrets:

```toml
openai_api_key = "env(OPENAI_API_KEY)"          # line 101
auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)" # line 294
secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"    # line 326
s3_host = "env(S3_HOST)" ...                    # lines 399-405
```

No hard-coded secret in `config.toml`. That file also contains the project id in plaintext:

```toml
project_id = "VoiceShieldAI"  # line 5 — not sensitive, but public repo reveals target project name
```

And critically:

```toml
[functions.analyze-audio]
verify_jwt = false  # line 418
```

**Severity: CRITICAL** — the Edge Function bypasses Supabase gateway JWT verification (see §4.4).

### 1.5 VITE_ variable inventory

All `VITE_` variables discovered (`grep VITE_`):

| Variable | Where declared | Where consumed | Contains secret? | Assessment |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env.example:2` | `src/lib/supabase.ts:3` | No — anon URL, public | OK (expected public) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.example:3` | `src/lib/supabase.ts:4` | No — anon/publishable key is public by design | OK if it is truly the anon key |
| `VITE_AI_BACKEND_URL` | `.env.example:6` | `src/context/DataContext.tsx:423`, `src/services/aiDetectionService.ts:22` | No | OK |
| `VITE_AI_BACKEND_WS_URL` | `.env.example:7` | `src/services/websocketService.ts:27`, `src/context/DataContext.tsx:424` | No | OK |
| `VITE_ENABLE_DEMO_MODE` | `.env.example:10` | `src/context/DataContext.tsx:425`, `src/services/aiDetectionService.ts:23` | No | **Client-side flag — security risk (see §2.1)** |

**Confirmed:** No `VITE_` variable holds a `service_role` key, `REALITY_DEFENDER_API_KEY`, or `HF_TOKEN`. Backend secrets correctly **never** use `VITE_` prefix (documented in `backend/.env.example:7-8`).

**Remaining risk:** The frontend `VITE_SUPABASE_PUBLISHABLE_KEY` is the `anon` key — safe to expose but must **never** be the `service_role` key. No code currently imports `service_role` (`grep service_role` finds only docs). The repo should add a CI check that fails if `VITE_` contains `service_role` or if any `SUPABASE_SERVICE_ROLE_KEY` appears in `src/`.

### 1.6 .env divergence

- Root `.env.example` does **not** document `OPENAI_API_KEY`, `SUPABASE_AUTH_*`, `S3_*` variables referenced via `env()` in `config.toml`. An operator would not know to set them.
- Backend `requirements.txt` has no pin to a lockfile hash; supply-chain risk is not audited by a lockfile.

**Recommendation (planned):** Provide a single `.env.example` mapping every `env()` consumed by `config.toml` plus backend vars, and add `detect-secrets` / `gitleaks` to CI pre-commit.

---

## 2. Frontend Audit

### 2.1 Demo mode is client-controlled and cross-contaminates real data

**Evidence:**

```ts
// src/context/DataContext.tsx:425
demoMode: import.meta.env.VITE_ENABLE_DEMO_MODE !== 'false',
// => Any build where VITE_ENABLE_DEMO_MODE is unset defaults to TRUE.

// src/services/aiDetectionService.ts:23
this.isDemoMode = import.meta.env.VITE_ENABLE_DEMO_MODE !== 'false';

// src/context/AuthContext.tsx:32-44
const DEMO_USER: UserProfile = { id: 'usr_sih_analyst_01', ... };
const [user, setUser] = useState<UserProfile | null>(() => {
  const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (saved) return JSON.parse(saved);
  return DEMO_USER; // defaults to logged-in demo user even with no Supabase
});

// src/context/DataContext.tsx:456-477
if (!isSupabaseConfigured || !client || !user) return; // fetchSupabaseData
// If isSupabaseConfigured is false, app never syncs — but also never blocks writes.
// All addAnalysis/addSpeakerProfile/etc. still push to local state and,
// when Supabase IS configured, also insert into Supabase regardless of demoMode.

 // src/services/aiDetectionService.ts:60-86
if (!this.isDemoMode && this.backendUrl && !this.backendUrl.includes('localhost:8000')) {
  // real fetch
} // else => high-fidelity simulation
```

**Findings:**

1. **Client-side flag decides trust.** An attacker builds with `VITE_ENABLE_DEMO_MODE=true` (or just sets `localhost:8000` to bypass the `!includes('localhost:8000')` branch) and can force the app into simulation, then flip the flag or directly call Supabase because RLS is the only barrier. There is **no server-side enforcement** that demo-generated rows cannot pollute real tables.
2. **`is_demo` column exists** (`audio_analyses.is_demo`) but is **never enforced** by RLS — a demo row with `is_demo=true` is stored in the same table as real forensic evidence and returned to the same queries. No `WHERE is_demo = false` isolation, no separate schema, no policy like `WITH CHECK (is_demo = false)`.
3. **No "SIMULATED RESULT" label.** `Topbar.tsx:80` shows a generic "Demo Mode" badge when `backendConfig.demoMode` is true, but per-analysis results (`AudioAnalysisPage`, `AnalyzePage`, `LiveDetectionPage`, `ReportsPage`) render simulated scores identically to real inference — no banner, no watermark, no `is_demo` indicator on the forensic dossier. An operator can mistake heuristic output for certified evidence.
4. **Hard-coded credentials / auto-login.** `AuthContext.tsx` ships a hard-coded `DEMO_USER` (`'analyst@voiceshield.defense'`, `Dr. Kabir Sharma`) and auto-populates it from `localStorage` or falls back to it outright. `loginAsDemoAnalyst()` instantly authenticates without password. This is intentional for evaluators but, if the build is deployed to production without `isSupabaseConfigured`, the entire app runs **unauthenticated** with full CRUD backed only by `localStorage`.

**Severity: HIGH** (integrity of forensic evidence; demo pollution).

### 2.2 Supabase service-role key usage

**Finding:** ✅ No `service_role` key is imported or referenced in `src/` (`grep service_role` → only docs). `src/lib/supabase.ts:18` uses `createClient(supabaseUrl, supabaseAnonKey)` with the anon key only. No `supabase.auth.admin` or service-role bypass is called from the browser.

### 2.3 localStorage as source of truth — sensitive data at rest

**Evidence:**

```ts
// src/context/DataContext.tsx
localStorage.getItem('voiceshield_analyses')     // :397
localStorage.getItem('voiceshield_speakers')     // :402
localStorage.getItem('voiceshield_alerts')       // :407
localStorage.getItem('voiceshield_investigations') // :412
localStorage.getItem('voiceshield_reports')      // :417
// and writes on every change: :434-450

// src/context/AuthContext.tsx
localStorage.getItem(LOCAL_STORAGE_USER_KEY) // :34
localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user)) // :98,101,144,185,212,219
```

**Findings:**

- The **entire security-sensitive dataset** — analyses (with `explanation`, `spectral_artifacts`), speaker profiles (with `voiceprint_hash`, `phone_number`, `department`), alerts, investigations (with `detected_caller`, `target_individual`), reports, plus the **cached `UserProfile`** — is persisted in `localStorage` as plaintext JSON under keys `voiceshield_*` and `voiceshield_auth_user`.
- `localStorage` is accessible to any script running on the origin (XSS) and is **never cleared on sign-out except the auth key** (`AuthContext.signOut` only removes `LOCAL_STORAGE_USER_KEY`; `DataContext.resetToDemoSeed` is manual). A shared workstation leaves all forensic data behind.
- Writes are **not encrypted** and do not respect Supabase as source of truth — local seed data is used when `isSupabaseConfigured` is false, but also hydrated from `localStorage` even when Supabase is reachable, creating a split-brain where a user can operate offline on stale/polluted local data and later sync inconsistently.

**Severity: HIGH** (confidentiality; data remanence; cache poisoning).

### 2.4 Rendering of user-supplied content (XSS surface)

**Evidence:**

- `grep dangerouslySetInnerHTML` → 0 hits. `grep innerHTML` → 0 hits in `src/`.
- Analyst notes (`InvestigationsPage.tsx`), alert titles/descriptions (`AlertsPage.tsx`), speaker names, filenames (`file_name`), and `explanation` are rendered via JSX interpolation:

```tsx
// InvestigationsPage.tsx — notes rendering
<p className="text-slate-200">{n.note_text || n.content}</p>
// DataContext.tsx — alert description built from explanation (user-influenced filename)
description: `Voice clone anomaly detected in ${analysis.source_type.replace('_', ' ')}. ${analysis.explanation}`,
```

**Finding:** ✅ No `dangerouslySetInnerHTML` misuse. React auto-escapes interpolated strings, so stored XSS via `<script>` in a note or filename is **not executed**. However:

- **No sanitization on ingest.** Filenames and notes are stored verbatim (`analysis.file_name` from `UploadFile.filename`, investigation notes from `content` string) with no length cap, no character allowlist, no HTML-entity normalization. Extremely long filenames or notes can cause UI overflow / stored content that, while escaped, is still confusing (e.g., a filename like `../../../etc/passwd` or `pay: <svg onload>` will display literally and could be copy-pasted into downstream systems).
- `AudioAnalysisPage.tsx:89-100` auto-runs analysis for pre-configured samples by constructing a dummy `File` with `sample.name` as filename, but never validates the name against an allowlist before saving to `DataContext`.

**Severity: MEDIUM** (low XSS exploitability today, but ingest validation gap — worsens with future `innerHTML` or PDF export).

### 2.5 Tokens in URLs / redirect handling

- `AuthContext.tsx:201` — `resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login' })` — no token in URL, safe.
- `supabase.ts:21` — `detectSessionInUrl: true` — Supabase will parse `access_token` from the URL fragment after magic-link / OAuth callbacks. This is **expected Supabase behavior** but means tokens briefly appear in `window.location.hash` and browser history. No other code puts tokens in `location.search`. No sensitive query param like `?api_key=` found.
- Supabase Edge Function allows `apikey` header via CORS (`Access-Control-Allow-Headers: "authorization, x-client-info, apikey"`), but never logs it.

**Severity: LOW** (standard Supabase flow; recommend `detectSessionInUrl` + immediate `history.replaceState` already handled by `supabase-js` v2).

### 2.6 Security headers & CSP

**Evidence:**

```html
<!-- index.html:1-14 -->
<head> <meta charset="UTF-8" /> <meta viewport ... /> <title>... | no CSP, no HSTS, no X-Frame -->
```

```ts
// vite.config.ts — no headers plugin, no CSP meta injection
// src/ and supabase/ — grep Content-Security-Policy|X-Frame|helmet => 0 hits
```

**Finding:** ❌ No `Content-Security-Policy`, no `X-Frame-Options`/`frame-ancestors`, no `Strict-Transport-Security`, no `X-Content-Type-Options`, no `Referrer-Policy`. The app relies on Vite dev defaults. If deployed behind a reverse proxy without these headers, it is vulnerable to clickjacking, MIME-sniff, and (if later adding `innerHTML`) XSS amplification.

**Severity: MEDIUM** (defense-in-depth).

---

## 3. FastAPI Backend Audit (`backend/main.py`, 303 lines)

### 3.1 Route inventory

| Method | Path | Auth | Purpose | File:line |
|---|---|---|---|---|
| GET | `/` | None | Service banner, echoes `reality_defender_configured` | `main.py:79` |
| GET | `/api/v1/health` | None | Health, model names, `engine_mode` | `main.py:90` |
| POST | `/api/v1/analyses` | None | Multipart audio analysis (core detector) | `main.py:121` |
| POST | `/api/v1/enrollment` | None | Multipart speaker enrollment, hash | `main.py:229` |
| WS | `/ws/v1/live-detection` | None | Streaming live detection, `receive()` loop | `main.py:255` |

**Finding:** ❌ **Zero endpoints verify a Supabase JWT** (or any auth). The only auth-related code is reading `REALITY_DEFENDER_API_KEY` from `os.getenv`. An unauthenticated caller on the network can upload audio, enroll speakers, and hold a WebSocket forever.

**Severity: CRITICAL.**

### 3.2 CORS

```py
# backend/main.py:33-40
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # wildcard
    allow_credentials=True,       # combined — browsers will reject, but non-browser clients can still abuse
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- `allow_origins=["*"]` with `allow_credentials=True` is both **insecure** (any origin can call the API) and **technically contradictory** (Starlette will emit `Access-Control-Allow-Origin: *` which browsers refuse when credentials are included — but attackers bypass CORS via curl / non-browser). The intended frontend origin is never pinned.

**Severity: HIGH.**

### 3.3 Upload validation (or lack thereof)

**Evidence (`POST /api/v1/analyses`):**

```py
# main.py:121-126
async def submit_audio_analysis(
    file: UploadFile = File(...),               # no File(...) size/type constraints
    speaker_profile_id: Optional[str] = Form(None),
    source_type: str = Form("audio_upload"),
):
    contents = await file.read()               # reads entire file into memory, unbounded
    duration = max(2.5, min(30.0, round(len(contents) / 32000, 1))) # estimate from byte length

# main.py:105-119 analyze_with_reality_defender
files = {"file": (file.filename or "sample.wav", audio_bytes, "audio/wav")}
# No MIME check, no extension allowlist
```

- **No max size.** A 500 MB upload is read entirely into RAM (`await file.read()`). No `max_upload_size` middleware, no Starlette `UploadFile` spool limit, no duration cap. DoS via memory exhaustion.
- **No type/MIME allowlist.** Any `Content-Type` is accepted; only downstream `if len(contents) > 2048` is checked. An attacker can upload `text/html`, `application/octet-stream`, or a zip bomb.
- **No real header (magic bytes) check.** Byte variance heuristic (`sum(abs(b-128)...)`) is not a format validator. Corrupted audio is still scored and returned `200` with a synthetic/authentic verdict.
- **No auth / RLS linkage.** `user_id` is hard-coded to `"usr_current"` (`main.py:50`), not extracted from JWT. Every upload is attributed to the same synthetic user.
- **Filename handling:** `file.filename` is echoed verbatim into the response (`file_name=file.filename or "uploaded_audio.wav"`) without sanitization. No `path.basename` stripping, no `../` removal, no length limit. Downstream storage (if later added) would be path-traversal-prone. Stored filename can be arbitrarily long and contain control characters.
- **Speaker enrollment similarly** (`POST /api/v1/enrollment`): reads entire file into memory, no MIME/size check, `display_name` taken from `Form(...)` with no validation or length limit, hash computed over raw bytes (`hashlib.sha256(contents).hexdigest()`).

**Severity: HIGH/CRITICAL** (DoS, spoofed caller ID, path traversal preparation).

### 3.4 Error messages & debug exposure

```py
# main.py:114-118
print(f"Reality Defender request failed: {e}")
# main.py:297-299
print("WebSocket client disconnected.")
print(f"WebSocket session closed: {e}")
# main.py:24-25
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
# main.py:303
uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) # reload=True
```

- Exceptions from `requests.post` are caught and printed to stdout, not returned to client — ✅ generic to caller.
- But `reload=True` enables **auto-reload + debug** in production if the module is run directly. No environment gate.
- Health endpoint leaks configuration booleans (`reality_defender_configured`, `huggingface_configured`) — low sensitivity, but reveals whether keys are present.
- No structured error envelope; unhandled exceptions bubble as FastAPI `500` with default message (stack trace not leaked because `debug` is not set on `FastAPI(...)`, but `reload=True` still exposes source watching).

**Severity: MEDIUM** (debug reload in prod; mild info disclosure).

### 3.5 Rate limiting, timeouts, and resource caps

- No `slowapi` limiter, no `RateLimiter` dependency, no in-memory counter — every route is **unthrottled**.
- `requests.post(..., timeout=12)` in `analyze_with_reality_defender` — has a timeout, ✅ at least not hanging forever, but no global request timeout middleware. A slow client can hold `/api/v1/analyses` upload indefinitely.
- WebSocket loop has no `max_messages`, no `max_bytes`, no idle timeout, no maximum session duration (`main.py:262-295` is an infinite `while True` with `await websocket.receive()`). An attacker can open many sockets and never close them.

**Severity: HIGH.**

### 3.6 WebSocket specifics (see also §3.1)

```py
# main.py:255-295
@app.websocket("/ws/v1/live-detection")
async def websocket_live_detection(websocket: WebSocket):
    await websocket.accept()   # accepts unconditionally
    step = 0
    while True:
        data = await websocket.receive()  # accepts any text/json/bytes, any size
        # ... random spoof score ...
        await websocket.send_json(payload)
```

- **No JWT on connect.** `websocket.accept()` with no `Authorization` query/header check, no `auth.uid()` extraction.
- **No per-user connection limit.** `step` is per-connection but global counter absent.
- **No cap on stream duration or message size.** Binary audio chunks are accepted via `websocket.receive()` generic, not `receive_bytes(max_size)`.
- **No chunk format validation.** `data = await websocket.receive()` discards the payload entirely — any string, JSON, or megabyte binary is accepted and a spoof score is still emitted. Adversarial audio is never validated.
- Client-side `websocketService.ts:58-94` chooses the WS URL from `VITE_AI_BACKEND_WS_URL` (client-writable) and simulates locally if the URL contains `localhost:8000`, further enabling demo-mode bypass.

**Severity: CRITICAL.**

---

## 4. Supabase (Postgres, RLS, Storage, Edge Function)

### 4.1 Tables & RLS enablement

Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (lines 167-175) — ✅.

| Table | RLS enabled | Policy counts | Note |
|---|---|---|---|
| `profiles` | Yes | 2 (select, update own) | Missing INSERT policy — only trigger can insert |
| `speaker_profiles` | Yes | 4 (select/insert/update/delete own) | ✅ correct |
| `audio_analyses` | Yes | 3 (select/insert/update own) | **Missing DELETE** — intentional? No delete for analysts; but **no DELETE denied explicitly** — RLS deny-by-default covers it, but inconsistency across tables |
| `detection_events` | Yes | 2 (select/insert via analysis ownership) | Missing UPDATE/DELETE — deny-by-default, okay |
| `alerts` | Yes | 3 (select/insert/update own) | Missing DELETE |
| `investigations` | Yes | 3 (select/insert/update own) | Missing DELETE |
| `investigation_notes` | Yes | 2 (select/insert via investigation ownership) | Missing UPDATE/DELETE |
| `reports` | Yes | 2 (select/insert own) | Missing UPDATE/DELETE — but `status` field exists; no update path by design? |
| `audit_logs` | Yes | 2 (select own, insert own) | **Must be insert-only** — see §4.2 |

### 4.2 `audit_logs` is NOT insert-only

Requirement: *"audit_logs is insert-only (no update or delete for any role)"*.

**Current migration (lines 296-302):**

```sql
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

With RLS enabled and no UPDATE/DELETE policy, PostgREST **does deny** update/delete for `authenticated` — but:

- There is **no explicit DENY** and no `REVOKE` for `service_role` / `postgres`. A compromised `service_role` or a future `FOR ALL` policy would silently grant mutation. The table also has `user_id REFERENCES auth.users ON DELETE SET NULL` — deleting a user nulls their audit trail. No `REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon;` and no trigger preventing mutation.
- `author_name` is not constrained; an attacker can insert audit rows with arbitrary metadata (`metadata JSONB DEFAULT '{}'`).

**Severity: MEDIUM** (integrity — tamper-evident trail not cryptographically enforced).

### 4.3 RLS gaps & sharing model

1. **`profiles` has no INSERT policy** — relies on `handle_new_user()` trigger (SECURITY DEFINER). That is correct, but note the trigger function is `SECURITY DEFINER SET search_path = public` — acceptable but must be reviewed for search_path hijack (it is pinned, ✅).
2. **`detection_events` RLS uses `EXISTS` subquery** per row (`lines 222-236`) — correct ownership, but is `auth.uid()` performant? The migration does not add `CREATE INDEX` on `detection_events(analysis_id)` — could cause slow policy checks. Not a vulnerability, but an operational gap.
3. **`investigation_notes` sharing is broken by design.** Policy requires `auth.uid() = user_id AND EXISTS (investigation where inv.user_id = auth.uid())` — a second analyst (`user B`) cannot add a note to an investigation owned by `user A`, even if they are on the same incident team. If investigations are meant to be **collaborative/organization-scoped**, the current RLS enforces strict per-user isolation that makes multi-analyst response impossible. Conversely, if isolation is intentional, the UI's "Lead Forensics Analyst" label (`InvestigationsPage.tsx:66`) spoofs a collaborator who cannot actually participate. Either way the model is underspecified.

**Severity: MEDIUM** (either breaks collaboration or leaks the assumption).

4. **No DELETE policies where deletion is offered in UI.** Delete buttons exist for `speakerProfiles` (`SpeakerProfilesPage.tsx:80-86`) and analyses, but `audio_analyses`, `alerts`, `investigations`, `reports` have **no DELETE policy** — UI delete will return `401/403` when Supabase is connected, but succeeds when `localStorage` fallback is used, causing divergent behavior and data resurrection on next Supabase sync.

5. **No `is_demo` enforcement in RLS.** As noted in §2.1, demo rows are not segregated. Policy should add `AND is_demo = false` to SELECT or a separate `FOR SELECT` that filters by request header.

### 4.4 Storage: buckets & policies

**Buckets (lines 334-338):**

```sql
INSERT INTO storage.buckets (id, name, public) VALUES
  ('voice-reference-audio', false),
  ('analysis-audio', false),
  ('reports', false)
```

- `public = false` ✅ — private buckets, require signed URLs. Correct.

**Policies (lines 342-360):**

All four operations correctly use `(storage.foldername(name))[1] = auth.uid()::text` as the folder isolation predicate, scoped to the three buckets — ✅ matches the audit requirement verbatim.

**Remaining gaps:**

- **No `file_size_limit` per bucket, no `allowed_mime_types`.** `supabase/config.toml:118` sets a global `file_size_limit = "50MiB"` for the local storage emulator, but the **migration never sets per-bucket limits** (e.g., `file_size_limit = 10485760, allowed_mime_types = '{audio/wav,audio/mp3,audio/mpeg,audio/flac,audio/ogg,audio/webm}'`). An attacker can upload `50 MiB` of any MIME (e.g., `text/html`) into `analysis-audio` and serve it via a signed URL, enabling stored content abuse.
- **Storage policies allow UPDATE and DELETE** within own folder — legitimate, but no retention / versioning. Deleting a voiceprint's reference audio leaves orphaned `speaker_profiles.reference_audio_path` pointing to a missing object.
- No virus/malware scanning hook is configured.

**Severity: MEDIUM.**

### 4.5 Edge Function `supabase/functions/analyze-audio`

**Evidence:**

```ts
// supabase/functions/analyze-audio/index.ts:19-44
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader ?? "" } } });
  const { data: { user }, error } = await supabaseClient.auth.getUser(); // line 34-35
  if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

// ...
  const rdApiKey = Deno.env.get("REALITY_DEFENDER_API_KEY"); // line 49
  // Heuristic branch if !rdApiKey else would call external API (not yet wired to fetch)
```

```toml
# supabase/config.toml:416-419
[functions.analyze-audio]
verify_jwt = false
```

**Findings:**

1. **Gateway JWT verification is disabled.** `verify_jwt = false` means Supabase's edge gateway does **not** reject requests missing a JWT before the function runs. The function does call `auth.getUser()` on the `Authorization` header, but that is **application-layer** verification that can be skipped if the caller omits `Authorization` — the function returns `401`, but the gateway still permits the invocation, exposing the function to anonymous probing and counting against invocation quotas. With `verify_jwt = true`, anonymous requests would never reach the isolate.

   **Severity: HIGH.**

2. **Reality Defender key hygiene.** `Deno.env.get("REALITY_DEFENDER_API_KEY")` reads from the Edge Functions secret store — correct, not bundled to client. The key is **never returned** in a response (`JSON.stringify(insertedAnalysis)` only echoes the analysis row, not `rdApiKey`). No leak in headers or error messages. ✅

3. **Demo heuristic still reachable authenticated.** The branch `if (body.isSimulated || !rdApiKey)` allows any authenticated caller to send `{ isSimulated: true }` and force the heuristic path regardless of backend configuration. This is a minor trust boundary — the Edge Function should ignore client-supplied `isSimulated` and decide server-side based solely on secret presence + server flag.

4. **CORS wildcard.** `corsHeaders = { "Access-Control-Allow-Origin": "*" }` permits any origin to POST to the Edge Function. Combined with `verify_jwt = false` (pre-fix), this is CORS + anonymous invoke = trivial abuse from any webpage.

5. **Request body is not size-limited** — `await req.json()` will parse any sized JSON; a multi-megabyte `fileName` or `audioUrl` string can be supplied.

**Severity: MEDIUM/HIGH.**

---

## 5. Data Protection — Voiceprints & Embeddings

### 5.1 Where biometrics live

| Artifact | Storage location | Columns | Access control |
|---|---|---|---|
| Reference audio file | `storage.buckets['voice-reference-audio']/{user_id}/...` (private) | opaque bytes | Storage RLS folder isolation + signed URL (1h default: `supabase.ts:35`) |
| Voiceprint hash | `public.speaker_profiles.voiceprint_hash` TEXT | `vp_sha256_...` (or dummy `vprint_...`) | Row RLS `auth.uid() = user_id` |
| Enrolled duration / sample rate | `audio_duration_seconds`, `sample_rate_hz` | numeric/int | Same row RLS |
| Raw embedding vector | **Not stored** — `backend/main.py` computes `hashlib.sha256(contents).hexdigest()[:24]` only, does not persist an embedding. `aiDetectionService.enrollSpeakerProfile` returns a synthetic hash, never a vector. | — | — |
| Analyses & spectral artifacts | `audio_analyses.spectral_artifacts` JSONB + `speaker_similarity_score` numeric | artifact scores + similarity % | Row RLS `auth.uid() = user_id` |

**Findings:**

- ✅ No raw biometric embedding is uploaded from the client or returned to it. The only persisted biometric derivative is a **SHA-256 hash of the audio bytes**, not a speaker embedding — this is good for confidentiality (not reversible to voice) but **weak as a biometric** (anyone with the audio file can recompute it; it is not a salted, slow KDF). `DataContext.addSpeakerProfile` even generates a synthetic hash `vprint_<rand>_sha256` client-side without server attestation.
- **Hash is returned to the client** and rendered (`SpeakerProfilesPage.tsx:147` shows `voiceprint_hash` in the grid, detail modal line 217). While a hash is not the audio, exposing it enables offline correlation and, if raw embeddings are added later, would be a leak. The spec requires embeddings stay server-side only and never be returned — already incidentally satisfied because no embedding is stored, but the hash channel should be re-evaluated before any real embedding is introduced.
- **`speaker_profiles.notes`, `phone_number`, `department`** are stored plaintext with no encryption at rest beyond Postgres disk encryption. Supabase Vault / `pgsodium` column encryption is not used.
- **No delete-my-data path.** `deleteSpeakerProfile` (`DataContext.tsx:576`) deletes the row and, when connected, `supabase.from('speaker_profiles').delete().eq('id', id)` — but it does **not** delete the reference audio object from `voice-reference-audio/{user_id}/...`. The bucket object remains orphaned. No `DELETE /me/data` or account-erasure endpoint. No retention policy or automatic expiry.

**Severity: MEDIUM** (hash exposure + orphaned audio + no GDPR-style erasure).

---

## 6. Dependency & Static-Analysis Scans (real outputs)

### 6.1 `pip-audit`

**Backend isolation (the deployable server):**

```
$ pip-audit -r backend/requirements.txt --format=json
{"dependencies": [
  {"name":"fastapi","version":"0.141.1","vulns":[]},
  {"name":"uvicorn","version":"0.53.0","vulns":[]},
  {"name":"python-multipart","version":"0.0.32","vulns":[]},
  {"name":"pydantic","version":"2.13.5","vulns":[]},
  {"name":"requests","version":"2.34.2","vulns":[]},
  {"name":"websockets","version":"17.1","vulns":[]},
  {"name":"aiofiles","version":"25.1.0","vulns":[]},
  ... (all listed vulns: [])
]}
=> "No known vulnerabilities found" on backend/requirements.txt
```

**Host-wide audit (for reference only, not the deployable image):**

```
$ pip-audit --desc --local
Found 42 known vulnerabilities in 4 packages   # on host's global Python 3.13 env
# Highlights (not in backend image): Pillow heap OOB (CVE-2026-* requiring 12.3.0),
# pip itself (GHSA-4xh5-x5gv-qwph requires 25.3/26.1+), soupsieve ReDoS, tornado DoS
# None of these are in backend/requirements.txt — backend image is clean.
```

Artifacts saved: `pip_audit.json` (host-wide, truncated in log), `pip_audit_backend2.json`.

### 6.2 `npm audit` / `bun audit`

```
$ where.exe bun; where.exe npm
# bun: NOT FOUND; npm: NOT FOUND on this runner
$ bun audit / npm audit --json
# => "not recognized" (Windows PowerShell, no Node toolchain)
```

**Finding:** Node audit was **not executable** in this environment. The repo's `package.json` pins `@supabase/supabase-js@^2.116.0`, `react@^19.0.1`, `vite@^8.3.0`, etc. but no `npm` was on PATH to evaluate. This is a **gap in CI** — audits must run in a container with `node`+`npm`/`bun` present (or via `osv-scanner`). Manual review notes:
- `vite@^8.3.0` maps to `8.x` (current latest 6.x is actually Vite 6; `8.3` is anomalously future-versioned — verify registry; if it's a placeholder, it should be `^5.3.0` / `^6.x`).
- No `package-lock` integrity check was performed.

**Severity: LOW** (process gap, not a confirmed vuln).

### 6.3 `bandit` (Python SAST on `backend/`)

```
$ bandit -r backend/ -f txt

Run started: 2026-09-24 08:09 IST
Total lines of code: 269

>> Issue: [B311:blacklist] random (x11)
   Location: backend/main.py:149,151,153,155,157,184(x2),273,279,289,291
   Severity: Low — random.random/uniform for heuristic scoring

>> Issue: [B104:hardcoded_bind_all_interfaces]
   Location: backend/main.py:303 uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
   Severity: Medium

Total issues: 11 Low, 1 Medium, 0 High
```

**Assessment:** `B311` is a **false positive** — `random` is used for demo/heuristic spoof scores, not for cryptographic nonces or tokens. No `B105` hard-coded password, no `B602` shell, no `B603` subprocess, no `B608` SQL injection. `B104` (bind `0.0.0.0`) is expected for containers but should be paired with a note that the container does not expose `reload=True` in production.

### 6.4 `gitleaks` / `trufflehog`

Not installed on this host. Equivalent manual checks performed per §1 (git log grep, working-tree grep for `eyJ`, `sk-`, `service_role`, `REALITY`, `HF_TOKEN`). No secret value found; placeholder/template values only. Recommend adding `gitleaks` to CI and pre-commit hook — see §8.

---

## 7. Cross-Cutting Findings Summary (with severity)

| # | Title | Severity | Exists today? | Tested? | Reference |
|---|---|---|---|---|---|
| S-01 | FastAPI & WebSocket have **no authentication** | CRITICAL | Yes | Code read + grep | §3.1, §3.6 |
| S-02 | Edge Function `verify_jwt = false` bypasses gateway | CRITICAL | Yes | `config.toml:418` | §4.5 |
| S-03 | CORS wildcard `allow_origins=["*"]` (backend) + Edge `Allow-Origin: *` | HIGH | Yes | `main.py:36`, `index.ts:6` | §3.2, §4.5 |
| S-04 | Unlimited upload size/type, unbounded `await file.read()`, no magic-byte check | CRITICAL | Yes | `main.py:121-135` | §3.3 |
| S-05 | Filename unsanitized (`file.filename` echoed & stored) | HIGH | Yes | `main.py:212,246` | §3.3 |
| S-06 | WebSocket: unlimited duration, message size, connections per user, no chunk validation | CRITICAL | Yes | `main.py:255-295` | §3.6 |
| S-07 | Demo mode client-controlled, pollutes real tables, no `is_demo` RLS isolation | HIGH | Yes | `DataContext:425`, `aiDetectionService:23` | §2.1 |
| S-08 | No "SIMULATED RESULT" banner on per-result views | HIGH | Yes | `AnalyzePage.tsx`, `AudioAnalysisPage.tsx` missing | §2.1 |
| S-09 | Sensitive data persisted in `localStorage` (analyses, voiceprints, alerts, auth) | HIGH | Yes | `DataContext:397-450` | §2.3 |
| S-10 | Hard-coded `DEMO_USER` auto-login; unauthenticated operation when Supabase unconfigured | HIGH | Yes | `AuthContext:19,32-44` | §2.1 |
| S-11 | No rate limiting or request timeout on any route | HIGH | Yes | No `slowapi` / `RateLimiter` | §3.5 |
| S-12 | `uvicorn.run(..., reload=True)` in prod path | MEDIUM | Yes | `main.py:303` | §3.4 |
| S-13 | `audit_logs` not provably insert-only (no REVOKE, no trigger) | MEDIUM | Yes | Migration 296-302 | §4.2 |
| S-14 | Storage: global 50MiB only, no per-bucket MIME allowlist or size cap | MEDIUM | Yes | Migration 334-360 | §4.4 |
| S-15 | Investigation notes RLS prevents collaboration (or leaks isolation assumption) | MEDIUM | Yes | Migration 276-284 | §4.3 |
| S-16 | Missing DELETE RLS where UI offers delete (divergent local vs Supabase behavior) | MEDIUM | Yes | Migration missing DELETE | §4.3 |
| S-17 | No CSP / secure headers (`Content-Security-Policy`, `X-Frame-Options`, `HSTS`) | MEDIUM | Yes | `index.html`, `vite.config.ts` | §2.6 |
| S-18 | Unsanitized ingest (filename, note length/content) — stored XSS low today but future risk | MEDIUM | Yes | `AlertsPage`, `InvestigationsPage` | §2.4 |
| S-19 | Backend `reality_defender_configured` boolean leaks key presence | LOW | Yes | `main.py:85` | §3.4 |
| S-20 | Voiceprint hash exposed to client; no server-side embedding custody; no delete-my-data | MEDIUM | Yes | `speaker_profiles.voiceprint_hash` | §5.1 |
| S-21 | Duplicated schema: `src/lib/supabase-schema.sql` vs `supabase/migrations/*.sql` — drift risk | LOW | Yes | Two identical schemas | §4 |
| S-22 | Node audit not runnable in this runner; `vite@^8.3.0` version suspicious | LOW | Yes | §6.2 | §6.2 |
| S-23 | `bandit B311` false positives on demo randomness | INFO | Yes | §6.3 | §6.3 |

**Secret leakage:** No secret value is currently committed (see §1.3). If any key was ever committed and rotated out, it would still reside in history — current history is clean, but future commits must be gated by `gitleaks`.

---

## 8. Fix Plan vs. Already Tested

> Requirement: *"Separate 'implemented and tested' from 'planned'."*

### 8.1 Implemented and tested (as of this audit — READ-ONLY step)

* **None.** This audit step intentionally made **zero code changes**. No migration was applied, no middleware added, no config flipped. All scanner outputs above are **before** state.

### 8.2 Planned (STEP 2, in severity order — not yet started, waiting for "continue")

The following is the intended fix order for the next step. Each item will be presented as a **diff** for review before editing, per CONTEXT rules.

1. **Secrets & rotation guidance** — Add `.env.example` entries for every `env()` in `config.toml`; add `.gitignore` for `backend/.env`; add `gitleaks` CI check; document which keys to rotate if they were ever committed (none found, so no rotation required today — but add detection so future leaks are caught).
2. **FastAPI: JWT on every route except `GET /health`** — Add `fastapi.security.HTTPBearer` dependency, verify Supabase JWT via `supabase-py` or `PyJWT` with `SUPABASE_JWT_SECRET`, return generic `401/403`. Pin CORS to the real frontend origin (`https://<your-domain>`, plus `http://localhost:3000` for dev via env), remove `allow_credentials` wildcard conflict.
3. **FastAPI: upload hardening** — `UploadFile` size cap (e.g., 10 MiB), extension allowlist (`wav, mp3, m4a, flac, ogg, webm`), magic-byte sniff (`file`/`python-magic`), `max_duration` check after trusted decode, sanitize filename (`pathlib.Path(name).name[:64]`, allowlist `[A-Za-z0-9._-]`), generic error messages (`"Invalid audio file"` not leak).
4. **FastAPI: rate limiting & timeouts** — `slowapi` (or `fastapi-limiter` + Redis) per-IP `10 uploads/min`, `30 health/min`; request timeout middleware `30s`; WebSocket idle timeout `60s` and max session `15 min`.
5. **WebSocket: authenticate + cap** — Require `?token=<JWT>` or `Authorization: Bearer` on upgrade, reject before `accept()`, enforce per-user connection cap (e.g., 2), cap message size (`receive_bytes(max=1MiB)`), validate chunk format (binary PCM length multiple, sample rate hint), close with `1008 Policy Violation` on abuse.
6. **Demo mode: impossible in production** — Gate by `import.meta.env.PROD` (Vite) — `demoMode = !import.meta.env.PROD && import.meta.env.VITE_ENABLE_DEMO_MODE === 'true'`; never call `supabase.from(...).insert` when `demoMode` is true; add DB policy `WITH CHECK (is_demo = false)` or separate `demo_*` tables; UI: add persistent "SIMULATED RESULT — not forensic evidence" banner whenever `analysis.is_demo === true` or `model_version` contains heuristic marker.
7. **Frontend: stop sensitive `localStorage`** — Remove `voiceshield_*` persistence; keep Supabase as source of truth with React Query / `supabase` cache only; if offline cache is needed, use `sessionStorage` + TTL + encryption-at-rest note, and clear on sign-out. Sanitize ingest (filename allowlist, note `maxLength 2000`, strip control chars) and render via text nodes only (already true — document it as policy).
8. **Frontend: CSP & secure headers** — Add `vite-plugin-csp` or inject `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.realitydefender.com; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'">` plus `vite.config.ts` dev-header middleware for `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`. For production, document reverse-proxy headers (`Strict-Transport-Security`, `Permissions-Policy`).
9. **Supabase: RLS hardening** — Migration to: REVOKE UPDATE/DELETE on `audit_logs` from `authenticated, anon`; add trigger `BEFORE UPDATE OR DELETE` that raises exception; add missing DELETE policies or explicitly revoke where delete is not allowed; add `is_demo` segregation policy; fix `investigation_notes` sharing by introducing `organization_id` or `investigation_members` join table and rewriting policy to `EXISTS (SELECT 1 FROM investigation_members WHERE investigation_id = notes.investigation_id AND user_id = auth.uid())`.
10. **Supabase: storage hardening** — Migration to set per-bucket `file_size_limit` (e.g., `voice-reference-audio: 10MiB`, `analysis-audio: 25MiB`, `reports: 5MiB`) and `allowed_mime_types`; add `AFTER DELETE` trigger on `speaker_profiles` to delete corresponding storage object prefix; optionally enable `pgsodium` column encryption for `phone_number`/`notes`.
11. **Voiceprints: server-side custody** — When real embeddings land, store in `speaker_embeddings` table with `REVOKE SELECT` from `authenticated` (server-role only), never return column; add `DELETE /me/data` RPC that deletes `profiles`, `speaker_profiles`, and storage folder, and `VACUUM`; document in `docs/THREAT_MODEL.md` and README Security section.
12. **Backend deployment: non-root Docker + secrets via host** — Add `backend/Dockerfile` (`FROM python:3.12-slim`, `RUN useradd -m appuser`, `USER appuser`, `EXPOSE 8000`, `CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]` sans `--reload`), `docker-compose.yml` with `env_file: .env` not baked into image, and `README` notes for secret injection via host env / Supabase Vault.
13. **Tests (STEP 3)** — `pytest` suite covering: missing/invalid JWT → 401/403; oversized file → 413; wrong MIME → 415; corrupted audio (bad header) → 400 generic; rate-limit → 429; WS without token → 1008 close; RLS tests with two users via `supabase-py` + `service_role` `CREATE USER` fixture; re-run `pip-audit`, `npm audit`, `bandit`, `gitleaks` and record before/after deltas.
14. **Docs (STEP 4)** — `docs/THREAT_MODEL.md` (voice cloning, replay, adversarial audio, API abuse, insider, leakage) with mitigated/tested/planned per threat, plus README Security section linking the audit.

---

## 9. What the repo does well (preserve)

- `.gitignore` correctly ignores `.env*` and keeps `.env.example` tracked.
- Backend secret naming avoids `VITE_` prefix and loads via `python-dotenv` + `os.getenv`.
- Frontend correctly uses the Supabase **anon** key, not `service_role`.
- No `dangerouslySetInnerHTML` / `innerHTML` usage.
- Supabase storage buckets are private and folder-isolated by `storage.foldername`.
- Edge Function does read `REALITY_DEFENDER_API_KEY` from `Deno.env` (secret store), not from client.
- Backend `pip-audit` is **clean** (0 vulns on `requirements.txt`).
- `bandit` finds no high-severity issues.

---

## 10. Immediate asks before STEP 2

1. **Confirm production origin(s)** for CORS allowlist (e.g., `https://voiceshield.example.com`, `http://localhost:3000` for dev).
2. **Confirm max upload policy** you want enforced (suggested: 10–25 MiB, 5 min max duration, MIME `audio/*` only).
3. **Confirm demo-mode posture:** Should demo be **completely absent** from production builds (`import.meta.env.PROD` gate), or visible but server-isolated behind a feature flag?
4. **Confirm investigation sharing model:** per-user isolation (current) vs organization/team (requires schema change). Decision blocks the RLS fix for `investigation_notes`.
5. **Approve the diff-before-edit workflow** — next message will contain the first patch (secrets/.gitignore + CORS + upload limits) as a unified diff for review.

---

## 11. Reproduction commands (auditor ran these for real)

```bash
git log --all --oneline
git ls-files
grep -R "VITE_" .env.example src/
grep -R "service_role|REALITY|HF_TOKEN" --include="*.ts" --include="*.py" --include="*.toml"
grep -R "localStorage|dangerouslySetInnerHTML|innerHTML" src/
grep -R "allow_origins|CORSMiddleware|verify_jwt|file_size_limit|allowed_mime" backend/ supabase/
pip install pip-audit bandit -q
pip-audit -r backend/requirements.txt --format=json
bandit -r backend/ -f txt
```

Outputs are quoted in §§1–6 above; full logs are in the runner's shell transcript and in `pip_audit_backend2.json`.

---

*End of STEP 1 — awaiting "continue" before any edits. No files have been modified.*
