# Architecture Overview

Home Hub is built using Next.js 14 with the App Router, leveraging React Server Components (RSCs) and Server Actions for efficient data fetching and mutations. The application follows a modular, feature-based folder structure.

## Data Flow

1.  **Client-side Interaction:** User interactions (e.g., form submissions, button clicks) on client components (`"use client"`) trigger events.
2.  **Server Actions/Route Handlers:** These events invoke Next.js Server Actions (for mutations) or Route Handlers (for API endpoints). Server Actions are preferred for direct database interactions and data mutations.
3.  **Authentication & Authorization:** All requests are intercepted by Auth.js middleware to ensure the user is authenticated. User and household IDs are extracted from the session.
4.  **Data Access Layer (Drizzle ORM):** Server Actions and Route Handlers interact with the Vercel Postgres database via Drizzle ORM. Drizzle provides a type-safe query builder and handles SQL generation.
5.  **Database (Vercel Postgres):** The PostgreSQL database stores all application data, with Row-Level Security (RLS)-style filtering enforced in server code by `household_id` for multi-tenancy.
6.  **Data Revalidation:** After successful mutations, `revalidatePath` is used to re-render affected RSCs and ensure the UI reflects the latest data.
7.  **Server-Side Rendering (SSR) / Static Site Generation (SSG):** Next.js renders pages on the server, fetching initial data for RSCs. This provides fast initial page loads and good SEO.
8.  **Client-Side Hydration:** React hydrates the server-rendered HTML on the client, making the application interactive.

## Key Modules

### `src/app`

-   **`(auth)`:** Contains routes and components related to authentication (e.g., magic link login). These are public routes.
-   **`(protected)`:** A route group containing all authenticated routes. It includes a `layout.tsx` that enforces authentication and provides the main application layout (sidebar, header).
-   **`api`:** Houses Next.js Route Handlers for specific API endpoints, primarily for client-side data fetching or complex mutations not suitable for Server Actions.
-   **`layout.tsx`:** The root layout for the entire application.
-   **`page.tsx`:** The landing page, typically the sign-in/sign-up entry point.

### `src/components`

-   **`ui`:** Re-exports and customizes `shadcn/ui` components. This ensures a consistent design system and allows for easy updates.
-   **`shared`:** Contains layout components used across the application, such as `Sidebar` and `Header`.
-   **`features`:** Organizes components by feature (e.g., `groceries`, `bills`, `purchases`). Each feature folder contains components specific to that domain, promoting modularity and maintainability.

### `src/lib`

-   **`auth.ts`:** Configures Auth.js, including providers (Email) and callbacks for session management and user data enrichment (e.g., adding `householdId` to the session).
-   **`db`:**
    -   **`index.ts`:** Initializes the Drizzle ORM client.
    -   **`schema.ts`:** Defines the database schema using Drizzle ORM, including table definitions and relations. This is the single source of truth for the database structure.
    -   **`migrate.ts`:** Script for running database migrations.
    -   **`seed.ts`:** Script for populating the database with sample data for development.
-   **`actions`:** Contains Next.js Server Actions. These functions are executed on the server and handle data mutations and business logic. They are organized by domain (e.g., `items.actions.ts`, `bills.actions.ts`).
-   **`utils.ts`:** Utility functions used across the application (e.g., date formatting, helper functions).
-   **`validators.ts`:** Zod schemas for input validation, ensuring data integrity before processing on the server.

## Design Principles

-   **Mobile-First:** UI is designed and developed with mobile devices in mind first, then scaled up for larger screens.
-   **Accessibility:** Adherence to WCAG guidelines for form controls, focus management, and semantic HTML.
-   **Clear Module Boundaries:** Features are encapsulated in their own directories, minimizing dependencies between different parts of the application.
-   **Environment-Driven Configuration:** Sensitive information and environment-specific settings are managed through environment variables.
-   **Server-Side Logic:** Business logic and data access are primarily handled on the server to improve performance, security, and maintainability.
