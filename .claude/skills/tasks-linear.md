# Task Management Skill

This skill helps you configure task management for your project through the local Orquesta agent. Whether you use Linear, GitHub Issues, Jira, or any other task tracker, the agent can help.

## When to Use

Use this skill when:
- You skipped the task panel step during project setup
- You want to connect a task tracker to your Orquesta project
- You need to create, update, or manage issues/tasks
- You want to sync prompts with task tickets

## Self-Hosted / Custom Task Management

If you're not using Linear and have your own task management setup, you can still use the agent to help.

### No Task Tracker

If you don't need issue tracking integration, you can simply work without it:

```
"I don't need task tracking, just execute the prompts directly"
```

### GitHub Issues

Use GitHub Issues for simple task tracking:

```
"Use GitHub Issues for task tracking in this project"
```

```
"Create a GitHub issue for this bug"
```

### Custom Task Commands

Tell the agent about your task management workflow:

```
"My tasks are managed in a TODO.md file at the project root"
```

```
"I use Notion for task management - just remind me to update it"
```

```
"Create tasks as markdown files in the /tasks folder"
```

### Supported Alternatives

The agent can work with various task management approaches:

- **GitHub Issues** - Create and manage issues in your repository
- **TODO.md** - Simple markdown-based task tracking
- **Jira** (coming soon) - Enterprise issue tracking
- **No tracking** - Just execute prompts without issue creation

---

## Linear Integration (Managed)

If you want to use Linear for issue tracking, follow the sections below.

### Prerequisites

1. A Linear account at [linear.app](https://linear.app)
2. A Linear workspace and project

## Configuration Options

### Option 1: OAuth Connection (Recommended)

1. Go to your Orquesta project dashboard
2. Navigate to **Settings** > **Integrations** > **Linear**
3. Click **Connect with Linear**
4. Authorize Orquesta to access your Linear workspace
5. Select the Linear project to link

### Option 2: Manual API Key Setup

If you prefer to use an API key:

1. Go to [linear.app/settings/api](https://linear.app/settings/api)
2. Create a new personal API key
3. Add it to your project:

```bash
# Via the agent prompt
"Add my Linear API key: LINEAR_API_KEY=lin_api_xxxxxxxx"
```

### Option 3: CLI Configuration

You can also configure Linear through the agent by asking:

```
"Help me set up Linear for this project"
```

The agent will:
1. Check for existing Linear configuration
2. Guide you through authorization
3. Help you select the correct project

## Task Operations

Once configured, you can manage tasks through prompts:

### Create an Issue
```
"Create a Linear issue: Fix the login button styling"
```

### List Issues
```
"Show me all open issues in Linear"
```

```
"What are my assigned issues?"
```

### Update Issue Status
```
"Mark issue ORQ-123 as done"
```

```
"Move ORQ-45 to In Progress"
```

### Add Comments
```
"Add a comment to ORQ-123: Fixed by updating the CSS class"
```

### Search Issues
```
"Find Linear issues about authentication"
```

## Automatic Prompt-to-Issue Sync

When enabled, prompts submitted through Orquesta can automatically:

1. **Create Issues**: Each prompt creates a corresponding Linear issue
2. **Track Progress**: Issue status updates as the agent works
3. **Link Commits**: Git commits are linked to the Linear issue
4. **Add Results**: Execution results are added as comments

### Enable Auto-Sync
```
"Enable automatic Linear issue creation for prompts"
```

### Disable Auto-Sync
```
"Disable automatic Linear issue creation"
```

## Issue Templates

Create issues with specific labels, assignees, or priorities:

```
"Create a high-priority bug: Users can't reset their password"
```

```
"Create a feature request assigned to me: Add dark mode toggle"
```

## Linear Project Selection

If you have multiple Linear projects:

```
"List my Linear projects"
```

```
"Switch to the 'Frontend' Linear project"
```

## Workflow States

Linear issues move through workflow states. Common commands:

```
"What states are available in Linear?"
```

```
"Move all my In Review issues to Done"
```

## Labels and Priorities

### Add Labels
```
"Add the 'bug' label to ORQ-123"
```

### Set Priority
```
"Set ORQ-45 to urgent priority"
```

## Environment Variables

The following environment variables are used:

| Variable | Description |
|----------|-------------|
| `LINEAR_API_KEY` | Your Linear API key |
| `LINEAR_PROJECT_ID` | Default project ID for new issues |
| `LINEAR_TEAM_ID` | Your Linear team ID |

## Troubleshooting

### "Invalid API key"
Regenerate your API key at [linear.app/settings/api](https://linear.app/settings/api).

### "Project not found"
Ensure you've selected the correct Linear project in settings.

### "Insufficient permissions"
Your API key may not have access to certain operations. Check key permissions in Linear.

### "Rate limit exceeded"
Linear has API rate limits. Wait a few minutes before retrying.

## Related Documentation

- [Linear Documentation](https://linear.app/docs)
- [Linear API Reference](https://developers.linear.app/docs)
- [Linear GraphQL API](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
