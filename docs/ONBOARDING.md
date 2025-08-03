# Onboarding Guide

This guide provides instructions for setting up your development environment and deploying the Home Hub application.

## 1. Development Environment Setup

### Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js**: Version 18 or higher. You can download it from [nodejs.org](https://nodejs.org/).
-   **npm**: Node Package Manager, which comes with Node.js. (Alternatively, you can use `pnpm` or `yarn` if preferred, but `npm` is used in these instructions.)
-   **Git**: For version control. Download from [git-scm.com](https://git-scm.com/).
-   **Vercel CLI**: For deploying to Vercel and managing Vercel Postgres. Install globally:
    ```bash
    npm install -g vercel
    ```
    Then, log in to your Vercel account:
    ```bash
    vercel login
    ```

### Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd home-hub
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root of your project. This file will store sensitive information and configuration specific to your development environment. Populate it with the following:

    ```dotenv
    DATABASE_URL="your-vercel-postgres-connection-string-here"
    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="your-nextauth-secret-here"
    EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
    EMAIL_FROM="noreply@example.com"
    ```

    -   **`DATABASE_URL`**: This is your connection string to the Vercel Postgres database. You can find this in your Vercel project dashboard under the Storage tab for your Postgres database.
    -   **`NEXTAUTH_URL`**: For local development, set this to `http://localhost:3000`. When deploying to Vercel, this should be your deployed application URL (e.g., `https://your-app-name.vercel.app`).
    -   **`NEXTAUTH_SECRET`**: A random string used to sign and encrypt the NextAuth.js JWT. You can generate a strong one using `openssl rand -base64 32` in your terminal.
    -   **`EMAIL_SERVER`**: Your SMTP server connection string for sending magic links. Replace `user`, `pass`, `smtp.example.com`, and `587` with your email provider's details.
    -   **`EMAIL_FROM`**: The email address that will appear as the sender for magic link emails.

### Database Setup (Local Development)

1.  **Generate Drizzle Migrations:**
    After defining or modifying your Drizzle schema (`src/lib/db/schema.ts`), generate a new migration file:
    ```bash
    npm run db:migrate
    ```
    This command will create a new SQL file in the `drizzle` directory, capturing the changes.

2.  **Apply Migrations to Vercel Postgres:**
    To apply the generated SQL migrations to your Vercel Postgres database, use the Vercel CLI. Replace `drizzle/<timestamp>_*.sql` with the actual path to your latest migration file:
    ```bash
    vercel psql < drizzle/<timestamp>_*.sql
    ```
    Alternatively, you can connect to your Vercel Postgres database using a GUI tool (like DBeaver or TablePlus) or `psql` and execute the SQL commands manually.

3.  **Seed the Database (Optional):**
    For development purposes, you can populate your database with sample data using the seed script:
    ```bash
    npm run db:seed
    ```
    **Note:** This script is intended for development and will insert sample data. Do not run it on a production database unless you intend to reset its data.

### Running the Development Server

To start the Next.js development server:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

## 2. Deployment to Vercel

Home Hub is designed for seamless deployment on Vercel.

1.  **Link your project to Vercel (if not already linked):**
    Navigate to your project directory in the terminal and run:
    ```bash
    vercel link
    ```
    Follow the prompts to link your local project to a Vercel project.

2.  **Configure Environment Variables on Vercel:**
    Ensure that all environment variables from your `.env.local` file (especially `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `EMAIL_SERVER`, `EMAIL_FROM`) are configured in your Vercel project settings. For `NEXTAUTH_URL`, use your Vercel deployment URL (e.g., `https://your-app-name.vercel.app`).

3.  **Deploy the Application:**
    To deploy your application to Vercel, simply run:
    ```bash
    vercel
    ```
    Vercel will build and deploy your application. Once deployed, it will provide you with the public URL.

## 3. Post-Deployment Steps

-   **Verify Database Connection:** After deployment, ensure your application can connect to the Vercel Postgres database. Check Vercel deployment logs for any database connection errors.
-   **Test Authentication:** Verify that magic link authentication works correctly in the deployed environment.
-   **Sanity Check Features:** Test all core features (Groceries, Bills, Shopping List, Analytics, Audit Log) to ensure they function as expected.
