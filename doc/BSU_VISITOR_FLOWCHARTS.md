# BSU Visitor Flowcharts

This document contains Mermaid flowcharts for the main BSU Visitor system flows.

---

## 1. Whole-system context flow

```mermaid
flowchart TD
  Start([User opens system]) --> PublicCheck{Public or authenticated?}

  PublicCheck -->|Public visitor| PublicHome[Public home / office list]
  PublicHome --> PublicChoice{Visitor action}
  PublicChoice -->|Self-register for office| OfficeQR[/office/:id]
  PublicChoice -->|Navigate to office| OfficePicker[/office]
  OfficePicker --> NavAR[/navigate AR navigation]

  OfficeQR --> PublicRegister[Submit visitor details]
  PublicRegister --> PublicAPI[POST /api/public/office/:id/register]
  PublicAPI --> PendingLog[(visit_logs: pending)]

  NavAR --> MultisetProxy[/api/multiset proxy]
  MultisetProxy --> VPS[Multiset VPS localization]
  VPS --> RouteLine[Render AR pathway route]

  PublicCheck -->|Authenticated user| Login[/login]
  Login --> AuthAPI[POST /api/users/login]
  AuthAPI --> RoleCheck{Role}

  RoleCheck -->|Admin| AdminArea[Admin dashboard/users/offices/logs]
  RoleCheck -->|Staff| StaffArea[Staff dashboard/queue/logs]
  RoleCheck -->|Security| SecurityArea[Security kiosk/status/offices]
```

---

## 2. Guard-house kiosk registration flow

```mermaid
flowchart TD
  A([Visitor arrives at guard house]) --> B[Security logs in]
  B --> C[Open /security/kiosk]
  C --> D[Enter visitor info, photo, purpose, office]
  D --> E{Required fields valid?}
  E -->|No| F[Show validation error]
  F --> D
  E -->|Yes| G[POST /api/security-guard/kiosk/register]
  G --> H{Existing visitor by contact?}
  H -->|Yes| I[Update/reuse visitor record]
  H -->|No| J[Create visitor record]
  I --> K[Create visit log]
  J --> K
  K --> L[(visit_logs status: pending)]
  L --> M[Visitor appears in staff office queue]
  M --> N([Await staff action])
```

---

## 3. Staff processing and security sign-out flow

```mermaid
flowchart TD
  A[(visit_logs status: pending)] --> B[Staff opens dashboard or queue]
  B --> C[GET /api/visit-logs/pending]
  C --> D[Staff reviews visitor purpose]
  D --> E{Office transaction complete?}
  E -->|No| D
  E -->|Yes| F[PATCH /api/visit-logs/:id/done]
  F --> G[(time_out recorded)]
  G --> H[Security status panel lists pending sign-out]
  H --> I{Visitor physically leaving?}
  I -->|No| H
  I -->|Yes| J[PATCH /api/security-guard/visit-logs/:id/sign-out]
  J --> K[(left_at recorded)]
  K --> L([Visitor no longer active on campus])
```

---

## 4. Public office QR self-registration flow

```mermaid
flowchart TD
  A([Visitor scans fixed office QR]) --> B[/office/:id]
  B --> C[GET /api/public/office/:id]
  C --> D{Office exists?}
  D -->|No| E[Show office not found]
  D -->|Yes| F[Show office visitor form]
  F --> G[Visitor enters name, contact, address, purpose]
  G --> H{Required fields valid?}
  H -->|No| I[Show validation error]
  I --> F
  H -->|Yes| J[POST /api/public/office/:id/register]
  J --> K{Existing visitor by contact?}
  K -->|Yes| L[Reuse visitor]
  K -->|No| M[Create visitor]
  L --> N[Create pending visit log]
  M --> N
  N --> O[Show confirmation]
  O --> P[Staff sees visitor in office queue]
```

---

## 5. AR navigation flow

```mermaid
flowchart TD
  A([Visitor needs directions]) --> B[Open /office]
  B --> C[Fetch public office list]
  C --> D[Select destination]
  D --> E[/navigate?to=id&name=name]
  E --> F{Browser supports camera/WebXR?}
  F -->|No| G[Show unsupported/error state]
  F -->|Yes| H[Request Multiset token via /api/multiset/token]
  H --> I[Start camera frame capture]
  I --> J[POST query image to /api/multiset/query-form]
  J --> K{Localized by VPS?}
  K -->|No| L[Keep scanning / show localization prompt]
  L --> I
  K -->|Yes| M[Convert Multiset map pose to Three.js world]
  M --> N[Find destination and nearest pathway nodes]
  N --> O[Render red route polyline]
  O --> P[Render live connector from camera to route]
  P --> Q([Visitor follows route])
```

---

## 6. Admin management flow

```mermaid
flowchart TD
  A[Admin logs in] --> B{Admin action}
  B --> C[View dashboard]
  B --> D[Manage users]
  B --> E[Manage offices]
  B --> F[View visitor logs]
  B --> G[Register user]

  D --> D1[GET/POST/PUT/DELETE /api/users]
  E --> E1[GET/POST/PUT/DELETE /api/offices]
  F --> F1[GET /api/visit-logs]
  G --> G1[POST /api/users]

  D1 --> Audit[activity_logs]
  E1 --> Audit
  F1 --> Audit
  G1 --> Audit
```

---

## 7. Deployment flow

```mermaid
flowchart LR
  Browser[Browser] --> CF[Cloudflare tunnel / public host]
  CF --> Proxy[Caddy proxy container]
  Proxy -->|Static SPA| Frontend[Frontend container]
  Proxy -->|/api/*| Backend[Backend container]
  Proxy -->|/uploads/*| Backend
  Backend --> DB[(bsu-data SQLite volume)]
  Backend --> Files[(bsu-uploads volume)]
  Backend --> Multiset[Multiset AI API]
```
