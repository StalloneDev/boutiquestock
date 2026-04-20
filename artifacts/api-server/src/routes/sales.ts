import { Router } from "express";
import { db } from "@workspace/db";
import { salesTable, productsTable, stockMovementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateSaleBody, ListSalesQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const params = ListSalesQueryParams.parse(req.query);
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const rows = await db
    .select({
      id: salesTable.id,
      productId: salesTable.productId,
      productName: productsTable.name,
      quantity: salesTable.quantity,
      unitPrice: salesTable.unitPrice,
      totalAmount: salesTable.totalAmount,
      notes: salesTable.notes,
      createdAt: salesTable.createdAt,
    })
    .from(salesTable)
    .leftJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .orderBy(desc(salesTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(rows);
});

router.post("/", async (req, res): Promise<void> => {
  const body = CreateSaleBody.parse(req.body);

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, body.productId));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  if (product.quantity < body.quantity) { res.status(400).json({ error: "Insufficient stock" }); return; }

  const totalAmount = body.unitPrice * body.quantity;
  const quantityBefore = product.quantity;
  const quantityAfter = quantityBefore - body.quantity;

  const [sale] = await db.insert(salesTable).values({
    productId: body.productId,
    quantity: body.quantity,
    unitPrice: String(body.unitPrice),
    totalAmount: String(totalAmount),
    notes: body.notes ?? null,
  }).returning();

  await db.update(productsTable).set({ quantity: quantityAfter, updatedAt: new Date() }).where(eq(productsTable.id, body.productId));

  await db.insert(stockMovementsTable).values({
    productId: body.productId,
    type: "sale",
    delta: -body.quantity,
    quantityBefore,
    quantityAfter,
    reason: `Vente #${sale.id}`,
  });

  res.status(201).json({
    ...sale,
    productName: product.name,
  });
});

router.delete("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [sale] = await db.select().from(salesTable).where(eq(salesTable.id, id));
  if (!sale) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(productsTable)
    .set({ quantity: productsTable.quantity + sale.quantity, updatedAt: new Date() } as never)
    .where(eq(productsTable.id, sale.productId));

  await db.delete(salesTable).where(eq(salesTable.id, id));
  res.status(204).send();
});

export default router;
