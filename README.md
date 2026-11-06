# Supplier Risk Assessment System

A full-stack MERN web application for evaluating and tracking supplier risk scores.
Built as a BCA minor academic project.

---

## Tech Stack

- **Frontend**: React (Vite), React Router DOM, Axios, plain CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT stored in HttpOnly cookies, bcryptjs

---

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- MongoDB (local install or MongoDB Atlas free tier)

---

## Project Structure

```
supplier-risk-assessment/
  client/          React + Vite frontend
  server/          Express backend
  README.md
```

---

## Setup Instructions

### 1. Clone / Download the project

```bash
cd supplier-risk-assessment
```

### 2. Configure the server

```bash
cd server
copy .env.example .env
```

Edit `server/.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/supplier_risk
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@1234
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

> **JWT_SECRET**: Use a strong random string (at least 32 characters).  
> **ADMIN_PASSWORD**: Must be at least 8 characters.

### 3. Install server dependencies

```bash
cd server
npm install
```

### 4. Seed the admin account

```bash
npm run seed:admin
```

Run this only once. It is safe to run again — it will skip creation if the admin already exists.

### 5. (Optional) Seed sample data

```bash
npm run seed:data
```

Seeds realistic fictional suppliers and assessments for demonstration.  
Safe to run multiple times — skips existing records.

### 6. Start the backend server

```bash
npm run dev
```

The API runs on `http://localhost:5000`.

### 7. Configure the frontend

```bash
cd ../client
copy .env.example .env
```

Edit `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

### 8. Install frontend dependencies

```bash
npm install
```

### 9. Start the frontend

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

---

## Default Login

After seeding:

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Admin   | admin@example.com    | Admin@1234  |

Register new accounts through the UI — public registration always creates an **Analyst** role.

---

## API Health Check

```
GET http://localhost:5000/api/health
```

---

## Risk Scoring Formula

Each of 5 factors is rated 1–5 by an analyst.

| Factor                    | Weight |
|---------------------------|--------|
| Financial Stability       | 25%    |
| Delivery Performance      | 25%    |
| Product / Service Quality | 20%    |
| Regulatory & Compliance   | 20%    |
| Supplier Dependency       | 10%    |

**Per factor contribution** = `((rating - 1) / 4) × weight × 100`

**Overall Score** = sum of all contributions (0–100)

| Score Range      | Classification |
|------------------|----------------|
| 0 – 33.33        | Low Risk       |
| 33.34 – 66.66    | Medium Risk    |
| 66.67 – 100      | High Risk      |

The backend always recalculates the score — frontend previews are for UX only.

---

## Security Notes

- Passwords are hashed with bcryptjs (salt rounds = 12).
- JWTs are stored in HttpOnly, SameSite=Strict cookies — not in localStorage.
- Role is assigned server-side; clients cannot self-assign Admin role.
- All admin endpoints are protected by role middleware on the backend.
- Deactivated accounts cannot log in or use existing sessions.
- Password hashes are never returned in API responses.
