<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# ProkerMart Project Context

## Project Overview

ProkerMart is a digital marketplace ecosystem for student organizations (Organisasi Mahasiswa/Ormawa). It allows organizations to sell merchandise, food, and services through dedicated "Toko" and "Sub-toko" (Proker-specific shops).

### Store Hierarchy & Access Levels

1. **Toko (Main Shop)**: The primary digital storefront assigned to a specific student organization.
2. **Sub-toko (Proker Shop)**: Department-specific or program-specific sub-shops tied to particular student work programs (Program Kerja/Proker).
3. **User Roles**:
   - `pembeli`: General students/customers browsing and purchasing items.
   - `organisasi`: Staff managing the main organization storefront.
   - `proker`: Sub-managers maintaining specific event or department sub-shops.
   - `admin`: Platform overseers handling global configuration, verification, and system health.

## Tech Stack

- **Framework**: Next.js 16.2.6 (App Router)
- **Library**: React 19.2.6
- **Styling**: Tailwind CSS 4 (using `@tailwindcss/postcss`)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database/Auth**: Supabase

## Project Structure

- `src/app/`: App Router routes and pages.
- `src/components/`: Reusable React components.
- `src/lib/`: Utility functions and clients.
- `supabase/migrations/`: SQL migration files for database schema.

## Database Schema Highlights

The database uses PostgreSQL (via Supabase) with the following key tables:

- `pengguna`: User accounts with roles (`pembeli`, `organisasi`, `proker`, `admin`).
- `organisasi`: Student organizations linked to users.
- `toko`: Main shops for organizations.
- `sub_toko`: Department or program-specific shops (Proker).
- `produk`: Items for sale.
- `pesanan` & `detail_pesanan`: Transaction management.
- `pembayaran`: Payment tracking (QRIS, Transfer, Cash).

## Development Rules & Patterns

1. **Code vs UI Language**: Use **English** for all code (variables, functions, comments). Use **Indonesian** for UI text and user-facing descriptions.
2. **Design Standards**: Follow existing high-quality UI patterns with strong responsiveness as a core requirement.
   - **Primary Color**: Blue (`biru`) is the main color.
   - **Neutral Colors**: White (`putih`) and Black (`hitam`) are neutrals.
   - **Tertiary Colors**: Other colors are considered tertiary.
   - **Animations**: Use framer-motion for smooth transitions.
   - **Icons**: Use lucide-react.
   - **All UI must be responsive (mobile-first, tablet, desktop)**
3. **Modular Architecture & Project Structure**:
   - Maintain a clean, decoupled folder structure. Avoid bloated monolithic files. Component size should ideally not exceed **300 lines of code**.
4. **Database Operations**: Always check the live database structure directly via the Supabase MCP server (e.g. using `list_tables` and `execute_sql` to query `information_schema.columns`) instead of just relying on migration files, as the actual live database schema might contain manual adjustments or updates not reflected in local SQL files.
5. **Environment Variables**: Access Supabase credentials securely using `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
6. **Error Handling**: Every Supabase fetch, insert, or mutation must be wrapped in structured `try-catch` blocks. Log error metrics cleanly using a prefix identifier: `console.error("[Module - Action] Error:", error);`.
7. **Next.js 16**: Be aware of potential breaking changes compared to older versions (13/14/15).
8. **Component Usage**:
   - Always check `src/components` for existing components before creating new ones.
   - Prioritize using and extending existing components to maintain consistency.
   - If a specific UI pattern is needed multiple times, create a reusable component instead of duplicating code.
