# Livinova

Platform marketplace properti “Livinova” untuk listing properti Smart Living terverifikasi, portal developer, dan panel admin.

## Struktur

- `apps/web` — Next.js (TypeScript, Tailwind, shadcn/ui, TanStack Query)
- `apps/api` — NestJS (TypeScript, Prisma, JWT + refresh token, RBAC)
- `packages/*` — paket bersama (types/config/ui)

## Prasyarat

- Node.js (disarankan versi LTS terbaru)
- PostgreSQL 16+
- Redis 7+
- (Opsional) Docker Desktop untuk menjalankan Postgres + Redis via `docker-compose.yml`

## Setup Environment

### Backend (apps/api)

1) Copy env template:
- `apps/api/.env.example` → `apps/api/.env`

2) Sesuaikan nilai `DATABASE_URL`, `REDIS_URL`, dan secret JWT.

### Frontend (apps/web)

1) Copy env template:
- `apps/web/.env.example` → `apps/web/.env`

2) Pastikan `NEXT_PUBLIC_API_URL` mengarah ke API (default `http://localhost:4000`).

## Menjalankan Infrastruktur (opsional via Docker)

Jika memakai Docker Desktop:

```bash
docker compose up -d
```

Default database:
- DB: `Livinova`
- User: `postgres`
- Password: `11111111`
- Port: `5432`

Redis port: `6379`

## Install Dependencies

Dari root monorepo:

```bash
npm install
```

## Prisma (Migrations + Generate + Seed)

Dari root monorepo:

```bash
npm run prisma:generate
```

Untuk menerapkan migrasi ke database:

```bash
npm run prisma:migrate
```

Untuk mengisi data contoh (developer, proyek, listing, fitur smart, bank KPR, artikel):

```bash
npm run prisma:seed
```

## Kredensial Admin (Seed)

Setelah menjalankan seed, akun berikut tersedia untuk akses dashboard admin:

- Email: `superadmin@livinova.local`
- Password: `Admin12345!`

## Menjalankan Aplikasi (Dev)

Dari root monorepo:

```bash
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`

## Endpoint Publik (MVP)

- `GET /public/listings` — listing terverifikasi (filter + pagination)
- `GET /public/listings/:slug` — detail listing
- `GET /public/developers` — direktori developer
- `GET /public/developers/:slug` — detail developer
- `GET /public/mortgage/banks` — daftar bank
- `GET /public/mortgage/products` — daftar produk KPR
- `POST /public/mortgage/simulate` — simulasi KPR berdasarkan konfigurasi produk di DB

## Halaman Web (MVP)

- `/` — beranda
- `/properti` — daftar properti
- `/properti/[slug]` — detail properti
- `/kpr` — simulasi KPR
- `/auth/login`, `/auth/register` — autentikasi dasar
