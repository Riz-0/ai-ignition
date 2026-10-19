# Launch Guide — Taking 2am Shoppers from web to installed app

This is the external, step-by-step checklist for turning the current web app
(`app/frontend`, a Vite + React PWA) into something a real user installs on a
phone, with a QR code that sends them there. Everything in the codebase is
already wired for this (manifest, service worker, install prompt, `/download`
page, QR generator). This guide is about the **non-code** work.

Two tracks are described:
- **Track A — PWA (fastest, what's built today)**: install from the browser, no
  store approval needed. Good for the hackathon demo and an early pilot.
- **Track B — Native store apps (production)**: wrap the same PWA for Google Play
  (TWA) and the App Store (Capacitor). Same UI, real store listing.

---

## Track A — Ship the PWA (days, not weeks)

The PWA is already installable from Chrome / Edge / Safari. To make it
reachable by a phone via the QR code you need a public HTTPS URL.

### A1. Pick a host and deploy the frontend

The frontend is a static bundle (`npm run build` → `dist/`). Any static host
works. Pick one:

| Host | Why | Command |
|------|-----|---------|
| **Netlify** | Free HTTPS, drag-and-drop `dist/`, zero config | `npm run build` then drag `dist/` onto app.netlify.com |
| **Vercel** | First-class Vite support, auto HTTPS | `npx vercel --prod` inside `app/frontend` |
| **GitHub Pages** | Free, lives with the repo | Push `dist/` to a `gh-pages` branch (use `vite-plugin-gh-pages`) |
| **AWS S3 + CloudFront** | Scale, custom domain, cheap | `aws s3 sync dist/ s3://your-bucket --delete` |

**Output of this step:** a public URL like `https://2am-shoppers.netlify.app`.

### A2. Make sure HTTPS is on

PWAs **require HTTPS** for service-worker registration and the install prompt.
Netlify / Vercel / GitHub Pages give you this automatically. On a custom host
(S3, EC2) add an SSL certificate — Let's Encrypt via `certbot`, or AWS
Certificate Manager with CloudFront. `localhost` is the only HTTP exception,
and that's only for local dev.

### A3. Verify the install criteria

Open the deployed URL in Chrome on desktop and run Lighthouse → PWA audit, or
check manually. The app must have:

- [x] `manifest.webmanifest` with `name`, `start_url`, `display: standalone`,
  and icons (192 + 512 + a maskable 512) — already in `public/`.
- [x] A registered service worker with a fetch handler — `public/sw.js`,
  registered in `src/main.jsx`.
- [x] HTTPS (A2).
- [ ] A theme-color meta tag — already in `index.html`. Set the color you want
      shown in the phone's status bar.

If Lighthouse flags the maskable icon, regenerate `public/icon-maskable-512.png`
with more padding around the "2am" mark (the current one is full-bleed, which is
fine, but some Android launchers crop tighter).

### A4. Point the QR code at the deployed URL

Two QR codes exist:

1. **On the presentation website** (`website/index.html`, the `#get-app`
   section). It currently encodes `http://localhost:3003/download`. For a live
   demo served from your laptop's LAN IP, the script already swaps in the LAN
   host automatically (`website/script.js`, the `appUrl()` function). For a
   **deployed** app, replace the default in that function:
   ```js
   return 'http://localhost:3003/download';  // → 'https://2am-shoppers.netlify.app/download'
   ```
2. **In the app** (`/download` page, `src/pages/DownloadPage.jsx`). It encodes
   its own `window.location.href`, so once it's deployed it encodes the deployed
   URL automatically — no change needed.

Both use `api.qrserver.com` for the image. If you want the QR rendered without
the external dependency, swap `src/components/QRCode.jsx` for a local generator
(e.g. `qrcode.react`) — the component API stays the same.

### A5. Test the install flow on each platform

- **Android (Chrome):** open the URL → menu (⋮) → **Install app**. Confirm it
  appears in the launcher, opens standalone (no browser chrome), and the
  `/download` page shows "App installed" instead of the install button.
- **iPhone (Safari):** open the URL → Share → **Add to Home Screen**. iOS
  Safari does **not** fire `beforeinstallprompt`, so the install button won't
  show — the on-page steps are the path. Verify the `apple-touch-icon` appears
  on the home screen.
- **Desktop (Chrome/Edge):** click the install icon (⊕) in the address bar.
  App opens in a standalone window.

### A6. Optional: enable Web Push notifications

The spec calls for casual push notifications (payday reminders, replenishment
prompts). The PWA service worker is in place; to actually deliver pushes you
need:

1. Generate VAPID keys: `npx web-push generate-vapid-keys`.
2. Add the public key to the frontend and subscribe on the customer side
   (`Notification.requestPermission()` + `serviceWorker.pushManager.subscribe`).
3. Send pushes from the backend with the `web-push` library (Node) using the
   private key. The backend already has a reminders route (`/api/reminders`)
   to hook this into.
4. Store subscription endpoints per user in the database.

This is optional for the MVP — in-app notification cards already work without
it. Add it when the demo moves to a pilot with real users.

---

## Track B — Native store apps (production)

Same React UI, packaged so it can be listed in the App Store and Google Play.

### B1. Google Play (Trusted Web Activity — easiest)

A TWA wraps the deployed PWA and ships it as an APK/AAB. No code changes.

1. Install **Bubblewrap** (Google's CLI for TWAs):
   `npm i -g @bubblewrap/cli`.
2. Initialise against the deployed URL:
   `bubblewrap init --manifest https://2am-shoppers.netlify.app/manifest.webmanifest`.
3. Answer the prompts (package id e.g. `com.twoam.shoppers`, app name, icons
   are pulled from the manifest).
4. Build: `bubblewrap build` → produces an `.aab` signed with a generated key.
5. Create a Google Play Developer account (**one-time $25 fee**), then upload
   the `.aab` to the Play Console, fill in the store listing, and submit for
   review (typically 1–3 days).

### B2. App Store (Capacitor)

iOS doesn't support TWAs the same way, so wrap the web app with Capacitor
(keeps the same React build, adds native bridges for camera, push, etc.).

1. `npm i @capacitor/core @capacitor/cli @capacitor/ios` inside `app/frontend`.
2. `npx cap init "2am Shoppers" com.twoam.shoppers --web-dir=dist`.
3. Build the web app: `npm run build`, then `npx cap add ios`.
4. Open in Xcode: `npx cap open ios`. Configure signing with an Apple Developer
   account (**$99/year**).
5. Add native capabilities as needed: `@capacitor/push-notifications`,
   `@capacitor/camera` (for receipt import), `@capacitor/preferences`
   (native keychain storage instead of localStorage).
6. Archive → upload to App Store Connect → submit for review (typically
   1–2 days). Apple is stricter than Google on: private API use, in-app
   purchase for any paid feature, and data-handling disclosures.

### B3. Consider whether you need native at all

For the hackathon and an early pilot, the PWA alone is enough — it installs,
works offline, supports push. Only move to Track B when you need:
- An App Store / Play Store listing for discoverability and trust.
- Native-only features (e.g. the iOS Wallet, background location, health data).
- A guaranteed icon in the launcher without the user doing the "Add to Home
  Screen" dance.

---

## Eslitec / MantaGO partnership steps

The website's **Eslitec** section lays out the product pitch (shopper-side
companion to MantaGO). To actually entice Eslitec to onboard the idea, the
external steps are:

1. **Secure an intro.** Eslitec's BD lead is Lydia Pan (Business Development
   Manager, listed on eslitec.com). Approach via the Eslitec contact form or a
   warm intro. Frame as "a shopper-side complement to MantaGO that increases
   repeat-purchase rates" — the metric they already sell against.
2. **Run a joint discovery session.** Bring the demo (admin: `user` /
   `password`) plus the `2amdepoloyers.md` brief. Map each 2am Shoppers feature
   to a MantaGO capability (the table in section 3 of the brief does this).
   Ask: which MantaGO channels would carry our reminders? Where does consent
   get stored — MantaGO's CRM or our app?
3. **Agree the data boundary in writing.** The brief's privacy rule is hard:
   shopper budgets, allowances and goal balances never go to the merchant CRM.
   Get Eslitec to agree this before any technical integration, because it
   shapes the API contract.
4. **Request a sandbox MantaGO account.** Build against MantaGO's APIs for
   journey state and messaging (LINE / WhatsApp etc.). Validate the message
   format and rate limits before shipping.
5. **Run a joint pilot with one Eslitec merchant.** Use the fictional coffee
   merchant from the MVP, but with one real Eslitec merchant's catalogue and
   customer list. Measure repeat-purchase rate and retention over 4–6 weeks.
6. **Co-publish the case study.** Eslitec markets with stories (their news
   section references DIGITIMES coverage). A joint case study is the asset
   that turns "proposed concept" into "validated integration".

---

## Privacy, compliance and the savings ledger

Before any public launch, handle these externally:

1. **Privacy policy.** The app records discretionary spending, savings goals
   and connected-platform links. Publish a policy covering what's stored
   locally (localStorage today) vs. on a server (when the backend is live).
2. **PDPA / GDPR / APPI.** Target markets are Taiwan, Thailand, Japan,
   Singapore, EU. Each has its own personal-data law; Thailand's PDPA and
   Japan's APPI are the most relevant to Eslitec's expansion markets. A
   single consent screen at signup covering "what we store and why" is the
   minimum.
3. **Financial disclaimer.** The savings workspace is a planning ledger —
   money is not moved. State this clearly in-app (already done) and in the
   store listing so reviewers don't classify the app as a financial product.
4. **Receipt import.** If receipt OCR is added later, the user must confirm
   extracted amounts before they update spending (the spec requires this).
   Build the confirm step into the import flow before going live.

---

## Pre-launch external checklist (summary)

- [ ] Deploy frontend to a static host with HTTPS (A1–A2).
- [ ] Lighthouse PWA audit passes on the deployed URL (A3).
- [ ] QR code on the website points at the deployed `/download` URL (A4).
- [ ] Install tested on Android Chrome, iOS Safari, desktop Chrome (A5).
- [ ] Domain purchased (e.g. `2amshoppers.app`) and pointed at the host.
- [ ] Privacy policy published and linked from the app and store listing.
- [ ] (Optional) Web Push VAPID keys generated and wired (A6).
- [ ] (Track B) Bubblewrap TWA built and submitted to Google Play (B1).
- [ ] (Track B) Capacitor iOS build submitted to App Store (B2).
- [ ] (Eslitec) Intro booked, data-boundary agreement drafted, sandbox MantaGO
      account requested.

When the box at A1 is ticked and the QR points at a real HTTPS URL, the
"scan QR → install app" loop works end to end — everything else is polish and
scale.
