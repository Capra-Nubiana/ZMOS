# ZMOS Backend Core Rules (December 2025)

- Multi-tenant SaaS: Shared database, shared schema. Every relevant table MUST have `tenantId: Uuid` (not null).
- Use nestjs-cls (ClsModule + ClsService) with AsyncLocalStorage to store current tenantId per request.
- Tenant resolution: Read from HTTP header `x-tenant-id` (UUID string). Validate it exists in DB. Throw 400 if missing/invalid.
- Prisma filtering: Use Prisma Client Extension ($extends) to automatically add { where: { tenantId } } to queries for models that have tenantId.
- Core entities to start:
  - Tenant (id: Uuid @id @default(uuid()), name: String, createdAt: DateTime @default(now()), updatedAt: DateTime @updatedAt)
  - Member (id: Uuid @id @default(uuid()), tenantId: Uuid @@index([tenantId]), email: String, passwordHash: String, name: String?, createdAt: DateTime @default(now()), updatedAt: DateTime @updatedAt)
  - Unique index: @@unique([email, tenantId])
- Auth: Local JWT-based (ZMOS-only mode). Members belong to a Tenant.
- Use class-validator DTOs, proper NestJS module structure.
- Use bcrypt for password hashing.
- Follow ports & adapters pattern — no hard ZHEP dependencies.