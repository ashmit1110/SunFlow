/*
  Warnings:

  - Added the required column `updatedAt` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN "notes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bomTemplateId" TEXT NOT NULL,
    "systemType" TEXT NOT NULL,
    "capacityKw" REAL NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "discount" DECIMAL NOT NULL DEFAULT 0,
    "tax" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validUntil" DATETIME,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_bomTemplateId_fkey" FOREIGN KEY ("bomTemplateId") REFERENCES "BOMTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("bomTemplateId", "capacityKw", "createdAt", "createdByUserId", "customerId", "discount", "id", "leadId", "status", "subtotal", "systemType", "tax", "total", "updatedAt", "validUntil") SELECT "bomTemplateId", "capacityKw", "createdAt", "createdByUserId", "customerId", "discount", "id", "leadId", "status", "subtotal", "systemType", "tax", "total", "createdAt", "validUntil" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE INDEX "Quote_leadId_idx" ON "Quote"("leadId");
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");
CREATE INDEX "Quote_bomTemplateId_idx" ON "Quote"("bomTemplateId");
CREATE INDEX "Quote_createdByUserId_idx" ON "Quote"("createdByUserId");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
