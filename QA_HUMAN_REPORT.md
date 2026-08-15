# Human Exploratory QA Report

**Date:** 2026-08-10
**Target:** `http://localhost:5173/`
**Method:** Playwright 1.62.1 with Chromium headless, real clicks and form submissions
**Scope:** Home, public office navigation, login/validation, role guards, console/network errors, responsive/basic usability

## Executive Summary

The server was reachable and public pages rendered. Public office selection navigated to the expected AR route. The primary release blocker is that the browser login flow returns HTTP 500 for both invalid and valid seeded credentials because the backend rejects the browser origin with CORS. This prevented authenticated role and dashboard testing.

## Confirmed Findings

### QA-HUMAN-001: Browser login is blocked by a server-side CORS 500

**Priority:** P0 / Blocker

**Reproduction:**

1. Open `http://localhost:5173/login` in Chromium.
2. Enter `admin` and `wrong-password`; click **Sign in**.
3. Observe `Internal Server Error` in the page.
4. Replace the password with seeded `admin123`; click **Sign in** again.

**Expected:** Invalid credentials should produce a normal authentication error without a server error; valid seeded credentials should establish a session and navigate to the admin area.

**Actual:** Both attempts remain on `/login` and display `Internal Server Error`. Captured response: `500 POST http://localhost:5173/api/users/login`, body `{"message":"CORS: origin http://localhost:5173 not allowed"}`.

**Impact:** No user can authenticate through the tested browser origin. Admin, staff, and security role guards, dashboards, and authenticated workflows cannot be reached.

**Evidence:** `qa-human-evidence/06-invalid-login.png`, `qa-human-evidence/07-admin-login.png`, and `qa-human-evidence/observations.json` entries for the two `500 POST` responses.

### QA-HUMAN-002: Unauthenticated page loads generate repeated 401 errors in the browser console

**Priority:** P2 / Medium

**Reproduction:** Open the home, office picker, navigation, or login page in a fresh browser context and inspect console/network activity.

**Expected:** Public pages should avoid authenticated API calls or handle expected unauthenticated responses silently.

**Actual:** Repeated `401 GET /api/users/me` and `401 GET /api/offices` responses produce repeated console errors such as `Failed to load resource: the server responded with a status of 401 (Unauthorized)`. The home page still renders, but this adds noisy failed requests and obscures genuine failures.

**Evidence:** `qa-human-evidence/observations.json`, `badResponses` and `consoleErrors`.

## Observed Non-Bugs / Notes

- Home page rendered with title `BSU Visitor — Campus access management`, visible sign-in/dashboard/public-navigation actions, and no horizontal overflow at 390x844.
- Public `/office` rendered four destinations: Office of the Dean, Registrar, Cashier, and Guard House.
- Clicking the first **Start route setup** navigated to `/navigate?to=office-of-the-dean&name=Office+of+the+Dean` and displayed the selected destination.
- `/navigate` without a destination clearly displayed `No destination specified.`
- Chromium headless reported that Multiset WebXR AR is unsupported. This is an environment limitation, not evidence that physical-device AR is broken.
- Mobile `/office` also had no horizontal overflow at 390x844.

## Tested / Not Tested Matrix

| Area | Result | Evidence / reason |
|---|---|---|
| Home page desktop | Tested: passed render | `01-home.png` |
| Home page mobile 390x844 | Tested: passed basic layout; no horizontal overflow | `12-mobile-home.png`, observations JSON |
| Public office picker | Tested: passed render | `02-office-picker.png` |
| Office destination click | Tested: passed route and selected destination | `02b-office-route-click.png` |
| AR browser capability | Tested: capability message shown; actual AR not testable in headless Chromium | observations JSON |
| Login form required-field validation | Tested: native required fields prevented submission; no custom error shown | `05-login-validation.png` |
| Invalid seeded login | Tested: blocked by CORS 500, not normal auth validation | `06-invalid-login.png`, observations JSON |
| Valid `admin / admin123` login | Tested: blocked by same CORS 500 | `07-admin-login.png`, observations JSON |
| `security (sec1)` login | Not tested: login endpoint was already blocked for browser requests |
| `staff (staff1)` login | Not tested: login endpoint was already blocked for browser requests |
| Admin routes and dashboard | Not tested: auth could not be established; unauthenticated navigation redirected to `/login` | `08-admin-users.png`, `11-unauth-admin.png` |
| Staff role guards | Not tested: no staff session available |
| Security role guards | Not tested: no security session available |
| Unauthenticated guard | Tested: protected `/admin/dashboard` redirected to `/login` | `11-unauth-admin.png` |
| Console errors | Tested: repeated expected-looking 401 errors plus login 500s | observations JSON |
| Network failures | Tested: no transport-level failed requests; HTTP 401/500 responses captured | observations JSON |
| Responsive public pages | Tested at 390x844 for home and office; no horizontal overflow | `12-mobile-home.png`, `13-mobile-office.png` |
| Authenticated responsive pages | Not tested: authentication blocker |

## Artifacts

Screenshots and structured observations are under `qa-human-evidence/`. No application source, dependencies, configuration, `QA_REPORT.md`, or documentation files were modified by this QA run.
