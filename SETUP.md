# RTI Reply Tracker — Setup on Your System

## What you need installed

1. **Node.js 18+**  
   Download: https://nodejs.org/  
   Check: `node -v` and `npm -v`

2. **MongoDB** (one of these):
   - **Local**: Install MongoDB Community  
     https://www.mongodb.com/try/download/community  
     Start the service so it listens on `mongodb://127.0.0.1:27017`
   - **Cloud (easier)**: Free MongoDB Atlas  
     https://www.mongodb.com/cloud/atlas  
     Create a cluster → get connection string → put it in `backend/.env` as `MONGODB_URI`

3. **Code editor** (optional): VS Code

---

## Step-by-step

### 1. Copy the project folder

Copy the entire `rti-reply-tracker` folder to your computer  
(or unzip `rti-reply-tracker.zip` if you downloaded the archive).

### 2. Backend

```bash
cd rti-reply-tracker/backend

# Install dependencies
npm install

# Configure environment (already has defaults for local MongoDB)
# Edit .env if you use Atlas:
#   MONGODB_URI=mongodb+srv://USER:PASS@cluster.../rti_tracker

# Load demo data (users, RTIs, schemes, applications)
npm run seed

# Start API server
npm run dev
```

You should see:
```
MongoDB connected: ...
Server running on port 5000
```

Leave this terminal open.

### 3. Frontend

Open a **new terminal**:

```bash
cd rti-reply-tracker/frontend

npm install

npm run dev
```

Open the URL it prints (usually **http://localhost:5173**).

---

## Demo logins

| Role    | How to login                                      | Password       |
|---------|---------------------------------------------------|----------------|
| Citizen | Email: `ramesh@test.com`                          | `abc123`       |
| Citizen | Email: `lakshmi@test.com`                         | `abc123`       |
| Clerk   | Select **Alpha** → email `clerk.alpha@demo.com`   | `suresh123`    |
| Clerk   | Select **Alpha** → `clerk2.alpha@demo.com`        | `meena123`     |
| Clerk   | Beta / Gamma similar (kavitha123, ravi123, …)     | see seed       |
| PDO     | Select **Alpha** → password only                  | `alphapdo123`  |
| PDO     | Beta / Gamma                                      | `betapdo123` / `gammapdo123` |

Menu (☰ top left) → Login as Citizen / Clerk / PDO.

---

## What works after setup

- **Citizen**: file RTI, see progress bars & zones, apply to schemes, pay demo fees  
- **Clerk**: reply to RTIs, process applications, request payment, complete after pay  
- **PDO**: overview, “needs attention”, remind clerks, full records table  
- **Home**: scheme list with filters (All / Open / Closing soon / Closed)

---

## Common problems

| Problem | Fix |
|---------|-----|
| `MongoDB connection error` | Start MongoDB service, or set correct `MONGODB_URI` in `backend/.env` |
| Frontend can't reach API | Ensure backend is on port 5000; check `frontend/.env` has `VITE_API_URL=http://localhost:5000/api` |
| CORS errors | Backend already allows `http://localhost:5173` |
| `npm install` fails | Use Node 18+; try `npm install --legacy-peer-deps` |
| Seed fails | Mongo must be running; delete old DB or change DB name in URI |

---

## Project structure (source files)

```
rti-reply-tracker/
├── SETUP.md                 ← this file
├── README.md
├── backend/
│   ├── package.json
│   ├── .env / .env.example
│   └── src/
│       ├── server.js
│       ├── config/db.js
│       ├── models/          User.js, RTI.js, Scheme.js, Application.js
│       ├── middleware/auth.js
│       ├── controllers/     auth, rti, scheme, application
│       ├── routes/
│       ├── utils/constants.js
│       └── seed/seed.js
└── frontend/
    ├── package.json
    ├── .env
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── api/client.js
        ├── context/AuthContext.jsx
        ├── components/      Layout, TrackBar, StatsBar, Tag, Loading, Empty
        ├── pages/           Home, Login, Citizen/Clerk/PDO dashboards
        └── utils/dates.js
```

All source is already written in these files — open them in your editor to read or edit.
