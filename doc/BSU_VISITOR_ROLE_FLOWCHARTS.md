# BSU Visitor Role Flowcharts

Generated: 2026-08-01

This document contains focused Mermaid flowcharts for the BSU Visitor Management System modules: Admin, Staff, Security, Office, Navigation, and Whole System.

---

## 1. Whole System Flowchart

```mermaid
flowchart TD
  A([Start]) --> B{User Type}

  B -->|Public Visitor| C[Open Public Home]
  C --> D{Visitor Goal}
  D -->|Register for Office Visit| E[Open Office Registration Page]
  D -->|Find Office Direction| F[Open Office Navigation Picker]

  E --> G[Submit Visitor Details]
  G --> H[Create / Reuse Visitor Record]
  H --> I[Create Visit Log]
  I --> J[(Status: pending)]
  J --> K[Staff Office Queue]

  F --> L[Select Destination Office]
  L --> M[Open AR Navigation]
  M --> N[Localize Camera Position]
  N --> O[Render Route to Office]

  B -->|Authenticated User| P[Login]
  P --> Q{Role}

  Q -->|Admin| R[Admin Module]
  Q -->|Staff| S[Staff Module]
  Q -->|Security| T[Security Module]

  R --> U[Manage Users, Offices, Logs, Dashboard]
  S --> V[Process Pending Visitors]
  T --> W[Register Visitors, Monitor Active Visitors, Sign Out]

  V --> X[Mark Visit Done]
  X --> Y[(Status: completed / time_out set)]
  Y --> W
  W --> Z[Sign Visitor Out]
  Z --> AA[(left_at set / status left)]
  AA --> AB([End])
```

---

## 2. Admin Flowchart

```mermaid
flowchart TD
  A([Admin Starts]) --> B[Open Login Page]
  B --> C[Enter Credentials]
  C --> D{Valid Admin Account?}
  D -->|No| E[Show Login Error]
  E --> B
  D -->|Yes| F[Open Admin Dashboard]

  F --> G{Admin Action}
  G -->|Manage Users| H[Open User List]
  G -->|Register User| I[Open Register User Page]
  G -->|Manage Offices| J[Open Offices Page]
  G -->|View Logs| K[Open Visitor Logs]
  G -->|View Summary| L[Review Dashboard Metrics]

  H --> H1[Create / Update / Delete User]
  I --> I1[Submit New Account]
  J --> J1[Create / Update / Delete Office]
  K --> K1[Filter / Review Visit Logs]
  L --> L1[Review Visitors, Offices, Queue Counts]

  H1 --> M[(Database Updated)]
  I1 --> M
  J1 --> M
  K1 --> N[Display Log Records]
  L1 --> O[Display System Summary]

  M --> P[Write Activity Log]
  N --> Q([Admin Task Complete])
  O --> Q
  P --> Q
```

---

## 3. Staff Flowchart

```mermaid
flowchart TD
  A([Staff Starts]) --> B[Login]
  B --> C{Valid Staff Account?}
  C -->|No| D[Show Login Error]
  D --> B
  C -->|Yes| E[Open Staff Dashboard]

  E --> F[Fetch Assigned Office Queue]
  F --> G{Pending / Processing Visitors?}
  G -->|No| H[Show Empty Queue]
  H --> F

  G -->|Yes| I[Select Visitor]
  I --> J[Review Name, Purpose, Time In]
  J --> K{Office Transaction Done?}
  K -->|No| L[Keep Visitor In Queue]
  L --> F

  K -->|Yes| M[Mark Visit Done]
  M --> N[Set time_out]
  N --> O[(Visit Status: completed)]
  O --> P[Refresh Staff Queue Count]
  P --> Q[Visitor Moves to Security Sign-Out List]
  Q --> R([Staff Flow Complete])
```

---

## 4. Security Flowchart

```mermaid
flowchart TD
  A([Security Starts]) --> B[Login]
  B --> C{Valid Security Account?}
  C -->|No| D[Show Login Error]
  D --> B
  C -->|Yes| E[Open Security Dashboard]

  E --> F{Security Action}
  F -->|Register Visitor| G[Open Kiosk]
  F -->|Monitor Active Visitors| H[Open Visitor Status]
  F -->|Manage Office Status| I[Open Office Status]

  G --> J[Enter Visitor Info, Photo, Purpose, Office]
  J --> K{Required Fields Valid?}
  K -->|No| L[Show Validation Error]
  L --> J
  K -->|Yes| M[Submit Kiosk Registration]
  M --> N{Existing Visitor Contact?}
  N -->|Yes| O[Reuse / Update Visitor Profile]
  N -->|No| P[Create Visitor Profile]
  O --> Q[Snapshot Photo Into Visit Log]
  P --> Q
  Q --> R[(Visit Status: pending)]
  R --> S[Visitor Appears In Staff Queue]

  H --> T[Fetch Active Visitors]
  T --> U[Compute Real Time On Site]
  U --> V{Visitor Leaving Campus?}
  V -->|No| T
  V -->|Yes| W[Sign Visitor Out]
  W --> X[Set left_at and status left]
  X --> Y([Visitor Exit Complete])

  I --> Z[Update Office Availability]
  Z --> AA[(Office Status Updated)]
```

---

## 5. Office Flowchart

```mermaid
flowchart TD
  A([Office Flow Starts]) --> B{Access Type}

  B -->|Public Visitor QR / Link| C[Open /office/:id]
  C --> D[Fetch Office Details]
  D --> E{Office Found?}
  E -->|No| F[Show Office Not Found]
  E -->|Yes| G[Show Office Registration Form]
  G --> H[Visitor Enters Details]
  H --> I{Valid Details?}
  I -->|No| J[Show Validation Error]
  J --> G
  I -->|Yes| K[Submit Public Registration]
  K --> L[Create / Reuse Visitor]
  L --> M[Create Pending Visit Log]
  M --> N[Show Confirmation]

  B -->|Staff Office User| O[Open Staff Dashboard]
  O --> P[Fetch Office Queue Count]
  P --> Q[Show Pending / Processing Visitors]
  Q --> R[Process Visitor]
  R --> S[Mark Done]
  S --> T[Queue Count Updates]

  B -->|Admin| U[Open Offices Management]
  U --> V[Create / Edit / Delete Office]
  V --> W[(Office Record Updated)]
```

---

## 6. Navigation Flowchart

```mermaid
flowchart TD
  A([Visitor Needs Direction]) --> B[Open Public Office Picker]
  B --> C[Fetch Office List]
  C --> D[Select Destination Office]
  D --> E[Open Navigation Page]

  E --> F{Camera / AR Supported?}
  F -->|No| G[Show Unsupported Browser Message]
  F -->|Yes| H[Request Camera Permission]

  H --> I{Permission Granted?}
  I -->|No| J[Show Permission Error]
  I -->|Yes| K[Start Camera / WebXR Session]

  K --> L[Request Multiset Token]
  L --> M[Capture Query Frame]
  M --> N[Send Frame To Localization API]
  N --> O{Position Localized?}

  O -->|No| P[Show Scanning / Retry Prompt]
  P --> M
  O -->|Yes| Q[Map Camera Pose To 3D Scene]
  Q --> R[Find Nearest Path Node]
  R --> S[Generate Route To Destination]
  S --> T[Render AR Pathway]
  T --> U{Arrived At Destination?}
  U -->|No| V[Update Live Connector / Direction]
  V --> T
  U -->|Yes| W[Show Arrival Alert]
  W --> X([Navigation Complete])
```

---

## 7. Module Relationship Summary

```mermaid
flowchart LR
  Visitor[Public Visitor] --> Office[Office Registration]
  Visitor --> Navigation[AR Navigation]
  Security[Security Guard] --> Kiosk[Kiosk Registration]
  Kiosk --> Logs[(Visit Logs)]
  Office --> Logs
  Logs --> Staff[Staff Queue]
  Staff --> Done[Mark Done / time_out]
  Done --> SecurityStatus[Security Active Visitor Status]
  SecurityStatus --> Exit[Sign Out / left_at]
  Admin[Admin] --> Users[Users]
  Admin --> Offices[Offices]
  Admin --> Logs
  Navigation --> Multiset[Multiset Localization]
  Multiset --> Route[AR Route Display]
```
