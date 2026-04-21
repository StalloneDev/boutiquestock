import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, productVariantsTable, salesTable, stockMovementsTable } from "@workspace/db";
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

    let variant = null;
    let variantLabel: string | null = null;
    if (item.variantId) {
      const [v] = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, item.variantId));
      if (!v) { res.status(404).json({ error: "Variante introuvable" }); return; }
      variant = v;
      variantLabel = [v.size, v.color].filter(Boolean).join(" / ") || null;

      if (v.quantity < item.quantity) {
        res.status(400).json({ error: `Stock insuffisant pour "${product.name}" ${variantLabel ?? ""} (disponible: ${v.quantity}, demandé: ${item.quantity})` });
        return;
      }
    } else if (product.quantity < item.quantity) {
      res.status(400).json({ error: `Stock insuffisant pour "${product.name}" (disponible: ${product.quantity}, demandé: ${item.quantity})` });
      return;
    }

    const totalAmount = item.unitPrice * item.quantity;

    const [sale] = await db.insert(salesTable).values({
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      totalAmount: String(totalAmount),
      notes: body.notes ?? null,
    }).returning();

    if (variant) {
      const variantBefore = variant.quantity;
      const variantAfter = variantBefore - item.quantity;
      await db.update(productVariantsTable)
        .set({ quantity: variantAfter, updatedAt: new Date() })
        .where(eq(productVariantsTable.id, variant.id));

      // recompute product total
      const allVariants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id));
      const totalQty = allVariants.reduce((acc, v) => acc + v.quantity, 0);
      await db.update(productsTable)
        .set({ quantity: totalQty, updatedAt: new Date() })
        .where(eq(productsTable.id, product.id));

      await db.insert(stockMovementsTable).values({
        productId: item.productId,
        variantId: variant.id,
        type: "sale",
        delta: -item.quantity,
        quantityBefore: variantBefore,
        quantityAfter: variantAfter,
        reason: `Vente caisse #${sale.id}`,
      });
    } else {
      const quantityBefore = product.quantity;
      const quantityAfter = quantityBefore - item.quantity;
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
    }

    resultItems.push({
      saleId: sale.id,
      productId: item.productId,
      variantId: item.variantId ?? null,
      productName: product.name,
      variantLabel,
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
