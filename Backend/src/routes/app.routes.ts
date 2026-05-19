import { Router } from "express";
import { getHomeData, searchProducts, getProductById, getCategories } from "../controllers/app.controller";

const router = Router();

router.get("/", getHomeData);
router.get("/categories", getCategories);
router.get("/products", searchProducts);
router.get("/products/:id", getProductById);

export default router;
