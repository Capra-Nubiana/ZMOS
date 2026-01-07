-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sessionInstanceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Waitlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Waitlist_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Waitlist_sessionInstanceId_fkey" FOREIGN KEY ("sessionInstanceId") REFERENCES "SessionInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sessionTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_sessionTypeId_fkey" FOREIGN KEY ("sessionTypeId") REFERENCES "SessionType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Waitlist_tenantId_idx" ON "Waitlist"("tenantId");

-- CreateIndex
CREATE INDEX "Waitlist_memberId_idx" ON "Waitlist"("memberId");

-- CreateIndex
CREATE INDEX "Waitlist_sessionInstanceId_idx" ON "Waitlist"("sessionInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_memberId_sessionInstanceId_key" ON "Waitlist"("memberId", "sessionInstanceId");

-- CreateIndex
CREATE INDEX "Favorite_tenantId_idx" ON "Favorite"("tenantId");

-- CreateIndex
CREATE INDEX "Favorite_memberId_idx" ON "Favorite"("memberId");

-- CreateIndex
CREATE INDEX "Favorite_sessionTypeId_idx" ON "Favorite"("sessionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_memberId_sessionTypeId_key" ON "Favorite"("memberId", "sessionTypeId");
