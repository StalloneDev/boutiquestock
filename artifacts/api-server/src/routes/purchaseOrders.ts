import { Router } from "express";
import { db } from "@workspace/db";
import { purchaseOrdersTable, purchaseOrderItemsTable, suppliersTable, productsTable, stockMovementsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreatePurchaseOrderBody, UpdatePurchaseOrderBody, ListPurchaseOrdersQueryParams } from "@workspace/api-zod";

const router = Router();

async function getOrderWithItems(id: number) {
  const [order] = await db
    .select({
      id: purchaseOrdersTable.id,
      supplierId: purchaseOrdersTable.supplierId,
      supplierName: suppliersTable.name,
      status: purchaseOrdersTable.status,
      notes: purchaseOrdersTable.notes,
      createdAt: purchaseOrdersTable.createdAt,
      updatedAt: purchaseOrdersTable.updatedAt,
    })
    .from(purchaseOrdersTable)
    .leftJoin(suppliersTable, eq(purchaseOrdersTable.supplierId, suppliersTable.id))
    .where(eq(purchaseOrdersTable.id, id));

  if (!order) return null;

  const items = await db
    .select({
      id: purchaseOrderItemsTable.id,
      purchaseOrderId: purchaseOrderItemsTable.purchaseOrderId,
      productId: purchaseOrderItemsTable.productId,
      productName: productsTable.name,
      quantityOrdered: purchaseOrderItemsTable.quantityOrdered,
      quantityReceived: purchaseOrderItemsTable.quantityReceived,
      unitCost: purchaseOrderItemsTable.unitCost,
    })
    .from(purchaseOrderItemsTable)
    .leftJoin(productsTable, eq(purchaseOrderItemsTable.productId, productsTable.id))
    .where(eq(purchaseOrderItemsTable.purchaseOrderId, id));

  const totalCost = items.reduce((acc, i) => acc + parseFloat(i.unitCost) * i.quantityOrdered, 0);

  return {
    ...order,
    totalCost,
    items: items.map((i) => ({
      ...i,
      unitCost: parseFloat(i.unitCost),
      totalCost: parseFloat(i.unitCost) * i.quantityOrdered,
    })),
  };
}

router.get("/", async (req, res): Promise<void> => {
  const params = ListPurchaseOrdersQueryParams.parse(req.query);

  const orders = await db
    .select({
      id: purchaseOrdersTable.id,
      supplierId: purchaseOrdersTable.supplierId,
      supplierName: suppliersTable.name,
      status: purchaseOrdersTable.status,
      notes: purchaseOrdersTable.notes,
      createdAt: purchaseOrdersTable.createdAt,
      updatedAt: purchaseOrdersTable.updatedAt,
    })
    .from(purchaseOrdersTable)
    .leftJoin(suppliersTable, eq(purchaseOrdersTable.supplierId, suppliersTable.id))
    .orderBy(purchaseOrdersTable.createdAt);

  const filteredOrders = orders.filter((o) => {
    if (params.supplierId && o.supplierId !== params.supplierId) return false;
    if (params.status && o.status !== params.status) return false;
    return true;
  });

  const ordersWithItems = await Promise.all(
    filteredOrders.map(async (o) => {
      const items = await db
        .select({ unitCost: purchaseOrderItemsTable.unitCost, quantityOrdered: purchaseOrderItemsTable.quantityOrdered })
        .from(purchaseOrderItemsTable)
        .where(eq(purchaseOrderItemsTable.purchaseOrderId, o.id));
      const totalCost = items.reduce((acc, i) => acc + parseFloat(i.unitCost) * i.quantityOrdered, 0);
      return { ...o, totalCost, items: [] };
    })
  );

  res.json(ordersWithItems);
});

router.post("/", async (req, res): Promise<void> => {
  const body = CreatePurchaseOrderBody.parse(req.body);

  const [order] = await db.insert(purchaseOrdersTable).values({
    supplierId: body.supplierId ?? null,
    notes: body.notes ?? null,
  }).returning();

  for (const item of body.items) {
    await db.insert(purchaseOrderItemsTable).values({
      purchaseOrderId: order.id,
      productId: item.productId,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: 0,
      unitCost: String(item.unitCost),
    });
  }

  const result = await getOrderWithItems(order.id);
  res.status(201).json(result);
});

router.get("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const order = await getOrderWithItems(id);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(order);
});

router.patch("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const body = UpdatePurchaseOrderBody.parse(req.body);
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) updateData.status = body.status;
  if (body.notes !== undefined) updateData.notes = body.notes;
  await db.update(purchaseOrdersTable).set(updateData).where(eq(purchaseOrdersTable.id, id));
  const result = await getOrderWithItems(id);
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.delete("/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.purchaseOrderId, id));
  await db.delete(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, id));
  res.status(204).send();
});

router.post("/:id/receive", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [order] = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, id));
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  if (order.status === "received") { res.status(400).json({ error: "Déjà reçu" }); return; }

  const items = await db.select().from(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.purchaseOrderId, id));

  for (const item of items) {
    const qty = item.quantityOrdered - item.quantityReceived;
    if (qty <= 0) continue;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) continue;

    const quantityBefore = product.quantity;
    const quantityAfter = quantityBefore + qty;

    await db.update(productsTable).set({ quantity: quantityAfter, updatedAt: new Date() }).where(eq(productsTable.id, item.productId));
    await db.update(purchaseOrderItemsTable).set({ quantityReceived: item.quantityOrdered }).where(eq(purchaseOrderItemsTable.id, item.id));
    await db.insert(stockMovementsTable).values({
      productId: item.productId,
      type: "entry",
      delta: qty,
      quantityBefore,
      quantityAfter,
      reason: `Réception bon de commande #${id}`,
    });
  }

  await db.update(purchaseOrdersTable).set({ status: "received", updatedAt: new Date() }).where(eq(purchaseOrdersTable.id, id));

  const result = await getOrderWithItems(id);
  res.json(result);
});

export default router;
