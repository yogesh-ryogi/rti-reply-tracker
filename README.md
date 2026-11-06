# RTI Reply Tracker (MERN)

Full-stack rebuild of the RTI Reply Tracker prototype using **MongoDB + Express + React + Node.js**.

## Features (matching the prototype)

- **Roles**: Citizen, Clerk (per Gram Panchayat), PDO (per Gram Panchayat)
- **RTI requests**: 30-day deadline, progress bar, zones (On track / Due soon / Critical / Overdue / Replied)
- **Scheme applications**: status flow including payment request → demo payment → complete with sanction
- **Dashboards** for each role + Home notifications / scheme listing
- **Seed data** identical to the original HTML prototype (3 panchayats, demo users, 21 RTIs, 7 schemes, 4 applications)

## Project structure

```
rti-reply-tracker/
├── backend/          # Express + Mongoose API
│   ├── src/
│   │   ├── models/       User, RTI, Scheme, Application
│   │   ├── routes/       auth, rti, schemes, applications
│   │   ├── controllers/
│   │   ├── middleware/   JWT auth + role guards
│   │   ├── seed/         seed.js (matches prototype)
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/         # React (Vite) + the prototype design system
    ├── src/
    │   ├── api/          axios client
    │   ├── context/      AuthContext
    │   ├── pages/        Home, Login, Citizen/Clerk/PDO dashboards
    │   ├── components/   Layout
    │   └── utils/
    └── package.json
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or set `MONGODB_URI` to Atlas)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # edit if needed
npm install
npm run seed           # loads demo users, RTIs, schemes, applications
npm run dev            # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
# optional: create .env with VITE_API_URL=http://localhost:5000/api
npm run dev            # http://localhost:5173
```

## Demo logins (after seed)

| Role    | Email / how to login              | Password      |
|---------|-----------------------------------|---------------|
| Citizen | ramesh@test.com                   | abc123        |
| Citizen | lakshmi@test.com                  | abc123        |
| Clerk   | clerk.alpha@demo.com (select panchayat + email) | suresh123 |
| Clerk   | clerk2.alpha@demo.com             | meena123      |
| Clerk   | clerk.beta@demo.com               | kavitha123    |
| Clerk   | clerk2.beta@demo.com              | ravi123       |
| Clerk   | clerk.gamma@demo.com              | prakash123    |
| Clerk   | clerk2.gamma@demo.com             | divya123      |
| PDO     | Select panchayat → password       | alphapdo123 / betapdo123 / gammapdo123 |

## API overview

- `POST /api/auth/register` – citizen registration
- `POST /api/auth/login` – all roles
- `GET  /api/auth/me`
- `GET  /api/auth/clerks?panchayat=alpha`
- `POST /api/rti` – file RTI (citizen)
- `GET  /api/rti/mine` | `/api/rti/panchayat` | `/api/rti/stats`
- `POST /api/rti/:id/reply` (clerk) | `/api/rti/:id/nudge` (pdo)
- `GET  /api/schemes?filter=all|open|soon|closed`
- `POST /api/applications` – apply to scheme
- `GET  /api/applications/mine` | `/panchayat`
- `PATCH /api/applications/:id/status`
- `POST /api/applications/:id/request-payment` | `/pay` | `/complete`

## Next steps / known gaps vs prototype

- Full notification engine on Home (partial)
- Clerk History tab search/filter tables (basic version present)
- PDO Records clerk performance table (basic records present)
- Time-travel demo controls (Next day / +30 days) – optional admin feature
- Dark mode toggle (CSS already supports `prefers-color-scheme` and `data-theme`)

The UI deliberately reuses the prototype’s CSS variables, card layout, track bars, and tags so the look stays the same while the data is real and persisted.
