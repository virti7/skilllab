# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables configured
- [ ] JWT_SECRET changed to a strong random value
- [ ] JWT_REFRESH_SECRET changed to a different strong random value
- [ ] Database connection string updated for production
- [ ] CORS_ORIGIN set to production frontend URL
- [ ] GROQ_API_KEY configured (if using AI features)
- [ ] NODE_ENV set to "production"
- [ ] Frontend VITE_API_URL points to production backend URL

## Security Checklist

- [ ] Helmet middleware enabled
- [ ] Rate limiting configured
- [ ] CORS restricted to specific origins
- [ ] No console.log statements in production code
- [ ] No hardcoded secrets in source code
- [ ] JWT tokens have reasonable expiry times
- [ ] Refresh token rotation implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection via helmet
- [ ] Secure cookie configuration
- [ ] Password strength validation
- [ ] File size limits on request body

## Performance Checklist

- [ ] Database indexes created on all foreign keys
- [ ] Connection pooling configured
- [ ] N+1 query patterns eliminated
- [ ] Frontend bundle optimized (tree-shaking, code splitting)
- [ ] Images optimized
- [ ] API response caching considered
- [ ] Rate limiting prevents abuse

## Monitoring Checklist

- [ ] Health check endpoints configured (/health, /api/health)
- [ ] Error logging to centralized service
- [ ] Uptime monitoring configured
- [ ] Database backup strategy documented
- [ ] Performance monitoring alerts set up

## Database Backup Strategy

1. **Automated Daily Backups**: Use `pg_dump` via cron job
   ```bash
   pg_dump -U username -d skilllab > /backups/skilllab_$(date +%Y%m%d).sql
   ```
2. **Retention Policy**: Keep 30 daily backups, 12 monthly backups
3. **Point-in-Time Recovery**: Enable WAL archiving for PITR
4. **Backup Verification**: Weekly restore test to staging environment
5. **Managed Database**: For Supabase/RDS, use their automated backup features

## Monitoring Recommendations

### Application Monitoring
- Sentry or Rollbar for error tracking
- Logtail or Papertrail for log aggregation
- Grafana + Prometheus for metrics

### Performance Monitoring
- Lighthouse CI for frontend performance regressions
- Web Vitals tracking (Core Web Vitals)
- API response time monitoring

### Uptime Monitoring
- Pingdom or UptimeRobot for endpoint monitoring
- Status page for incident communication
- Alert webhooks to Slack/Discord

## Production URLs

- Frontend (Production): https://skilllab-app.vercel.app
- Backend API (Production): https://skilllab-api.onrender.com
- Health Check: https://skilllab-api.onrender.com/health
- Database: Managed PostgreSQL (Supabase / AWS RDS / Neon)

## Deployment Commands

### Vercel (Frontend)
```bash
npm install -g vercel
vercel --prod
```

### Render (Backend)
```bash
# Via Git, connected to repository
# Build command: cd backend && npm install && npx prisma generate
# Start command: cd backend && node src/index.js
```

### Docker
```bash
docker-compose up -d --build
```
