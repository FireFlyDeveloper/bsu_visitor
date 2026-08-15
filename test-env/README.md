# Local QA Environment

These files are for local testing only and are intentionally untracked:

- `backend.env` — local backend settings, including a test-only JWT secret
- `client.env` — local Vite proxy settings

Use them only on the local machine. Do not commit secrets or use these values in production.

Example backend start:

```bash
env $(tr '\n' ' ' < test-env/backend.env) npm run dev
```

The repository already includes a root `npm run test:api` smoke test, which creates its own test environment and uses a test JWT secret.

The smoke test uses an explicitly exported `PORT` unchanged. If `PORT` is not
set, it uses port 8000 unless that port is occupied, then selects the next
available port without stopping existing processes. `npm run backend:port`
prints the first available port starting at 8000.
