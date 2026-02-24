# AI Provider Monitor App

Web app tracking API changes across AI providers. Deployed at [ai-provider-monitor.vercel.app](https://ai-provider-monitor.vercel.app).

## How it works

- Data is stored in `data/changes.json` — a flat JSON array of change entries
- The [ai-provider-monitor](https://github.com/gr2m/ai-provider-monitor) repo sends repository dispatch events via a GitHub App whenever it detects API changes
- A GitHub Actions workflow receives these events, fetches the latest change data, updates `data/changes.json`, and commits
- Vercel auto-deploys on each push

## Seeding data

To rebuild `data/changes.json` from scratch using the ai-provider-monitor repo:

```bash
npm run seed -- ../ai-provider-monitor
```

## Development

```bash
npm install
npm run dev
```
