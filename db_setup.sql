-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'HELPER');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KG', 'GM', 'L', 'ML', 'PCS', 'DOZEN', 'BOX', 'PACK');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'CARD', 'CREDIT', 'SPLIT');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('FRIDGE', 'RACK', 'COUNTER', 'MACHINE', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "AnomalyType" AS ENUM ('CASH_MISMATCH', 'LATE_ENTRY', 'HIGH_VALUE_VOID', 'INVENTORY_DISCREPANCY');

-- CreateEnum
CREATE TYPE "AnomalySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BillFormat" AS ENUM ('THERMAL_80MM', 'THERMAL_58MM', 'A4', 'A5');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "category" TEXT,
    "mrp" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "unit" "Unit" NOT NULL DEFAULT 'PCS',
    "minStock" INTEGER NOT NULL DEFAULT 5,
    "isLoose" BOOLEAN NOT NULL DEFAULT false,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LooseConfig" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isLoose" BOOLEAN NOT NULL DEFAULT true,
    "unit" "Unit" NOT NULL DEFAULT 'KG',
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LooseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "batchNumber" TEXT,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditEntry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT,
    "staffId" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransaction" (
    "id" TEXT NOT NULL,
    "assetTypeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnDate" TIMESTAMP(3),

    CONSTRAINT "AssetTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "message" TEXT NOT NULL,
    "targetAudience" JSONB NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ONDCOrder" (
    "id" TEXT NOT NULL,
    "ondcOrderId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "customerDetails" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ONDCOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "voidsCount" INTEGER NOT NULL DEFAULT 0,
    "expectedCash" DOUBLE PRECISION,
    "actualCash" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyLog" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "type" "AnomalyType" NOT NULL,
    "severity" "AnomalySeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnomalyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkedBill" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "parkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkedBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalePayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "BillFormat" NOT NULL,
    "template" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_name_key" ON "Product"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LooseConfig_productId_key" ON "LooseConfig"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_storeId_phone_key" ON "Customer"("storeId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "AssetType_storeId_name_key" ON "AssetType"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ONDCOrder_ondcOrderId_key" ON "ONDCOrder"("ondcOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "BillTemplate_storeId_name_key" ON "BillTemplate"("storeId", "name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LooseConfig" ADD CONSTRAINT "LooseConfig_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditEntry" ADD CONSTRAINT "CreditEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetType" ADD CONSTRAINT "AssetType_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransaction" ADD CONSTRAINT "AssetTransaction_assetTypeId_fkey" FOREIGN KEY ("assetTypeId") REFERENCES "AssetType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransaction" ADD CONSTRAINT "AssetTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLog" ADD CONSTRAINT "CampaignLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLog" ADD CONSTRAINT "CampaignLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ONDCOrder" ADD CONSTRAINT "ONDCOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomalyLog" ADD CONSTRAINT "AnomalyLog_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkedBill" ADD CONSTRAINT "ParkedBill_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkedBill" ADD CONSTRAINT "ParkedBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkedBill" ADD CONSTRAINT "ParkedBill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillTemplate" ADD CONSTRAINT "BillTemplate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
