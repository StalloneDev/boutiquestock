import { Router } from "express";
import { db } from "@workspace/db";
import { productVariantsTable, productsTable, stockMovementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.patch("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Variante introuvable" }); return; }

  const body = req.body as Record<string, unknown>;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.size !== undefined) updateData.size = body.size;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.sku !== undefined) updateData.sku = body.sku;
  if (body.barcode !== undefined) updateData.barcode = body.barcode;
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.unitCostPrice !== undefined) updateData.unitCostPrice = body.unitCostPrice != null ? String(body.unitCostPrice) : null;
  if (body.unitSalePrice !== undefined) updateData.unitSalePrice = body.unitSalePrice != null ? String(body.unitSalePrice) : null;

  const [updated] = await db.update(productVariantsTable).set(updateData).where(eq(productVariantsTable.id, id)).returning();

  // Recompute parent product total stock
  const allVariants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, existing.productId));
  const totalQty = allVariants.reduce((acc, v) => acc + v.quantity, 0);
  await db.update(productsTable).set({ quantity: totalQty, updatedAt: new Date() }).where(eq(productsTable.id, existing.productId));

  res.json(updated);
});

router.delete("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, id));
  if (!existing) { res.status(204).send(); return; }

  await db.delete(stockMovementsTable).where(eq(stockMovementsTable.variantId, id));
  await db.delete(productVariantsTable).where(eq(productVariantsTable.id, id));

  const remaining = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, existing.productId));
  const totalQty = remaining.reduce((acc, v) => acc + v.quantity, 0);
  await db.update(productsTable)
    .set({ quantity: totalQty, hasVariants: remaining.length > 0 ? 1 : 0, updatedAt: new Date() })
    .where(eq(productsTable.id, existing.productId));

  res.status(204).send();
});

export default router;
