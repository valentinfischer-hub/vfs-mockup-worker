# vfs-mockup-worker

Premium-Cloud-Worker fuer vfs Custom-Preview-Builds (v3.5 24/7).

## Architektur

```
Make.com (alle 30min)
  -> stale pending_previews (processed=false AND created_at < now-2h)
  -> repository_dispatch event "build-mockup" mit mockup_id
GitHub Actions Workflow (.github/workflows/mockup-build.yml)
  -> Puppeteer Headless (Site-Scrape + Image-Harvest)
  -> Anthropic Sonnet 4.6 (HTML-Generierung mit v3.5-Prompt)
  -> Lighthouse-CLI (Performance/A11y/SEO Scores)
  -> 5 Persona-Passes via Anthropic (Design/Polish/Marketing/SEO/UX)
  -> Cloudinary (Image-Proxy)
  -> Netlify Deploy
  -> Instantly Reply mit Preview-Link
  -> Supabase PATCH pending_previews (alle 17 Tracking-Felder + sent_at)
  -> Supabase INSERT cost_log
  -> Slack Notification
```

## Secrets

- `ANTHROPIC_API_KEY`
- `NETLIFY_TOKEN`
- `NETLIFY_PREVIEW_SITE_ID` (default 78324fe7-6075-4d03-8a8b-8500efc2ade0)
- `INSTANTLY_API_KEY`
- `VFS_SUPABASE_URL` (https://kvtmkabkmouzljhsxgir.supabase.co)
- `VFS_SUPABASE_SERVICE_KEY`
- `CLOUDINARY_CLOUD_NAME` (default dlitscucm)
- `SLACK_ALERTS_WEBHOOK`

## Manueller Test

```bash
gh workflow run mockup-build.yml -f mockup_id=<uuid>
```

## Status-Felder pending_previews die der Worker schreibt

Siehe `migrations/extend_pending_previews_for_dashboard.sql` im Haupt-Repo.