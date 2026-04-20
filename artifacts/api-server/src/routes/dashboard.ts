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

router.get("/margins", async (req, res): Promise<void> => {
  const products = await db
    .select({
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      quantity: productsTable.quantity,
      unitCostPrice: productsTable.unitCostPrice,
      unitSalePrice: productsTable.unitSalePrice,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

  const sales = await db
    .select({
      productId: salesTable.productId,
      quantity: salesTable.quantity,
      totalAmount: salesTable.totalAmount,
    })
    .from(salesTable);

  const byCategory: Record<string, {
    categoryId: number | null;
    categoryName: string;
    productCount: number;
    totalCostValue: number;
    totalSaleValue: number;
    totalUnitsSold: number;
    totalRevenue: number;
  }> = {};

  for (const p of products) {
    const key = p.categoryName ?? "Sans catégorie";
    if (!byCategory[key]) {
      byCategory[key] = {
        categoryId: p.categoryId,
        categoryName: key,
        productCount: 0,
        totalCostValue: 0,
        totalSaleValue: 0,
        totalUnitsSold: 0,
        totalRevenue: 0,
      };
    }
    byCategory[key].productCount++;
    const costPrice = p.unitCostPrice ? parseFloat(p.unitCostPrice) : 0;
    const salePrice = p.unitSalePrice ? parseFloat(p.unitSalePrice) : 0;
    byCategory[key].totalCostValue += costPrice * p.quantity;
    byCategory[key].totalSaleValue += salePrice * p.quantity;
  }

  const salesByCat: Record<string, { unitsSold: number; revenue: number }> = {};

  const allProducts = await db
    .select({
      id: productsTable.id,
      categoryName: categoriesTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

  const productCatLookup: Record<number, string> = {};
  for (const p of allProducts) {
    productCatLookup[p.id] = p.categoryName ?? "Sans catégorie";
  }

  for (const s of sales) {
    const catName = productCatLookup[s.productId] ?? "Sans catégorie";
    if (!salesByCat[catName]) salesByCat[catName] = { unitsSold: 0, revenue: 0 };
    salesByCat[catName].unitsSold += s.quantity;
    salesByCat[catName].revenue += parseFloat(s.totalAmount);
  }

  for (const key of Object.keys(byCategory)) {
    byCategory[key].totalUnitsSold = salesByCat[key]?.unitsSold ?? 0;
    byCategory[key].totalRevenue = salesByCat[key]?.revenue ?? 0;
  }

  const result = Object.values(byCategory).map((cat) => {
    const totalProfit = cat.totalSaleValue - cat.totalCostValue;
    const marginPercent = cat.totalSaleValue > 0 ? (totalProfit / cat.totalSaleValue) * 100 : 0;
    return {
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      productCount: cat.productCount,
      totalCostValue: cat.totalCostValue,
      totalSaleValue: cat.totalSaleValue,
      totalProfit,
      marginPercent: Math.round(marginPercent * 100) / 100,
      totalUnitsSold: cat.totalUnitsSold,
      totalRevenue: cat.totalRevenue,
    };
  }).sort((a, b) => b.totalProfit - a.totalProfit);

  res.json(result);
});

export default router;
