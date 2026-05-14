# SN14 Validator Dashboard

React dashboard for the Cacheon monitoring API. The UI covers validator status, king data, evaluation results, raw container logs, round history, and the pending evaluation job.

## Local development

```bash
npm install
npm run dev
```

The browser uses same-origin `/api` requests. In development, Vite proxies those calls to `API_PROXY_TARGET`, which defaults to `https://api.cacheon.ai`.

## Production build

```bash
npm run build
PORT=4173 npm run start
```

## PM2

```bash
npm run build
pm2 start ecosystem.config.cjs
```

The PM2 config runs the local Node server on port `4173`, serving `dist/` and proxying `/api/*` to `API_PROXY_TARGET`. Override `PORT` or `API_PROXY_TARGET` through PM2 environment settings if needed.
