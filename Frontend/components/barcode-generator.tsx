"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Printer,
  Package,
  Search,
  Loader2,
  RefreshCw,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { PageLoader } from "./ui/page-loader";
import { usePosData } from "@/hooks/use-pos-data";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import apiClient from "@/lib/apiClient";
import { isKioskMode, silentPrint, enableKioskMode } from "@/utils/kiosk-printing";
import { usePrinterSettings } from "@/hooks/use-printer-settings";
import { encodeLabelBarcodeValue } from "@/lib/labelBarcode";

interface Product {
  id: string;
  code?: string;
  name: string;
  sku?: string;
  barcode?: string;
  sales_rate_exc_dis_and_tax?: number;
  unitName?: string;
  unitId?: string;
  category?: string;
  brandName?: string;
  weight?: string;
  mfgDate?: string;
  expDate?: string;
}

interface SelectedProductItem {
  id: string;
  product: Product;
  netWeight: string;
  packageDate: Date;
  expiryDuration: string;
  expiryDate?: Date;
  copies: number;
}

export default function BarcodeGenerator() {
  const [selectedProducts, setSelectedProducts] = useState<
    SelectedProductItem[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentProductId, setCurrentProductId] = useState("");
  const [globalExpiryDuration, setGlobalExpiryDuration] = useState("");
  // Global default net weight + a global copies value so a whole batch can be
  // configured in one click for bulk printing workflows.
  const [globalNetWeight, setGlobalNetWeight] = useState("");
  const [globalCopies, setGlobalCopies] = useState("1");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const productDropdownRef = useRef<HTMLDivElement | null>(null);
  // Global printer settings (configured in Printer Settings page)
  const { barcodePrinter, printers: globalPrinters } = usePrinterSettings();
  const [selectedPaperSize, setSelectedPaperSize] = useState("3x2inch");
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [kioskMode, setKioskMode] = useState(false);
  const [customNetWeightMode, setCustomNetWeightMode] = useState<Record<string, boolean>>({});

  // Detect kiosk mode on mount
  useEffect(() => {
    const kiosk = isKioskMode();
    setKioskMode(kiosk);
    if (kiosk) {
      enableKioskMode();
    }
  }, []);

  const expiryOptions = [
    { value: "3", label: "3 Months" },
    { value: "6", label: "6 Months" },
    { value: "12", label: "12 Months" },
    { value: "18", label: "18 Months" },
    { value: "24", label: "24 Months" },
    { value: "36", label: "36 Months" },
  ];

  const paperSizes = [
    { value: "50x30mm", label: "50mm x 30mm (Standard)" },
    { value: "60x40mm", label: "60mm x 40mm (Large)" },
    { value: "40x25mm", label: "40mm x 25mm (Small)" },
    { value: "3x2inch", label: "3\" x 2\" (Zebra/ZDesigner - 76mm x 51mm)" },
    { value: "76x51mm", label: "76mm x 51mm (3\" x 2\" Alternative)" },
  ];

  // Direct printing function
  const printDirectly = () => {
    window.print();
  };

  // Generate proper barcode using JsBarcode
  const generateBarcodeDataURL = (value: string): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 80;

    try {
      JsBarcode(canvas, value, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: false,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error generating barcode:", error);
      // Fallback: return empty data URL
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }
  };

  const calculateExpiryDate = (
    packageDate: Date,
    durationMonths: string
  ): Date | undefined => {
    if (!durationMonths) return undefined;
    const months = parseInt(durationMonths, 10);
    if (isNaN(months)) return undefined;
    const expiry = new Date(packageDate);
    expiry.setMonth(expiry.getMonth() + months);
    return expiry;
  };

  // Global store with custom hook
  const {
    products,
    productsLoading,
    isAnyLoading,
    refreshAllData,
    fetchProducts,
  } = usePosData();


  // Handle initial load and search
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (searchTerm.length >= 2) {
          await fetchProducts({ force: true, search: searchTerm });
        } else {
          await fetchProducts();
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "Could not fetch products from server",
        });
      }
    };

    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setProductDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Printer loading handled by global usePrinterSettings hook

  const parseWeightToGrams = (weightInput: any) => {
    if (!weightInput || weightInput.trim() === "") return 0;

    const input = weightInput.toLowerCase().trim();
    let weight = 0;

    const numberMatch = input.match(/(\d+\.?\d*)/);
    if (!numberMatch) return 0;

    const number = Number.parseFloat(numberMatch[1]);

    if (input.includes("kg")) {
      weight = number * 1000;
    } else if (input.includes("g") && !input.includes("kg")) {
      weight = number;
    } else if (input.includes("ml") || input.includes("l")) {
      if (input.includes("ml")) {
        weight = number;
      } else if (input.includes("l")) {
        weight = number * 1000;
      }
    } else {
      weight = number;
    }

    return weight;
  };

  const calculatePriceByWeight = (netWeightInput: any, basePrice: any) => {
    if (!netWeightInput || !basePrice) return basePrice || 0;

    const input = netWeightInput.toLowerCase().trim();
    const numberMatch = input.match(/(\d+\.?\d*)/);
    if (!numberMatch) return basePrice;

    const weightValue = Number.parseFloat(numberMatch[1]);
    if (weightValue <= 0) return basePrice;

    let multiplier = 1;

    if (input.includes("kg") || input.includes("kilo")) {
      multiplier = weightValue;
    } else if (
      input.includes("g") &&
      !input.includes("kg") &&
      !input.includes("mg")
    ) {
      multiplier = weightValue / 1000;
    } else if (input.includes("mg")) {
      multiplier = weightValue / 1000000;
    } else if (input.includes("lb") || input.includes("pound")) {
      multiplier = weightValue * 0.453592;
    } else if (input.includes("oz") && !input.includes("fl")) {
      multiplier = weightValue * 0.0283495;
    } else if (
      input.includes("l") &&
      !input.includes("ml") &&
      !input.includes("fl")
    ) {
      multiplier = weightValue;
    } else if (input.includes("ml") || input.includes("milliliter")) {
      multiplier = weightValue / 1000;
    } else if (input.includes("ser") || input.includes("seer")) {
      multiplier = weightValue * 0.933105;
    } else if (input.includes("maund")) {
      multiplier = weightValue * 37.3242;
    } else if (
      input.includes("pc") ||
      input.includes("piece") ||
      input.includes("pcs")
    ) {
      multiplier = weightValue;
    } else if (input.includes("dozen")) {
      multiplier = weightValue * 12;
    } else {
      multiplier = weightValue / 1000;
    }

    const finalPrice = basePrice * multiplier;
    return finalPrice.toFixed(2);
  };

  const formatWeightDisplay = (netWeightInput: any) => {
    if (!netWeightInput) return "Not specified";

    // CRITICAL: Preserve the exact input string to avoid any conversion errors
    // Only format if it's a valid weight string, otherwise return as-is
    const input = String(netWeightInput).toLowerCase().trim();
    
    // If input is already a formatted string like "200g", preserve it exactly
    if (input.match(/^\d+\.?\d*\s*(kg|g|mg|lb|oz|l|ml|ser|maund|pc|pcs|piece|dozen)$/i)) {
      // Extract number and unit, but preserve exact format
      const numberMatch = input.match(/(\d+\.?\d*)/);
      const unitMatch = input.match(/(kg|g|mg|lb|oz|l|ml|ser|maund|pc|pcs|piece|dozen)/i);
      
      if (numberMatch && unitMatch) {
        const number = Number.parseFloat(numberMatch[1]);
        const unit = unitMatch[1].toLowerCase();
        
        // Return formatted but preserve the exact number (no rounding)
        if (unit === "kg") return `${number}kg`;
        if (unit === "g") return `${number}g`;
        if (unit === "mg") return `${number}mg`;
        if (unit === "lb") return `${number}lb`;
        if (unit === "oz") return `${number}oz`;
        if (unit === "l") return `${number}L`;
        if (unit === "ml") return `${number}ml`;
        if (unit === "ser" || unit === "seer") return `${number} seer`;
        if (unit === "maund") return `${number} maund`;
        if (unit === "pc" || unit === "pcs" || unit === "piece") return `${number} pcs`;
        if (unit === "dozen") return `${number} dozen`;
      }
    }
    
    // If it's just a number, assume grams
    const numberMatch = input.match(/(\d+\.?\d*)/);
    if (numberMatch) {
      const number = Number.parseFloat(numberMatch[1]);
      return `${number}g`; // Default to grams
    }

    // Return original if can't parse
    return String(netWeightInput);
  };

  // Helper function to determine if unit is weight-based (kg, g, etc.) or piece-based (pc, pcs, etc.)
  const isWeightUnit = (unitName?: string): boolean => {
    if (!unitName) return true; // Default to weight if no unit specified
    const unit = unitName.toLowerCase().trim();
    return (
      unit.includes("kg") ||
      unit.includes("kilo") ||
      unit.includes("gram") ||
      unit.includes("g") ||
      unit.includes("mg") ||
      unit.includes("lb") ||
      unit.includes("pound") ||
      unit.includes("oz") ||
      unit.includes("ounce") ||
      unit.includes("l") ||
      unit.includes("liter") ||
      unit.includes("ml") ||
      unit.includes("milliliter") ||
      unit.includes("ser") ||
      unit.includes("seer") ||
      unit.includes("maund")
    );
  };

  // Generate dropdown options based on unit type
  const getNetWeightOptions = (unitName?: string): Array<{ value: string; label: string }> => {
    const isWeight = isWeightUnit(unitName);
    
    if (isWeight) {
      // Weight-based options (grams and kg)
      return [
        { value: "100g", label: "100g" },
        { value: "200g", label: "200g" },
        { value: "300g", label: "300g" },
        { value: "500g", label: "500g" },
        { value: "600g", label: "600g" },
        { value: "700g", label: "700g" },
        { value: "1000g", label: "1000g" },
        { value: "1kg", label: "1kg" },
        { value: "custom", label: "Custom" },
      ];
    } else {
      // Piece-based options - store with "pc" suffix for proper formatting
      return [
        { value: "1 pc", label: "1 pc" },
        { value: "2 pcs", label: "2 pcs" },
        { value: "3 pcs", label: "3 pcs" },
        { value: "4 pcs", label: "4 pcs" },
        { value: "5 pcs", label: "5 pcs" },
        { value: "6 pcs", label: "6 pcs" },
        { value: "10 pcs", label: "10 pcs" },
        { value: "12 pcs", label: "12 pcs" },
        { value: "custom", label: "Custom" },
      ];
    }
  };

  const filteredProducts = useMemo(() => {
    // Inactive products are kept out of the barcode generator — there's no
    // point printing barcodes for items that can't be sold.
    const activeProducts = products.filter((p) => p.is_active !== false);
    if (!searchTerm) return activeProducts;

    return activeProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku &&
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // If the product is already in the list, bump its copies count instead
    // of rejecting — matches the scan-to-add behaviour and supports the bulk
    // workflow where you re-pick the same item to print extra labels.
    const existing = selectedProducts.find((sp) => sp.product.id === productId);
    if (existing) {
      const nextCopies = (existing.copies || 1) + 1;
      setSelectedProducts((prev) =>
        prev.map((sp) =>
          sp.product.id === productId ? { ...sp, copies: nextCopies } : sp,
        ),
      );
      sonnerToast.success(`${product.name}`, {
        description: `Copies set to ${nextCopies}`,
        position: "top-right",
        duration: 300,
      });
      setCurrentProductId("");
      setSearchTerm("");
      setProductDropdownOpen(false);
      if (productSearchInputRef.current) productSearchInputRef.current.focus();
      return;
    }

    const newItem: SelectedProductItem = {
      id: Date.now().toString(),
      product,
      netWeight: globalNetWeight || "",
      packageDate: new Date(),
      expiryDuration: "",
      copies: Math.max(1, parseInt(globalCopies, 10) || 1),
    };

    if (globalExpiryDuration) {
      newItem.expiryDuration = globalExpiryDuration;
      newItem.expiryDate = calculateExpiryDate(
        newItem.packageDate,
        globalExpiryDuration
      );
    }

    setSelectedProducts((prev) => [...prev, newItem]);
    sonnerToast.success(`Added ${product.name}`, {
      description: `SKU ${product.sku || product.code || ""}`.trim(),
      position: "top-right",
      duration: 300,
    });
    setCurrentProductId("");
    setSearchTerm("");
    setProductDropdownOpen(false);
    if (productSearchInputRef.current) {
      // Re-focus so the next scan/search lands here without an extra click.
      productSearchInputRef.current.focus();
    }
  };

  // Scan-to-add: if the user presses Enter and the search matches exactly one
  // product (by SKU, code, or full name), add it immediately. If a product is
  // already selected, bump its copies count instead of duplicating the row.
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const term = searchTerm.trim();
    if (!term) return;
    const lower = term.toLowerCase();
    const exact =
      products.find((p) => (p.sku || "").toLowerCase() === lower) ||
      products.find((p) => (p.code || "").toLowerCase() === lower) ||
      products.find((p) => p.name.toLowerCase() === lower);
    const match = exact || (filteredProducts.length === 1 ? filteredProducts[0] : null);
    if (!match) return;
    e.preventDefault();
    const already = selectedProducts.find((sp) => sp.product.id === match.id);
    if (already) {
      setSelectedProducts((prev) =>
        prev.map((sp) =>
          sp.product.id === match.id ? { ...sp, copies: sp.copies + 1 } : sp,
        ),
      );
      setSearchTerm("");
      setProductDropdownOpen(false);
      return;
    }
    handleProductSelect(match.id);
  };

  const addProduct = () => {
    if (!currentProductId) return;
    handleProductSelect(currentProductId);
  };

  const removeProduct = (itemId: string) => {
    setSelectedProducts((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateProductData = (
    itemId: string,
    field: keyof SelectedProductItem,
    value: any
  ) => {
    setSelectedProducts((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === "expiryDuration") {
            updatedItem.expiryDate = calculateExpiryDate(
              updatedItem.packageDate,
              value
            );
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Apply globally-configured values (expiry duration, net weight, copies)
  // to every selected product. Each value is only applied when it's set, so
  // the user can choose which fields to bulk-update.
  const applyGlobalDates = () => {
    if (!globalExpiryDuration && !globalNetWeight && !globalCopies) return;
    const copiesNum = Math.max(1, parseInt(globalCopies, 10) || 1);
    setSelectedProducts((prev) => {
      const updated = prev.map((item) => {
        const next = { ...item };
        if (globalExpiryDuration) {
          next.expiryDuration = globalExpiryDuration;
          next.expiryDate = calculateExpiryDate(item.packageDate, globalExpiryDuration);
        }
        if (globalNetWeight) {
          next.netWeight = globalNetWeight;
        }
        if (globalCopies) {
          next.copies = copiesNum;
        }
        return next;
      });
      toast({
        title: "Applied to all products",
        description: `${updated.length} product${updated.length === 1 ? "" : "s"} updated.`,
      });
      return updated;
    });
  };

  const clearAll = () => {
    setSelectedProducts([]);
    toast({
      title: "Cleared",
      description: "All products have been removed from the list.",
    });
  };

  // Printer loading is handled globally by usePrinterSettings hook

  // Printer detection is now handled globally in Printer Settings page


  const handlePrintAll = async () => {
    if (selectedProducts.length === 0) return;

    const invalidProducts = selectedProducts.filter(
      (item) => !item.netWeight.trim() || !item.packageDate || !item.expiryDate
    );

    if (invalidProducts.length > 0) {
      toast({
        variant: "destructive",
        title: "Incomplete data",
        description: `${invalidProducts.length} products are missing required information.`,
      });
      return;
    }

    setIsPrinting(true);
    
    try {
      // Generate PDF in frontend and open browser print dialog (like boxhero.io)
      await generatePDFAndPrint();
      toast({
        title: "Print Dialog Opened",
        description: "Select your printer from the print dialog",
      });
    } catch (error: any) {
      console.error('Printing error:', error);
      toast({
        variant: "destructive",
        title: "Print Error",
        description: error.message || "Failed to generate PDF. Please install jspdf: npm install jspdf",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Generate PDF in frontend and open for browser print (like boxhero.io)
  const generatePDFAndPrint = async () => {
    // Dynamic import of jsPDF (install: npm install jspdf)
    const { jsPDF } = await import('jspdf');
    
    // Paper size: 58mm x 40mm (landscape/horizontal) - same as boxhero.io
    const labelWidth = 58; // mm
    const labelHeight = 40; // mm
    
    // Convert mm to points (1mm = 2.83464567 points)
    const mmToPt = (mm: number) => mm * 2.83464567;
    const widthPt = mmToPt(labelWidth);
    const heightPt = mmToPt(labelHeight);
    
    // Margins (1.5mm on all sides like boxhero.io)
    const margin = 1.5;
    const marginPt = mmToPt(margin);
    const contentWidth = widthPt - (marginPt * 2);
    const contentHeight = heightPt - (marginPt * 2);
    
    // Create PDF document (landscape: width > height)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [widthPt, heightPt]
    });
    
    // Set default text color to pure black for darker text
    doc.setTextColor(0, 0, 0);
    
    // Font sizes - larger and darker for better visibility
    const titleFontSize = 10; // pt - larger for better visibility
    const labelFontSize = 8; // pt - bold labels (NET WT, PKG, EXP) - larger
    const valueFontSize = 8; // pt - bold values - larger
    const priceFontSize = 9; // pt - price in bold - larger
    
    // Expand each product into N labels based on its copies count, so a
    // single click prints continuous strips from the thermal printer.
    const labelsToRender: SelectedProductItem[] = selectedProducts.flatMap((sp) => {
      const n = Math.max(1, sp.copies || 1);
      return Array.from({ length: n }, () => sp);
    });

    // Process each label
    for (let labelIdx = 0; labelIdx < labelsToRender.length; labelIdx++) {
      const sp = labelsToRender[labelIdx];
      // Add new page for each label after the first
      if (labelIdx > 0) {
        doc.addPage([widthPt, heightPt], 'landscape');
      }
      
      // Start lower from top - use more of the label space
      let y = marginPt + mmToPt(3); // Start 3mm from top margin (pushed down)
      const leftMargin = marginPt;
      
      // Title (Product Name) - centered, bold, larger, dark
      const title = (sp.product.name || '').toUpperCase().trim();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(titleFontSize);
      doc.setTextColor(0, 0, 0); // Pure black for darker text
      
      // Calculate text width and wrap if needed (max 2 lines)
      const titleLines = doc.splitTextToSize(title, contentWidth * 0.95);
      const titleHeight = Math.min(titleLines.length, 2) * titleFontSize * 1.4;
      
      // Center the title
      titleLines.slice(0, 2).forEach((line: string, index: number) => {
        const lineWidth = doc.getTextWidth(line);
        const lineX = leftMargin + (contentWidth - lineWidth) / 2;
        doc.text(line, lineX, y + titleFontSize + (index * titleFontSize * 1.4));
      });
      
      y += titleHeight + mmToPt(0.8); // More spacing
      
      // Meta row (Weight & Price) - ALL BOLD AND DARK
      const netWeightValue = sp.netWeight ? formatWeightDisplay(sp.netWeight) : '';
      const price = Math.round(Number(calculatePriceByWeight(sp.netWeight, sp.product.sales_rate_exc_dis_and_tax)));
      const priceText = `RS ${price}`;
      
      if (netWeightValue) {
        // NET WT - ALL BOLD
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(labelFontSize);
        doc.setTextColor(0, 0, 0); // Pure black
        doc.text('NET WT:', leftMargin, y + labelFontSize);
        
        // Weight value - ALSO BOLD
        const labelWidth = doc.getTextWidth('NET WT: ');
        doc.setFont('helvetica', 'bold'); // Changed to bold
        doc.setFontSize(valueFontSize);
        doc.setTextColor(0, 0, 0);
        doc.text(netWeightValue, leftMargin + labelWidth, y + labelFontSize);
        
        // Price on the right side in bold
        if (priceText) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(priceFontSize);
          doc.setTextColor(0, 0, 0);
          const priceWidth = doc.getTextWidth(priceText);
          doc.text(priceText, leftMargin + contentWidth - priceWidth, y + priceFontSize);
        }
        
        y += labelFontSize * 1.5 + mmToPt(0.5); // More spacing
      }
      
      // Dates row (PKG & EXP) - ALL BOLD AND DARK
      const pkgDate = formatDate(sp.packageDate);
      const expDate = formatDate(sp.expiryDate);
      
      // PKG label and value - ALL BOLD
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(labelFontSize);
      doc.setTextColor(0, 0, 0);
      doc.text('PKG:', leftMargin, y + labelFontSize);
      const pkgLabelWidth = doc.getTextWidth('PKG: ');
      doc.setFont('helvetica', 'bold'); // Changed to bold
      doc.setFontSize(valueFontSize);
      doc.setTextColor(0, 0, 0);
      doc.text(pkgDate, leftMargin + pkgLabelWidth, y + labelFontSize);
      
      // EXP label and value - ALL BOLD (right side)
      const expLabel = 'EXP:';
      const expFullText = `${expLabel} ${expDate}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(labelFontSize);
      doc.setTextColor(0, 0, 0);
      const expLabelWidth = doc.getTextWidth(expLabel);
      const expFullWidth = doc.getTextWidth(expFullText);
      const expX = leftMargin + contentWidth - expFullWidth;
      doc.text(expLabel, expX, y + labelFontSize);
      doc.setFont('helvetica', 'bold'); // Changed to bold
      doc.setFontSize(valueFontSize);
      doc.setTextColor(0, 0, 0);
      doc.text(expDate, expX + expLabelWidth, y + labelFontSize);
      
      y += labelFontSize * 1.5 + mmToPt(0.3); // Less spacing - barcode will be positioned at bottom
      
      // Barcode: 9-digit numeric SKU only; legacy products use SANITIZED-PRICE until SKU is migrated
      const barcodeValue = encodeLabelBarcodeValue(
        sp.product.sku,
        sp.product.code,
        price
      );
      
      try {
        // Generate barcode - LARGER width and height, VERY DARK, with LARGER number
        const canvas = document.createElement('canvas');
        
        // Much higher resolution for better quality and darker rendering
        const barcodeHeightPx = 120; // Increased from 100 for larger barcode
        canvas.height = barcodeHeightPx;
        canvas.width = 600; // Wider canvas for better quality
        
        // Set canvas context for VERY DARK rendering
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000'; // Pure black
          ctx.strokeStyle = '#000000'; // Pure black
          ctx.lineWidth = 2; // Thicker lines for darker appearance
        }
        
        // Generate barcode with VERY DARK bars - NO number in image (we'll add large text separately)
        JsBarcode(canvas, barcodeValue, {
          format: "CODE128",
          width: 4.5, // MUCH wider bars for VERY DARK appearance
          height: barcodeHeightPx,
          displayValue: false, // NO number in barcode image - we'll add large text separately below
          margin: 10, // Quiet zones for better scanning
          background: "#FFFFFF",
          lineColor: "#000000" // Pure black - VERY DARK
        });
        
        // Ensure barcode is rendered VERY DARK
        if (ctx) {
          ctx.globalCompositeOperation = 'source-over';
          // Enhance contrast for darker appearance
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            // Make black pixels even darker (ensure pure black)
            if (data[i] < 128) { // If it's dark
              data[i] = 0;     // R
              data[i + 1] = 0; // G
              data[i + 2] = 0; // B
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
        
        const barcodeDataURL = canvas.toDataURL('image/png', 1.0);

        // Position the barcode *below the dates row* — the old code anchored
        // it from the bottom of the label, which caused it to overlap the
        // PKG/EXP text when the title wrapped or fonts grew.
        const barcodeTopGap = mmToPt(1.5); // gap between dates row and barcode
        const barcodeStartY = y + barcodeTopGap;

        // Reserve room for the barcode number text below the bars.
        const textFontSize = 9;
        const textTopGap = mmToPt(1.5);
        const reservedTextSpace = textFontSize + textTopGap + mmToPt(0.5);

        // Vertical room actually available between the dates row and the
        // bottom margin, minus the text below the barcode.
        const availableHeight =
          heightPt - marginPt - barcodeStartY - reservedTextSpace;

        // Cap width at 90% of content width.
        const targetBarcodeWidthPt = contentWidth * 0.9;

        const barcodeAspectRatio = canvas.width / canvas.height;

        // Start from the width target and derive height; if that overflows the
        // available vertical space, shrink to fit instead.
        let finalBarcodeWidthPt = targetBarcodeWidthPt;
        let finalBarcodeHeightPt = finalBarcodeWidthPt / barcodeAspectRatio;
        if (finalBarcodeHeightPt > availableHeight) {
          finalBarcodeHeightPt = Math.max(availableHeight, mmToPt(6));
          finalBarcodeWidthPt = finalBarcodeHeightPt * barcodeAspectRatio;
          if (finalBarcodeWidthPt > targetBarcodeWidthPt) {
            finalBarcodeWidthPt = targetBarcodeWidthPt;
            finalBarcodeHeightPt = finalBarcodeWidthPt / barcodeAspectRatio;
          }
        }

        const barcodeX = leftMargin + (contentWidth - finalBarcodeWidthPt) / 2;
        const barcodeY = barcodeStartY;

        doc.addImage(
          barcodeDataURL,
          'PNG',
          barcodeX,
          barcodeY,
          finalBarcodeWidthPt,
          finalBarcodeHeightPt,
        );

        // Barcode number — centered under the bars, clear gap, doesn't run
        // past the bottom margin.
        const barcodeTextY = barcodeY + finalBarcodeHeightPt + textTopGap + textFontSize;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(textFontSize);
        doc.setTextColor(0, 0, 0);
        const barcodeTextWidth = doc.getTextWidth(barcodeValue);
        const barcodeTextX = leftMargin + (contentWidth - barcodeTextWidth) / 2;
        doc.text(barcodeValue, barcodeTextX, barcodeTextY);
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
    
    // Generate PDF blob and open in new window for printing
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Open PDF in new window and trigger print
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    } else {
      throw new Error('Could not open print window. Please allow pop-ups.');
    }
    
    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10000);
  };

  // Browser-based printing - optimized for kiosk mode
  const printWithBrowser = async () => {
    // In kiosk mode: Create minimal print window that closes automatically
    if (kioskMode) {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Barcode Labels</title>
          <style>
            @media print {
              @page {
                size: ${selectedPaperSize === '3x2inch' ? '3in 2in' : selectedPaperSize === '50x30mm' ? '50mm 30mm' : selectedPaperSize === '60x40mm' ? '60mm 40mm' : '76mm 51mm'};
                margin: 0;
              }
              body { margin: 0; padding: 0; }
              .label { 
                page-break-inside: avoid;
                page-break-after: always;
                padding: 5mm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10mm;
            }
            .label {
              border: 1px dashed #ddd;
              padding: 5mm;
              margin-bottom: 10mm;
              text-align: center;
            }
            .title {
              font-weight: bold;
              font-size: 13pt;
              margin-bottom: 2mm;
              text-transform: uppercase;
            }
            .meta {
              font-size: 9pt;
              margin-bottom: 2mm;
            }
            .barcode-container {
              margin: 5mm 0;
            }
            .barcode {
              max-width: 100%;
              height: auto;
            }
            .dates {
              font-size: 9pt;
              border-top: 1px solid #ccc;
              padding-top: 2mm;
              margin-top: 5mm;
            }
          </style>
        </head>
        <body>
          ${selectedProducts.map((sp) => {
            const price = Math.round(Number(calculatePriceByWeight(sp.netWeight, sp.product.sales_rate_exc_dis_and_tax)));
            const barcodeValue = encodeLabelBarcodeValue(sp.product.sku, sp.product.code, price);
            const barcodeDataURL = generateBarcodeDataURL(barcodeValue);
            
            return `
              <div class="label">
                <div class="title">${sp.product.name}</div>
                <div class="meta">NET WT: ${formatWeightDisplay(sp.netWeight)} | RS ${price}</div>
                <div class="barcode-container">
                  <img src="${barcodeDataURL}" alt="Barcode" class="barcode" />
                </div>
                <div class="dates">PKG: ${formatDate(sp.packageDate)} | EXP: ${formatDate(sp.expiryDate)}</div>
              </div>
            `;
          }).join('')}
        </body>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // In kiosk mode, close automatically after print
              setTimeout(() => window.close(), 500);
            }, 100);
          };
        </script>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setIsPrinting(false);
      return;
    }

    // Normal mode: Standard print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcode Labels</title>
        <style>
          @media print {
            @page {
              size: ${selectedPaperSize === '3x2inch' ? '3in 2in' : selectedPaperSize === '50x30mm' ? '50mm 30mm' : selectedPaperSize === '60x40mm' ? '60mm 40mm' : '76mm 51mm'};
              margin: 0;
            }
            body { margin: 0; padding: 0; }
            .label { 
              page-break-inside: avoid;
              page-break-after: always;
              padding: 5mm;
            }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10mm;
          }
          .label {
            border: 1px dashed #ddd;
            padding: 5mm;
            margin-bottom: 10mm;
            text-align: center;
          }
          .title {
            font-weight: bold;
            font-size: 13pt;
            margin-bottom: 2mm;
            text-transform: uppercase;
          }
          .meta {
            font-size: 9pt;
            margin-bottom: 2mm;
          }
          .barcode-container {
            margin: 5mm 0;
          }
          .barcode {
            max-width: 100%;
            height: auto;
          }
          .dates {
            font-size: 9pt;
            border-top: 1px solid #ccc;
            padding-top: 2mm;
            margin-top: 5mm;
          }
        </style>
      </head>
      <body>
        ${selectedProducts.map((sp) => {
          const price = Math.round(Number(calculatePriceByWeight(sp.netWeight, sp.product.sales_rate_exc_dis_and_tax)));
          const barcodeValue = encodeLabelBarcodeValue(sp.product.sku, sp.product.code, price);
          const barcodeDataURL = generateBarcodeDataURL(barcodeValue);
          
          return `
            <div class="label">
              <div class="title">${sp.product.name}</div>
              <div class="meta">NET WT: ${formatWeightDisplay(sp.netWeight)} | RS ${price}</div>
              <div class="barcode-container">
                <img src="${barcodeDataURL}" alt="Barcode" class="barcode" />
              </div>
              <div class="dates">PKG: ${formatDate(sp.packageDate)} | EXP: ${formatDate(sp.expiryDate)}</div>
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      
      setTimeout(() => {
        printWindow.close();
        setIsPrinting(false);
        toast({
          title: "Print Dialog Opened",
          description: barcodePrinter ? `Printer: ${barcodePrinter}` : "Select your printer from the dialog",
        });
      }, 100);
    }, 250);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "__/__/____";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isFormValid =
    selectedProducts.length > 0 &&
    selectedProducts.every(
      (item) =>
        item.netWeight.trim() &&
        item.packageDate &&
        item.expiryDate &&
        item.copies > 0,
    );

  // Total label count across all selected products — what the printer will
  // actually emit. Drives the print button label so the user knows how many
  // labels a batch will produce before they click.
  const totalLabels = selectedProducts.reduce(
    (sum, item) => sum + Math.max(1, item.copies || 1),
    0,
  );

  if (productsLoading && products.length === 0) {
    return <PageLoader message="Loading Barcode Generator..." />;
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Product Selection and Form */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Multi-Product Barcode Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">


            {/* Product Search Dropdown - Combined Search and Select */}
            <div className="space-y-2 border-t pt-4" ref={productDropdownRef}>
              <Label htmlFor="product-search">
                Add Product ({filteredProducts.length} available)
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  ref={productSearchInputRef}
                  id="product-search"
                  placeholder="Scan or search by name, SKU, code (Enter to add)"
                  value={searchTerm}
                  onFocus={() => setProductDropdownOpen(true)}
                  autoComplete="off"
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setProductDropdownOpen(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9"
                />
                {productDropdownOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {productsLoading ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Loading products...
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {searchTerm ? "No matching products found" : "No products available"}
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50 ${
                            currentProductId === product.id
                              ? "bg-blue-50 font-semibold text-blue-900"
                              : "text-gray-800"
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleProductSelect(product.id)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-xs text-gray-500">
                              SKU: {product.sku || "N/A"} | Rs{" "}
                              {product.sales_rate_exc_dis_and_tax || 0}
                              {product.unitName && ` | Unit: ${product.unitName}`}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Barcode Printer - configured globally in Printer Settings */}
            <div className="space-y-2 border-t pt-4">
              <Label>Barcode Printer</Label>
              {barcodePrinter ? (
                <div className="px-3 py-2 rounded-lg border border-purple-100 bg-purple-50/60 flex items-center gap-2 text-sm text-purple-800">
                  🖨️ <span className="font-medium">{barcodePrinter}</span>
                  <span className="text-purple-600 text-xs">(change in Printer Settings)</span>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-lg border border-amber-100 bg-amber-50 text-sm text-amber-800">
                  No barcode printer configured. Go to <strong>Printer Settings</strong> to set one.
                </div>
              )}
            </div>

            {/* Global Defaults — applied to every product in one click. */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Apply to All</Label>
                <span className="text-xs text-gray-500">For bulk batches</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="global-net-weight" className="text-xs text-gray-600">
                    Net Weight
                  </Label>
                  <Input
                    id="global-net-weight"
                    value={globalNetWeight}
                    onChange={(e) => setGlobalNetWeight(e.target.value)}
                    placeholder="e.g. 500g"
                  />
                </div>
                <div>
                  <Label htmlFor="global-copies" className="text-xs text-gray-600">
                    Copies / product
                  </Label>
                  <Input
                    id="global-copies"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={globalCopies}
                    onChange={(e) => setGlobalCopies(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Expiry</Label>
                <Select
                  onValueChange={setGlobalExpiryDuration}
                  value={globalExpiryDuration}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose expiry duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {expiryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={applyGlobalDates}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={
                  selectedProducts.length === 0 ||
                  (!globalExpiryDuration && !globalNetWeight && !globalCopies)
                }
              >
                Apply to All Products
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 border-t pt-4">
              <Button
                onClick={handlePrintAll}
                className="w-full"
                disabled={!isFormValid || isPrinting}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                {isPrinting
                  ? "Printing..."
                  : `Print ${totalLabels} Label${totalLabels === 1 ? "" : "s"}`}
              </Button>
              <Button
                onClick={clearAll}
                variant="outline"
                className="w-full"
                disabled={selectedProducts.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Selected Products List */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Selected Products ({selectedProducts.length})</span>
              {totalLabels > 0 && (
                <span className="text-sm font-normal text-gray-600 bg-gray-100 rounded-full px-3 py-1">
                  {totalLabels} label{totalLabels === 1 ? "" : "s"} total
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No products selected yet.</p>
                <p className="text-sm">Add products from the dropdown above.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-screen overflow-y-auto pr-1">
                {selectedProducts.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{item.product.name}</h3>
                        <p className="text-xs text-gray-600">
                          SKU: {item.product.sku} · Price: Rs {item.product.sales_rate_exc_dis_and_tax}
                        </p>
                      </div>
                      <Button
                        onClick={() => removeProduct(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor={`weight-${item.id}`}>
                          Net Weight *
                        </Label>
                        {(() => {
                          const options = getNetWeightOptions(item.product.unitName);
                          const optionValues = options.map((opt) => opt.value);
                          const isCustomValue =
                            item.netWeight &&
                            !optionValues.includes(item.netWeight);
                          const showCustomInput =
                            customNetWeightMode[item.id] || isCustomValue;

                          return showCustomInput ? (
                            <div className="space-y-2">
                              <Input
                                id={`weight-${item.id}`}
                                value={item.netWeight}
                                onChange={(e) =>
                                  updateProductData(
                                    item.id,
                                    "netWeight",
                                    e.target.value
                                  )
                                }
                                placeholder={
                                  isWeightUnit(item.product.unitName)
                                    ? "e.g., 500g, 1kg"
                                    : "e.g., 1, 2, 3"
                                }
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCustomNetWeightMode((prev) => ({
                                    ...prev,
                                    [item.id]: false,
                                  }));
                                  // Reset to empty or first option if value doesn't match
                                  if (isCustomValue) {
                                    updateProductData(
                                      item.id,
                                      "netWeight",
                                      ""
                                    );
                                  }
                                }}
                                className="w-full"
                              >
                                Use Dropdown
                              </Button>
                            </div>
                          ) : (
                            <Select
                              value={item.netWeight || ""}
                              onValueChange={(value) => {
                                if (value === "custom") {
                                  setCustomNetWeightMode((prev) => ({
                                    ...prev,
                                    [item.id]: true,
                                  }));
                                  updateProductData(item.id, "netWeight", "");
                                } else {
                                  updateProductData(item.id, "netWeight", value);
                                }
                              }}
                            >
                              <SelectTrigger id={`weight-${item.id}`}>
                                <SelectValue placeholder="Select net weight" />
                              </SelectTrigger>
                              <SelectContent>
                                {options.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        })()}
                      </div>
                      <div>
                        <Label>Package Date</Label>
                        <Input
                          value={formatDate(item.packageDate)}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>
                      <div>
                        <Label>Expiry Duration *</Label>
                        <Select
                          onValueChange={(value) =>
                            updateProductData(item.id, "expiryDuration", value)
                          }
                          value={item.expiryDuration}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Set expiry" />
                          </SelectTrigger>
                          <SelectContent>
                            {expiryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`copies-${item.id}`}>Copies</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() =>
                              updateProductData(
                                item.id,
                                "copies",
                                Math.max(1, (item.copies || 1) - 1),
                              )
                            }
                            disabled={(item.copies || 1) <= 1}
                          >
                            -
                          </Button>
                          <Input
                            id={`copies-${item.id}`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={item.copies}
                            onChange={(e) => {
                              const n = parseInt(e.target.value, 10);
                              updateProductData(
                                item.id,
                                "copies",
                                Number.isFinite(n) && n > 0 ? n : 1,
                              );
                            }}
                            className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() =>
                              updateProductData(
                                item.id,
                                "copies",
                                (item.copies || 1) + 1,
                              )
                            }
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Compact preview — keeps the visual confirmation
                        without dominating the card height. */}
                    <div className="bg-gray-50 px-3 py-2 rounded border flex items-center gap-3">
                      <img
                        src={generateBarcodeDataURL(
                          encodeLabelBarcodeValue(
                            item.product.sku,
                            item.product.code,
                            Math.round(
                              Number(
                                calculatePriceByWeight(
                                  item.netWeight,
                                  item.product.sales_rate_exc_dis_and_tax,
                                ),
                              ),
                            ),
                          ),
                        )}
                        alt="Barcode Preview"
                        className="h-8 object-contain bg-white p-1 rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-xs text-gray-700 space-y-0.5">
                        <div className="flex justify-between gap-2">
                          <span className="truncate">
                            Net: {formatWeightDisplay(item.netWeight)}
                          </span>
                          <span className="font-semibold">
                            Rs{" "}
                            {Math.round(
                              Number(
                                calculatePriceByWeight(
                                  item.netWeight,
                                  item.product.sales_rate_exc_dis_and_tax,
                                ),
                              ),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 text-gray-500">
                          <span>PKG {formatDate(item.packageDate)}</span>
                          <span>EXP {formatDate(item.expiryDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
