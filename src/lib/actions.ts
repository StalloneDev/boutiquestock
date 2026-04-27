"use server";

import { db } from "@/db";
import { cache } from "react";
import { productsTable, categoriesTable, salesTable, stockMovementsTable, productVariantsTable, purchaseOrdersTable, purchaseOrderItemsTable, cashRegisterSessionsTable, usersTable } from "@/db";
import { eq, ilike, and, or, sql, desc, isNull } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

// Cache tags constants
const TAGS = {
  products: "products",
  categories: "categories",
  analysis: "analysis",
  sales: "sales",
};

// Product Actions
export const getProducts = async (params: { search?: string; categoryId?: number; lowStock?: boolean } = {}) => {
  return await unstable_cache(
    async () => {
      const conditions = [];
      if (params.search) {
        conditions.push(ilike(productsTable.name, `%${params.search}%`));
      }
      if (params.categoryId) {
        conditions.push(eq(productsTable.categoryId, params.categoryId));
      }
      if (params.lowStock) {
        conditions.push(sql`${productsTable.quantity} <= ${productsTable.lowStockThreshold}`);
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
          barcode: productsTable.barcode,
          imageUrl: productsTable.imageUrl,
          hasVariants: productsTable.hasVariants,
          createdAt: productsTable.createdAt,
          updatedAt: productsTable.updatedAt,
        })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(productsTable.name);

      return rows;
    },
    ['products', JSON.stringify(params)],
    { tags: [TAGS.products], revalidate: 3600 }
  )();
};

export async function createProduct(data: any) {
  const [created] = await db
    .insert(productsTable)
    .values({
      name: data.name,
      categoryId: data.categoryId ?? null,
      quantity: data.quantity ?? 0,
      unitCostPrice: data.unitCostPrice != null ? String(data.unitCostPrice) : null,
      unitSalePrice: data.unitSalePrice != null ? String(data.unitSalePrice) : null,
      lowStockThreshold: data.lowStockThreshold ?? 2,
      notes: data.notes ?? null,
      barcode: data.barcode ?? null,
      imageUrl: data.imageUrl ?? null,
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

  revalidateTag(TAGS.products);
  revalidatePath("/products");
  return created;
}

export async function updateProduct(id: number, data: any) {
  const [updated] = await db
    .update(productsTable)
    .set({
      name: data.name,
      categoryId: data.categoryId ?? null,
      quantity: data.quantity ?? 0,
      unitCostPrice: data.unitCostPrice != null ? String(data.unitCostPrice) : null,
      unitSalePrice: data.unitSalePrice != null ? String(data.unitSalePrice) : null,
      lowStockThreshold: data.lowStockThreshold ?? 2,
      notes: data.notes ?? null,
      barcode: data.barcode ?? null,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : null,
      updatedAt: new Date(),
    })
    .where(eq(productsTable.id, id))
    .returning();

  revalidateTag(TAGS.products);
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/margins");
  return updated;
}

export const getProductById = async (id: number) => {
  return await unstable_cache(
    async () => {
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
          barcode: productsTable.barcode,
          imageUrl: productsTable.imageUrl,
          createdAt: productsTable.createdAt,
          updatedAt: productsTable.updatedAt,
        })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .where(eq(productsTable.id, id));
      return product;
    },
    [`product-${id}`],
    { tags: [TAGS.products], revalidate: 3600 }
  )();
};

export const getProductMovements = async (productId: number) => {
  return await unstable_cache(
    async () => {
      return await db
        .select()
        .from(stockMovementsTable)
        .where(eq(stockMovementsTable.productId, productId))
        .orderBy(desc(stockMovementsTable.createdAt));
    },
    [`movements-${productId}`],
    { tags: [TAGS.products], revalidate: 3600 }
  )();
};

export async function deleteProduct(id: number) {
  await db.delete(productsTable).where(eq(productsTable.id, id));
  revalidateTag(TAGS.products);
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

// Category Actions
export const getCategories = async () => {
  return await unstable_cache(
    async () => {
      return await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    },
    ['categories'],
    { tags: [TAGS.categories], revalidate: 3600 }
  )();
};

export async function createCategory(data: { name: string; description?: string }) {
  const [created] = await db.insert(categoriesTable).values({
    name: data.name,
    description: data.description ?? null,
  }).returning();
  revalidateTag(TAGS.categories);
  revalidatePath("/categories");
  revalidatePath("/products");
  return created;
}

export async function updateCategory(id: number, data: { name?: string; description?: string }) {
  const [updated] = await db.update(categoriesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(categoriesTable.id, id))
    .returning();
  revalidateTag(TAGS.categories);
  revalidatePath("/categories");
  revalidatePath("/products");
  return updated;
}


export async function deleteCategory(id: number) {
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  revalidateTag(TAGS.categories);
  revalidatePath("/categories");
  revalidatePath("/products");
}

import { gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";

// Sales Actions
export async function getSales(filters?: { from?: string; to?: string }) {
  const conditions = [];

  if (filters?.from) {
    conditions.push(gte(salesTable.createdAt, new Date(filters.from)));
  }

  if (filters?.to) {
    const toDate = new Date(filters.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(salesTable.createdAt, toDate));
  }

  return await db
    .select({
      id: salesTable.id,
      productId: salesTable.productId,
      productName: productsTable.name,
      quantity: salesTable.quantity,
      unitPrice: salesTable.unitPrice,
      totalAmount: salesTable.totalAmount,
      status: salesTable.status,
      createdAt: salesTable.createdAt,
      cashierName: usersTable.name,
    })
    .from(salesTable)
    .innerJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .leftJoin(usersTable, eq(salesTable.cashierId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(salesTable.createdAt));
}

export async function recordSale(data: { productId: number; quantity: number; unitPrice: number; notes?: string }) {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, data.productId));
  if (!product) throw new Error("Product not found");
  if (product.quantity < data.quantity) throw new Error("Insufficient stock");

  const [activeSession] = await db.select().from(cashRegisterSessionsTable).where(eq(cashRegisterSessionsTable.status, "open"));
  if (!activeSession) throw new Error("Aucune session de caisse ouverte");

  const totalAmount = data.unitPrice * data.quantity;
  const quantityBefore = product.quantity;
  const quantityAfter = quantityBefore - data.quantity;

  const session = await getSession();
  const userId = session?.user?.id;

  const [sale] = await db.insert(salesTable).values({
    sessionId: activeSession.id,
    productId: data.productId,
    quantity: data.quantity,
    unitPrice: String(data.unitPrice),
    totalAmount: String(totalAmount),
    status: "completed",
    notes: data.notes ?? null,
    cashierId: userId ?? null,
  }).returning();

  await db.update(productsTable)
    .set({ quantity: quantityAfter, updatedAt: new Date() })
    .where(eq(productsTable.id, data.productId));

  await db.insert(stockMovementsTable).values({
    productId: data.productId,
    type: "sale",
    delta: -data.quantity,
    quantityBefore,
    quantityAfter,
    reason: `Vente #${sale.id}`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/sales");
  return sale;
}

export async function cancelSale(saleId: number) {
  const [sale] = await db.select().from(salesTable).where(eq(salesTable.id, saleId));
  if (!sale) throw new Error("Vente non trouvée");
  if (sale.status === "cancelled") throw new Error("Vente déjà annulée");

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, sale.productId));
  if (!product) throw new Error("Produit associé introuvable");

  const quantityBefore = product.quantity;
  const quantityAfter = quantityBefore + sale.quantity;

  // Update sale status
  await db.update(salesTable)
    .set({ status: "cancelled", updatedAt: new Date() } as any)
    .where(eq(salesTable.id, saleId));

  // Restore stock
  await db.update(productsTable)
    .set({ quantity: quantityAfter, updatedAt: new Date() })
    .where(eq(productsTable.id, product.id));

  // Record stock movement
  await db.insert(stockMovementsTable).values({
    productId: product.id,
    type: "entry",
    delta: sale.quantity,
    quantityBefore,
    quantityAfter,
    reason: `Annulation vente #${sale.id}`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/sales");
  return true;
}

// Session Actions
export async function getActiveSession() {
  const [session] = await db
    .select()
    .from(cashRegisterSessionsTable)
    .where(eq(cashRegisterSessionsTable.status, "open"))
    .limit(1);
  return session || null;
}

export async function openSession(openingBalance: number) {
  const activeSession = await getActiveSession();
  if (activeSession) throw new Error("Une session est déjà ouverte.");

  const [session] = await db.insert(cashRegisterSessionsTable).values({
    openingBalance: String(openingBalance),
    status: "open",
  }).returning();

  revalidatePath("/pos");
  return session;
}

export async function closeSession(sessionId: number, closingBalance: number, notes?: string) {
  const [session] = await db.update(cashRegisterSessionsTable)
    .set({
      status: "closed",
      closingTime: new Date(),
      closingBalance: String(closingBalance),
      notes: notes ?? null,
    })
    .where(eq(cashRegisterSessionsTable.id, sessionId))
    .returning();

  revalidatePath("/pos");
  return session;
}

export async function getSessionSales(sessionId: number) {
  const sales = await db
    .select()
    .from(salesTable)
    .where(and(eq(salesTable.sessionId, sessionId), eq(salesTable.status, "completed")));

  return sales;
}

export async function getSuppliers() {
  const { suppliersTable } = await import("@/db");
  return await db.select().from(suppliersTable).orderBy(suppliersTable.name);
}

export async function createSupplier(data: { name: string; contactName?: string; email?: string; phone?: string; address?: string }) {
  const { suppliersTable } = await import("@/db");
  const [created] = await db.insert(suppliersTable).values({
    name: data.name,
    contact: data.contactName, // Map contactName from form to contact in DB
    email: data.email,
    phone: data.phone,
    address: data.address,
  }).returning();
  revalidatePath("/suppliers");
  return created;
}

export async function getStockMovements(limit = 50) {
  return await db
    .select({
      id: stockMovementsTable.id,
      productName: productsTable.name,
      type: stockMovementsTable.type,
      delta: stockMovementsTable.delta,
      quantityBefore: stockMovementsTable.quantityBefore,
      quantityAfter: stockMovementsTable.quantityAfter,
      reason: stockMovementsTable.reason,
      createdAt: stockMovementsTable.createdAt,
    })
    .from(stockMovementsTable)
    .innerJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
    .orderBy(desc(stockMovementsTable.createdAt))
    .limit(limit);
}

export async function recordStockEntry(data: { productId: number; quantity: number; reason?: string }) {
  const [product] = await db.select({ quantity: productsTable.quantity }).from(productsTable).where(eq(productsTable.id, data.productId));
  if (!product) throw new Error("Produit non trouvé");

  const quantityBefore = product.quantity;
  const quantityAfter = quantityBefore + data.quantity;

  const [movement] = await db.insert(stockMovementsTable).values({
    productId: data.productId,
    type: "entry",
    delta: data.quantity,
    quantityBefore,
    quantityAfter,
    reason: data.reason || "Réapprovisionnement manuel",
  }).returning();

  await db.update(productsTable)
    .set({ quantity: quantityAfter, updatedAt: new Date() })
    .where(eq(productsTable.id, data.productId));

  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/restock");
  return movement;
}
export async function getPurchaseOrders() {
  const { suppliersTable } = await import("@/db");
  const orders = await db
    .select({
      id: purchaseOrdersTable.id,
      supplierName: suppliersTable.name,
      status: purchaseOrdersTable.status,
      createdAt: purchaseOrdersTable.createdAt,
    })
    .from(purchaseOrdersTable)
    .leftJoin(suppliersTable, eq(purchaseOrdersTable.supplierId, suppliersTable.id))
    .orderBy(desc(purchaseOrdersTable.createdAt));
  return orders;
}

export async function createPurchaseOrder(data: { supplierId: number; notes?: string; items: { productId: number; quantity: number; unitCost: number }[] }) {
  return await db.transaction(async (tx) => {
    const [order] = await tx.insert(purchaseOrdersTable).values({
      supplierId: data.supplierId,
      notes: data.notes,
      status: "ordered",
    }).returning();

    for (const item of data.items) {
      await tx.insert(purchaseOrderItemsTable).values({
        purchaseOrderId: order.id,
        productId: item.productId,
        quantityOrdered: item.quantity,
        unitCost: String(item.unitCost),
      });
    }

    revalidatePath("/orders");
    return order;
  });
}

// Analytics Actions
export const getMarginAnalysis = async () => {
  return await unstable_cache(
    async () => {
      const products = await db
        .select({
          id: productsTable.id,
          name: productsTable.name,
          quantity: productsTable.quantity,
          unitCostPrice: productsTable.unitCostPrice,
          unitSalePrice: productsTable.unitSalePrice,
          categoryName: categoriesTable.name,
        })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

      const categoryMap = new Map<string, { cost: number; revenue: number }>();
      let totalCost = 0;
      let totalRevenue = 0;

      products.forEach((p) => {
        const cost = Number(p.unitCostPrice || 0) * p.quantity;
        const revenue = Number(p.unitSalePrice || 0) * p.quantity;
        const category = p.categoryName || "Sans catégorie";

        totalCost += cost;
        totalRevenue += revenue;

        const current = categoryMap.get(category) || { cost: 0, revenue: 0 };
        categoryMap.set(category, {
          cost: current.cost + cost,
          revenue: current.revenue + revenue,
        });
      });

      const categoryData = Array.from(categoryMap.entries()).map(([name, stats]) => {
        const profit = stats.revenue - stats.cost;
        const margin = stats.revenue > 0 ? (profit / stats.revenue) * 100 : 0;
        return {
          name,
          cost: stats.cost,
          revenue: stats.revenue,
          profit,
          margin: Math.round(margin * 100) / 100,
        };
      });

      const totalProfit = totalRevenue - totalCost;
      const globalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      return {
        totalCost,
        totalRevenue,
        totalProfit,
        globalMargin: Math.round(globalMargin * 100) / 100,
        categoryData: categoryData.sort((a, b) => b.profit - a.profit),
      };
    },
    ['margin-analysis'],
    { tags: [TAGS.analysis, TAGS.products], revalidate: 3600 }
  )();
};

export async function getDashboardStats() {
  const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);
  const [totalStockValue] = await db.select({ value: sql<number>`sum(cast(${productsTable.unitCostPrice} as decimal) * ${productsTable.quantity})` }).from(productsTable);

  return {
    productCount: Number(productsCount.count),
    stockValue: Number(totalStockValue.value || 0),
  };
}

// -------------------------------------------------------------
// EMPLOYEE / USERS ACTIONS
// -------------------------------------------------------------

import { hashPassword } from "./auth";

export async function getUsers() {
  return await db.select({
    id: usersTable.id,
    name: usersTable.name,
    username: usersTable.username,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.name);
}

export async function createUser(data: any) {
  const [created] = await db.insert(usersTable).values({
    name: data.name,
    username: data.username,
    password: hashPassword(data.password),
    role: data.role,
  }).returning({
    id: usersTable.id,
    name: usersTable.name,
    role: usersTable.role,
  });

  revalidatePath("/employees");
  return created;
}

export async function updateUser(id: number, data: any) {
  const updateData: any = {
    name: data.name,
    username: data.username,
    role: data.role,
  };

  if (data.password && data.password.trim() !== "") {
    updateData.password = hashPassword(data.password);
  }

  const [updated] = await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, id))
    .returning({
      id: usersTable.id,
    });

  revalidatePath("/employees");
  return updated;
}

export async function deleteUser(id: number) {
  await db.delete(usersTable).where(eq(usersTable.id, id));
  revalidatePath("/employees");
  return { success: true };
}
