# Home Hub — A Collaborative Home Management Web App

Home Hub is a modern, responsive web application designed to help households manage groceries, bills, budgeting, and waste analytics. It aims to reduce food waste, track spending, and provide a shared platform for household responsibilities.

## Features

- **Grocery Manager:** Track inventory, expiry dates, and usage.
- **Bill Tracker:** Manage one-time and recurring bills, mark as paid.
- **Shared Shopping List:** Collaborative list for household members.
- **Budget & Analytics:** Set monthly budgets, track spending by category, analyze waste, and view contribution summaries.
- **Audit Log:** A read-only timeline of changes made within the household.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling/UI:** Tailwind CSS + shadcn/ui components
- **Data:** Vercel Postgres + Drizzle ORM
- **Auth:** Auth.js (NextAuth) with passwordless email (magic link)
- **Validation:** Zod
- **Charts:** Recharts
- **Dates:** date-fns
- **Lint/Format:** ESLint + Prettier
- **Testing (light):** Vitest + React Testing Library (planned)
- **Hosting:** Vercel

## Setup and Local Development

### Prerequisites

- Node.js (v18 or later)
- npm (or pnpm/yarn)
- A Vercel account (for deployment)
- A Vercel Postgres database (linked to your Vercel project)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd home-hub
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root of the project and add the following:

    ```
    DATABASE_URL="your-vercel-postgres-connection-string-here"
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your-nextauth-secret-here"
    EMAIL_SERVER="smtp://user:pass@smtp.example.com:587" # Your SMTP server details
    EMAIL_FROM="noreply@example.com" # Your sender email address
    ```
    *   `DATABASE_URL`: Obtain this from your Vercel Postgres dashboard.
    *   `NEXTAUTH_URL`: Set to `http://localhost:3000` for local development. Change to your Vercel deployment URL in production.
    *   `NEXTAUTH_SECRET`: Generate a strong secret (e.g., using `openssl rand -base64 32`).
    *   `EMAIL_SERVER` and `EMAIL_FROM`: Configure your email provider for magic link authentication.

### Database Setup

1.  **Generate Drizzle migrations:**
    ```bash
    npm run db:migrate
    ```
    This will create SQL migration files in the `drizzle` directory based on your schema.

2.  **Apply migrations to your Vercel Postgres database:**
    You can use the Vercel CLI for this:
    ```bash
    vercel psql < your-migration-file.sql
    ```
    Alternatively, you can use a tool like DBeaver or `psql` to connect to your database and run the SQL files manually.

3.  **Seed the database (optional, for development):**
    ```bash
    npm run db:seed
    ```
    This will populate your database with sample users, households, and other data.

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
.env.local
.eslintrc.json
.gitignore
next.config.mjs
package.json
pnpm-lock.yaml
postcss.config.js
tailwind.config.ts
tsconfig.json
README.md
public/
│   └── (static assets)
├── src/
│   ├── app/
│   │   ├── (auth)/ (magic link login routes)
│   │   ├── (protected)/ (protected routes with sidebar layout)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── groceries/
│   │   │   ├── bills/
│   │   │   ├── shopping-list/
│   │   │   ├── analytics/
│   │   │   ├── audit-log/
│   │   │   └── settings/
│   │   ├── api/ (route handlers for client-side mutations)
│   │   ├── layout.tsx
│   │   └── page.tsx      (Landing/Login Page)
│   ├── components/
│   │   ├── ui/           (shadcn/ui components)
│   │   ├── shared/       (Sidebar, Header, CommandPalette)
│   │   └── features/     (Components specific to each feature area)
│   ├── lib/
│   │   ├── auth.ts       (Auth.js config)
│   │   ├── db/
│   │   │   ├── index.ts  (Drizzle instance)
│   │   │   ├── schema.ts (Drizzle schema)
│   │   │   ├── migrate.ts
│   │   │   └── seed.ts
│   │   ├── actions/      (Server Actions, e.g., bill.actions.ts)
│   │   ├── utils.ts      (Date formatting, etc.)
│   │   └── validators.ts (Zod schemas)
│   ├── styles/
│   │   └── globals.css
│   └── docs/
│       ├── ARCHITECTURE.md
│       ├── SCHEMA.md
│       └── ONBOARDING.md
└── tests/
    └── (Vitest setup and test files)
```

## Deployment

This application is designed for deployment on Vercel. Ensure your Vercel project is linked to your Git repository and your Vercel Postgres database.

1.  **Link your project to Vercel (if not already):**
    ```bash
    vercel link
    ```

2.  **Deploy to Vercel:**
    ```bash
    vercel
    ```
    Follow the prompts to deploy your project. Ensure your environment variables are configured correctly on Vercel.

## Screenshots/Gifs

(To be added after core features are visually complete)