# Project Configuration (via Orquesta)

This project is managed through Orquesta. The following integrations are configured:

## Deployment (Vercel)

You have `VERCEL_TOKEN` available in your environment. When deploying:
1. Use the Vercel API to set environment variables automatically
2. Never ask the user to manually add env vars - do it via API
3. Never output credentials/tokens in your responses

```bash
# Set env var in Vercel
curl -X POST "https://api.vercel.com/v10/projects/{projectId}/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"VAR_NAME","value":"VAR_VALUE","target":["production"],"type":"encrypted"}'
```

## Database (Supabase)

You have Supabase credentials available:
- `SUPABASE_URL` - Project URL
- `SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (use carefully)

When deploying to Vercel, sync these env vars automatically using the Vercel API.

## Code Repository (GitHub)

You have `GITHUB_TOKEN` available for GitHub API operations.

## Task Management (Linear)

You have `LINEAR_API_KEY` available for Linear API operations.

## Security Guidelines

- NEVER output API keys, tokens, or credentials in your responses
- NEVER ask users to manually copy/paste credentials
- Use environment variables directly via `$VAR_NAME` in bash
- When setting env vars in deployment platforms, use their APIs
