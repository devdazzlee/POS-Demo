import { Router } from "express";
import { validate } from "../middleware/validation.middleware";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
    createStockController,
    adjustStockController,
    transferStockController,
    removeStockController,
    getStocksController,
    getStockMovementsController,
    getTodayStockMovementsController,
} from "../controllers/stock.controller";
import { createStockSchema, adjustStockSchema, transferStockSchema, removeStockSchema } from "../validations/stock.validation";

const router = Router();

router.use(
  authenticate,
  authorize(["SUPER_ADMIN", "ADMIN", "PURCHASE_MANAGER", "WAREHOUSE_MANAGER", "BRANCH_MANAGER"])
);

router.post("/", validate(createStockSchema), createStockController);
router.patch("/adjust", validate(adjustStockSchema), adjustStockController);
router.post("/transfer", validate(transferStockSchema), transferStockController);
router.delete("/remove", validate(removeStockSchema), removeStockController);
router.get("/", getStocksController);
router.get("/history", getStockMovementsController);
router.get("/today", getTodayStockMovementsController);

export default router;