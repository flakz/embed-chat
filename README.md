# Marno AI Chat Widget

Embeddable chat widget for n8n webhooks. One script tag, one config object — no build step, no React required on the host page.

## Embed

```html
<script>
  window.MarnoChatConfig = {
    webhookUrl: "https://your-n8n.com/webhook/chat",
    brandName: "Your Brand",
    brandLogo: "https://your-site.com/logo.png",
    primaryColor: "#0D72FF",
    suggestions: [
      { label: "Get started", prompt: "How do I get started?" },
      { label: "Pricing", prompt: "What are the pricing plans?" },
    ],
    greetings: [
      "Hi! I'm an AI assistant.",
      "How can I help you today?"
    ],
    subtitle: "We typically reply within a minute",
    poweredBy: "Powered by Your Brand",
    poweredByUrl: "https://your-site.com"
  };
</script>
<script src="https://your-app.vercel.app/marno-chat-widget.js"></script>
```

### How clients customize

Everything they need to change is in `window.MarnoChatConfig`. No env vars, no build step for them. They write their own texts, colors, logo URL, and webhook URL right in the config object. The widget has defaults for everything, so they only override what they want.

## Config Reference

| Key | Type | Default |
|---|---|---|
| `webhookUrl` | string | n8n demo URL |
| `kbSlug` | string | `"kbase"` |
| `brandName` | string | `"Marno AI"` |
| `brandLogo` | string | default icon |
| `primaryColor` | string | `"#0D72FF"` |
| `suggestions` | `{label, prompt}[]` | 4 defaults |
| `greetings` | `[string, string]` | 2 defaults |
| `subtitle` | string | `""` |
| `poweredBy` | string | `"Powered by Marno AI"` |
| `poweredByUrl` | string | `"https://marno.ai"` |

## Webhook Contract

POSTs `{ query, sessionId, slug }` to webhookUrl.
Expects `{ response: "..." }` in return (Markdown supported).

## Development

```bash
npm install
npm run dev     # Vite dev with HMR, serves the demo page
npm run build   # → dist/marno-chat-widget.js
```

## Deploy to Vercel

Push to GitHub → import into Vercel. The `vercel.json` is already set up. After deploy, the widget JS is at `https://your-app.vercel.app/marno-chat-widget.js` and the demo page at the root URL.
