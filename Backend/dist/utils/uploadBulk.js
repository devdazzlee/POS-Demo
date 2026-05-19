"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    // Accept only csv and excel files
    if (file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    }
    else {
        cb(new Error('Only CSV and Excel files are allowed!'), false);
    }
};
const uploadBulk = (0, multer_1.default)({ storage, fileFilter });
exports.default = uploadBulk;
//# sourceMappingURL=uploadBulk.js.map