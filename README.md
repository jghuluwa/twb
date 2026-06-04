# Therabo / 通微宝

<p align="center">
  <strong>Premium multi-language DTC e-commerce platform for nitric oxide wearable health products</strong>
</p>

<p align="center">
  <a href="https://therabo.com"><img src="https://img.shields.io/badge/Visit-Therabo-00A86B?style=flat&logo=web" alt="Website"></a>
  <img src="https://img.shields.io/badge/TypeScript-Frontend-blue?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Stack-React%20%2B%20Express%20%2B%20SQLite-green?style=flat" alt="Stack">
</p>

---

## Overview

Therabo (通微宝) is a full-featured direct-to-consumer e-commerce platform specializing in nitric oxide wearable health products. Built with modern web technologies, it supports multi-language content, multi-currency transactions, and diverse payment methods.

### Key Features

- **Multi-language Support**: Simplified Chinese (zh), Traditional Chinese (zh-tw), English (en)
- **Multi-currency**: CNY (RMB), USD
- **Product Management**: Full CRUD with inventory tracking, variants (colors/sizes), and SEO metadata
- **Shopping Cart**: Guest checkout + registered account support
- **Payment Integration**: Stripe, Alipay, WeChat Pay v3, offline payments
- **Admin Dashboard**: Complete backend management with analytics, order processing, customer management
- **Marketing Tools**: Popups, announcements, coupon codes, email campaigns
- **Content CMS**: Pages (Privacy Policy, Terms, FAQ, Returns), Hero/About sections
- **Email Notifications**: Order confirmations, payment receipts, shipping notifications, welcome emails

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Auth | bcrypt + JWT cookies |
| Payments | Stripe Checkout, Alipay SDK, WeChat Pay v3 |
| Email | Nodemailer (SMTP) |
| Deployment | Docker, Docker Compose, Nginx |

---

## Project Structure

```
therabo/
├── src/                         # React frontend source
│   ├── components/              # Reusable UI components
│   ├── admin/                  # Admin dashboard pages
│   ├── hooks/                   # Custom React hooks
│   ├── data/                    # Static product data (seed)
│   └── types.ts                 # TypeScript definitions
├── server/                     # Express backend source
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   ├── lib/                 # Business logic (auth, email, etc.)
│   │   ├── middleware/          # Express middleware
│   │   ├── db.ts                # Database layer
│   │   └── index.ts             # Server entry point
│   └── data/                    # SQLite database
├── public/                      # Static assets
├── Dockerfile                   # Multi-stage production build
├── docker-compose.yml           # Production stack (app + nginx)
├── nginx.conf                   # Nginx reverse proxy config
└── .env.example                 # Environment variables template
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for production)

### Development

```bash
# Frontend
npm install
npm run dev

# Backend
cd server
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend on port 8080.

### Production Build

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with real values
nano .env

# 3. Build and start containers
docker compose up -d --build
```

Access the production site at `http://localhost` (or your configured domain).

---

## First-time Setup

On first container start, the seed script automatically:

1. Creates admin account (`admin` + password from `ADMIN_BOOTSTRAP_PASSWORD`)
2. Seeds 16 default products
3. Initializes default site content (Hero, About sections)

**Important**: Log in to the admin dashboard immediately and change the admin password.

### Admin Access

- URL: `https://your-domain.com/#admin`
- Default credentials: `admin` + `ADMIN_BOOTSTRAP_PASSWORD` from `.env`

---

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_URL` | Public URL (e.g., `https://therabo.com`) |
| `JWT_SECRET` | Random string for JWT signing (min 32 bytes) |
| `ADMIN_BOOTSTRAP_PASSWORD` | Initial admin password |

### Optional (Payments)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ALIPAY_APP_ID` | Alipay app ID |
| `ALIPAY_PRIVATE_KEY` | Alipay private key |
| `ALIPAY_PUBLIC_KEY` | Alipay public key |
| `WECHAT_MCHID` | WeChat Pay merchant ID |
| `WECHAT_SERIAL_NO` | WeChat certificate serial number |

(Leave unconfigured payment fields blank — their buttons will be hidden from checkout)

### Optional (Email)

SMTP settings can be configured in the admin dashboard under **Mail Center → SMTP**.

---

## Documentation

- [Deployment Guide](DEPLOY.md) — Full production deployment walkthrough
- [Admin Login Tutorial](管理员登录教程.md) — In Chinese

---

## License

Proprietary — All rights reserved.

---

## Support

For technical support or business inquiries, contact the development team.
