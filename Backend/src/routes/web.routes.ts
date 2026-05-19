import { Router } from 'express';
import {
  getHome,
  listCategories,
  getAllCategories,
  getCategoryBySlug,
  listProducts,
  getProductById,
  suggestProducts,
  getProductCount,
} from '../controllers/web.controller';

const router = Router();

// Home — single bundled payload for the website landing page
router.get('/home', getHome);

// Categories
router.get('/categories', listCategories);
router.get('/categories/all', getAllCategories);
router.get('/categories/:slug', getCategoryBySlug);

// Products
router.get('/products', listProducts);
router.get('/products/:id', getProductById);

// Search suggestions (typeahead)
router.get('/search/suggest', suggestProducts);

// Meta
router.get('/meta/product-count', getProductCount);

export default router;
