# Zyrax POS

A full-stack Point of Sale (POS) and retail management system built for small-to-medium businesses. Track inventory, process sales, manage customer credit ledgers (Khata), monitor expenses, and view real-time reports — all in one place.

> **Origin:** Originally inspired by [Retailer-POS](https://github.com/codedbyhassan/Retailer-POS) by Hassan Agyemang Boakye. This version has been heavily rewritten with a custom Express + SQLite backend, local JWT authentication, and many new features.

---

## ✨ Features

- **Role-based Access Control** — Admin and Cashier roles with protected routes
- **Product Management** — Add, edit, archive products with image uploads, SKUs, barcodes, and categories
- **Point of Sale (POS)** — Fast checkout with barcode support, cart management, discount/tax handling, and multi-mode payment (Cash, Card, Mobile Money, Khata)
- **Customer Ledger (Khata)** — Credit accounts for trusted customers with full transaction history and running balance
- **Inventory Tracking** — Real-time stock levels, low-stock alerts, and adjustment audit logs
- **Expense Management** — Record and categorize shop expenses with reporting integration
- **Reports & Analytics** — Daily sales summary, revenue trends, top products, inventory valuation, and net profit calculation
- **User Management** — Admins can create, edit, and deactivate cashier accounts
- **Business Settings** — Customizable branding, currency, tax rate, receipt footer, and theme presets
- **Dark Mode** — Full dark mode support across admin and cashier layouts
- **A4 & Thermal Receipts** — Print professional invoices or compact 80mm thermal slips

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, Tailwind CSS, TanStack Query |
| **Backend** | Express.js (Node.js) |
| **Database** | SQLite (via `better-sqlite3`) |
| **Auth** | Custom JWT with PBKDF2 password hashing |
| **File Uploads** | Multer (local storage) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

### 2. Configure Environment

```bash
# Server environment
cp server/.env.example server/.env
# Edit server/.env and set a strong AUTH_SECRET and passwords

# Frontend environment
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port
```

### 3. Seed the Database

```bash
cd server
node seed-users.js
```

### 4. Run the App

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### 5. Login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@retailer.com` | `admin123` (change in `.env`) |
| Cashier | `cashier@retailer.com` | `cashier123` (change in `.env`) |

---

## 📁 Project Structure

```
zyrax-pos/
├── server/               # Express API
│   ├── config/
│   │   └── database.js   # SQLite schema & connection
│   ├── controllers/      # API business logic
│   ├── middleware/       # Auth, upload, rate limiting
│   ├── routes/           # API endpoints
│   ├── data/             # SQLite database (ignored by git)
│   └── public/uploads/   # Product images (ignored by git)
│
├── src/                  # React frontend
│   ├── app/              # Routes & app shell
│   ├── pages/            # Page components
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/api/     # HTTP client & API modules
│   ├── store/            # Global state (theme, sidebar, settings)
│   └── utils/            # Helpers & formatters
│
└── package.json
```

---

## 🔑 API Endpoints

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout` |
| Products | `GET`, `POST`, `PUT`, `DELETE /api/products` |
| Sales | `GET`, `POST /api/sales` |
| Inventory | `GET`, `POST /api/inventory/adjust` |
| Customers | `GET`, `POST`, `DELETE /api/customers` |
| Expenses | `GET`, `POST`, `DELETE /api/expenses` |
| Reports | `GET /api/reports/daily`, `/revenue`, `/products` |
| Users | `GET`, `POST`, `PUT`, `DELETE /api/user` |
| Upload | `POST /api/upload/products` |

All protected endpoints require a `Bearer` token in the `Authorization` header.

---

## ⚠️ Security Notes

- Change the default `AUTH_SECRET` and passwords before deploying to production
- Token lifetime is 30 days — re-login when expired
- Image uploads are limited to 5MB (JPG, PNG, GIF, WebP)
- Keep your `.env` files private — they are ignored by git

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

Original work Copyright (c) 2026 Hassan Agyemang Boakye.
