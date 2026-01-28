# Database Skill

This skill helps you configure your database for your project through the local Orquesta agent. Whether you use Supabase, PostgreSQL, MySQL, MongoDB, or any other database, the agent can help.

## When to Use

Use this skill when:
- You skipped the database step during project setup
- You want to connect a database to your Orquesta project
- You need to run database migrations
- You want to manage your database schema

## Self-Hosted / Custom Database

If you're not using Supabase and have your own database setup, you can still use the agent to help manage it.

### Configure Custom Database

Tell the agent about your database setup:

```
"My database is PostgreSQL at postgres://user:pass@localhost:5432/mydb"
```

```
"I use MySQL hosted on PlanetScale. Help me set up the connection."
```

```
"I'm using MongoDB Atlas. Configure the database connection."
```

### Common Self-Hosted Setups

**PostgreSQL:**
```
"Set up PostgreSQL with connection string DATABASE_URL=postgres://..."
```

**MySQL/MariaDB:**
```
"Configure MySQL database at mysql://user:pass@host:3306/db"
```

**MongoDB:**
```
"Set up MongoDB connection to mongodb+srv://..."
```

**SQLite (Local Development):**
```
"Use SQLite database at ./data/app.db"
```

**Redis (Cache/Session):**
```
"Configure Redis for caching at redis://localhost:6379"
```

### Database Operations (Any Database)

Once configured, you can manage your database:

```
"Run database migrations"
```

```
"Show me the schema of the users table"
```

```
"Create a migration to add a new column"
```

```
"Generate types from my database schema"
```

The agent will use your project's configured environment variables to connect to your database.

---

## Supabase Integration (Managed)

If you want to use Supabase as your backend-as-a-service, follow the sections below.

### Prerequisites

1. A Supabase account at [supabase.com](https://supabase.com)
2. A Supabase project created

## Configuration Options

### Option 1: Project Browser (Recommended)

1. Go to your Orquesta project dashboard
2. Navigate to **Settings** > **Integrations** > **Supabase**
3. Enter your Supabase Management API token
4. Browse and select your Supabase project
5. Credentials are automatically configured

### Option 2: Manual Credential Setup

If you prefer to enter credentials manually:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon Key**: `eyJ...` (public)
   - **Service Role Key**: `eyJ...` (secret - use carefully)

Add them to your project:

```bash
# Via the agent prompt
"Configure Supabase with URL=https://xxx.supabase.co, ANON_KEY=eyJ..., SERVICE_KEY=eyJ..."
```

### Option 3: CLI Configuration

You can also configure Supabase through the agent by asking:

```
"Help me set up Supabase for this project"
```

The agent will:
1. Check for existing Supabase configuration
2. Guide you through connecting your project
3. Set up the necessary environment variables

## Database Operations

Once configured, you can run database operations through prompts:

### Run Migrations
```
"Run database migrations"
```

### Create a New Table
```
"Create a users table with id, email, name, and created_at columns"
```

### Query Data
```
"Show me the last 10 users from the database"
```

### Create a Migration
```
"Create a migration to add a 'role' column to the users table"
```

## Environment Variables

The following environment variables are used:

| Variable | Description | Public? |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin access) | No |
| `SUPABASE_DB_PASSWORD` | Database password (for migrations) | No |

## Common Operations

### Enable Row Level Security
```
"Enable RLS on the posts table"
```

### Create RLS Policies
```
"Create an RLS policy so users can only see their own posts"
```

### Generate TypeScript Types
```
"Generate TypeScript types from my Supabase schema"
```

### Create a Database Function
```
"Create a Postgres function to calculate user stats"
```

## Supabase CLI

The Supabase CLI can be used for advanced operations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Pull remote schema
supabase db pull

# Push local changes
supabase db push
```

## Troubleshooting

### "Invalid API key"
Check that you're using the correct key (anon vs service role) for the operation.

### "RLS policy violation"
Ensure you have the correct RLS policies set up, or use the service role key for admin operations.

### "Connection refused"
Verify your project URL is correct and the project is active.

### "Migration failed"
Check the migration file for syntax errors and ensure the database password is correct.

## Related Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
