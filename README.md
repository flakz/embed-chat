# Marno AI Chat Widget

Embeddable chat widget for n8n webhooks. One script tag, one config object — no build step, no React required on the host page.

## Embed

```html
<script>
  window.MarnoChatConfig = {
    webhookUrl: "https://your-n8n.com/webhook/chat",
    kbSlug: "glaucom",
    brandName: "Marno AI",
    brandLogo: "https://cdn.pfps.gg/pfps/63901-mark-grayson.png",
    primaryColor: "#fb2b71",
    toggleIcon: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg",
    suggestions: [
      { label: "Get started", prompt: "How do I get started with the platform?" },
      { label: "See templates", prompt: "Can you show me the available templates?" },
      { label: "Pricing", prompt: "What are the pricing plans available?" },
      { label: "Book a demo", prompt: "I would like to book a demo." },
      { label: "Documentation", prompt: "Where can I find the API documentation?" },
    ],
    greetings: [
      "Hi there! I'm an AI agent trained on docs, help articles, and other important content.",
      "How can I best help you today?",
    ],
  };
</script>
<script src="https://your-app.vercel.app/marno-chat-widget.js"></script>
```

### How clients customize

Everything they need to change is in `window.MarnoChatConfig`. No env vars, no build step. They write their own texts, colors, logo URL, and webhook URL in the config object. All values are optional — the widget has sensible defaults for everything.

## Config Reference

| Key | Type | Default | Description |
|---|---|---|---|
| `webhookUrl` | string | n8n demo URL | n8n webhook endpoint |
| `kbSlug` | string | `"kbase"` | Knowledge base slug passed in requests |
| `brandName` | string | `"Marno AI"` | Name shown in chat header |
| `brandLogo` | string | default M icon | Image URL for header logo |
| `primaryColor` | string | `"#0D72FF"` | Header, user bubbles, send button, suggestion colors |
| `toggleIcon` | string | green avatar | Image URL for floating chat button |
| `suggestions` | `{label, prompt}[]` | 5 defaults | Any number of suggestion chips |
| `greetings` | `[string, string]` | 2 defaults | Welcome messages on first open |

## Webhook Contract

POSTs `{ query, sessionId, slug }` to webhookUrl.
Expects `{ response: "..." }` in return (Markdown supported).

## Development

```bash
npm install
npm run build   # → dist/marno-chat-widget.js
```

## Deploy to Vercel

Push to GitHub → import into Vercel. The `vercel.json` is already set up. After deploy, the widget JS is at `https://your-app.vercel.app/marno-chat-widget.js` and the demo page at the root URL.
