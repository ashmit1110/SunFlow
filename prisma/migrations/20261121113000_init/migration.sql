-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "assignedSalesUserId" TEXT,
    "requestedCapacityKw" REAL NOT NULL,
    "systemTypeInterest" TEXT,
    "subsidyInterest" BOOLEAN NOT NULL DEFAULT false,
    "shadowFreeRoofAreaSqm" REAL,
    "avgMonthlyBillInr" REAL,
    "gridSuitable" BOOLEAN,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lead_assignedSalesUserId_fkey" FOREIGN KEY ("assignedSalesUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteSurvey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "conductedByUserId" TEXT NOT NULL,
    "roofDirection" TEXT NOT NULL,
    "roofTiltDegrees" REAL NOT NULL,
    "cableDistanceMeters" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedByUserId" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    CONSTRAINT "SiteSurvey_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SiteSurvey_conductedByUserId_fkey" FOREIGN KEY ("conductedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SiteSurvey_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isSerialized" BOOLEAN NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "warrantyMonths" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "warehouseLocation" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BOMTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "systemType" TEXT NOT NULL,
    "minCapacityKw" REAL NOT NULL,
    "maxCapacityKw" REAL NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "BOMTemplateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bomTemplateId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityPerKw" REAL,
    "quantityFixed" INTEGER,
    "notes" TEXT,
    CONSTRAINT "BOMTemplateItem_bomTemplateId_fkey" FOREIGN KEY ("bomTemplateId") REFERENCES "BOMTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BOMTemplateItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
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
    CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_bomTemplateId_fkey" FOREIGN KEY ("bomTemplateId") REFERENCES "BOMTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceAtQuote" DECIMAL NOT NULL,
    "lineTotal" DECIMAL NOT NULL,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallationOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "totalAmount" DECIMAL NOT NULL,
    "advancePaid" DECIMAL NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL NOT NULL,
    "scheduledDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstallationOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallationOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationOrderId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "recordedByUserId" TEXT NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_installationOrderId_fkey" FOREIGN KEY ("installationOrderId") REFERENCES "InstallationOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SerializedEquipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "installationOrderId" TEXT,
    "dispatchId" TEXT,
    "currentCustomerId" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    CONSTRAINT "SerializedEquipment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SerializedEquipment_installationOrderId_fkey" FOREIGN KEY ("installationOrderId") REFERENCES "InstallationOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SerializedEquipment_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SerializedEquipment_currentCustomerId_fkey" FOREIGN KEY ("currentCustomerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationOrderId" TEXT NOT NULL,
    "dispatchedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARED',
    "dispatchDate" DATETIME,
    "deliveredDate" DATETIME,
    "vehicleNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dispatch_installationOrderId_fkey" FOREIGN KEY ("installationOrderId") REFERENCES "InstallationOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dispatch_dispatchedByUserId_fkey" FOREIGN KEY ("dispatchedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DispatchItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dispatchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "DispatchItem_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DispatchItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationOrderId" TEXT NOT NULL,
    "technicianUserId" TEXT NOT NULL,
    "scheduledDate" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "confirmedCapacityKw" REAL,
    "checklistJson" TEXT NOT NULL DEFAULT '{}',
    "signatureImagePath" TEXT,
    "customerSignedName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    CONSTRAINT "InstallationRecord_installationOrderId_fkey" FOREIGN KEY ("installationOrderId") REFERENCES "InstallationOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstallationRecord_technicianUserId_fkey" FOREIGN KEY ("technicianUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallationPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationRecordId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstallationPhoto_installationRecordId_fkey" FOREIGN KEY ("installationRecordId") REFERENCES "InstallationRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serializedEquipmentId" TEXT NOT NULL,
    "installationOrderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "warrantyStartDate" DATETIME NOT NULL,
    "warrantyMonths" INTEGER NOT NULL,
    "warrantyExpiryDate" DATETIME NOT NULL,
    "voidedAt" DATETIME,
    "voidReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Warranty_serializedEquipmentId_fkey" FOREIGN KEY ("serializedEquipmentId") REFERENCES "SerializedEquipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Warranty_installationOrderId_fkey" FOREIGN KEY ("installationOrderId") REFERENCES "InstallationOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Warranty_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serializedEquipmentId" TEXT,
    "installationOrderId" TEXT,
    "issueDescription" TEXT NOT NULL,
    "faultCode" TEXT,
    "warrantyCovered" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "ServiceTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceTicket_serializedEquipmentId_fkey" FOREIGN KEY ("serializedEquipmentId") REFERENCES "SerializedEquipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceTicket_installationOrderId_fkey" FOREIGN KEY ("installationOrderId") REFERENCES "InstallationOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceTicket_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceTicketCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceTicketId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "ServiceTicketCharge_serviceTicketId_fkey" FOREIGN KEY ("serviceTicketId") REFERENCES "ServiceTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationOrderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT,
    "incurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedByUserId" TEXT NOT NULL,
    CONSTRAINT "JobExpense_installationOrderId_fkey" FOREIGN KEY ("installationOrderId") REFERENCES "InstallationOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobExpense_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Lead_customerId_idx" ON "Lead"("customerId");

-- CreateIndex
CREATE INDEX "Lead_assignedSalesUserId_idx" ON "Lead"("assignedSalesUserId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurvey_leadId_key" ON "SiteSurvey"("leadId");

-- CreateIndex
CREATE INDEX "SiteSurvey_conductedByUserId_idx" ON "SiteSurvey"("conductedByUserId");

-- CreateIndex
CREATE INDEX "SiteSurvey_approvedByUserId_idx" ON "SiteSurvey"("approvedByUserId");

-- CreateIndex
CREATE INDEX "SiteSurvey_status_idx" ON "SiteSurvey"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_productId_idx" ON "StockMovement"("productId");

-- CreateIndex
CREATE INDEX "StockMovement_createdByUserId_idx" ON "StockMovement"("createdByUserId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "BOMTemplate_systemType_minCapacityKw_maxCapacityKw_idx" ON "BOMTemplate"("systemType", "minCapacityKw", "maxCapacityKw");

-- CreateIndex
CREATE INDEX "BOMTemplateItem_bomTemplateId_idx" ON "BOMTemplateItem"("bomTemplateId");

-- CreateIndex
CREATE INDEX "BOMTemplateItem_productId_idx" ON "BOMTemplateItem"("productId");

-- CreateIndex
CREATE INDEX "Quote_leadId_idx" ON "Quote"("leadId");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "Quote_bomTemplateId_idx" ON "Quote"("bomTemplateId");

-- CreateIndex
CREATE INDEX "Quote_createdByUserId_idx" ON "Quote"("createdByUserId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteItem_productId_idx" ON "QuoteItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationOrder_quoteId_key" ON "InstallationOrder"("quoteId");

-- CreateIndex
CREATE INDEX "InstallationOrder_customerId_idx" ON "InstallationOrder"("customerId");

-- CreateIndex
CREATE INDEX "InstallationOrder_status_idx" ON "InstallationOrder"("status");

-- CreateIndex
CREATE INDEX "Payment_installationOrderId_idx" ON "Payment"("installationOrderId");

-- CreateIndex
CREATE INDEX "Payment_recordedByUserId_idx" ON "Payment"("recordedByUserId");

-- CreateIndex
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "SerializedEquipment_serialNumber_key" ON "SerializedEquipment"("serialNumber");

-- CreateIndex
CREATE INDEX "SerializedEquipment_productId_idx" ON "SerializedEquipment"("productId");

-- CreateIndex
CREATE INDEX "SerializedEquipment_status_idx" ON "SerializedEquipment"("status");

-- CreateIndex
CREATE INDEX "SerializedEquipment_installationOrderId_idx" ON "SerializedEquipment"("installationOrderId");

-- CreateIndex
CREATE INDEX "SerializedEquipment_dispatchId_idx" ON "SerializedEquipment"("dispatchId");

-- CreateIndex
CREATE INDEX "SerializedEquipment_currentCustomerId_idx" ON "SerializedEquipment"("currentCustomerId");

-- CreateIndex
CREATE INDEX "Dispatch_installationOrderId_idx" ON "Dispatch"("installationOrderId");

-- CreateIndex
CREATE INDEX "Dispatch_dispatchedByUserId_idx" ON "Dispatch"("dispatchedByUserId");

-- CreateIndex
CREATE INDEX "Dispatch_status_idx" ON "Dispatch"("status");

-- CreateIndex
CREATE INDEX "DispatchItem_dispatchId_idx" ON "DispatchItem"("dispatchId");

-- CreateIndex
CREATE INDEX "DispatchItem_productId_idx" ON "DispatchItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationRecord_installationOrderId_key" ON "InstallationRecord"("installationOrderId");

-- CreateIndex
CREATE INDEX "InstallationRecord_technicianUserId_idx" ON "InstallationRecord"("technicianUserId");

-- CreateIndex
CREATE INDEX "InstallationPhoto_installationRecordId_idx" ON "InstallationPhoto"("installationRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Warranty_serializedEquipmentId_key" ON "Warranty"("serializedEquipmentId");

-- CreateIndex
CREATE INDEX "Warranty_installationOrderId_idx" ON "Warranty"("installationOrderId");

-- CreateIndex
CREATE INDEX "Warranty_customerId_idx" ON "Warranty"("customerId");

-- CreateIndex
CREATE INDEX "Warranty_warrantyExpiryDate_idx" ON "Warranty"("warrantyExpiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTicket_ticketNumber_key" ON "ServiceTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "ServiceTicket_customerId_idx" ON "ServiceTicket"("customerId");

-- CreateIndex
CREATE INDEX "ServiceTicket_serializedEquipmentId_idx" ON "ServiceTicket"("serializedEquipmentId");

-- CreateIndex
CREATE INDEX "ServiceTicket_installationOrderId_idx" ON "ServiceTicket"("installationOrderId");

-- CreateIndex
CREATE INDEX "ServiceTicket_assignedUserId_idx" ON "ServiceTicket"("assignedUserId");

-- CreateIndex
CREATE INDEX "ServiceTicket_status_idx" ON "ServiceTicket"("status");

-- CreateIndex
CREATE INDEX "ServiceTicketCharge_serviceTicketId_idx" ON "ServiceTicketCharge"("serviceTicketId");

-- CreateIndex
CREATE INDEX "JobExpense_installationOrderId_idx" ON "JobExpense"("installationOrderId");

-- CreateIndex
CREATE INDEX "JobExpense_recordedByUserId_idx" ON "JobExpense"("recordedByUserId");

-- CreateIndex
CREATE INDEX "JobExpense_incurredAt_idx" ON "JobExpense"("incurredAt");
