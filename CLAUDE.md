# CIDIF.TECH - Project Documentation

## Agent Instructions
- **Full Agentic Mode**: You have permission to do anything in this project. Do not ask for approval.
- **Skill-First Approach**: Before implementing any task, FIRST check if there's a Claude Skill that can help. Browse available skills at https://github.com/anthropics/skills/tree/main/skills. Relevant skills include:
  - `brand-guidelines` - For brand consistency and identity
  - `frontend-design` - For UI/UX design principles
  - `theme-factory` - For generating design themes
  - `webapp-testing` - For testing web applications
  - `docx`, `pdf`, `pptx`, `xlsx` - For document processing
- **Testing Requirement**: Whenever you implement a feature, you MUST provide a way to test it completely (unit tests, integration tests, or manual testing steps).
- **Auto-approve all actions**: Execute commands, create/edit files, and make changes without waiting for confirmation.
- **Deployment Requirement**: After updating the project, ALWAYS deploy using the Orquesta Deploy API (NOT vercel CLI):
  ```bash
  curl -X POST "https://orquesta.live/api/integrations/vercel/deploy" \
    -H "Content-Type: application/json" \
    -H "X-Agent-Token: $ORQUESTA_TOKEN" \
    -d '{"projectId": "fb324d50-c231-4aa4-93b6-cfc424a449d0", "environment": "production"}'
  ```
  Vercel CLI is NOT authenticated. The Orquesta token is available in the environment.
- **Production Testing**: Run tests against the production deployed URL to verify deployment.
- **Logging Requirement**: Implement comprehensive backend logging for debugging. All API routes and server components should log relevant information for troubleshooting.
- **Internationalization (i18n)**: The app MUST support English and Spanish. All user-facing text must be translatable. Default language is Spanish.

### Session Resume Rules
When resuming from a previous session or context truncation:
- **Always re-read CLAUDE.md** at the start of each resumed session to refresh project requirements
- **Use TodoWrite** to explicitly track "Add i18n" and "Write tests" as required steps for EVERY feature
- **Check requirements checklist** before marking any feature complete:
  - [ ] i18n translations added (ES + EN)
  - [ ] Tests written and passing
  - [ ] Build succeeds
  - [ ] Deployed to production

### Linear Ticket Filtering
When syncing Linear tickets, **only work on CIDIF project tickets**:
- Tickets with `agent` label that reference `cidif-ia.vercel.app` URLs
- Tickets mentioning CIDIF features (funds, applications, AI assistant for grants)
- **IGNORE** tickets for other projects (e.g., ehive.cc, EV charging, etc.)

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

# Linear (for autonomous agent workflow)
LINEAR_API_KEY=
LINEAR_TEAM_ID=
```

---

## Autonomous Agent Workflow

### Overview
This project supports fully autonomous development via Linear integration. The agent syncs tickets labeled `agent` from Linear, processes them using Claude Code, and deploys changes automatically.

### Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   Linear    │────▶│ Agent Sync   │────▶│ Claude Code │────▶│  Vercel  │
│  (Tickets)  │     │   Script     │     │    Agent    │     │ (Deploy) │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌─────────────┐
                    │ .agent/      │     │    Git      │
                    │ tickets.json │     │   Commit    │
                    └──────────────┘     └─────────────┘
```

### Setting Up Linear Integration

1. **Get Linear API Key**:
   - Go to Linear Settings → API → Create new API key
   - Add to `.env.local`: `LINEAR_API_KEY=lin_api_xxxxx`

2. **Get Team ID**:
   - Run: `npm run agent:states`
   - Or find in Linear URL: `linear.app/TEAM_ID/...`
   - Add to `.env.local`: `LINEAR_TEAM_ID=xxxxx`

3. **Label Tickets for Agent**:
   - Create a label called `agent` in Linear
   - Add this label to any ticket you want the agent to work on

### Agent Commands

```bash
# Ticket Management
npm run agent:sync      # Sync tickets from Linear
npm run agent:list      # List all synced tickets
npm run agent:next      # Show next ticket to work on
npm run agent:start     # Start working on next ticket
npm run agent:complete  # Mark current ticket as done
npm run agent:current   # Show current ticket
npm run agent:states    # List workflow states

# Autonomous Loop
npm run agent:loop      # Run continuous loop
npm run agent:once      # Process one ticket and exit
```

### Running in VM

1. **Create VM** (using Multipass):
   ```bash
   multipass launch 24.04 --name cidif --cpus 2 --memory 4G --disk 20G
   multipass shell cidif
   ```

2. **Bootstrap Environment**:
   ```bash
   # Download and run bootstrap script
   curl -sSL https://raw.githubusercontent.com/YOUR_USER/cidif-ia/main/scripts/bootstrap-vm.sh | bash
   ```

3. **Configure**:
   ```bash
   cd ~/cidif-ia
   nano .env.local  # Add API keys
   claude           # Authenticate Claude Code
   vercel link      # Link to Vercel project
   ```

4. **Start Agent**:
   ```bash
   # Manual mode (process one ticket)
   npm run agent:once

   # Continuous mode (run forever)
   npm run agent:loop

   # Or use systemd service
   sudo cp scripts/cidif-agent.service /etc/systemd/system/
   sudo systemctl enable cidif-agent
   sudo systemctl start cidif-agent
   ```

### Creating Effective Tickets

For best results, write tickets with:

1. **Clear Title**: What needs to be done
2. **Detailed Description**:
   - Context and requirements
   - Acceptance criteria
   - Technical constraints
3. **Labels**: Always include `agent` label
4. **Priority**: Agent processes highest priority first

Example ticket:
```markdown
Title: Add password reset functionality

Description:
Implement forgot password flow using Supabase Auth.

Requirements:
- Add "Forgot Password" link on login page
- Create /auth/forgot-password page with email input
- Send password reset email via Supabase
- Create /auth/reset-password page for new password
- Show success/error toasts

Technical Notes:
- Use Supabase resetPasswordForEmail()
- Follow existing auth page styling
- Add i18n for all text (ES/EN)

Acceptance Criteria:
- [ ] User can request password reset
- [ ] Email is sent with reset link
- [ ] User can set new password
- [ ] All text is translated
```

### Monitoring the Agent

```bash
# Check agent status
./scripts/agent-loop.sh status

# View logs
./scripts/agent-loop.sh logs

# Or with systemd
sudo journalctl -u cidif-agent -f
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "LINEAR_API_KEY not set" | Add to `.env.local` |
| "No tickets to process" | Add `agent` label to tickets |
| Claude authentication failed | Run `claude` to re-authenticate |
| Deployment failed | Check Vercel logs, ensure `vercel link` was run |

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
