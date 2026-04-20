import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, stockMovementsTable } from "@workspace/db";
import { eq, ilike, and, lte, sql } from "drizzle-orm";
import { CreateProductBody, UpdateProductBody, AdjustProductStockBody, ListProductsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.parse(req.query);

  const conditions = [];
  if (params.search) {
    conditions.push(ilike(productsTable.name, `%${params.search}%`));
  }
  if (params.categoryId) {
    conditions.push(eq(productsTable.categoryId, params.categoryId));
  }

  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      quantity: productsTable.quantity,
      unitCostPrice: productsTable.unitCostPrice,
      unitSalePrice: productsTable.unitSalePrice,
      lowStockThreshold: productsTable.lowStockThreshold,
      notes: productsTable.notes,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.name);

  let result = rows;
  if (params.lowStock) {
    result = rows.filter((p) => p.quantity <= p.lowStockThreshold);
  }

  res.json(result);
});

router.post("/", async (req, res): Promise<void> => {
  const body = CreateProductBody.parse(req.body);
  const [created] = await db
    .insert(productsTable)
    .values({
      name: body.name,
      categoryId: body.categoryId ?? null,
      quantity: body.quantity ?? 0,
      unitCostPrice: body.unitCostPrice != null ? String(body.unitCostPrice) : null,
      unitSalePrice: body.unitSalePrice != null ? String(body.unitSalePrice) : null,
      lowStockThreshold: body.lowStockThreshold ?? 2,
      notes: body.notes ?? null,
    })
    .returning();

  if (created.quantity > 0) {
    await db.insert(stockMovementsTable).values({
      productId: created.id,
      type: "entry",
      delta: created.quantity,
      quantityBefore: 0,
      quantityAfter: created.quantity,
      reason: "Stock initial",
    });
  }

  const [withCategory] = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      quantity: productsTable.quantity,
      unitCostPrice: productsTable.unitCostPrice,
      unitSalePrice: productsTable.unitSalePrice,
      lowStockThreshold: productsTable.lowStockThreshold,
      notes: productsTable.notes,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, created.id));

  res.status(201).json(withCategory);
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      quantity: productsTable.quantity,
      unitCostPrice: productsTable.unitCostPrice,
      unitSalePrice: productsTable.unitSalePrice,
      lowStockThreshold: productsTable.lowStockThreshold,
      notes: productsTable.notes,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(product);
});

router.patch("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = UpdateProductBody.parse(req.body);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.unitCostPrice !== undefined) updateData.unitCostPrice = body.unitCostPrice != null ? String(body.unitCostPrice) : null;
  if (body.unitSalePrice !== undefined) updateData.unitSalePrice = body.unitSalePrice != null ? String(body.unitSalePrice) : null;
  if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = body.lowStockThreshold;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const [updated] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [withCategory] = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      quantity: productsTable.quantity,
      unitCostPrice: productsTable.unitCostPrice,
      unitSalePrice: productsTable.unitSalePrice,
      lowStockThreshold: productsTable.lowStockThreshold,
      notes: productsTable.notes,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  res.json(withCategory);
});

router.delete("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(stockMovementsTable).where(eq(stockMovementsTable.productId, id));
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

router.post("/:id/adjust-stock", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = AdjustProductStockBody.parse(req.body);

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Not found" }); return; }

  const quantityBefore = product.quantity;
  const quantityAfter = quantityBefore + body.delta;

  if (quantityAfter < 0) { res.status(400).json({ error: "Insufficient stock" }); return; }

  const [updated] = await db
    .update(productsTable)
    .set({ quantity: quantityAfter, updatedAt: new Date() })
    .where(eq(productsTable.id, id))
    .returning();

  await db.insert(stockMovementsTable).values({
    productId: id,
    type: body.delta > 0 ? "entry" : "exit",
    delta: body.delta,
    quantityBefore,
    quantityAfter,
    reason: body.reason ?? null,
  });

  const [withCategory] = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      quantity: productsTable.quantity,
      unitCostPrice: productsTable.unitCostPrice,
      unitSalePrice: productsTable.unitSalePrice,
      lowStockThreshold: productsTable.lowStockThreshold,
      notes: productsTable.notes,
      createdAt: productsTable.createdAt,
      updatedAt: productsTable.updatedAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, updated.id));

  res.json(withCategory);
});

export default router;
