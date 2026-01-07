# ZMOS Security Policy

## Overview

This document outlines the security measures, policies, and best practices for the ZMOS (Zimasa Movement Operating System) platform, ensuring the protection of user data, system integrity, and compliance with relevant standards.

## Authentication & Authorization

### JWT Token Management

#### Token Lifecycle
- **Access Token Expiration**: 24 hours from issuance
- **Refresh Token Expiration**: 30 days from issuance
- **Token Format**: RFC 7519 compliant JWT with RS256 signing

#### Token Refresh Strategy
```javascript
// Client-side token refresh flow
async function refreshAccessToken() {
  try {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'x-tenant-id': tenantId
      }
    });

    if (response.ok) {
      const { accessToken } = await response.json();
      // Store new access token
      localStorage.setItem('accessToken', accessToken);
      return accessToken;
    }
  } catch (error) {
    // Redirect to login on refresh failure
    redirectToLogin();
  }
}
```

#### Automatic Token Refresh (Android)
```kotlin
// Android implementation with OkHttp interceptor
class TokenRefreshInterceptor : Interceptor {
    override fun intercept(chain: Chain): Response {
        val originalRequest = chain.request()
        val response = chain.proceed(originalRequest)

        if (response.code == 401) {
            // Try to refresh token
            val refreshResponse = refreshToken()
            if (refreshResponse != null) {
                // Retry original request with new token
                val newRequest = originalRequest.newBuilder()
                    .header("Authorization", "Bearer ${refreshResponse.accessToken}")
                    .build()
                return chain.proceed(newRequest)
            }
        }

        return response
    }
}
```

### Multi-Tenant Security

#### Tenant Isolation
- **Database Level**: Row-based security with tenant ID filters
- **API Level**: `x-tenant-id` header validation on all requests
- **Data Segregation**: Complete isolation between tenant data

#### Cross-Tenant Protection
```sql
-- Automatic tenant filtering in all queries
SELECT * FROM locations WHERE tenant_id = $1
-- $1 is extracted from x-tenant-id header
```

## Rate Limiting

### Rate Limit Policies

#### Authentication Endpoints
- **Signup**: 5 requests per minute per IP address
- **Login**: 10 requests per minute per IP address
- **Token Refresh**: 20 requests per minute per user

#### API Endpoints
- **Read Operations** (GET): 100 requests per minute per tenant
- **Write Operations** (POST/PUT/PATCH): 50 requests per minute per tenant
- **Delete Operations**: 20 requests per minute per tenant

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60  // When limit exceeded
```

### Rate Limiting Implementation
```javascript
// Redis-based rate limiting
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each tenant to 100 requests per windowMs
  keyGenerator: (req) => req.headers['x-tenant-id'] || req.ip
});
```

## Data Protection

### Encryption

#### Data at Rest
- **Database Encryption**: AES-256 encryption for sensitive fields
- **File Storage**: Server-side encryption for uploaded content
- **Backup Encryption**: All backups encrypted with customer-managed keys

#### Data in Transit
- **TLS 1.3**: Required for all communications
- **Certificate Pinning**: Recommended for mobile applications
- **HSTS**: HTTP Strict Transport Security enabled

### Personally Identifiable Information (PII)

#### PII Fields
- **Direct PII**: email, name, phone_number
- **Indirect PII**: location data, session history
- **Sensitive PII**: health data, payment information (if added)

#### PII Handling Rules
```javascript
// PII field validation
const piiFields = ['email', 'name', 'phoneNumber'];

function sanitizeForLogs(data) {
  const sanitized = { ...data };
  piiFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  return sanitized;
}
```

## GDPR Compliance

### Data Subject Rights

#### Right to Access
```http
GET /gdpr/data-export
Authorization: Bearer <token>
x-tenant-id: <tenant-id>
```

#### Right to Erasure
```http
POST /gdpr/data-deletion
Authorization: Bearer <token>
x-tenant-id: <tenant-id>
Content-Type: application/json

{
  "confirmation": "DELETE_ALL_MY_DATA",
  "reason": "user_request"
}
```

### Data Retention Policies

#### User Data Retention
- **Active Users**: Retained indefinitely
- **Inactive Users** (no login > 2 years): 90-day deletion notice
- **Deleted Users**: Data anonymized after 30 days, deleted after 1 year

#### System Data Retention
- **Audit Logs**: 7 years (compliance requirement)
- **Analytics Data**: 2 years
- **Backups**: 30 days rolling retention

## Password Security

### Password Requirements
- **Minimum Length**: 12 characters
- **Complexity**: At least 3 of: uppercase, lowercase, numbers, symbols
- **Dictionary Check**: No common passwords allowed
- **Personal Info**: Cannot contain user's name or email

### Password Storage
- **Algorithm**: Argon2id (recommended) or bcrypt (fallback)
- **Salt**: Unique per password, stored separately
- **Iterations**: Minimum 12 for Argon2id, 12 rounds for bcrypt

```javascript
// Password validation
const passwordSchema = {
  minLength: 12,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  blacklist: ['password', '123456', 'qwerty'] // Common passwords
};
```

## CORS Configuration

### Allowed Origins
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Allow specific domains in production
    const allowedOrigins = [
      'https://app.zmos.com',
      'https://admin.zmos.com',
      /^https:\/\/.*\.zmos\.com$/  // Subdomains
    ];

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(/^http:\/\/localhost:\d+$/);
    }

    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      return allowed.test(origin);
    });

    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-api-key']
};
```

## API Key Management (Mobile Apps)

### Mobile API Keys
```javascript
// API key rotation strategy
const apiKeyRotation = {
  currentKey: 'current_key_v1',
  previousKey: 'previous_key_v0', // Grace period
  rotationSchedule: 'quarterly',
  gracePeriod: '30 days'
};
```

### Mobile Request Signing
```kotlin
// Android request signing for additional security
fun signRequest(request: Request, secret: String): Request {
    val timestamp = System.currentTimeMillis()
    val payload = "${request.method}${request.url}$timestamp"
    val signature = hmacSha256(payload, secret)

    return request.newBuilder()
        .addHeader("X-Timestamp", timestamp.toString())
        .addHeader("X-Signature", signature)
        .build()
}
```

## Security Monitoring

### Real-time Alerts
- **Failed Authentication**: > 5 failed attempts per minute
- **Rate Limit Exceeded**: Any tenant exceeding limits
- **Suspicious Patterns**: Unusual API usage patterns
- **Data Export Requests**: GDPR data export requests

### Audit Logging
```javascript
// Structured audit log
const auditLog = {
  timestamp: new Date().toISOString(),
  tenantId: req.headers['x-tenant-id'],
  userId: req.user?.id,
  action: 'user_login',
  resource: 'auth',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  success: true,
  metadata: {
    loginMethod: 'email',
    mfaUsed: false
  }
};
```

## Incident Response

### Security Incident Classification
- **Critical**: Data breach, unauthorized access to production data
- **High**: Service disruption, DDoS attack
- **Medium**: Rate limiting bypass, suspicious activity
- **Low**: Failed login attempts, probe attempts

### Response Timeline
- **Critical**: Response within 1 hour, resolution within 4 hours
- **High**: Response within 4 hours, resolution within 24 hours
- **Medium**: Response within 24 hours, resolution within 72 hours
- **Low**: Response within 72 hours, resolution when convenient

## Security Testing

### Automated Security Tests
```javascript
// Example security test
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/locations')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', tenantId)
      .send({ name: maliciousInput });

    expect(response.status).toBe(400);
  });

  it('should validate tenant isolation', async () => {
    // Attempt cross-tenant data access
    const response = await request(app)
      .get('/locations')
      .set('Authorization', `Bearer ${token}`)
      .set('x-tenant-id', 'other-tenant-id');

    expect(response.body).toHaveLength(0);
  });
});
```

### Penetration Testing Schedule
- **Automated**: Daily security scans
- **Manual**: Quarterly penetration testing
- **External Audit**: Annual third-party security audit

## Security Checklist for Mobile Apps

### Android Security Requirements
- [ ] Certificate pinning implemented
- [ ] Sensitive data encrypted in SharedPreferences
- [ ] Network security config properly configured
- [ ] ProGuard/R8 obfuscation enabled
- [ ] Root detection implemented
- [ ] Jailbreak detection (if iOS support added)
- [ ] Biometric authentication for sensitive operations

### Mobile Security Best Practices
```kotlin
// Android secure storage
class SecureStorage(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) {
        sharedPreferences.edit()
            .putString("auth_token", token)
            .apply()
    }
}
```

## Compliance Certifications

### Planned Certifications
- [ ] SOC 2 Type II (Security, Availability, Confidentiality)
- [ ] ISO 27001 (Information Security Management)
- [ ] GDPR Compliance Audit
- [ ] HIPAA Compliance (if health data expanded)

### Security Training
- **Developer Training**: Annual security awareness training
- **Code Reviews**: Security-focused code review checklist
- **Incident Response Drills**: Quarterly incident response simulations

---

## Contact Information

**Security Team**: security@zmos.com
**Emergency Contact**: +1-555-SECURITY
**PGP Key**: Available at https://zmos.com/security/pgp-key.asc

**Report Security Issues**: security@zmos.com or https://zmos.com/security/report

---

*This document is reviewed and updated quarterly or when significant security changes are made.*
