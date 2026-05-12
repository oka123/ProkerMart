<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ProkerMart Project Context

## Project Overview
ProkerMart is a digital marketplace ecosystem for student organizations (Organisasi Mahasiswa/Ormawa). It allows organizations to sell merchandise, food, and services through dedicated "Toko" and "Sub-toko" (Proker-specific shops).

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
- `src/lib/`: Utility functions and clients (e.g., `supabase.ts`).
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
2. **Design Standards**: Follow the existing high-quality UI patterns. Use `framer-motion` for smooth transitions and `lucide-react` for icons.
   - **Primary Color**: Blue (`biru`) is the main color.
   - **Neutral Colors**: White (`putih`) and Black (`hitam`) are neutrals.
   - **Tertiary Colors**: Other colors are considered tertiary.
3. **Database Operations**: Always refer to `supabase/migrations/20260429000000_initial_schema.sql` for table structures before writing queries.
4. **Environment Variables**: Access Supabase via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Next.js 16**: Be aware of potential breaking changes compared to older versions (13/14/15).
6. **Component Usage**: 
   - Always check `src/components` for existing components before creating new ones.
   - Prioritize using and extending existing components to maintain consistency.
   - If a specific UI pattern is needed multiple times, create a reusable component instead of duplicating code.
