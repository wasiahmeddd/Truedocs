# AI HANDOFF DOCUMENT — Govt-Cards-Organizer
> Last updated: 2026-04-05 10:42 IST
> Previous AI: Claude Opus 4.6 (via Antigravity/Gemini Code Assist)

---

## PROJECT OVERVIEW

**What this app is:** A personal encrypted vault for storing scans of government ID cards (Aadhaar, PAN, Voter ID, etc.) organized by family member. Also stores crypto seed phrases. All files are AES-256-GCM encrypted at rest.

**Tech stack (current - desktop/server version):**
- Frontend: React 18 + Vite + Tailwind CSS 3 + Framer Motion + shadcn/ui (Radix)
- Backend: Express 5 (Node.js) 
- Database: PostgreSQL via Drizzle ORM
- Auth: bcryptjs + express-session
- Encryption: Node.js `crypto` module (AES-256-GCM, scryptSync key derivation)
- Router: `wouter` (not react-router)
- State: TanStack React Query (no Redux)
- Icons: `lucide-react`

**Database connection:**
```
DATABASE_URL=postgresql://postgres:Wa12si34@localhost:5432/govt_cards
```

**Run command:** `npm run dev` (uses `tsx watch server/index.ts`)
**LAN access:** Server configured on `0.0.0.0:3000`, accessible at `http://192.168.1.8:3000`

---

## CURRENT STATE — What Has Been Done

### ✅ Mobile UI Redesign (COMPLETED)
All pages now have dual layouts using Tailwind responsive classes:
- `hidden md:flex` / `hidden md:block` = Desktop UI (original, untouched)
- `md:hidden` = Mobile UI (new "Obsidian Vault" dark theme)

**Design system:** Slate-950 backgrounds, blue-400/cyan-400/emerald-400 accents, frosted glass headers, rounded-2xl cards.

**Pages completed:**
- `client/src/pages/Home.tsx` — Bento grid dashboard
- `client/src/pages/CardsList.tsx` — Card type list
- `client/src/pages/CardsByType.tsx` — Cards grouped by person
- `client/src/pages/PeopleList.tsx` — People list with avatars
- `client/src/pages/PersonDetail.tsx` — Profile with prev/next navigation
- `client/src/pages/FileViewer.tsx` — Document viewer with external open fallback
- `client/src/pages/Auth.tsx` — Login/Register with framer-motion animations (palette updated to blue/cyan)

### ✅ Global Mobile Navigation (COMPLETED)
- Created `client/src/components/MobileNav.tsx` — persistent bottom nav bar
- Added to `client/src/App.tsx` — renders on all pages except auth/landing/admin
- All mobile pages have `pb-24` to avoid content being hidden behind nav
- Active tab highlights with colored icons (blue=Home, cyan=Cards, emerald=People)

### ✅ Auth Page Palette Refinement (COMPLETED)
- Changed from purple/blue gradients to blue/cyan/emerald to match vault theme

---

## WHAT NEEDS TO BE DONE — Implementation Plan

### Phase 1: Quick UI Fixes (DO FIRST)

#### 1.1 Remove "Secure Database Encrypted" box from Home
**File:** `client/src/pages/Home.tsx` lines 250-257
**Action:** Delete or replace this bento box — it's meaningless filler:
```tsx
{/* Recent Activity / Small Insight */}
<div className="bg-slate-900 rounded-xl p-6 relative flex flex-col justify-between aspect-square border border-slate-800">
  <Clock className="text-emerald-400 h-8 w-8" />
  <div>
    <span className="font-bold text-2xl text-slate-200">Secure</span>
    <p className="text-slate-400 text-[10px] mt-1 sm:text-xs">Database Encrypted</p>
  </div>
</div>
```
Replace with a "Settings" shortcut or just remove it entirely.

#### 1.2 Redesign CardsList Mobile Header
**File:** `client/src/pages/CardsList.tsx` lines 111-124
**Problem:** The header says "Document Types" — too generic and cramped.
**Action:** Redesign to a sleeker header. Example:
- Centered title "Card Vault"
- Action buttons spread evenly
- Remove the `<ArrowLeft>` back button (global nav handles it now)

#### 1.3 Add documentNumber and documentName to Cards Schema
**File:** `shared/schema.ts` line 43-50
**Action:** Add two nullable text fields to the `cards` table:
```ts
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull(),
  type: text("type").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name"),
  title: text("title"),
  documentNumber: text("document_number"),  // NEW — e.g. "1234 5678 9012"
  documentName: text("document_name"),      // NEW — e.g. "Wasi Ahmed"
});
```
**IMPORTANT:** After modifying, run `npm run db:push` to sync with PostgreSQL.

Also update `InsertCard` type (auto-derived from schema, should work automatically with Drizzle).

#### 1.4 Add Input Fields in Upload Dialogs
**Files:** 
- `client/src/components/AddCardDialog.tsx` — Add "Card Number" and "Name on Card" inputs
- `client/src/components/GlobalAddCardDialog.tsx` — Same inputs

In the form submission, include these in the FormData:
```ts
if (data.documentNumber) formData.append("documentNumber", data.documentNumber);
if (data.documentName) formData.append("documentName", data.documentName);
```

**Server route** (`server/routes.ts` line 259-264) also needs updating to read these:
```ts
const card = await storage.createCard({
  personId,
  type,
  title: req.body.title || undefined,
  filename: storageFilename,
  originalName: req.file.originalname,
  documentNumber: req.body.documentNumber || undefined,  // NEW
  documentName: req.body.documentName || undefined,      // NEW
});
```

#### 1.5 Show Metadata on Card Face with Copy Buttons
**File:** `client/src/components/CardItem.tsx`
**Action:** Below the card title, show `documentNumber` and `documentName` with tap-to-copy icons directly on the card — no need to open the metadata dialog.

---

### Phase 2: Offline Storage Layer (CORE REWRITE)

**Goal:** Make the app work 100% offline by replacing all server API calls with IndexedDB.

#### 2.1 Install Dependencies
```bash
npm install dexie
# bcryptjs is already installed
# @capacitor/core and @capacitor/android will be added in Phase 3
```

#### 2.2 Create Local Database
**New file:** `client/src/lib/local-db.ts`
- Use Dexie.js to define IndexedDB tables mirroring the PostgreSQL schema
- Tables: users, people, cards, cardTypes, cryptoWallets, files (for encrypted blobs)

#### 2.3 Create Browser-Compatible Encryption
**New file:** `client/src/lib/local-crypto.ts`
- Use Web Crypto API (`SubtleCrypto`)
- Key derivation: `PBKDF2` with 100,000 iterations (replaces Node's `scryptSync`)
- Encryption: `AES-256-GCM` (same algorithm, just browser-native implementation)
- Functions: `deriveKey(password, salt)`, `encryptBlob(data, key)`, `decryptBlob(encrypted, key)`

**IMPORTANT NOTE:** The server uses `scryptSync` with a hardcoded salt (`'fixed_salt_for_simplicity_govt_cards'`). The browser doesn't have scrypt natively. The offline app uses PBKDF2 instead. This means **files encrypted on the server CANNOT be directly decrypted in the APK** — they are separate vaults.

#### 2.4 Create Storage Mode Context
**New file:** `client/src/lib/storage-mode.ts`
- React context that provides `mode: "server" | "local"`
- Detection logic:
  - If `window.Capacitor` exists → "local" (running as APK)
  - If fetch to `/api/user` fails with network error → "local"
  - Otherwise → "server"

#### 2.5 Modify Auth Context
**File:** `client/src/context/AuthContext.tsx`
- In "local" mode: 
  - Login → hash password with bcryptjs → compare with stored hash in IndexedDB
  - Register → hash + store in IndexedDB
  - Store derived encryption key in memory (NOT IndexedDB)
- In "server" mode: existing behavior unchanged

#### 2.6 Modify Hooks
**File:** `client/src/hooks/use-people.ts`
- In "local" mode: CRUD operations against Dexie `people` table
- In "server" mode: existing fetch calls

**File:** `client/src/hooks/use-cards.ts`
- In "local" mode: 
  - Create: encrypt file with Web Crypto → store blob in `files` table + metadata in `cards` table
  - Delete: remove from both tables
  - List: query Dexie
- In "server" mode: existing fetch calls

#### 2.7 Modify FileViewer
**File:** `client/src/pages/FileViewer.tsx`
- In "local" mode: read blob from IndexedDB → decrypt → create blob URL
- In "server" mode: existing fetch

---

### Phase 3: Android APK (Packaging)

#### 3.1 Capacitor Setup
```bash
npm install @capacitor/core @capacitor/android
npx cap init "TrueDocs" "com.wasi.truedocs"
npx cap add android
```

**New file:** `capacitor.config.ts`
```ts
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.wasi.truedocs',
  appName: 'TrueDocs',
  webDir: 'dist/public',  // Vite output directory
  server: { androidScheme: 'https' }
};
export default config;
```

#### 3.2 Build Script
Add to `package.json`:
```json
"cap:build": "npm run build && npx cap sync android"
```

The Vite build needs to output the frontend as a standalone SPA (no SSR, no server).

#### 3.3 GitHub Actions Workflow
**New file:** `.github/workflows/build-apk.yml`
```yaml
name: Build Android APK
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - run: npm ci
      - run: npm run build
      - run: npx cap sync android
      - name: Build APK
        working-directory: android
        run: ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: truedocs-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## KEY FILES MAP

```
├── client/src/
│   ├── App.tsx                    — Router + global providers
│   ├── components/
│   │   ├── MobileNav.tsx          — Global bottom navigation (mobile only)
│   │   ├── CardItem.tsx           — Individual card display + actions
│   │   ├── AddCardDialog.tsx      — Add card to specific person
│   │   ├── GlobalAddCardDialog.tsx— Add card from anywhere
│   │   ├── ChangePasswordDialog.tsx
│   │   ├── ProfileDialog.tsx
│   │   ├── CryptoWalletDrawer.tsx
│   │   ├── TransferAllDataCard.tsx
│   │   └── ui/                    — shadcn/ui components
│   ├── context/
│   │   └── AuthContext.tsx         — Auth state management
│   ├── hooks/
│   │   ├── use-cards.ts            — Card CRUD (currently fetches from server)
│   │   ├── use-people.ts           — People CRUD (currently fetches from server)
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── queryClient.ts          — TanStack Query config
│   │   ├── card-config.ts          — Card type icon/color mapping
│   │   ├── icon-map.ts             — Dynamic icon resolver
│   │   ├── share-util.ts           — Share/export utility
│   │   └── bip39Dict.ts            — Crypto wallet word list
│   └── pages/
│       ├── Home.tsx                — Dashboard (dual layout)
│       ├── Auth.tsx                — Login/Register
│       ├── CardsList.tsx           — Card types list
│       ├── CardsByType.tsx         — Cards of one type
│       ├── PeopleList.tsx          — All people
│       ├── PersonDetail.tsx        — One person's profile + cards
│       ├── FileViewer.tsx          — PDF/image viewer
│       ├── Landing.tsx             — Public landing page
│       └── AdminDashboard.tsx      — Admin panel
├── server/
│   ├── routes.ts                   — All Express API routes (1086 lines)
│   ├── storage.ts                  — PostgreSQL data access layer
│   ├── encryption.ts               — AES-256-GCM encrypt/decrypt
│   ├── auth.ts                     — Passport.js + session auth
│   ├── db.ts                       — Drizzle PostgreSQL connection
│   └── index.ts                    — Server entry point
├── shared/
│   ├── schema.ts                   — Drizzle table definitions + types
│   └── routes.ts                   — API route definitions + Zod schemas
└── package.json
```

## CRITICAL IMPLEMENTATION NOTES

1. **Routing:** Uses `wouter`, NOT react-router. Links are `<Link href="/path">`, hooks are `useRoute`, `useLocation`.

2. **Responsive strategy:** Desktop UI wrapped in `hidden md:block`, Mobile UI wrapped in `md:hidden`. Both exist in same component. Do NOT delete desktop code.

3. **Mobile design system:** Slate-950 bg, blue-400/cyan-400/emerald-400 accents, `backdrop-blur-xl` headers, `rounded-2xl` cards, `font-sans antialiased`.

4. **User's password:** Recovered via brute-force. App user is `wasi`. Database password is `Wa12si34`.

5. **All pages must have `pb-24`** in mobile containers to account for the fixed bottom MobileNav.

6. **The `shared/routes.ts` file** defines API routes + Zod validation schemas used by both server and client hooks. When adding new fields, update both the schema and the route definitions.

7. **File encryption flow (server):**
   - Upload: `multer` (memory) → `encrypt(buffer, sessionKey)` → write JSON to `pdfs/` folder
   - Download: read JSON → `decrypt(data, sessionKey)` → send as PDF
   - Session key = `crypto.scryptSync(password, userSalt, 32).toString('hex')`

8. **The `ThemeToggle` component** is rendered globally in App.tsx. It handles light/dark mode for desktop. The mobile UI forces dark mode via Tailwind classes.

## PROGRESS TRACKER

- [x] Mobile UI for Home page
- [x] Mobile UI for CardsList page  
- [x] Mobile UI for CardsByType page
- [x] Mobile UI for PeopleList page
- [x] Mobile UI for PersonDetail page
- [x] Mobile UI for FileViewer page
- [x] Mobile UI for Auth page (palette refinement)
- [x] Global MobileNav component
- [x] Fix duplicate useEffect in FileViewer.tsx
- [x] **Phase 1.1:** Remove "Secure Database Encrypted" box from Home
- [x] **Phase 1.2:** Redesign CardsList mobile header
- [x] **Phase 1.3:** Add documentNumber/documentName to schema
- [x] **Phase 1.4:** Add metadata input fields to upload dialogs
- [x] **Phase 1.5:** Show metadata on CardItem face with copy buttons
- [x] **Phase 2.1:** Install Dexie.js
- [x] **Phase 2.2:** Create local-db.ts (IndexedDB schema)
- [x] **Phase 2.3:** Create local-crypto.ts (Web Crypto API)
- [x] **Phase 2.4:** Create storage-mode.ts context
- [x] **Phase 2.5:** Modify AuthContext for local mode
- [x] **Phase 2.6:** Modify use-people.ts for local mode
- [x] **Phase 2.7:** Modify use-cards.ts for local mode
- [x] **Phase 2.8:** Modify FileViewer for local mode
- [x] **Phase 3.1:** Set up Capacitor
- [x] **Phase 3.2:** Create build scripts
- [x] **Phase 3.3:** Create GitHub Actions workflow
- [ ] **Phase 3.4:** Test APK build
