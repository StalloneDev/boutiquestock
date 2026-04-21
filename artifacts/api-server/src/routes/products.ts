import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, stockMovementsTable, productVariantsTable } from "@workspace/db";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { CreateProductBody, UpdateProductBody, AdjustProductStockBody, ListProductsQueryParams } from "@workspace/api-zod";

const router = Router();

const productSelect = {
  id: productsTable.id,
  name: productsTable.name,
  categoryId: productsTable.categoryId,
  categoryName: categoriesTable.name,
  quantity: productsTable.quantity,
  unitCostPrice: productsTable.unitCostPrice,
  unitSalePrice: productsTable.unitSalePrice,
  lowStockThreshold: productsTable.lowStockThreshold,
  notes: productsTable.notes,
  barcode: productsTable.barcode,
  imageUrl: productsTable.imageUrl,
  hasVariants: productsTable.hasVariants,
  createdAt: productsTable.createdAt,
  updatedAt: productsTable.updatedAt,
};

async function attachVariants(rows: Array<Record<string, unknown> & { id: number; hasVariants: number }>) {
  return Promise.all(
    rows.map(async (p) => {
      const variants = p.hasVariants
        ? await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, p.id)).orderBy(productVariantsTable.id)
        : [];
      return { ...p, hasVariants: !!p.hasVariants, variants };
    }),
  );
}

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
    .select(productSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.name);

  let result = rows;
  if (params.lowStock) {
    result = rows.filter((p) => p.quantity <= p.lowStockThreshold);
  }

  res.json(await attachVariants(result));
});

router.get("/by-barcode/:barcode", async (req, res): Promise<void> => {
  const barcode = req.params.barcode;
  if (!barcode) { res.status(400).json({ error: "Code-barres manquant" }); return; }

  const [variantHit] = await db
    .select({
      variant: productVariantsTable,
      product: productSelect,
    })
    .from(productVariantsTable)
    .innerJoin(productsTable, eq(productVariantsTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productVariantsTable.barcode, barcode));

  if (variantHit) {
    const [withVariants] = await attachVariants([variantHit.product]);
    res.json({ product: withVariants, variant: variantHit.variant });
    return;
  }

  const [productHit] = await db
    .select(productSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.barcode, barcode));

  if (!productHit) { res.status(404).json({ error: "Produit introuvable" }); return; }
  const [withVariants] = await attachVariants([productHit]);
  res.json({ product: withVariants, variant: null });
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
      barcode: body.barcode ?? null,
      imageUrl: body.imageUrl ?? null,
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
    .select(productSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, created.id));

  const [withVariants] = await attachVariants([withCategory]);
  res.status(201).json(withVariants);
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db
    .select(productSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  const [withVariants] = await attachVariants([product]);
  res.json(withVariants);
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
  if (body.barcode !== undefined) updateData.barcode = body.barcode;
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

  const [updated] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [withCategory] = await db
    .select(productSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  const [withVariants] = await attachVariants([withCategory]);
  res.json(withVariants);
});

router.delete("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(stockMovementsTable).where(eq(stockMovementsTable.productId, id));
  await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, id));
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
    .select(productSelect)
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, updated.id));

  const [withVariants] = await attachVariants([withCategory]);
  res.json(withVariants);
});

// Variants nested under products
router.get("/:id/variants", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const variants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, id)).orderBy(productVariantsTable.id);
  res.json(variants);
});

router.post("/:id/variants", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) { res.status(404).json({ error: "Produit introuvable" }); return; }

  const body = req.body as Record<string, unknown>;

  const [variant] = await db.insert(productVariantsTable).values({
    productId: id,
    size: (body.size as string | null) ?? null,
    color: (body.color as string | null) ?? null,
    sku: (body.sku as string | null) ?? null,
    barcode: (body.barcode as string | null) ?? null,
    quantity: (body.quantity as number) ?? 0,
    unitCostPrice: body.unitCostPrice != null ? String(body.unitCostPrice) : null,
    unitSalePrice: body.unitSalePrice != null ? String(body.unitSalePrice) : null,
  }).returning();

  // mark product as having variants & sum quantities
  const allVariants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, id));
  const totalQty = allVariants.reduce((acc, v) => acc + v.quantity, 0);
  await db.update(productsTable).set({ hasVariants: 1, quantity: totalQty, updatedAt: new Date() }).where(eq(productsTable.id, id));

  if (variant.quantity > 0) {
    await db.insert(stockMovementsTable).values({
      productId: id,
      variantId: variant.id,
      type: "entry",
      delta: variant.quantity,
      quantityBefore: 0,
      quantityAfter: variant.quantity,
      reason: "Stock initial variante",
    });
  }

  res.status(201).json(variant);
});

export default router;
