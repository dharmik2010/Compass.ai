# Voyage AI — Plan Smarter. Travel Better.

Voyage AI is a premium full-stack travel planner dashboard that integrates a **deterministic engine** (geospatial route calculation, budget expense math, weather API mapping, and Atlas Vector Discovery Cosine similarity) with a **generative engine** (Gemini AI LLMs running strictly in JSON output mode).

Features include:
1. **Glassmorphic Theme**: Sleek dark mode visual aesthetics inspired by Notion, Stripe, and Airbnb.
2. **Interactive Form Onboarding**: Split wizard alongside a conversational AI parser mapping tags in real-time.
3. **Self-Healing State Machine**: WebSocket alerts atomically mutating weather fallbacks and budget ledgers.
4. **Resilient AI Pipelines**: Strict schema validators capturing malformed JSON outputs, triggering auto-retries or fallbacks.

---

## Technical Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Leaflet Maps
- **Backend**: Node.js, Express, TypeScript, Socket.io (WebSockets), JSON Schema Validators
- **Database**: MongoDB (Mongoose) + Automatic In-Memory array fallback when offline.
- **Generative AI**: Google Gemini AI (Google Generative AI SDK)

---

## Quick Start Setup

### 1. Configure Environments
Create a `.env` configuration file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/voyage-ai
JWT_SECRET=voyage-ai-super-secret-key-123456
GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If no MONGODB_URI or GEMINI_API_KEY are provided, the system auto-boots in **Simulated Mode**, using high-fidelity local database matrices and vector cosine scoring in-memory.*

### 2. Install Workspaces
From the root directory, install all workspace packages concurrently:
```bash
npm install
```

### 3. Run Development Servers
Start both backend API and frontend Vite servers concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:3000`
- **Backend Server**: `http://localhost:5000`

---

## Walkthrough Verification Checklist (Definition of Done)

Follow these steps to demonstrate the premium features to judges:

### 1. Authentication & OTP Verification
1. Open the signup screen (`/register`). Create a new traveler account.
2. Observe the **Backend API Console logs**. You will see the registration verification OTP code print to stdout (e.g. `[MOCK MAIL SERVICE] Code: 489215`).
3. Enter the OTP code. The token cookies are set and you land on the command dashboard.
4. *Admin Account Override*: Register or login with an email containing the word `"admin"` (e.g. `admin.user@voyage.com`). The system automatically flags you with role `'admin'` so you can unlock the Admin Panel!

### 2. Conversational Planner Sync
1. Open the multi-step planner page (`/planner`).
2. Type in the Chat Assistant: `"Plan a budget-friendly couple trip to Tokyo. I need vegetarian food options."`
3. Notice that:
   - The Destination dropdown in Step 1 syncs to **Tokyo**.
   - The Travelers limit in Step 2 updates.
   - The Diet preference in Step 4 switches to **Vegetarian**.
4. Click **Generate Itinerary** to trigger vector search candidate matching.

### 3. Live Self-Healing Weather Alert Disruption
1. Open your generated Trip itinerary details page.
2. Inspect the **Leaflet Polyline routes** connecting lodging to attractions, the Recharts budget bar charts, and the packing checklist.
3. Click the red button: **"Simulate Rain Alert"** in the top navbar.
4. Instantly observe:
   - Outdoor events are re-routed to museum alternatives.
   - A warning notification is broadcast over WebSockets, displaying an alert overlay.
   - An **Umbrella** item is automatically appended to the packing checklist.
   - Budget cost totals update.
   - Map routing markers and dashed lines adjust.
   - *This happens in real time without refreshing the page!*

### 4. Catching Malformed LLM Responses
1. Go to the Admin Panel (`/admin`).
2. Examine the list of prompt logs displaying token allocations and execution status.
3. Navigate back to `/planner`. Check the step 4 checkbox: **"Simulate Malformed LLM Schema Response"** and generate.
4. Inspect the Admin logs again. You will see a `FAILED_FALLBACK` log capturing the malformed JSON structural validation catch, demonstrating how the app avoids crashes by reverting to last-known-good states.
