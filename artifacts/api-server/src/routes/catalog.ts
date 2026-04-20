import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, and, gt } from "drizzle-orm";
import { GetCatalogQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const params = GetCatalogQueryParams.parse(req.query);

  const conditions = [];
  if (params.search) {
    conditions.push(ilike(productsTable.name, `%${params.search}%`));
  }
  if (params.categoryId) {
    conditions.push(eq(productsTable.categoryId, params.categoryId));
  }
  if (params.inStockOnly) {
    conditions.push(gt(productsTable.quantity, 0));
  }

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      unitSalePrice: productsTable.unitSalePrice,
      quantity: productsTable.quantity,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(categoriesTable.name, productsTable.name);

  const result = products.map((p) => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.categoryName,
    unitSalePrice: p.unitSalePrice ? parseFloat(p.unitSalePrice) : null,
    quantity: p.quantity,
    available: p.quantity > 0,
  }));

  res.json(result);
});

export default router;
