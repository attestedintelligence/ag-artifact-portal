# Launch Checklist

Per AGA Build Guide Phase 13 - Pre-launch verification steps.

## Pre-Launch Checks

### 1. Security Audit

- [ ] Rate limiting configured and tested
- [ ] Input validation on all API endpoints
- [ ] Bad words filter active on user inputs
- [ ] CORS configured for production domains only
- [ ] CSP headers set correctly
- [ ] HTTPS enforced via HSTS
- [ ] JWT secrets rotated from development values
- [ ] Supabase RLS policies verified
- [ ] No sensitive data in client-side code/logs

### 2. Cryptographic Verification

- [ ] Ed25519 key pairs generated securely
- [ ] Issuer keys stored in secure secrets manager
- [ ] Test vectors pass (TV-JCS-001, TV-SIG-001)
- [ ] Domain separator (`ai.bundle.v1:`) correctly applied
- [ ] SHA-256 hashing verified against known outputs
- [ ] Receipt chain integrity verified in tests

### 3. Golden Run Test

- [ ] Create Policy Artifact with deterministic policy_id
- [ ] Start run under Sentinel boundary
- [ ] Inject deterministic drift
- [ ] Observe enforcement action matches policy mapping
- [ ] Export evidence bundle ZIP
- [ ] Verify bundle offline (PASS)
- [ ] Tamper with receipt and verify (FAIL)

### 4. Database & Storage

- [ ] Supabase project created in production region
- [ ] Database schema migrated
- [ ] RLS policies applied
- [ ] Backup strategy configured
- [ ] Connection pooling configured for scale

### 5. Email Service

- [ ] Resend account configured
- [ ] Sending domain verified (SPF, DKIM, DMARC)
- [ ] Email templates tested
- [ ] Magic link flow verified
- [ ] Unsubscribe handling (if applicable)

### 6. Deployment

- [ ] Vercel project created
- [ ] Environment variables set in Vercel dashboard
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Preview deployments working
- [ ] Production deployment verified

### 7. Monitoring

- [ ] Error tracking configured (Sentry or similar)
- [ ] Uptime monitoring active
- [ ] Log aggregation set up
- [ ] Alerts configured for critical errors
- [ ] Performance monitoring baseline established

### 8. Documentation

- [ ] API documentation complete
- [ ] User guide drafted
- [ ] README updated
- [ ] CHANGELOG started
- [ ] License file present

## Post-Launch Checklist

### Immediate (Day 1)

- [ ] Verify all endpoints responding
- [ ] Test user signup flow
- [ ] Test artifact sealing flow
- [ ] Test verification flow
- [ ] Check error logs for issues
- [ ] Verify email delivery

### Week 1

- [ ] Review usage metrics
- [ ] Address any reported issues
- [ ] Verify rate limiting in production
- [ ] Check database performance
- [ ] Review security logs

### Month 1

- [ ] Collect user feedback
- [ ] Plan feature improvements
- [ ] Review cost/scaling needs
- [ ] Security review
- [ ] Performance optimization if needed

## Emergency Contacts

- **Infra Issues**: [TBD]
- **Security Issues**: [TBD]
- **Support Escalation**: [TBD]

## Rollback Procedure

1. Navigate to Vercel dashboard
2. Go to Deployments
3. Find last known good deployment
4. Click "Promote to Production"
5. Verify rollback successful
6. Investigate and fix issue in development

## Critical Paths

1. **User Signup**: `/signup` -> Magic link email -> `/vault`
2. **Artifact Seal**: `/create` -> Upload/hash -> Sign -> `/vault/[id]`
3. **Verification**: QR scan -> `/verify/[id]` -> PASS/FAIL result
4. **Bundle Export**: `/vault/[id]` -> Download -> Offline verify

---

**Last Updated**: 2024-12-31
**Version**: 1.0.0
