import { Request, Response } from 'express';
import { BarcodeService } from '../services/barcode.service';
import { ApiResponse } from '../utils/apiResponse';
import asyncHandler from '../middleware/asyncHandler';
import { BarcodeService as ZebraBarcodeService } from '../services/zebra-barcode.service';
import { printBarcodeLabels } from '../services/label-pdf.service';

const barcodeService = new BarcodeService();
const zebraService = new ZebraBarcodeService();

// Get available printers
const getPrinters = asyncHandler(async (req: Request, res: Response) => {
  const printers = await barcodeService.getAvailablePrinters();
  new ApiResponse(printers, 'Printers fetched successfully').send(res);
});

// Print receipt
const printReceipt = asyncHandler(async (req, res) => {
  console.log('Print receipt request body:', JSON.stringify(req.body, null, 2));

  const { printer, job, receiptData } = req.body || {};
  if (!printer?.name || !receiptData) {
    return res.status(400).json({ success: false, message: 'Missing printer.name or receiptData' });
  }

  const result = await barcodeService.printReceipt({
    printer,
    job: job ?? { copies: 1, cut: true, openDrawer: false },
    receiptData
  });

  new ApiResponse(result, 'Receipt sent to printer successfully').send(res);
});


// export async function printZebraLikeLabels(req: Request, res: Response) {
//   const { printerName, copies, paperSize, dpi, humanReadable, items } = req.body || {};
//   if (!printerName || !Array.isArray(items) || items.length === 0) {
//     return res.status(400).json({ success: false, message: 'printerName and non-empty items[] are required' });
//   }

//   const r = await printBarcodeLabels({
//     printerName,
//     copies,
//     paperSize,
//     dpi,
//     humanReadable,
//     items
//   });

//   if (r.success) res.json({ success: true, message: r.message || 'Printed' });
//   else res.status(500).json({ success: false, message: r.message || 'Print failed' });
// }



export { getPrinters, printReceipt  };
