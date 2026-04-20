import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, salesTable, stockMovementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PosCheckoutBody } from "@workspace/api-zod";

const router = Router();

router.post("/checkout", async (req, res): Promise<void> => {
  const body = PosCheckoutBody.parse(req.body);

  if (!body.items || body.items.length === 0) {
    res.status(400).json({ error: "Le panier est vide" });
    return;
  }

  const resultItems = [];
  let grandTotal = 0;

  for (const item of body.items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) {
      res.status(404).json({ error: `Produit ${item.productId} introuvable` });
      return;
    }
    if (product.quantity < item.quantity) {
      res.status(400).json({ error: `Stock insuffisant pour "${product.name}" (disponible: ${product.quantity}, demandé: ${item.quantity})` });
      return;
    }

    const totalAmount = item.unitPrice * item.quantity;
    const quantityBefore = product.quantity;
    const quantityAfter = quantityBefore - item.quantity;

    const [sale] = await db.insert(salesTable).values({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      totalAmount: String(totalAmount),
      notes: body.notes ?? null,
    }).returning();

    await db.update(productsTable)
      .set({ quantity: quantityAfter, updatedAt: new Date() })
      .where(eq(productsTable.id, item.productId));

    await db.insert(stockMovementsTable).values({
      productId: item.productId,
      type: "sale",
      delta: -item.quantity,
      quantityBefore,
      quantityAfter,
      reason: `Vente caisse #${sale.id}`,
    });

    resultItems.push({
      saleId: sale.id,
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount,
    });

    grandTotal += totalAmount;
  }

  res.status(201).json({
    items: resultItems,
    grandTotal,
    itemCount: resultItems.reduce((acc, i) => acc + i.quantity, 0),
  });
});

export default router;
