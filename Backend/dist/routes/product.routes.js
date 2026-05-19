"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../controllers/product.controller");
const product_validation_1 = require("../validations/product.validation");
const validation_middleware_1 = require("../middleware/validation.middleware");
// import { authenticate, authorize } from '../middleware/auth.middleware';
const multer_1 = __importDefault(require("../utils/multer"));
const parse_formdata_middleware_1 = require("../middleware/parse-formdata.middleware");
const uploadBulk_1 = __importDefault(require("../utils/uploadBulk"));
const router = express_1.default.Router();
// router.use(authenticate, authorize(['SUPER_ADMIN', 'ADMIN']));
router.post('/', multer_1.default.array('images', 10), parse_formdata_middleware_1.parseFormData, (0, validation_middleware_1.validate)(product_validation_1.createProductSchema), product_controller_1.createProduct);
router.post('/upload-image', multer_1.default.single('image'), product_controller_1.uploadProductImage);
router.post('/bulk-upload', uploadBulk_1.default.single('file'), product_controller_1.bulkUploadProducts);
router.delete('/all', product_controller_1.deleteAllProducts);
router.get('/', (0, validation_middleware_1.validate)(product_validation_1.listProductsSchema), product_controller_1.listProducts);
router.get('/export/excel', product_controller_1.exportProductsToExcel);
router.get('/featured', product_controller_1.getFeaturedProducts);
router.get('/best-selling', product_controller_1.getBestSellingProducts);
router.get('/:id', (0, validation_middleware_1.validate)(product_validation_1.getProductSchema), product_controller_1.getProduct);
router.patch('/:id', (0, validation_middleware_1.validate)(product_validation_1.updateProductSchema), product_controller_1.updateProduct);
router.patch('/:id/toggle-status', (0, validation_middleware_1.validate)(product_validation_1.getProductSchema), product_controller_1.toggleProductStatus);
router.delete('/:id', (0, validation_middleware_1.validate)(product_validation_1.getProductSchema), product_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map