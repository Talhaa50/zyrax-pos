# Zyrax POS

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

A **full-stack Point of Sale (POS) and retail management system** built for small-to-medium businesses. Manage inventory, process sales, track customer credit (Khata), monitor expenses, and view real-time analytics — all in one modern, fast application.

> **Origin:** Originally inspired by [Retailer-POS](https://github.com/codedbyhassan/Retailer-POS) by Hassan Agyemang Boakye. This version has been **completely rewritten** with a custom Express + SQLite backend, local JWT authentication, and many new business-critical features.

---

## ✨ Features

### 🛒 Point of Sale (POS)
- **Lightning-fast checkout** with barcode scanning support
- **Smart cart management** — add, remove, adjust quantities with real-time totals
- **Discount & tax handling** — percentage or flat discounts, configurable tax rates
- **Multiple payment methods** — Cash, Card, Mobile Money, and **Khata (Credit)**
- **Dual receipt printing** — Professional A4 invoices + compact 80mm thermal slips
- **Customer selection** at checkout for credit sales

### 📦 Inventory Management
- **Real-time stock tracking** with automatic deduction on every sale
- **Low-stock alerts** — never run out of best-selling items
- **Stock adjustment logs** — full audit trail of who changed what and when
- **Product categories** for organized catalog management
- **Barcode & SKU support** for quick lookups

### 👥 Customer Ledger (Khata)
- **Credit accounts** for trusted customers
- **Full transaction history** — every payment received and credit given
- **Running balance** calculation with automatic updates
- **Printable ledger statements** for customer reconciliation
- **POS integration** — charge sales directly to a customer's account

### 💰 Expense Tracking
- **Record all business expenses** — rent, utilities, salaries, supplies, etc.
- **Categorization** for organized bookkeeping
- **Net profit calculation** — sales revenue minus cost of goods minus expenses
- **Visual breakdown** in reports dashboard

### 📊 Reports & Analytics
- **Daily Sales Report** — revenue, transactions, average sale, payment breakdown
- **Product Performance** — best sellers, slow movers, profit margins
- **Inventory Valuation** — total stock value, low stock count, out-of-stock items
- **Revenue Trends** — visual charts with date range filtering
- **Cashier Performance** — leaderboard with transaction counts and totals

### 👤 User Management
- **Role-based access control** — Admin vs Cashier permissions
- **Create, edit, deactivate** cashier accounts
- **Password management** — secure password changes with admin override
- **Audit logging** — track who did what across the system

### ⚙️ Business Settings
- **Customizable branding** — business name, logo, receipt footer
- **Currency & tax configuration**
- **Theme presets** — multiple color schemes
- **Dark mode** — full support across all layouts

### 🔐 Security
- **JWT authentication** with HMAC-SHA256 signing
- **PBKDF2 password hashing** (10,000 iterations)
- **Token expiry** — 30-day sessions with automatic cleanup
- **Protected API routes** — every endpoint validated

---

## 🏗️ Architecture

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, Tailwind CSS, TanStack Query |
| **Backend** | Express.js (Node.js) |
| **Database** | SQLite via `better-sqlite3` |
| **Authentication** | Custom JWT with PBKDF2 password hashing |
| **File Uploads** | Multer (local storage) |
| **Styling** | Tailwind CSS with custom CSS variables for theming |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ and npm

### 1. Clone & Install

```bash
git clone https://github.com/Talhaa50/zyrax-pos.git
cd zyrax-pos

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

### 2. Configure Environment

```bash
# Server environment (from server/ directory)
cp server/.env.example server/.env
# Edit server/.env and set a strong AUTH_SECRET and secure passwords

# Frontend environment (from root directory)
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port than 3001
```

### 3. Seed the Database

```bash
cd server
node seed-users.js
```

This creates the SQLite database and default user accounts.

### 4. Run the Application

```bash
# Terminal 1: Backend (from server/ directory)
npm run dev

# Terminal 2: Frontend (from root directory)
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |

### 5. Login

| Role | Email | Default Password |
|------|-------|-----------------|
| **Admin** | `admin@retailer.com` | Set in `server/.env` |
| **Cashier** | `cashier@retailer.com` | Set in `server/.env` |

> ⚠️ **Change default passwords before production use!**

---

## 📁 Project Structure

```
zyrax-pos/
├── server/                          # Express REST API
│   ├── config/
│   │   └── database.js             # SQLite connection & schema
│   ├── controllers/                # Business logic
│   ├── middleware/                 # Auth, upload, rate limiting
│   ├── routes/                     # API route definitions
│   ├── data/                       # SQLite database (ignored by git)
│   ├── public/uploads/products/    # Product images (ignored by git)
│   ├── seed-users.js               # Database seeding script
│   └── app.js                      # Express app entry point
│
├── src/                             # React Frontend
│   ├── app/                         # Routes & root component
│   ├── pages/                       # Page-level components
│   ├── components/                  # Reusable UI components
│   ├── hooks/                       # Custom React hooks
│   ├── services/api/                # HTTP client & API modules
│   ├── store/                       # Theme, sidebar, settings state
│   ├── layouts/                     # Admin, Cashier, AppShell layouts
│   ├── utils/                       # Helpers & formatters
│   └── constants/                   # Roles, enums
│
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
└── LICENSE
```

---

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email & password |
| `POST` | `/api/auth/logout` | Clear session |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get single product |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Archive product |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sales` | List sales history |
| `GET` | `/api/sales/:id` | Get sale details |
| `POST` | `/api/sales` | Process new sale |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/inventory` | Get inventory status |
| `POST` | `/api/inventory/adjust` | Adjust stock levels |

### Customers (Khata)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customers` | List customers with balances |
| `POST` | `/api/customers` | Create customer |
| `GET` | `/api/customers/:id` | Get customer + ledger |
| `POST` | `/api/customers/:id/transaction` | Add payment or credit |
| `DELETE` | `/api/customers/:id` | Delete customer |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/expenses` | List expenses |
| `POST` | `/api/expenses` | Add expense |
| `DELETE` | `/api/expenses/:id` | Delete expense |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/daily` | Daily sales summary |
| `GET` | `/api/reports/revenue` | Revenue trends |
| `GET` | `/api/reports/products` | Product performance |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user` | List users |
| `POST` | `/api/user` | Create user |
| `PUT` | `/api/user/:id` | Update user |
| `POST` | `/api/user/:id/password` | Reset password |
| `DELETE` | `/api/user/:id` | Delete user |

### Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/products` | Upload product image |

> All protected endpoints require `Authorization: Bearer <token>` header.

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Admin & cashier accounts |
| `products` | Product catalog with pricing, stock, images |
| `sales` | Sale transactions with payment method & totals |
| `sale_items` | Individual line items per sale |
| `customers` | Customer profiles for Khata (credit) accounts |
| `customer_transactions` | Ledger entries (DEBIT/CREDIT) with running balance |
| `expenses` | Business expense records with categories |
| `inventory_logs` | Stock movement audit trail |
| `audit_logs` | System-wide action logging |
| `business_settings` | Store configuration |
| `categories` | Product categories |

---

## ⚠️ Security Best Practices

1. **Change default credentials** in `server/.env` before production
2. **Use a strong AUTH_SECRET** — minimum 32 random characters
3. **Keep `.env` files private** — they are already in `.gitignore`
4. **Token lifetime** is 30 days — users must re-login when expired
5. **Image uploads** are limited to 5MB (JPG, PNG, GIF, WebP only)
6. **Run behind HTTPS** in production
7. **Regular database backups** — `server/data/pos_data.db`

---

## 🛠️ Development Commands

```bash
# Start frontend development server
npm run dev

# Start backend development server (with auto-reload)
cd server && npm run dev

# Start both concurrently
npm run dev:all

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🗺️ Roadmap

- [x] Local SQLite backend
- [x] JWT authentication
- [x] Product management with image uploads
- [x] POS with barcode support
- [x] Customer ledger (Khata)
- [x] Expense tracking
- [x] Reports & analytics
- [x] User management
- [x] A4 & thermal receipts
- [x] Dark mode & theming
- [ ] Multi-store support
- [ ] Supplier management
- [ ] Purchase orders
- [ ] Sales forecasting
- [ ] Mobile-responsive cashier view
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Original work Copyright (c) 2026 Hassan Agyemang Boakye.

---

<p align="center">
  Built with ❤️ for small business owners worldwide.
</p>
