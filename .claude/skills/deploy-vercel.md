# Deploy Skill

This skill helps you configure deployment for your project through the local Orquesta agent. Whether you use Vercel, a self-hosted solution, or any other deployment platform, the agent can help.

## IMPORTANT: Automated Environment Variable Sync

When deploying a project that uses Supabase (or other services), **YOU MUST automatically sync environment variables to Vercel** using the Vercel API. DO NOT ask the user to manually add them.

### Automated Workflow for Vercel + Supabase

If you have `VERCEL_TOKEN` and Supabase credentials available in your environment, run this automatically:

```bash
# Check what env vars are available
env | grep -E "VERCEL|SUPABASE" | cut -d= -f1

# Get the Vercel project ID (by name)
PROJECT_NAME="your-project"
PROJECT_ID=$(curl -s "https://api.vercel.com/v9/projects/$PROJECT_NAME" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq -r '.id')

# Sync each required env var to Vercel
for VAR_NAME in SUPABASE_URL NEXT_PUBLIC_SUPABASE_URL SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  VAR_VALUE="${!VAR_NAME}"
  if [ -n "$VAR_VALUE" ]; then
    echo "Setting $VAR_NAME in Vercel..."
    curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"key\":\"$VAR_NAME\",\"value\":\"$VAR_VALUE\",\"target\":[\"production\",\"preview\",\"development\"],\"type\":\"encrypted\"}" > /dev/null
  fi
done

# Trigger a new deployment for env vars to take effect
curl -s -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$PROJECT_NAME\",\"project\":\"$PROJECT_NAME\",\"target\":\"production\"}"
```

**NEVER output credentials in your response.** Just confirm they were set.

## When to Use

Use this skill when:
- You skipped the deployment step during project setup
- You want to connect a deployment platform to your Orquesta project
- You need to configure auto-deploy settings
- You want to trigger manual deployments

## Self-Hosted / Custom Deployment

If you're not using Vercel and have your own deployment setup, you can still use the agent to help with deployments.

### Configure Custom Deployment

Tell the agent about your deployment setup:

```
"My deployment uses: SSH to deploy@myserver.com, runs 'git pull && npm run build && pm2 restart app'"
```

```
"I deploy to AWS using CDK. Help me set up deployment commands."
```

```
"I use Docker with Kubernetes for deployment. Set up the deployment workflow."
```

### Common Self-Hosted Setups

**SSH/SFTP Deployment:**
```
"Deploy to my server via SSH at user@server.com"
```

**Docker Deployment:**
```
"Build and push Docker image to my registry, then deploy to my server"
```

**AWS/GCP/Azure:**
```
"Deploy to AWS using my configured credentials"
```

**Static Hosting (Netlify, Cloudflare Pages, etc):**
```
"Deploy to Netlify/Cloudflare Pages"
```

The agent will use your project's configured environment variables and credentials to execute the deployment.

---

## Vercel Integration (Managed)

If you want to use Vercel for hosting, follow the sections below.

### Prerequisites

1. A Vercel account at [vercel.com](https://vercel.com)
2. Your project should already be connected to GitHub
3. The Vercel CLI installed (optional, for local deployments)

## Configuration Options

### Option 1: OAuth Connection (Recommended)

1. Go to your Orquesta project dashboard
2. Navigate to **Settings** > **Integrations** > **Vercel**
3. Click **Connect with Vercel**
4. Authorize Orquesta to access your Vercel account
5. Select the Vercel project to link

### Option 2: Manual Token Setup

If you prefer to use a personal access token:

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create a new token with appropriate permissions
3. Add the token to your project:

```bash
# Via the agent prompt
"Add my Vercel token: VERCEL_TOKEN=xxxxxxxx"
```

Or add it to your project's environment variables through the Orquesta dashboard.

### Option 3: CLI Configuration

You can also configure Vercel through the agent by asking:

```
"Help me set up Vercel deployment for this project"
```

The agent will:
1. Check if Vercel CLI is installed
2. Guide you through `vercel link` if needed
3. Configure the deployment settings

## Deployment Commands

Once configured, you can deploy through prompts:

### Deploy to Preview
```
"Deploy this to Vercel preview"
```

### Deploy to Production
```
"Deploy this to production"
```

### Check Deployment Status
```
"What's the status of my latest Vercel deployment?"
```

### Rollback
```
"Rollback to the previous Vercel deployment"
```

## Auto-Deploy Configuration

To enable auto-deploy on git push:

```
"Enable auto-deploy for my Vercel project"
```

To disable:
```
"Disable auto-deploy, I want manual deployments only"
```

## Environment Variables

Vercel environment variables can be managed through:

```
"Add STRIPE_KEY as a Vercel environment variable"
```

```
"List my Vercel environment variables"
```

### Setting Environment Variables via API

When you have a Vercel token (either from Orquesta project config or provided by user), use the Vercel API directly:

**Add a single environment variable:**
```bash
curl -X POST "https://api.vercel.com/v10/projects/{projectId}/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "SUPABASE_URL",
    "value": "https://xxx.supabase.co",
    "target": ["production", "preview", "development"],
    "type": "encrypted"
  }'
```

**List environment variables:**
```bash
curl "https://api.vercel.com/v10/projects/{projectId}/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```

**Delete an environment variable:**
```bash
curl -X DELETE "https://api.vercel.com/v10/projects/{projectId}/env/{envId}" \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```

### Finding the Project ID

If you don't know the Vercel project ID, you can:

1. **List all projects:**
```bash
curl "https://api.vercel.com/v9/projects" \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```

2. **Get project by name:**
```bash
curl "https://api.vercel.com/v9/projects/{projectName}" \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```

### Syncing Supabase Credentials to Vercel

When deploying a project that uses Supabase, automatically sync these env vars:

```bash
# Required Supabase variables for most projects
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Add each one to Vercel
for VAR in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  curl -X POST "https://api.vercel.com/v10/projects/{projectId}/env" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$VAR\",\"value\":\"${!VAR}\",\"target\":[\"production\",\"preview\",\"development\"],\"type\":\"encrypted\"}"
done
```

**IMPORTANT:** When adding environment variables, trigger a new deployment for them to take effect:

```bash
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"project-name","project":"project-name","target":"production"}'
```

## Troubleshooting

### "Project not linked"
Run `vercel link` in your project directory or connect via OAuth in the dashboard.

### "Permission denied"
Ensure your token has the correct scopes or re-authorize via OAuth.

### "Build failed"
Check your `vercel.json` configuration and build command settings.

## Related Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables](https://vercel.com/docs/environment-variables)
