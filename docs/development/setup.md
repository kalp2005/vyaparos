# VyaparOS — Development Setup & Authentication Architecture Guide

This document provides setup instructions for running VyaparOS locally and configuring **Firebase Authentication** alongside **Supabase PostgreSQL**.

---

## 1. Architectural Roles of Providers

```text
                    VYAPAROS
                       │
                       ↓
              Firebase Authentication (Identity Provider)
                       │
                       ↓ (Verified JWT / ID Token)
                 Firebase UID
                       │
                       ↓ (Server Token Verification)
                 Application API
                       │
                       ↓ (Tenant Scoped & RLS Enforced)
                Supabase PostgreSQL (Application Database)
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
       User / Roles          Business Data
```

- **Firebase Authentication** handles:
  - Phone OTP Authentication (+91 format)
  - Email & Password Authentication
  - Session lifecycle, tokens, and password resets
- **Supabase PostgreSQL** handles:
  - Relational database storage, foreign keys, and constraints
  - Row-Level Security (RLS) policies
  - User profiles, multi-tenant businesses, branches, khata ledgers, transactions, and audit trails
- **Application Authorization**:
  - Global Roles (`ADMIN`, `SHOPKEEPER`, `SHOPPER`)
  - Operational Roles (`OWNER`, `MANAGER`, `CASHIER`, `SALESPERSON`, `ACCOUNTANT`, `INVENTORY_MANAGER`)

---

## 2. Environment Variables Setup

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"

# Firebase Web SDK (Client)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="[PROJECT].firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="[PROJECT]"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="[PROJECT].appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:...:web:..."

# Firebase Admin SDK (Server Only)
FIREBASE_PROJECT_ID="[PROJECT]"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@[PROJECT].iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 3. Database Migrations

Apply database migrations located in `supabase/migrations/`:

```bash
# Push schema migrations to Supabase
npx prisma db push
# Or apply direct SQL migration
# supabase/migrations/20260831000001_initial_schema_and_rls.sql
```

Seed realistic Indian merchant test records:

```bash
node prisma/seed.js
```

---

## 4. Running the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the landing page and authentication screens.

---

## 5. Automated Testing

Run the automated test suite covering authentication, tenancy isolation, roles, and double-entry ledger cascade:

```bash
npm test
```
