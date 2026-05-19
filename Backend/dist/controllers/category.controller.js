"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllCategories = exports.deleteCategory = exports.listCategories = exports.toggleCategoryStatus = exports.updateCategory = exports.getCategory = exports.createCategory = void 0;
const category_service_1 = require("../services/category.service");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const categoryService = new category_service_1.CategoryService();
exports.createCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await categoryService.createCategory(req.body);
    new apiResponse_1.ApiResponse(category, 'Category created successfully', 201).send(res);
    console.log(req.files);
    if (req.files?.length) {
        console.log('Processing category images:');
        await categoryService.processCategoryImages(category.id, req.files);
    }
});
exports.getCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.id);
    new apiResponse_1.ApiResponse(category, 'Category retrieved successfully').send(res);
});
exports.updateCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    new apiResponse_1.ApiResponse(category, 'Category updated successfully').send(res);
});
exports.toggleCategoryStatus = (0, asyncHandler_1.default)(async (req, res) => {
    await categoryService.toggleCategoryStatus(req.params.id);
    new apiResponse_1.ApiResponse(null, 'Category status changed successfully').send(res);
});
exports.listCategories = (0, asyncHandler_1.default)(async (req, res) => {
    const { page = 1, limit, search, is_active, branch_id } = req.query;
    const parsedLimit = typeof limit === 'string' && limit.trim() !== '' ? Number(limit) : undefined;
    const result = await categoryService.listCategories({
        page: Number(page),
        limit: parsedLimit,
        search: search,
        is_active: is_active ? is_active === 'true' : undefined,
        branch_id: branch_id,
    });
    new apiResponse_1.ApiResponse(result.data, 'Categories retrieved successfully', 200).send(res);
});
exports.deleteCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const category = await categoryService.deleteCategory(req.params.id);
    new apiResponse_1.ApiResponse(category, 'Category deleted successfully').send(res);
});
exports.deleteAllCategories = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await categoryService.deleteAllCategories();
    new apiResponse_1.ApiResponse(result, `Successfully deleted ${result.deletedCount} categories and ${result.deletedImages} category images`, 200).send(res);
});
//# sourceMappingURL=category.controller.js.map