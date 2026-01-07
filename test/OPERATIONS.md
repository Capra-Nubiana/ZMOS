# ZMOS Operations Guide

This document provides comprehensive operational procedures for deploying, monitoring, and maintaining the ZMOS platform in production environments.

## System Architecture Overview

### Production Stack
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   API Gateway    │    │  Application    │
│     (nginx)     │───▶│   (kong/traefik) │───▶│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redis Cache   │    │   PostgreSQL     │    │   Monitoring    │
│   (sessions)    │    │   (data)         │    │   (Prometheus)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Infrastructure Requirements
- **Application Servers**: 3+ nodes for high availability
- **Database**: PostgreSQL with streaming replication
- **Cache**: Redis cluster for session storage
- **Load Balancer**: Nginx with SSL termination
- **Monitoring**: Prometheus + Grafana stack
- **Logging**: ELK stack (Elasticsearch, Logstash, Kibana)

## Deployment Strategy

### Blue-Green Deployment
```bash
# Blue-green deployment script
#!/bin/bash

# Deploy to green environment
kubectl set image deployment/api-green api=zmos/api:v1.2.3
kubectl wait --for=condition=available deployment/api-green

# Run smoke tests
if smoke_tests_pass; then
    # Switch traffic to green
    kubectl patch service api -p '{"spec":{"selector":{"color":"green"}}}'

    # Keep blue as rollback option
    echo "Deployment successful. Blue environment available for rollback."

else
    # Rollback to blue
    kubectl patch service api -p '{"spec":{"selector":{"color":"blue"}}}'
    echo "Smoke tests failed. Rolled back to blue environment."
    exit 1
fi
```

### Zero-Downtime Deployment
```yaml
# Kubernetes deployment with rolling update
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zmos-api
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
      - name: api
        image: zmos/api:latest
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
```

## Health Checks & Monitoring

### Application Health Checks
```javascript
// Health check endpoints
app.get('/health/live', (req, res) => {
  // Basic liveness check
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connectivity
    await redis.ping();

    // Check external services
    await checkExternalServices();

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
        redis: 'healthy',
        external: 'healthy'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

### Monitoring Setup

#### Prometheus Metrics
```javascript
// Application metrics
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;

// Enable default metrics
collectDefaultMetrics({ prefix: 'zmos_' });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'zmos_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const activeBookings = new promClient.Gauge({
  name: 'zmos_active_bookings_total',
  help: 'Total number of active bookings'
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

#### Grafana Dashboards
Key dashboards to create:
- **API Performance**: Response times, throughput, error rates
- **Database Metrics**: Query performance, connection pools, replication lag
- **Business Metrics**: Active users, booking rates, session utilization
- **Infrastructure**: CPU, memory, disk usage, network I/O

## Logging Strategy

### Structured Logging
```javascript
// Winston logger configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'zmos-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File for production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      tenantId: req.headers['x-tenant-id'],
      userId: req.user?.id
    });
  });

  next();
});
```

### Log Levels & Usage
```javascript
// Debug: Detailed information for troubleshooting
logger.debug('Processing booking', { bookingId, userId });

// Info: General information about application operation
logger.info('User logged in', { userId, tenantId });

// Warn: Warning messages about potentially harmful situations
logger.warn('Rate limit exceeded', { ip: req.ip, endpoint: req.path });

// Error: Error conditions that don't stop the application
logger.error('Database query failed', {
  error: err.message,
  query: 'SELECT * FROM sessions',
  duration: 5000
});

// Fatal: Critical errors that require immediate attention
logger.error('Database connection lost', {
  error: err.message,
  impact: 'All requests failing'
});
```

## Database Operations

### Connection Pooling
```javascript
// Prisma database configuration
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' }
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Connection pool monitoring
prisma.$on('beforeExit', async () => {
  logger.info('Prisma client shutting down');
});
```

### Query Performance Monitoring
```sql
-- Slow query log analysis
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage analysis
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Backup Strategy
```bash
# Daily backup script
#!/bin/bash

BACKUP_DIR="/backups/zmos"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/zmos_backup_$DATE.sql"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://zmos-backups/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Verify backup integrity
gunzip -c $BACKUP_FILE.gz | pg_restore --list > /dev/null
if [ $? -eq 0 ]; then
    echo "Backup verification successful"
else
    echo "Backup verification failed" >&2
    exit 1
fi
```

## Disaster Recovery

### Recovery Time Objectives (RTO)
- **Critical Services**: RTO = 1 hour
- **Standard Services**: RTO = 4 hours
- **Data Recovery**: RTO = 24 hours

### Recovery Point Objectives (RPO)
- **Transactional Data**: RPO = 5 minutes
- **Session Data**: RPO = 15 minutes
- **Analytics Data**: RPO = 1 hour

### Disaster Recovery Plan
```bash
# DR failover script
#!/bin/bash

echo "Initiating disaster recovery failover..."

# 1. Promote standby database
pg_ctl promote -D /var/lib/postgresql/data

# 2. Update DNS to point to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.zmos.com",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "'$DR_LOAD_BALANCER'"}]
      }
    }]
  }'

# 3. Scale up DR application servers
kubectl scale deployment api --replicas=10 -n dr-cluster

# 4. Update Redis sentinel configuration
redis-cli -h sentinel sentinel failover zmos-cache

# 5. Verify services are healthy
curl -f https://api.zmos.com/health/ready

echo "Failover complete. Services running in DR region."
```

## Incident Response

### Incident Classification
```javascript
const INCIDENT_LEVELS = {
  SEV1: {
    name: 'Critical',
    description: 'Complete system outage',
    response: '15 minutes',
    resolution: '1 hour'
  },
  SEV2: {
    name: 'High',
    description: 'Major functionality broken',
    response: '30 minutes',
    resolution: '4 hours'
  },
  SEV3: {
    name: 'Medium',
    description: 'Minor functionality issues',
    response: '2 hours',
    resolution: '24 hours'
  },
  SEV4: {
    name: 'Low',
    description: 'Cosmetic issues',
    response: '24 hours',
    resolution: '1 week'
  }
};
```

### Incident Response Process
```markdown
# Incident Response Checklist

## Phase 1: Detection & Assessment (0-15 min)
- [ ] Alert received and acknowledged
- [ ] Incident severity assessed
- [ ] Affected systems identified
- [ ] Customer impact evaluated
- [ ] Stakeholders notified

## Phase 2: Containment (15-60 min)
- [ ] Temporary mitigation applied
- [ ] Root cause investigation started
- [ ] Communication with customers initiated
- [ ] Status page updated

## Phase 3: Resolution (1-4 hours)
- [ ] Root cause identified
- [ ] Permanent fix implemented
- [ ] Systems restored to normal
- [ ] Verification tests completed

## Phase 4: Follow-up (4+ hours)
- [ ] Incident post-mortem conducted
- [ ] Documentation updated
- [ ] Prevention measures implemented
- [ ] Customer communication completed
```

### Communication Templates
```javascript
// Status page update function
async function updateStatusPage(incident) {
  const statusUpdate = {
    state: incident.severity === 'SEV1' ? 'major_outage' : 'partial_outage',
    title: incident.title,
    description: incident.description,
    affected_components: incident.affectedSystems,
    updates: [{
      timestamp: new Date(),
      status: 'investigating',
      message: 'Our team is investigating the issue.'
    }]
  };

  await fetch(process.env.STATUS_PAGE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STATUS_PAGE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(statusUpdate)
  });
}
```

## Performance Optimization

### Caching Strategy
```javascript
// Redis caching for frequently accessed data
const cache = require('redis');

class CacheManager {
  constructor(redisClient) {
    this.client = redisClient;
  }

  async getSession(sessionId) {
    const cacheKey = `session:${sessionId}`;
    let session = await this.client.get(cacheKey);

    if (!session) {
      // Fetch from database
      session = await prisma.sessionInstance.findUnique({
        where: { id: sessionId },
        include: { sessionType: true, location: true }
      });

      // Cache for 5 minutes
      await this.client.setex(cacheKey, 300, JSON.stringify(session));
    } else {
      session = JSON.parse(session);
    }

    return session;
  }

  async invalidateSession(sessionId) {
    await this.client.del(`session:${sessionId}`);
    // Also invalidate related caches
    await this.client.del(`sessions:location:${session.locationId}`);
  }
}
```

### Database Query Optimization
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_sessions_location_date
ON session_instances (location_id, start_time)
WHERE status = 'scheduled';

CREATE INDEX CONCURRENTLY idx_bookings_user_status
ON bookings (member_id, status, created_at DESC);

-- Query optimization example
EXPLAIN ANALYZE
SELECT s.*, st.name as session_type_name, l.name as location_name
FROM session_instances s
JOIN session_types st ON s.session_type_id = st.id
JOIN locations l ON s.location_id = l.id
WHERE s.location_id = $1
  AND s.start_time >= $2
  AND s.start_time < $3
  AND s.status = 'scheduled'
ORDER BY s.start_time;
```

## Security Operations

### Automated Security Scanning
```bash
# Daily security scan
#!/bin/bash

# Dependency vulnerability scan
npm audit --audit-level=moderate

# Container security scan
trivy image zmos/api:latest

# Infrastructure security scan
checkov -f kubernetes/

# Secret scanning
gitleaks detect --verbose --redact

# Report findings
send_security_report
```

### Access Control
```javascript
// Role-based access control
const ROLES = {
  ADMIN: 'admin',
  PROVIDER: 'provider',
  MEMBER: 'member',
  GUEST: 'guest'
};

const PERMISSIONS = {
  CREATE_SESSION: 'create:session',
  MANAGE_BOOKINGS: 'manage:bookings',
  VIEW_ANALYTICS: 'view:analytics'
};

function checkPermission(user, permission) {
  const userPermissions = getUserPermissions(user.role);
  return userPermissions.includes(permission);
}

function getUserPermissions(role) {
  switch (role) {
    case ROLES.ADMIN:
      return Object.values(PERMISSIONS);
    case ROLES.PROVIDER:
      return [PERMISSIONS.CREATE_SESSION, PERMISSIONS.MANAGE_BOOKINGS];
    case ROLES.MEMBER:
      return [PERMISSIONS.MANAGE_BOOKINGS];
    default:
      return [];
  }
}
```

## Maintenance Windows

### Scheduled Maintenance
```javascript
// Maintenance window scheduling
const maintenanceWindows = [
  {
    dayOfWeek: 0, // Sunday
    startTime: '02:00',
    endTime: '04:00',
    description: 'Database maintenance and backups'
  },
  {
    dayOfWeek: 3, // Wednesday
    startTime: '01:00',
    endTime: '03:00',
    description: 'Application updates and deployments'
  }
];

function isMaintenanceWindow() {
  const now = new Date();
  const currentWindow = maintenanceWindows.find(window =>
    window.dayOfWeek === now.getDay()
  );

  if (!currentWindow) return false;

  const currentTime = now.toTimeString().slice(0, 5);
  return currentTime >= currentWindow.startTime &&
         currentTime <= currentWindow.endTime;
}

app.use((req, res, next) => {
  if (isMaintenanceWindow() && !req.path.startsWith('/health')) {
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Scheduled maintenance in progress',
      retryAfter: 3600 // 1 hour
    });
    return;
  }
  next();
});
```

## Runbooks

### Common Incident Response
```markdown
# Database Connection Issues

## Detection
- Alert: "Database connection pool exhausted"
- Symptoms: 500 errors, slow responses

## Investigation
```bash
# Check database connectivity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check connection pool status
kubectl exec -it postgres-0 -- psql -c "SELECT * FROM pg_stat_activity"

# Check application logs
kubectl logs -f deployment/api --tail=100
```

## Resolution
```bash
# Restart application pods
kubectl rollout restart deployment/api

# If database issue, restart database
kubectl rollout restart statefulset/postgres

# Scale up application if needed
kubectl scale deployment api --replicas=10
```

## Prevention
- Monitor connection pool metrics
- Implement circuit breaker pattern
- Set appropriate connection timeouts
```

---

## Key Metrics to Monitor

### Application Metrics
- **Response Time**: P95 < 500ms
- **Error Rate**: < 1%
- **Throughput**: > 1000 requests/second
- **Availability**: > 99.9%

### Business Metrics
- **Active Users**: Track daily/monthly active users
- **Booking Conversion**: Monitor booking funnel
- **Session Utilization**: Track capacity usage
- **Revenue Metrics**: Monitor booking revenue

### Infrastructure Metrics
- **CPU Usage**: < 70% average
- **Memory Usage**: < 80% average
- **Disk Usage**: < 75% average
- **Network I/O**: Monitor bandwidth usage

## Contact Information

- **On-call Engineer**: PagerDuty escalation
- **DevOps Team**: devops@zmos.com
- **Database Admin**: dba@zmos.com
- **Security Team**: security@zmos.com
- **Management**: management@zmos.com

---

*This operations guide should be reviewed quarterly and updated with lessons learned from incidents.*
