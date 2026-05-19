import { Request, Response } from "express";
import { printBarcodeLabels } from "../services/label-pdf.service";

export const printLabelsController = async (req: Request, res: Response) => {
  try {
    const { printerName, items, paperSize, copies, dpi, humanReadable } = req.body || {};
    
    if (!printerName || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ 
        success: false, 
        message: "printerName and items[] are required" 
      });
    }

    // Use PDF service for printing
    const result = await printBarcodeLabels({
      printerName,
      items,
      paperSize: paperSize ?? "3x2inch", // Default to 3x2 inch for GC420t
      copies: copies ?? 1,
      dpi: dpi ?? 203, // GC420t default DPI
      humanReadable: !!humanReadable,
    });

    // Log detailed result for debugging
    console.log('Print result:', JSON.stringify({
      success: result.success,
      paperSize,
      dpi,
      printerName,
    }));

    res.status(result.success ? 200 : 500).json(result);
  } catch (e: any) {
    console.error("Print labels error:", e);
    res.status(500).json({ 
      success: false, 
      message: e?.message || String(e) 
    });
  }
};

