# 🍚 Household Food Cost Sharing & Meal Management System

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge" alt="status" />
  <img src="https://img.shields.io/badge/API-v1.0.0-blue?style=for-the-badge" alt="api version" />
  <img src="https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge" alt="license" />
</p>

<p align="center">
  A full-stack system for households to automatically track daily meal participation,
  split food & ingredient costs fairly among members, manage prepaid deposits,
  and settle monthly bills — all through a REST API with Swagger docs and a modern web dashboard.
</p>

<p align="center">
  <a href="https://household-food-system.onrender.com/swagger-ui">📘 Live API Docs</a> •
  <a href="#-getting-started">🚀 Getting Started</a> •
  <a href="#-api-reference">📡 API Reference</a> •
  <a href="#-tech-stack">🛠 Tech Stack</a>
</p>

---

## ✨ Features

- 👥 **Member Management** — Admins can add, update status (`ACTIVE` / `AWAY` / `INACTIVE`), and manage household members.
- 🍽 **Daily Meal Tracking** — Members mark whether they're eating each day; system auto-calculates who shares which cost.
- 💰 **Fair Cost Splitting** — Food cost is split only among members who ate that day; ingredient cost is split evenly among all `ACTIVE` members.
- 🏦 **Prepaid Deposit Wallet** — Members top up a prepaid balance; the system deducts automatically at settlement time.
- 🧾 **Automated Bill Settlement** — One click calculates each member's dues for a date range and deducts from their deposit balance — with full audit history.
- 📊 **Settlement History** — Every settlement run is logged and retrievable, with pagination.
- 🔐 **JWT Authentication** — Secure login with access & refresh tokens, admin-only route protection.
- 📄 **Interactive API Docs** — Full Swagger/OpenAPI 3.0 documentation, live and testable.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **ORM / Client** | Prisma |
| **Auth** | JWT (access + refresh tokens) |
| **API Docs** | Swagger UI (`swagger-jsdoc` + `swagger-ui-express`) |
| **Frontend** | React + TypeScript (Vite) |
| **Hosting** | Render (backend), Google AI Studio / Vercel (frontend) |

---

## 📁 Project Structure

```
household-food-system/
├── api/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── members.routes.js
│   │   │   ├── dailyCost.routes.js
│   │   │   ├── mealStatus.routes.js
│   │   │   ├── billSharing.routes.js
│   │   │   └── deposits.routes.js
│   │   ├── services/
│   │   │   ├── costSharingEngine.js
│   │   │   ├── prismaClient.js
│   │   │   └── server.js
│   │   └── prismaClient.js
│   ├── .env
│   ├── docker-compose.yml
│   └── package.json
└── web/                    # Frontend (React dashboard)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database (local or hosted)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/SARONCHAIRIN/household-food-system.git
cd household-food-system
```

### 2. Backend setup

```bash
cd api
npm install
cp .env.example .env   # fill in your DATABASE_URL, JWT_SECRET, etc.
npx prisma generate
npm run dev
```

The API will be available at `http://localhost:10000`, with Swagger docs at `http://localhost:10000/swagger-ui`.

### 3. Frontend setup

```bash
cd ../web
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173` (default Vite port).

---

## 📡 API Reference

Full interactive documentation: **[household-food-system.onrender.com/swagger-ui](https://household-food-system.onrender.com/swagger-ui)**

### 🔐 Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | User login (returns access + refresh token) |
| `POST` | `/api/v1/auth/register` | Register a new household member |

### 👥 Members & Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/members` | Get all members |
| `PATCH` | `/api/v1/users/{id}/status` | Admin: update a member's status |

### 🍽 Meals & Daily Costs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/meal-statuses` | Get all meal statuses |
| `POST` | `/api/v1/meal-statuses` | Set/update meal status for a date |
| `GET` | `/api/v1/daily-costs` | Get all daily food costs |
| `POST` | `/api/v1/daily-costs` | Record a new daily food cost |

### 🏦 Deposits
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/admin/deposits` | Admin: credit a deposit to a member |
| `GET` | `/api/v1/deposits/balance` | Get a member's balance & transaction history |
| `GET` | `/api/v1/admin/deposits/all` | Admin: get all members' balances at once |

### 🧾 Bills
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/bills/summary` | Preview cost-sharing totals for a date range (read-only) |
| `POST` | `/api/v1/bills/settle` | Settle bills for a period & deduct from deposits |
| `GET` | `/api/v1/bills/last-settlement` | Get the most recent settlement record |
| `GET` | `/api/v1/bills/settlements` | Get paginated settlement history |

---

## 🔑 Authentication

All admin routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Obtain a token via `POST /api/v1/auth/login`:

```bash
curl -X POST https://household-food-system.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'
```

---

## 🗺 How Cost Splitting Works

1. Each day, an admin records the total **food cost** and **ingredient cost** (`POST /daily-costs`).
2. Members mark themselves `EAT` or `NOT_EAT` for that day (`POST /meal-statuses`).
3. **Food cost** for that day is divided only among members who marked `EAT`.
4. **Ingredient cost** is divided evenly among all currently `ACTIVE` members, regardless of daily attendance.
5. At settlement time (`POST /bills/settle`), each member's total is deducted from their prepaid deposit balance — partial deduction if balance is insufficient.

---

## 🧭 Roadmap

- [ ] Per-settlement detail view (`GET /bills/settlements/:id`)
- [ ] Email/SMS notifications on low balance
- [ ] Export settlement reports as PDF
- [ ] Multi-household support

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">Built with ❤️ for fairer household living.</p>