import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, salesTable, stockMovementsTable, categoriesTable } from "@workspace/db";
import { eq, sum, count, sql, desc } from "drizzle-orm";
import { GetTopProductsQueryParams, GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/summary", async (req, res): Promise<void> => {
  const products = await db.select().from(productsTable);

  const totalProducts = products.length;
  const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalStockValue = products.reduce((acc, p) => {
    const price = p.unitSalePrice ? parseFloat(p.unitSalePrice) : (p.unitCostPrice ? parseFloat(p.unitCostPrice) : 0);
    return acc + price * p.quantity;
  }, 0);
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  const salesResult = await db
    .select({ total: sql<string>`coalesce(sum(${salesTable.totalAmount}), 0)`, cnt: count() })
    .from(salesTable);

  const totalSalesValue = parseFloat(salesResult[0]?.total ?? "0");
  const totalSalesCount = salesResult[0]?.cnt ?? 0;

  res.json({
    totalProducts,
    totalUnits,
    totalStockValue,
    totalSalesValue,
    totalSalesCount,
    lowStockCount,
    outOfStockCount,
  });
});

router.get("/top-products", async (req, res): Promise<void> => {
  const params = GetTopProductsQueryParams.parse(req.query);
  const limit = params.limit ?? 5;

  const rows = await db
    .select({
      productId: salesTable.productId,
      productName: productsTable.name,
      categoryName: categoriesTable.name,
      totalSold: sql<number>`cast(sum(${salesTable.quantity}) as int)`,
      totalRevenue: sql<number>`cast(sum(${salesTable.totalAmount}) as float)`,
    })
    .from(salesTable)
    .leftJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(salesTable.productId, productsTable.name, categoriesTable.name)
    .orderBy(sql`sum(${salesTable.quantity}) desc`)
    .limit(limit);

  res.json(rows);
});

router.get("/category-breakdown", async (req, res): Promise<void> => {
  const products = await db
    .select({
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      quantity: productsTable.quantity,
      unitSalePrice: productsTable.unitSalePrice,
      unitCostPrice: productsTable.unitCostPrice,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

  const breakdown: Record<string, { categoryId: number | null; categoryName: string; productCount: number; totalUnits: number; totalValue: number }> = {};

  for (const p of products) {
    const key = p.categoryName ?? "Sans catégorie";
    if (!breakdown[key]) {
      breakdown[key] = { categoryId: p.categoryId, categoryName: key, productCount: 0, totalUnits: 0, totalValue: 0 };
    }
    breakdown[key].productCount++;
    breakdown[key].totalUnits += p.quantity;
    const price = p.unitSalePrice ? parseFloat(p.unitSalePrice) : (p.unitCostPrice ? parseFloat(p.unitCostPrice) : 0);
    breakdown[key].totalValue += price * p.quantity;
  }

  res.json(Object.values(breakdown).sort((a, b) => b.totalValue - a.totalValue));
});

router.get("/recent-activity", async (req, res): Promise<void> => {
  const params = GetRecentActivityQueryParams.parse(req.query);
  const limit = params.limit ?? 10;

  const movements = await db
    .select({
      id: stockMovementsTable.id,
      type: stockMovementsTable.type,
      productId: stockMovementsTable.productId,
      productName: productsTable.name,
      delta: stockMovementsTable.delta,
      reason: stockMovementsTable.reason,
      createdAt: stockMovementsTable.createdAt,
    })
    .from(stockMovementsTable)
    .leftJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
    .orderBy(desc(stockMovementsTable.createdAt))
    .limit(limit);

  const activity = movements.map((m) => ({
    id: m.id,
    type: m.type === "sale" ? "sale" : m.type === "entry" ? "stock_entry" : "adjustment",
    productId: m.productId,
    productName: m.productName ?? "Produit inconnu",
    delta: m.delta,
    description: m.reason ?? (m.type === "sale" ? "Vente" : m.type === "entry" ? "Entrée de stock" : "Ajustement"),
    createdAt: m.createdAt,
  }));

  res.json(activity);
});

export default router;
