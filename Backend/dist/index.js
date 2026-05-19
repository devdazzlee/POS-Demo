"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const app_1 = require("./config/app");
const client_1 = require("./prisma/client");
const error_middleware_1 = require("./middleware/error.middleware");
const not_found_middleware_1 = require("./middleware/not-found.middleware");
const db_1 = require("./config/db");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const subcategory_routes_1 = __importDefault(require("./routes/subcategory.routes"));
const branch_routes_1 = __importDefault(require("./routes/branch.routes"));
const color_routes_1 = __importDefault(require("./routes/color.routes"));
const size_routes_1 = __importDefault(require("./routes/size.routes"));
const unit_routes_1 = __importDefault(require("./routes/unit.routes"));
const supplier_routes_1 = __importDefault(require("./routes/supplier.routes"));
const tax_routes_1 = __importDefault(require("./routes/tax.routes"));
const brand_routes_1 = __importDefault(require("./routes/brand.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const adminOrder_routes_1 = __importDefault(require("./routes/adminOrder.routes"));
const stock_routes_1 = __importDefault(require("./routes/stock.routes"));
const purchase_routes_1 = __importDefault(require("./routes/purchase.routes"));
const transfer_routes_1 = __importDefault(require("./routes/transfer.routes"));
const stock_out_routes_1 = __importDefault(require("./routes/stock-out.routes"));
const stock_adjustment_routes_1 = __importDefault(require("./routes/stock-adjustment.routes"));
const inventory_routes_1 = __importDefault(require("./routes/inventory.routes"));
const sale_routes_1 = __importDefault(require("./routes/sale.routes"));
const app_routes_1 = __importDefault(require("./routes/app.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const cashflow_routes_1 = __importDefault(require("./routes/cashflow.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const customerOrder_routes_1 = __importDefault(require("./routes/customerOrder.routes"));
const device_identity_routes_1 = __importDefault(require("./routes/device_identity.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const employee_route_1 = __importDefault(require("./routes/employee.route"));
const salary_route_1 = __importDefault(require("./routes/salary.route"));
const shift_route_1 = __importDefault(require("./routes/shift.route"));
const shiftAssignment_routes_1 = __importDefault(require("./routes/shiftAssignment.routes"));
const barcode_routes_1 = __importDefault(require("./routes/barcode.routes"));
const guestOrder_routes_1 = __importDefault(require("./routes/guestOrder.routes"));
const web_routes_1 = __importDefault(require("./routes/web.routes"));
const node_cron_1 = __importDefault(require("node-cron"));
const vAPI = process.env.vAPI || '/api/v1';
const app = (0, express_1.default)();
(0, db_1.connectDB)();
// Middleware
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            'https://pos.manpasandstore.com',
            'https://manpasand-pos-t623.vercel.app',
            'https://manpasand-pos-beta.vercel.app',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'https://manpasandstore.com',
            'https://www.manpasandstore.com'
        ];
        // Check if origin matches (with or without trailing slash)
        const originMatch = allowedOrigins.some(allowed => origin === allowed || origin === `${allowed}/`);
        if (originMatch) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '50mb' })); // Allow large base64 image payloads
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Routes
app.use(`${vAPI}/auth`, auth_routes_1.default);
app.use(`${vAPI}/categories`, category_routes_1.default);
app.use(`${vAPI}/subcategories`, subcategory_routes_1.default);
app.use(`${vAPI}/branches`, branch_routes_1.default);
app.use(`${vAPI}/colors`, color_routes_1.default);
app.use(`${vAPI}/sizes`, size_routes_1.default);
app.use(`${vAPI}/units`, unit_routes_1.default);
app.use(`${vAPI}/suppliers`, supplier_routes_1.default);
app.use(`${vAPI}/taxes`, tax_routes_1.default);
app.use(`${vAPI}/brands`, brand_routes_1.default);
app.use(`${vAPI}/products`, product_routes_1.default);
app.use(`${vAPI}/order`, adminOrder_routes_1.default);
app.use(`${vAPI}/sale`, sale_routes_1.default);
app.use(`${vAPI}/stock`, stock_routes_1.default);
app.use(`${vAPI}/purchases`, purchase_routes_1.default);
app.use(`${vAPI}/transfers`, transfer_routes_1.default);
app.use(`${vAPI}/stock-out`, stock_out_routes_1.default);
app.use(`${vAPI}/stock-adjustments`, stock_adjustment_routes_1.default);
app.use(`${vAPI}/inventory`, inventory_routes_1.default);
app.use(`${vAPI}/expenses`, expense_routes_1.default);
app.use(`${vAPI}/cashflows`, cashflow_routes_1.default);
app.use(`${vAPI}/dashboard`, dashboard_routes_1.default);
app.use(`${vAPI}/reports`, reports_routes_1.default);
app.use(`${vAPI}/employee`, employee_route_1.default);
app.use(`${vAPI}/salaries`, salary_route_1.default);
app.use(`${vAPI}/shifts`, shift_route_1.default);
app.use(`${vAPI}/shift-assignment`, shiftAssignment_routes_1.default);
app.use(`${vAPI}/barcode-generator`, barcode_routes_1.default);
// Website Routes (paginated, server-side filtered)
app.use(`${vAPI}/web`, web_routes_1.default);
// App Routes
app.use(`${vAPI}/customer/app`, app_routes_1.default);
app.use(`${vAPI}/customer`, customer_routes_1.default);
app.use(`${vAPI}/app/customer/order`, customerOrder_routes_1.default);
app.use(`${vAPI}/customer/device-identity`, device_identity_routes_1.default);
app.use(`${vAPI}/guest/order`, guestOrder_routes_1.default); // Guest checkout route
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK - Server is working fine' });
});
// Error handling
app.use(error_middleware_1.errorHandler);
app.use(not_found_middleware_1.notFoundHandler);
// Cron job to close drawers after 24 hours
node_cron_1.default.schedule('0 * * * *', async () => {
    const now = new Date();
    console.log("🕐 Cron job running at:", now.toISOString());
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    console.log("📅 Looking for drawers opened before:", cutoff.toISOString());
    const openDrawers = await client_1.prisma.cashFlow.findMany({
        where: {
            status: 'OPEN',
            opened_at: { lte: cutoff },
        },
        include: {
            branch: {
                select: { name: true }
            }
        }
    });
    console.log(`🔍 Found ${openDrawers.length} drawers to auto-close`);
    for (const drawer of openDrawers) {
        await client_1.prisma.cashFlow.update({
            where: { id: drawer.id },
            data: { status: 'CLOSED', closed_at: new Date() },
        });
        console.log(`✅ Auto-closed drawer ${drawer.id} for branch: ${drawer.branch?.name || 'Unknown'}`);
    }
    if (openDrawers.length === 0) {
        console.log("✅ No drawers needed auto-closing");
    }
});
// Start server
app.listen(app_1.config.port, () => {
    console.log(`Server running on port ${app_1.config.port}`);
});
process.on('SIGINT', async () => {
    await client_1.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map