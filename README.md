# Not My Problem™

Professional boundary-setting, as a service.

## Deploy to Vercel (2 minutes)

1. **Install Vercel CLI** (if you haven't):
   ```
   npm i -g vercel
   ```

2. **Deploy:**
   ```
   vercel
   ```
   Follow the prompts — choose defaults for everything.

3. **Add your API key:**
   - Go to your project on vercel.com → Settings → Environment Variables
   - Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
   - Redeploy: `vercel --prod`

That's it. Your site is live.

## Project structure

```
notmyproblem/
  index.html        ← frontend (pure HTML/CSS/JS)
  api/
    generate.js     ← serverless function (proxies Anthropic API)
  vercel.json       ← routing config
```

## Why a backend?

Browsers block direct calls to api.anthropic.com (CORS policy). The `/api/generate` serverless function runs server-side, so there's no CORS issue — and your API key stays secret.