import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import salesRouter from "./sales";
import stockMovementsRouter from "./stockMovements";
import dashboardRouter from "./dashboard";
import posRouter from "./pos";
import suppliersRouter from "./suppliers";
import purchaseOrdersRouter from "./purchaseOrders";
import catalogRouter from "./catalog";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/sales", salesRouter);
router.use("/stock-movements", stockMovementsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/pos", posRouter);
router.use("/suppliers", suppliersRouter);
router.use("/purchase-orders", purchaseOrdersRouter);
router.use("/catalog", catalogRouter);

export default router;
