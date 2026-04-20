import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import salesRouter from "./sales";
import stockMovementsRouter from "./stockMovements";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/sales", salesRouter);
router.use("/stock-movements", stockMovementsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
