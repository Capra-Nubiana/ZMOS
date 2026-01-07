-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Member_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Member" ("createdAt", "email", "id", "name", "passwordHash", "tenantId", "updatedAt") SELECT "createdAt", "email", "id", "name", "passwordHash", "tenantId", "updatedAt" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_googleId_key" ON "Member"("googleId");
CREATE INDEX "Member_tenantId_idx" ON "Member"("tenantId");
CREATE UNIQUE INDEX "Member_email_tenantId_key" ON "Member"("email", "tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
