# Complete QA Report — BSU Visitor

**Date:** 2026-08-10
**Environment:** Local isolated QA environment
**Frontend:** `http://127.0.0.1:5173`
**Backend QA port:** `http://127.0.0.1:8765`
**Scope:** Frontend/backend connectivity, public API, smoke workflows, browser public flows, browser login, AR route entry, and console/network behavior.

## Executive Result

### Passed
- Frontend served HTTP 200.
- Backend `GET /api/health` returned HTTP 200 on the intended QA port.
- Backend `GET /api/public/offices` returned HTTP 200.
- API smoke test passed **44/44**.
- Public homepage rendered.
- Public AR office picker rendered four configured destinations.
- Office of the Dean route navigation worked and opened the expected `/navigate` route.
- No uncaught browser JavaScript errors appeared in the tested public flows.
- Local test environment files were created and ignored from Git.
- AR route entry preserved the verified existing AR behavior; headless browser cannot run physical WebXR.

### Failed / Blocked
- Browser login could not be completed with `admin/admin123` because the seeded database used for this browser run did not contain the expected admin credentials. Direct API response was HTTP 401 `Invalid credentials`, not a frontend/backend transport failure.
- The public `/office/1` page showed `Office not found` because the local seeded database did not have a matching office record at that point. The AR office picker still rendered its four configured destinations.
- A stale/background process previously occupied port 8000 and returned `404 Not found` for `/api/health`. Directly running the intended backend on port 8765 returned the correct 200 response. This is a local process/port ownership issue.
- Actual Web Push delivery is not configured; the repository documents that VAPID credentials and a delivery worker/provider are required.

## API Workflow QA

`JWT_SECRET=qa-test-secret-with-at-least-32-characters PORT=8877 npm run test:api`

Result: **44 passed, 0 failed**.

Coverage included:

- Health and login
- Public office listing
- Admin grace-period settings
- Public self-registration
- Opaque token lookup
- Registration idempotency
- Visitor creation and visit registration
- Status completion and exit deadline behavior
- Validation errors
- Security login and active visitors
- Security office status
- Push subscription abstraction
- Role restrictions
- Kiosk registration and photo validation
- Overdue visitors
- Staff completion
- Security sign-out and duplicate sign-out rejection

## Human Browser QA

### Homepage
- Rendered successfully.
- Title: `BSU Visitor — Campus access management`.
- Public AR navigation link was visible.
- API resources were routed through Vite proxy, including `/api/users/me` and `/api/offices`.

### Public AR picker
- Rendered four destinations:
  - Office of the Dean
  - Registrar
  - Cashier
  - Guard House
- Selecting Office of the Dean navigated to:
  `navigate?to=office-of-the-dean&name=Office+of+the+Dean`
- Headless browser correctly displayed that WebXR/Multiset AR is unsupported in the test browser. This is an environment limitation, not evidence that physical AR is broken.

### AR navigation screen
- Destination and map ID rendered.
- Start AR button was disabled with the correct unsupported-device message.
- No uncaught console errors were observed.

### Login
- Form rendered and accepted username/password input.
- Clicking Sign in did not navigate in the browser run.
- Direct backend verification returned 401 `Invalid credentials` for `admin/admin123` against the freshly seeded local database.
- Therefore authenticated browser dashboards could not be completed in this run.

## Test Environment

Created locally under `test-env/`:

- `test-env/backend.env`
- `test-env/client.env`
- `test-env/README.md`
- `test-env/.gitignore`

The test env files containing the local JWT secret are ignored and were not pushed.

## Final Assessment

**API integration: PASS**

**Public frontend integration: PASS**

**Public AR route entry: PASS**

**Authenticated browser integration: BLOCKED by seeded-credential mismatch**

**Web Push delivery: NOT CONFIGURED**

**Physical AR runtime: Previously verified by the user; not executable in headless browser**

## Recommended Follow-up

1. Seed known browser QA accounts explicitly and rerun admin, staff, and security browser flows.
2. Ensure one intended backend process owns port 8000 before normal development QA.
3. Seed at least one office record for public QR-route browser testing.
4. Configure VAPID credentials and a push delivery worker before claiming Web Push delivery is operational.
5. Do not alter the verified AR/map implementation without physical-device regression testing.

## Evidence

- `QA_REPORT.md`
- `QA_HUMAN_REPORT.md`
- `QA_CONNECTION_REPORT.md`
- `qa-human-evidence/`
- `test-results/`

**Conclusion:** The backend API and public frontend connection are working and the complete API workflow passes. Full browser role QA is not complete because the local seeded login credentials did not match the browser test credentials; this is explicitly recorded rather than treated as a pass.