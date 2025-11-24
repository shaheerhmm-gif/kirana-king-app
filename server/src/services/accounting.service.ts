import prisma from '../prisma';

interface JournalEntryData {
    storeId: string;
    ledgerAccountId: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    description: string;
    referenceType: string;
    referenceId?: string;
}

export class AccountingService {
    /**
     * Auto-post journal entries when a sale is made
     */
    static async postSaleEntries(saleId: string, storeId: string) {
        try {
            const sale = await prisma.sale.findUnique({
                where: { id: saleId },
                include: { items: true }
            });

            if (!sale) return;

            // Find or create necessary ledger accounts
            const salesAccount = await this.findOrCreateLedger(storeId, 'Sales', 'INCOME');
            const cashAccount = await this.findOrCreateLedger(storeId, 'Cash', 'ASSET');
            const inventoryAccount = await this.findOrCreateLedger(storeId, 'Inventory', 'ASSET');
            const cogsAccount = await this.findOrCreateLedger(storeId, 'Cost of Goods Sold', 'EXPENSE');

            const entries: JournalEntryData[] = [];

            // Debit: Cash (or Accounts Receivable if credit sale)
            if (sale.paymentMode === 'CREDIT') {
                const arAccount = await this.findOrCreateLedger(storeId, 'Accounts Receivable', 'ASSET');
                entries.push({
                    storeId,
                    ledgerAccountId: arAccount.id,
                    amount: sale.totalAmount,
                    type: 'DEBIT',
                    description: `Sale #${sale.id.substring(0, 8)}`,
                    referenceType: 'SALE',
                    referenceId: saleId
                });
            } else {
                entries.push({
                    storeId,
                    ledgerAccountId: cashAccount.id,
                    amount: sale.totalAmount,
                    type: 'DEBIT',
                    description: `Sale #${sale.id.substring(0, 8)}`,
                    referenceType: 'SALE',
                    referenceId: saleId
                });
            }

            // Credit: Sales
            entries.push({
                storeId,
                ledgerAccountId: salesAccount.id,
                amount: sale.totalAmount,
                type: 'CREDIT',
                description: `Sale #${sale.id.substring(0, 8)}`,
                referenceType: 'SALE',
                referenceId: saleId
            });

            // Calculate COGS and reduce inventory
            let totalCOGS = 0;
            for (const item of sale.items) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    include: { batches: { orderBy: { createdAt: 'asc' }, take: 1 } }
                });
                const purchasePrice = product?.batches[0]?.purchasePrice || 0;
                totalCOGS += purchasePrice * item.quantity;
            }

            if (totalCOGS > 0) {
                // Debit: COGS
                entries.push({
                    storeId,
                    ledgerAccountId: cogsAccount.id,
                    amount: totalCOGS,
                    type: 'DEBIT',
                    description: `COGS for Sale #${sale.id.substring(0, 8)}`,
                    referenceType: 'SALE',
                    referenceId: saleId
                });

                // Credit: Inventory
                entries.push({
                    storeId,
                    ledgerAccountId: inventoryAccount.id,
                    amount: totalCOGS,
                    type: 'CREDIT',
                    description: `COGS for Sale #${sale.id.substring(0, 8)}`,
                    referenceType: 'SALE',
                    referenceId: saleId
                });
            }

            // Create all journal entries
            await prisma.journalEntry.createMany({
                data: entries as any
            });

        } catch (error) {
            console.error('Error posting sale entries:', error);
        }
    }

    /**
     * Auto-post journal entries when a purchase is made
     */
    static async postPurchaseEntries(purchaseOrderId: string, storeId: string) {
        try {
            const po = await prisma.purchaseOrder.findUnique({
                where: { id: purchaseOrderId },
                include: { items: true }
            });

            if (!po) return;

            const inventoryAccount = await this.findOrCreateLedger(storeId, 'Inventory', 'ASSET');
            const apAccount = await this.findOrCreateLedger(storeId, 'Accounts Payable', 'LIABILITY');

            const entries: JournalEntryData[] = [];

            // Debit: Inventory
            entries.push({
                storeId,
                ledgerAccountId: inventoryAccount.id,
                amount: po.totalAmount,
                type: 'DEBIT',
                description: `Purchase Order ${po.id}`,
                referenceType: 'PURCHASE',
                referenceId: purchaseOrderId
            });

            // Credit: Accounts Payable
            entries.push({
                storeId,
                ledgerAccountId: apAccount.id,
                amount: po.totalAmount,
                type: 'CREDIT',
                description: `Purchase Order ${po.id}`,
                referenceType: 'PURCHASE',
                referenceId: purchaseOrderId
            });

            await prisma.journalEntry.createMany({
                data: entries as any
            });

        } catch (error) {
            console.error('Error posting purchase entries:', error);
        }
    }

    /**
     * Helper: Find or create a ledger account
     */
    private static async findOrCreateLedger(storeId: string, name: string, type: string) {
        let ledger = await prisma.ledgerAccount.findFirst({
            where: { storeId, name }
        });

        if (!ledger) {
            ledger = await prisma.ledgerAccount.create({
                data: {
                    storeId,
                    name,
                    type: type as any,
                    balance: 0
                }
            });
        }

        return ledger;
    }
}
