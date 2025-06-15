# ChatNPT Application

A Next.js application for chat-based interactions with AI models.

## Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn
- Turso database (for production)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

## Production Readiness Features

### Sentry Integration
1. Install Sentry package:
```bash
npm install @sentry/nextjs
```
2. Configure Sentry:
   - Create `sentry.client.config.js` and `sentry.server.config.js` files
   - Add `NEXT_PUBLIC_SENTRY_DSN` environment variable

### Axiom Integration
1. Install Axiom package:
```bash
npm install next-axiom
```
2. Configure logger in `src/lib/logger.ts`
3. Add `AXIOM_TOKEN` environment variable

### Turso Rate Limiting
1. Create `rate_limits` table:
```sql
CREATE TABLE rate_limits (
  ip TEXT PRIMARY KEY,
  count INTEGER,
  window_start INTEGER
);
```
2. Set Turso environment variables:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`

### Health Check Endpoint
Access at `/api/health`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side errors | Yes |
| `SENTRY_DSN` | Sentry DSN for server-side errors | Yes |
| `AXIOM_TOKEN` | Axiom API token | Yes |
| `TURSO_DATABASE_URL` | Turso database URL | Production |
| `TURSO_AUTH_TOKEN` | Turso authentication token | Production |
| `INTERNAL_API_TOKEN` | Token for internal API authentication | Yes |

## Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deployment Considerations
- Set all required environment variables in production
- Configure reverse proxy (Nginx, Cloudflare, etc.)
- Enable HTTPS
- Configure monitoring and alerting
## Testing

Integration tests are available at the `/test` page. This page provides links to test the following integrations:

- **Sentry**: Click "Test Sentry" to trigger an error that should be captured by Sentry
- **Axiom**: Click "Test Axiom" to send a test log that should appear in Axiom

After triggering the tests, verify the results in your Sentry and Axiom dashboards.