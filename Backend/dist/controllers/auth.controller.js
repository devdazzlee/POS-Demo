"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.registerAdmin = exports.logout = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = __importDefault(require("../middleware/asyncHandler"));
const authService = new auth_service_1.AuthService();
const register = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await authService.register(req.body);
    new apiResponse_1.ApiResponse(user, 'IUser registered successfully', 201).send(res);
});
exports.register = register;
const registerAdmin = (0, asyncHandler_1.default)(async (req, res) => {
    const user = await authService.registerAdmin(req.body);
    new apiResponse_1.ApiResponse(user, 'IUser registered successfully', 201).send(res);
});
exports.registerAdmin = registerAdmin;
const login = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const userWithToken = await authService.login(email, password);
    new apiResponse_1.ApiResponse({ ...userWithToken }, 'Login successful').send(res);
});
exports.login = login;
const logout = (0, asyncHandler_1.default)(async (req, res) => {
    await authService.logout(req.user?.id);
    new apiResponse_1.ApiResponse(null, 'Logout successful').send(res);
});
exports.logout = logout;
const getCurrentUser = (0, asyncHandler_1.default)(async (req, res) => {
    new apiResponse_1.ApiResponse(req.user, 'Current user fetched').send(res);
});
exports.getCurrentUser = getCurrentUser;
//# sourceMappingURL=auth.controller.js.map