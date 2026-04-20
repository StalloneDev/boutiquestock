import { Router } from "express";
import { db } from "@workspace/db";
import { stockMovementsTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateStockMovementBody, ListStockMovementsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const params = ListStockMovementsQueryParams.parse(req.query);
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;

  const query = db
    .select({
      id: stockMovementsTable.id,
      productId: stockMovementsTable.productId,
      productName: productsTable.name,
      type: stockMovementsTable.type,
      delta: stockMovementsTable.delta,
      quantityBefore: stockMovementsTable.quantityBefore,
      quantityAfter: stockMovementsTable.quantityAfter,
      reason: stockMovementsTable.reason,
      createdAt: stockMovementsTable.createdAt,
    })
    .from(stockMovementsTable)
    .leftJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
    .orderBy(desc(stockMovementsTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (params.productId) {
    const rows = await db
      .select({
        id: stockMovementsTable.id,
        productId: stockMovementsTable.productId,
        productName: productsTable.name,
        type: stockMovementsTable.type,
        delta: stockMovementsTable.delta,
        quantityBefore: stockMovementsTable.quantityBefore,
        quantityAfter: stockMovementsTable.quantityAfter,
        reason: stockMovementsTable.reason,
        createdAt: stockMovementsTable.createdAt,
      })
      .from(stockMovementsTable)
      .leftJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
      .where(eq(stockMovementsTable.productId, params.productId))
      .orderBy(desc(stockMovementsTable.createdAt))
      .limit(limit)
      .offset(offset);
    res.json(rows);
    return;
  }

  const rows = await query;
  res.json(rows);
});

router.post("/", async (req, res): Promise<void> => {
  const body = CreateStockMovementBody.parse(req.body);

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, body.productId));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const quantityBefore = product.quantity;
  const quantityAfter = quantityBefore + body.delta;

  if (quantityAfter < 0) { res.status(400).json({ error: "Insufficient stock" }); return; }

  await db.update(productsTable).set({ quantity: quantityAfter, updatedAt: new Date() }).where(eq(productsTable.id, body.productId));

  const [movement] = await db.insert(stockMovementsTable).values({
    productId: body.productId,
    type: body.delta > 0 ? "entry" : "exit",
    delta: body.delta,
    quantityBefore,
    quantityAfter,
    reason: body.reason ?? null,
  }).returning();

  res.status(201).json({ ...movement, productName: product.name });
});

export default router;
