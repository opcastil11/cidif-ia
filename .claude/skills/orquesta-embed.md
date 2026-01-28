# Orquesta Embed SDK Skill

This skill helps you install and configure the Orquesta Embed SDK in any web project.

## IMPORTANT: Token is Already Available

When running through Orquesta, the embed token is **already injected** into your environment as:

```
ORQUESTA_EMBED_TOKEN=oek_xxxxx
```

You do NOT need to ask the user for this token. It's automatically available via `process.env.ORQUESTA_EMBED_TOKEN`.

When configuring the embed in code, use:
- **Next.js**: Copy the value to `.env.local` as `NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN`
- **Vite**: Copy to `.env` as `VITE_ORQUESTA_EMBED_TOKEN`
- **Server-side**: Use `process.env.ORQUESTA_EMBED_TOKEN` directly

## CRITICAL: No Proxy Needed

The SDK connects **directly to orquesta.live** - CORS is enabled on the backend.

**DO NOT:**
- Create API routes or proxy endpoints
- Add an `apiUrl` prop to OrquestaEmbed
- Create custom fetch calls to validate tokens

The SDK handles everything automatically.

## What is Orquesta Embed?

Orquesta Embed is a widget that adds a floating panel to any website, allowing users to:
- Submit prompts directly to the Orquesta agent
- See real-time execution output
- Right-click elements to prompt about them
- Auto-capture console logs and network errors
- View prompt history (timeline)
- Check deployment status

## Environment Variable

The embed token should be stored in an environment variable:

```
NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN=oek_xxxxx
# or for non-Next.js projects:
VITE_ORQUESTA_EMBED_TOKEN=oek_xxxxx
REACT_APP_ORQUESTA_EMBED_TOKEN=oek_xxxxx
ORQUESTA_EMBED_TOKEN=oek_xxxxx
```

**IMPORTANT**: The token prefix is `oek_` (Orquesta Embed Key), not `oat_` (which is for agent tokens).

## Installation

### NPM / Yarn / PNPM

```bash
npm install orquesta-embed
# or
yarn add orquesta-embed
# or
pnpm add orquesta-embed
```

## Usage

### React / Next.js

```tsx
import { OrquestaEmbed } from 'orquesta-embed'
import 'orquesta-embed/styles.css'

function App() {
  return (
    <>
      {/* Your app content */}
      <OrquestaEmbed
        token={process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN}
        position="bottom-right"
        captureConsole={true}
        captureNetwork={true}
      />
    </>
  )
}
```

### Next.js App Router (with 'use client')

```tsx
'use client'

import { OrquestaEmbed } from 'orquesta-embed'
import 'orquesta-embed/styles.css'

export function OrquestaWidget() {
  return (
    <OrquestaEmbed
      token={process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN!}
      position="bottom-right"
      captureConsole={true}
      captureNetwork={true}
    />
  )
}
```

Then in your layout:

```tsx
import { OrquestaWidget } from '@/components/OrquestaWidget'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <OrquestaWidget />
      </body>
    </html>
  )
}
```

### Vanilla JavaScript / HTML

Add before the closing `</body>` tag:

```html
<script src="https://orquesta.live/embed/v1/orquesta.min.js"></script>
<link rel="stylesheet" href="https://orquesta.live/embed/v1/orquesta.css">
<script>
  Orquesta.init({
    token: 'oek_xxxxx', // Your embed token
    position: 'bottom-right',
    captureConsole: true,
    captureNetwork: true
  })
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | string | required | Your Orquesta embed token (oek_xxx) |
| `position` | string | 'bottom-right' | Panel position: 'bottom-right', 'bottom-left', 'top-right', 'top-left' |
| `defaultOpen` | boolean | false | Whether panel starts open |
| `theme` | string | 'dark' | Theme: 'dark', 'light', 'auto' |
| `captureConsole` | boolean | true | Auto-capture console.log/error |
| `captureNetwork` | boolean | true | Auto-capture failed network requests |
| `hotkey` | string | 'ctrl+shift+o' | Keyboard shortcut to toggle panel |
| `features` | string[] | all | Features to enable: 'prompts', 'timeline', 'deployments', 'elements', 'captures' |

## Features

### Element Selection
Users can right-click any element on the page and select "Prompt about this" to automatically include the element's context (selector, tag, text content) in their prompt.

### Console Capture
When enabled, the widget captures `console.log`, `console.warn`, `console.error`, and unhandled exceptions. Users can include recent logs in their prompts.

### Network Capture
When enabled, the widget intercepts `fetch` and `XMLHttpRequest` to capture failed requests (4xx, 5xx errors). Users can include these errors in prompts for debugging.

### Timeline
Shows history of prompts submitted through the embed, with status and timestamps.

### Deployments
Shows current deployment status from Vercel (if integrated).

## Programmatic API (Vanilla JS)

```javascript
const widget = Orquesta.init({ token: 'oek_xxxxx' })

// Control the widget
widget.open()
widget.close()
widget.toggle()

// Start element selection mode
widget.startElementSelection()

// Submit a prompt programmatically
widget.submitPrompt('Fix this bug', {
  includeConsole: true,
  includeNetwork: true
})

// Destroy the widget
widget.destroy()
```

## Generating Embed Tokens

Embed tokens are generated from the Orquesta dashboard:
1. Go to your project
2. Click the "Embed" tab
3. Go to "Tokens" section
4. Click "Generate Token"
5. Copy the token (shown only once!)

**Auto-added to Environment Variables**: When you generate a token, it's automatically added to your project's environment variables as `ORQUESTA_EMBED_TOKEN`. The local agent can access this through the project credentials.

Tokens can have domain restrictions to limit which websites can use them.

## Updating

To get the latest features and bug fixes:

### NPM Projects
```bash
# Update to the latest version
npm install orquesta-embed@latest

# Verify the update
npm list orquesta-embed

# Then rebuild and redeploy your project
git add package.json package-lock.json
git commit -m "chore: update orquesta-embed"
git push
```

### CDN Projects (Vanilla JS)
CDN files at `orquesta.live/embed/v1/` are automatically updated when new versions are published. No manual action needed!

If you're not seeing the latest features:
- Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
- Redeploy your site to clear edge caches
- Check browser DevTools Network tab to verify scripts are loading correctly

### Current Version
**v0.1.25** - Full feature parity between React and Vanilla JS widgets:
- 3 tabs: Prompts, Timeline, Logs
- User authentication (login/logout with Google)
- Connection status indicator (red=disconnected, green=online, gray=offline)
- Overlay mode toggles (show element markers on page)
- Right-click element selection toggle
- Error banners for connection issues

## Choosing Between NPM and CDN

| Feature | NPM (React/Next.js) | CDN (Vanilla JS) |
|---------|---------------------|------------------|
| Auto-updates | No (manual npm update) | Yes (automatic) |
| React component | Yes | No (uses script) |
| Build-time optimization | Yes | No |
| TypeScript types | Yes | No |
| Best for | React/Next.js projects | Plain HTML/JS projects |

**Recommendation:**
- Use **NPM** for React, Next.js, Vue, or any project with a build step
- Use **CDN** for plain HTML sites, WordPress, or projects without npm

## Troubleshooting

### Widget not appearing
- Check that the token is valid and not revoked
- Ensure styles.css is imported (React) or the CSS link is added (vanilla)
- Check browser console for errors

### CORS errors
- Embed tokens can have domain restrictions - make sure your domain is allowed
- The embed connects to orquesta.live - ensure it's not blocked

### Console/Network capture not working
- Make sure `captureConsole: true` and `captureNetwork: true` are set
- The captures must be initialized before other code runs (add script early in `<head>`)

### Old version showing after update
- Clear browser cache completely
- Check `npm ls orquesta-embed` to verify installed version
- For CDN users: hard refresh with Ctrl+Shift+R
- Redeploy your site to clear edge caches
