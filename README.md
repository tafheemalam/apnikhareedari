# ApniKhareedari

A complete, production-ready e-commerce platform built for a Pakistani online store: Laravel 13 REST API + MySQL 8 backend, and a React + Vite storefront and admin panel. Cash on Delivery works out of the box; online payment is wired through a swappable gateway interface.

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Quick Start (Docker)](#2-quick-start-docker)
3. [Laravel Installation Details](#3-laravel-installation-details)
4. [MySQL Database Setup](#4-mysql-database-setup)
5. [Environment Configuration](#5-environment-configuration)
6. [Migration Commands](#6-migration-commands)
7. [Seeder Commands](#7-seeder-commands)
8. [Storage Configuration](#8-storage-configuration)
9. [Backend Startup](#9-backend-startup)
10. [React Frontend Setup](#10-react-frontend-setup)
11. [Build Commands](#11-build-commands)
12. [API Documentation](#12-api-documentation)
13. [Admin Login](#13-admin-login)
14. [Payment Gateway Configuration](#14-payment-gateway-configuration)
15. [Production Deployment Instructions](#15-production-deployment-instructions)
16. [Running Tests](#16-running-tests)
17. [Project Structure](#17-project-structure)

---

## 1. System Requirements

**Recommended path (Docker) — nothing else to install:**
- Docker Desktop (Windows/macOS) or Docker Engine + Compose v2 (Linux)
- Node.js 18+ and npm (for the React frontend, which runs directly on the host)

**Running the backend natively instead of via Docker:**
- PHP 8.3+ with extensions: `pdo_mysql`, `mbstring`, `exif`, `pcntl`, `bcmath`, `gd`, `zip`, `opcache`
- Composer 2+
- MySQL 8+
- Node.js 18+ and npm

This guide documents the Docker path, since that's what this repo's `docker-compose.yml` sets up. If you run the backend natively instead, skip the `docker compose` prefix on every command below and run `php artisan` / `composer` directly against a MySQL server you configure yourself in `backend/.env`.

## 2. Quick Start (Docker)

```bash
git clone <this-repo> apnikhareedari
cd apnikhareedari

# 1. Backend: copy env, start containers, install deps, migrate + seed
cp backend/.env.example backend/.env
docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan storage:link
docker compose exec app php artisan migrate --seed

# 2. Frontend (runs on the host, not in Docker)
cd frontend
npm install
npm run dev
```

Then open:
- Storefront: http://localhost:5173
- Admin panel: http://localhost:5173/admin (see [Admin Login](#13-admin-login))
- API: http://localhost:8000/api
- Mailhog (catches all outgoing email locally): http://localhost:8025

## 3. Laravel Installation Details

The `docker-compose.yml` at the repo root defines four services:

| Service | Purpose |
|---|---|
| `app` | PHP 8.3-FPM running Laravel (OPcache enabled — see note below) |
| `webserver` | nginx, proxies to `app`, exposed on `localhost:8000` |
| `mysql` | MySQL 8, exposed on `localhost:3307` (host) → `3306` (container) |
| `queue` | Runs `php artisan queue:work`, processes queued notification emails |
| `mailhog` | Local SMTP catcher, exposed on `localhost:8025` (web UI) |

All PHP commands run **inside** the `app` container:

```bash
docker compose exec app php artisan <command>
docker compose exec app composer <command>
```

**Windows/Docker Desktop note:** this project bind-mounts `backend/` into the container so edits on the host are picked up immediately. On Windows, crossing from the NTFS host filesystem into the container is slow enough that PHP's OPcache (`docker/php/opcache.ini`) is tuned with `revalidate_freq=2` — it batches the "did this file change" filesystem check to once every 2 seconds per file instead of every single request. This cuts typical request time from several seconds down to ~100-200ms once warmed up, while still picking up backend code changes automatically within a couple of seconds. If you ever need to force an immediate cache clear: `docker compose restart app`.

## 4. MySQL Database Setup

MySQL is provisioned automatically by `docker compose up -d` using the credentials baked into `docker-compose.yml` and mirrored in `backend/.env.example`:

- Database: `apnikhareedari`
- User: `akd_user` / Password: `akd_password`
- Root password: `akd_root_password`
- Host (from inside Docker's network): `mysql` — this is what `backend/.env` should use
- Host (from your own machine, e.g. a GUI client): `127.0.0.1:3307`

If you're running MySQL natively instead of via Docker, create the database and user yourself:

```sql
CREATE DATABASE apnikhareedari CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'akd_user'@'%' IDENTIFIED BY 'akd_password';
GRANT ALL PRIVILEGES ON apnikhareedari.* TO 'akd_user'@'%';
FLUSH PRIVILEGES;
```
...then update `DB_HOST` in `backend/.env` to `127.0.0.1` (or your MySQL host).

## 5. Environment Configuration

Copy the example file and adjust as needed:

```bash
cp backend/.env.example backend/.env
docker compose exec app php artisan key:generate
```

Key variables:

| Variable | Purpose |
|---|---|
| `APP_URL` | Backend base URL (`http://localhost:8000` for Docker) |
| `FRONTEND_URL` | Used to build links inside emails (password reset, order confirmation) |
| `DB_HOST` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | MySQL connection — `mysql` as host when using Docker |
| `MAIL_HOST` | `mailhog` when using Docker; catches all mail locally, nothing is really sent |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | Credentials created by the database seeder — see [Admin Login](#13-admin-login) |
| `CUSTOMER_SEED_EMAIL` / `CUSTOMER_SEED_PASSWORD` | Demo customer account created by the seeder |
| `QUEUE_CONNECTION` | `database` — the `queue` container processes notification emails asynchronously |

The frontend has its own `frontend/.env` (already committed, since it holds no secrets — just the API base URL):

```
VITE_API_URL=http://localhost:8000/api
```

## 6. Migration Commands

```bash
docker compose exec app php artisan migrate            # run pending migrations
docker compose exec app php artisan migrate:fresh       # drop everything and re-run from scratch
docker compose exec app php artisan migrate:status       # see what's been applied
docker compose exec app php artisan migrate:rollback     # undo the last batch
```

The schema (22 migrations) covers catalog (categories/products/images/variations), inventory + a full transaction ledger, cart, wishlist, addresses, orders/order items, payments, coupons + usage tracking, reviews, shipping zones/rates, settings, roles/permissions, and Sanctum tokens — with foreign keys, indexes, and cascade/restrict rules throughout.

## 7. Seeder Commands

```bash
# Everything at once (recommended for a fresh environment)
docker compose exec app php artisan migrate:fresh --seed

# Or seed on top of an existing schema
docker compose exec app php artisan db:seed
```

This creates, in order: roles & permissions, the admin + demo customer accounts, default store/payment/shipping/tax settings, four shipping zones (Karachi, Lahore, Islamabad, Other Cities), a ~25-product catalog across 4 top-level categories (with Size/Color variations on clothing and footwear), 3 sample coupons, and 5 sample orders spanning every order status.

Re-run a single seeder if you only want to reset one part of the demo data, e.g.:
```bash
docker compose exec app php artisan db:seed --class=CatalogSeeder
```

## 8. Storage Configuration

Product/category images and uploaded settings assets (logo, favicon) are stored via Laravel's `public` disk at `backend/storage/app/public`, symlinked to `backend/public/storage`:

```bash
docker compose exec app php artisan storage:link
```

This only needs to run once per environment (it's already required in the Quick Start above). Uploaded images are served at `http://localhost:8000/storage/<path>`.

## 9. Backend Startup

```bash
docker compose up -d          # start all containers in the background
docker compose logs -f app    # tail the Laravel container's logs
docker compose down           # stop everything (add -v to also wipe the MySQL volume)
```

The API is then live at `http://localhost:8000/api`. Health check: `GET http://localhost:8000/up`.

## 10. React Frontend Setup

The frontend runs directly on your machine (not in Docker) via Node:

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. It talks to the API at whatever `VITE_API_URL` points to in `frontend/.env`.

## 11. Build Commands

**Frontend production build:**
```bash
cd frontend
npm run build      # outputs static assets to frontend/dist
npm run preview    # serve the production build locally to sanity-check it
```

**Backend — no separate build step** for the API itself, but for production you should bake in Composer's optimized autoloader and Laravel's config/route caches (see [Production Deployment](#15-production-deployment-instructions)):
```bash
docker compose exec app composer install --no-dev --optimize-autoloader
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
```

## 12. API Documentation

All endpoints are prefixed with `/api`. Responses follow a consistent envelope:

```json
// success
{ "success": true, "message": "Product created successfully", "data": { } }
// error
{ "success": false, "message": "Validation failed", "errors": { } }
```

Auth uses Laravel Sanctum bearer tokens (`Authorization: Bearer <token>`), issued on login/register. Guests get a cart via an `X-Cart-Token` header (a client-generated UUID) instead of an auth token; the frontend's `src/services/api.js` handles this automatically.

<details>
<summary><strong>Public / storefront</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create a customer account |
| POST | `/auth/login` | Login (customer or admin) |
| POST | `/auth/forgot-password` | Send a password reset email |
| POST | `/auth/reset-password` | Reset password with the emailed token |
| GET | `/categories` | Category tree (active, root-level with children) |
| GET | `/categories/{slug}` | One category + its children |
| GET | `/products` | Search/filter/sort/paginate products |
| GET | `/products/{slug}` | Product detail incl. variations + approved reviews |
| GET | `/products/{product}/reviews` | Approved reviews for a product |
| GET | `/settings/public` | Store name/logo/contact/payment-methods-enabled/social links |
| GET | `/shipping/zones` | Active shipping zones and rates |
| POST | `/shipping/estimate` | Estimate shipping for a city + subtotal |
| POST | `/coupons/validate` | Check a coupon code against a subtotal |
| GET/POST/PUT/DELETE | `/cart`, `/cart/items(/…)` | Guest or authenticated cart |
| POST | `/checkout` | Place an order (COD or online) |

</details>

<details>
<summary><strong>Authenticated customer</strong> (Bearer token required)</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/auth/me`, `/auth/logout` | Current user, logout |
| PUT | `/profile`, `/profile/password` | Update profile / change password |
| GET/POST/PUT/DELETE | `/addresses(/…)` | Address book (owner-only) |
| PATCH | `/addresses/{id}/default` | Set default address |
| GET/POST/DELETE | `/wishlist(/…)` | Wishlist |
| POST | `/wishlist/{product}/move-to-cart` | Move a wishlist item into the cart |
| GET | `/orders`, `/orders/{orderNumber}` | Own orders / order detail |
| POST | `/orders/{orderNumber}/cancel` | Cancel own order (if still cancellable) |
| GET | `/orders/{orderNumber}/invoice` | Download invoice PDF |
| POST | `/products/{product}/reviews` | Review a product (delivered orders only) |
| PUT | `/reviews/{review}` | Edit own review |

</details>

<details>
<summary><strong>Admin</strong> (Bearer token + role/permission required, all under <code>/admin/*</code>)</summary>

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | `view-dashboard` | Stats + daily/monthly sales, orders-by-status, top sellers |
| ...CRUD | `/admin/categories` | `manage-categories` | + `PATCH .../toggle-status` |
| ...CRUD | `/admin/products` | `manage-products` | + images, `/admin/products/{id}/variations` CRUD |
| GET/POST | `/admin/inventory(/…)` | `manage-inventory` | List, low-stock, out-of-stock, history, increase/decrease/set |
| GET/PUT/POST | `/admin/orders(/…)` | `manage-orders` | List, detail, status/payment-status update, cancel, invoice |
| ...CRUD | `/admin/coupons` | `manage-coupons` | + toggle-status |
| GET/PATCH/DELETE | `/admin/reviews(/…)` | `manage-reviews` | Approve/reject/delete |
| GET/PUT/POST | `/admin/settings(/…)` | `manage-settings` | Grouped settings, logo/favicon upload |
| ...CRUD | `/admin/shipping-zones` | `manage-settings` | Shipping zones + rates |
| ...CRUD | `/admin/users` | `manage-admins` | Admin user management + role assignment |

</details>

Run `docker compose exec app php artisan route:list --path=api` for the exhaustive, always-current list.

## 13. Admin Login

Seeded by `AdminUserSeeder` (credentials come from `backend/.env`, defaults shown below — **change these before any real deployment**):

- **Admin panel URL:** `http://localhost:5173/admin`
- **Email:** `admin@apnikhareedari.pk` (`ADMIN_SEED_EMAIL`)
- **Password:** `Admin@12345` (`ADMIN_SEED_PASSWORD`)
- Role: Super Admin (all permissions)

A demo customer account is also seeded: `customer@apnikhareedari.pk` / `Customer@12345`.

## 14. Payment Gateway Configuration

Online payment is built behind an interface (`app/Contracts/PaymentGatewayInterface.php`) so checkout logic never talks to a specific gateway directly:

```php
interface PaymentGatewayInterface
{
    public function identifier(): string;
    public function charge(Order $order, array $payload = []): PaymentResult;
    public function verify(string $transactionId): PaymentResult;
    public function refund(Payment $payment, ?float $amount = null): PaymentResult;
}
```

Two implementations ship out of the box:
- **`CodGateway`** — Cash on Delivery, always "succeeds" with `payment_status = pending` (paid on delivery).
- **`MockGateway`** — simulates a successful online charge for local development/demos. No card data is ever collected or stored, per spec rule #12.

Toggle these from **Admin → Settings → Payment**, which writes to the `settings` table:
- `payment.cod_enabled` — show/hide Cash on Delivery at checkout
- `payment.online_enabled` — show/hide Online Payment at checkout
- `payment.active_gateway` — which gateway identifier `MockGateway`/a real one is currently active

**To add a real gateway** (Stripe, PayPal, JazzCash, Easypaisa, etc.):
1. Implement `PaymentGatewayInterface` in `app/Services/Payments/YourGateway.php`.
2. Register it in `PaymentGatewayManager::$gateways` (`app/Services/Payments/PaymentGatewayManager.php`).
3. Put its API keys in `.env` (never in the database, never sent to the frontend) and read them in your gateway class via `config()`.
4. Set `payment.active_gateway` to its identifier from the admin Settings page.

No other code — checkout, order creation, inventory deduction — needs to change.

## 15. Production Deployment Instructions

This repo's `docker-compose.yml` is a **development** setup (bind-mounted source, Mailhog, exposed DB port). For production:

1. **Backend**
   - Build a production image that `COPY`s the code in rather than bind-mounting it (drop the `volumes:` bind mount, add a multi-stage `COPY . .` + `composer install --no-dev --optimize-autoloader` in the Dockerfile).
   - Set `APP_ENV=production`, `APP_DEBUG=false`, generate a fresh `APP_KEY`.
   - Point `DB_*` at a managed/production MySQL instance; don't expose its port publicly.
   - Set real `MAIL_*` credentials (SMTP provider of your choice) instead of Mailhog.
   - Set `payment.active_gateway` to a real implementation with real credentials in `.env`.
   - Run `php artisan config:cache route:cache view:cache` as part of your deploy step.
   - Run `php artisan migrate --force` (not `migrate:fresh`) against the production database.
   - Keep the `queue` worker running (e.g. under Supervisor) so notification emails keep sending after deploy.
   - Serve behind HTTPS; set `SESSION_SECURE_COOKIE=true` and restrict `CORS_ALLOWED_ORIGINS` in `.env` to your real frontend domain.
   - `opcache.validate_timestamps=1` is fine for a normal Linux host (no cross-filesystem penalty there); consider `0` for maximum performance if your deploy pipeline restarts PHP-FPM on every release anyway.

2. **Frontend**
   - `npm run build` produces static assets in `frontend/dist` — deploy these to any static host/CDN (Nginx, S3+CloudFront, Vercel, Netlify, etc.).
   - Set `VITE_API_URL` to your production API's public URL at build time.

3. **Storage**
   - Product images live on the `public` disk. For a multi-server deployment, switch `FILESYSTEM_DISK` to S3-compatible storage instead of local disk so uploads are shared across app servers.

## 16. Running Tests

```bash
docker compose exec app php artisan test
```

49 feature tests cover registration, login, category/product creation and authorization, product search, cart + stock validation, checkout (COD, online/mock payment, coupon discounts, stock-race handling, price snapshotting), order cancellation with inventory restoration, inventory adjustment, coupon validation, and RBAC/ownership authorization boundaries. Tests run against an in-memory SQLite database (see `backend/phpunit.xml`) so they don't touch your dev MySQL data.

## 17. Project Structure

```
apnikhareedari/
├── docker-compose.yml       # app, webserver, mysql, queue, mailhog
├── docker/
│   ├── php/                 # Dockerfile + opcache.ini for the app/queue containers
│   └── nginx/                # nginx vhost proxying to php-fpm
├── backend/                 # Laravel 13 API
│   ├── app/
│   │   ├── Contracts/        # PaymentGatewayInterface
│   │   ├── Http/Controllers/Api/{Admin,Auth}/
│   │   ├── Http/Requests/    # Form Request validation
│   │   ├── Http/Resources/   # API response shaping
│   │   ├── Models/
│   │   ├── Notifications/    # queued, mail-channel notifications
│   │   ├── Policies/         # ownership authorization (registered in AppServiceProvider)
│   │   └── Services/         # InventoryService, CheckoutService, ShippingService, Payments/
│   ├── database/{migrations,seeders,factories}/
│   └── tests/Feature/
└── frontend/                # React 19 + Vite
    └── src/
        ├── components/{layout,ui}/
        ├── context/          # Auth, Cart, Site, Toast
        ├── pages/{account,admin,auth}/
        └── services/{admin}/ # one module per API resource
```
