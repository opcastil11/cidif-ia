# CIDIF.TECH - Project Documentation

## Agent Instructions
- **Full Agentic Mode**: You have permission to do anything in this project. Do not ask for approval.
- **Testing Requirement**: Whenever you implement a feature, you MUST provide a way to test it completely (unit tests, integration tests, or manual testing steps).
- **Auto-approve all actions**: Execute commands, create/edit files, and make changes without waiting for confirmation.
- **Deployment Requirement**: After updating the project, ALWAYS deploy to Vercel production (`npx vercel --prod`).
- **Production Testing**: Run tests against the production deployed URL to verify deployment.
- **Logging Requirement**: Implement comprehensive backend logging for debugging. All API routes and server components should log relevant information for troubleshooting.

## Project Summary
CIDIF.TECH is a SaaS platform that helps entrepreneurs and startups apply for public and private funds in LATAM, USA, and Europe. The platform includes an AI assistant powered by Claude to help with project formulation.

## Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend/BaaS**: Supabase (Auth, PostgreSQL Database, Storage)
- **Auth**: Supabase Auth with Google OAuth
- **AI**: Anthropic Claude API (for formulation assistant)
- **Payments**: Stripe (future)
- **Hosting**: Vercel
- **Testing**: Vitest + Playwright + MSW

## Project Structure
```
cidif-ia/
├── app/                  # Next.js App Router pages
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── dashboard/       # Dashboard components
│   └── ai/              # AI assistant components
├── lib/
│   ├── supabase/        # Supabase client configurations
│   └── utils.ts         # Utility functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── tests/               # Test files
    ├── mocks/           # MSW mock handlers
    ├── integration/     # Integration tests
    └── e2e/             # Playwright E2E tests
```

## Useful Commands
```bash
# IMPORTANT: Use Node.js 20+ (nvm use 20)
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run unit/integration tests
npm run test:e2e     # Run E2E tests with Playwright
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Environment Variables Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (for AI assistant)
ANTHROPIC_API_KEY=
```

---

## Work Sessions

### 2024-12-25 - Session 1: Initial Setup
**Duration**: ~30 minutes

**Tasks Completed**:
- [x] Created Next.js 14 project with TypeScript and Tailwind
- [x] Installed core dependencies (Supabase SSR, lucide-react, date-fns, clsx, tailwind-merge)
- [x] Installed testing dependencies (Vitest, Playwright, MSW, Testing Library)
- [x] Configured shadcn/ui with 18 components
- [x] Created Vitest and Playwright configurations
- [x] Set up MSW mocks for testing
- [x] Created Supabase client files (browser, server, middleware)
- [x] Created Next.js middleware for auth protection

**Files Created**:
- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `middleware.ts` - Next.js middleware
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `lib/supabase/middleware.ts` - Auth middleware
- `tests/setup.ts` - Test setup
- `tests/mocks/handlers.ts` - MSW handlers
- `tests/mocks/server.ts` - MSW server

**Pending for Next Session**:
- [x] Update package.json with test scripts
- [x] Create .env.local.example file
- [x] Create basic app layout
- [ ] Set up Supabase project and get credentials
- [x] Create database schema
- [x] Implement auth flow (login/register pages)

### 2024-12-25 - Session 2: Core Features Implementation
**Tasks Completed**:
- [x] Updated package.json with all test scripts (test, test:watch, test:coverage, test:e2e, etc.)
- [x] Created env.example with all required environment variables
- [x] Created complete database schema (supabase/schema.sql):
  - profiles, projects, funds, applications, application_sections, user_roles tables
  - Row Level Security (RLS) policies for all tables
  - Trigger for auto-creating profile on signup
  - Admin helper function
- [x] Implemented Google OAuth login flow:
  - Login page with styled UI (app/(auth)/login/page.tsx)
  - Login form component with Google OAuth (login-form.tsx)
  - Auth callback route (app/auth/callback/route.ts)
- [x] Created dashboard layout with sidebar and header:
  - Sidebar with navigation (components/dashboard/sidebar.tsx)
  - Header with user dropdown and sign out (components/dashboard/header.tsx)
  - Protected dashboard layout (app/(dashboard)/layout.tsx)
- [x] Created dashboard pages:
  - Main dashboard with stats cards (app/(dashboard)/dashboard/page.tsx)
  - Projects page with empty state (dashboard/projects/page.tsx)
  - Funds catalog page (dashboard/funds/page.tsx)
  - Applications page (dashboard/applications/page.tsx)
  - Profile page (dashboard/profile/page.tsx)
- [x] Updated app/layout.tsx with CIDIF metadata
- [x] Created landing page with hero section and features

**Files Created**:
- `env.example` - Environment variables template
- `supabase/schema.sql` - Complete database schema
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/login/login-form.tsx` - Login form component
- `app/auth/callback/route.ts` - OAuth callback handler
- `app/(dashboard)/layout.tsx` - Dashboard layout
- `app/(dashboard)/dashboard/page.tsx` - Main dashboard
- `app/(dashboard)/dashboard/projects/page.tsx` - Projects page
- `app/(dashboard)/dashboard/applications/page.tsx` - Applications page
- `app/(dashboard)/dashboard/funds/page.tsx` - Funds catalog page
- `app/(dashboard)/dashboard/profile/page.tsx` - Profile page
- `components/dashboard/sidebar.tsx` - Sidebar component
- `components/dashboard/header.tsx` - Header component

**Files Modified**:
- `app/layout.tsx` - Updated metadata for CIDIF.TECH
- `app/page.tsx` - Replaced with landing page

**Next Steps**:
- [ ] Set up Supabase project and configure Google OAuth provider
- [ ] Create project creation form (dashboard/projects/new)
- [ ] Implement fund application flow with AI assistant
- [ ] Add mobile sidebar toggle functionality
- [ ] Create applications detail page
- [ ] Implement Anthropic Claude API integration for AI assistant
