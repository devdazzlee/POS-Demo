import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  getPrinters,
  printReceipt,
  // printZebraLikeLabels,
} from '../controllers/barcode.controller';
import asyncHandler from '../middleware/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { printReceiptPDF } from '../services/print-receipt-pdf.service';
import { printLabelsController } from '../controllers/labels.controller';



const router = express.Router();
// Get available printers 
router.get('/printers', getPrinters);

// Resolve logo path - handle both src and dist directories
const logoPath = fs.existsSync(path.join(__dirname, '../../src/assets/logo.png'))
  ? path.resolve(__dirname, '../../src/assets/logo.png')
  : path.resolve(__dirname, '../../assets/logo.png');

console.log('Logo path resolved to:', logoPath);
// Print receipt
router.post('/print-receipt', asyncHandler(async (req, res) => {
  const { printer, job, receiptData } = req.body || {};
  if (!printer?.name || !receiptData) {
    return res.status(400).json({ success: false, message: 'Missing printer.name or receiptData' });
  }
  const result = await printReceiptPDF({ printer, job, logoPath, receiptData });
  new ApiResponse(result, 'Receipt sent to printer successfully').send(res);
}));

// router.post('/print-zebra', printZebraLikeLabels);
router.post('/print-zebra', printLabelsController);




export default router;
