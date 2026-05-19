"use client";

import { useState, useEffect, useRef, useMemo, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLoading } from "@/hooks/use-loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Trash2,
  CreditCard,
  DollarSign,
  Scan,
  Pencil,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { offlineAPIClient } from "@/lib/offline-api-client";
import { offlineDB } from "@/lib/offline-db";
import { syncManager } from "@/lib/offline-sync";
import { usePosData } from "@/hooks/use-pos-data";
import { printReceiptViaServer, type ReceiptData } from "@/lib/print-server";
import { usePrinterSettings } from "@/hooks/use-printer-settings";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHoldSales } from "@/hooks/use-hold-sales";
import { usePosBranch } from "@/hooks/use-pos-branch";

interface CartItem {
  id: string; // Unique cart item ID (product.id + timestamp for separate entries)
  productId?: string; // Original product ID for reference (optional for backward compatibility)
  name: string;
  price: number; // Display price (barcode price if scanned, otherwise original price)
  originalPrice: number; // Original product price (used for line total calculations)
  actualUnitPrice: number; // Actual unit price for calculations (always original product price)
  quantity: number;
  category: string;
  unitId?: string;
  unitName?: string;
  unit?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  categoryId: string;
  barcode?: string;
  code?: string; // Product code for barcode matching
  sku?: string; // SKU for barcode matching
  available_stock?: number;
  current_stock?: number;
  reserved_stock?: number;
  minimum_stock?: number;
  maximum_stock?: number;
  unitId?: string;
  unitName?: string;
}

// Printer type from global hook
type Printer = ReturnType<typeof usePrinterSettings>["printers"][number];


export function NewSale() {
  const [cart, setCart] = useState<CartItem[]>([]);
  // Track input values as strings to allow decimal point typing
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [quantityModes, setQuantityModes] = useState<Record<string, "preset" | "custom">>({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethodPending, setPaymentMethodPending] = useState<"Cash" | "Card" | null>(null);
  const [tenderedAmount, setTenderedAmount] = useState("");
  const [calculatedChange, setCalculatedChange] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [autoPrint, setAutoPrint] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pos_auto_print") !== "false";
    }
    return true;
  });
  const {
    adminMode,
    branchLoading,
    branches: availableBranches,
    selectedBranchId,
    setSelectedBranchId,
    branchInfo,
    hasBranch,
  } = usePosBranch();
  const { holdSales, holdSale, retrieveHoldSale, deleteHoldSale, holdSalesLoading, refreshHoldSales } =
    useHoldSales(selectedBranchId);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Refs for price and quantity inputs for keyboard navigation
  const priceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const quantityInputRefs = useRef<Record<string, HTMLElement | null>>({});
  const lastAddedProductId = useRef<string | null>(null);
  // Refs for cart items and scrollable container
  const cartItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cartScrollContainerRef = useRef<HTMLDivElement | null>(null);
  // Ref to track scan timeout for rapid scanning
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to prevent duplicate processing of the same scan
  const lastProcessedScanRef = useRef<string>('');
  const isProcessingScanRef = useRef<boolean>(false);
  const enterKeyPressedRef = useRef<boolean>(false);
  // Track when user is actively interacting with other inputs (prevent auto-refocus)
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteractingRef = useRef<boolean>(false);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(
    null
  );
  const { loading: paymentLoading, withLoading: withPaymentLoading } =
    useLoading();
  const [scanLoading, setScanLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  // Global printer settings (configured in Printer Settings page)
  const { receiptPrinter, getReceiptPrinterObj, printers } = usePrinterSettings();
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [isHoldingSale, setIsHoldingSale] = useState(false);
  const [isViewingHeldSales, setIsViewingHeldSales] = useState(false);
  const [deleteTargetHoldSale, setDeleteTargetHoldSale] = useState<number | null>(null);
  const [isDeletingHoldSale, setIsDeletingHoldSale] = useState(false);
  const [resumingHoldIndex, setResumingHoldIndex] = useState<number | null>(null);

  const [globalDiscountType, setGlobalDiscountType] = useState<"percentage" | "fixed">("fixed");
  const [globalDiscountValue, setGlobalDiscountValue] = useState<string>("");

  // Global store with custom hook
  const {
    products,
    categories,
    customers,
    productsLoading,
    categoriesLoading,
    customersLoading,
    isAnyLoading,
    fetchProducts,
    fetchCategories,
    fetchCustomers,
  } = usePosData();
  // Fetch initial data and focus search input
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!mounted) return;

      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchCustomers(),
        ]);
      } catch (error) {
        // Error loading data - no toast shown
      }
    };

    fetchData();

    // Focus the search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // Cleanup function to prevent memory leaks and state updates after unmount
    return () => {
      mounted = false;
      // Clear scan timeout on unmount
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
    };
  }, []); // Empty dependency array since we only want to fetch once on mount

  // Keep search input always focused (professional POS behavior)
  // Uses intelligent focus management: only refocuses when user is idle
  useEffect(() => {
    const IDLE_TIMEOUT = 2000; // 2 seconds of inactivity before refocusing search
    const INTERACTION_TIMEOUT = 500; // 500ms to detect if user is still interacting

    const markUserInteracting = () => {
      isUserInteractingRef.current = true;
      // Clear any pending refocus
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
        userInteractionTimeoutRef.current = null;
      }
      // Reset interaction flag after a short delay
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, INTERACTION_TIMEOUT);
    };

    const isInteractiveElement = (element: HTMLElement | null): boolean => {
      if (!element) return false;
      
      // Check data attributes for special inputs
      if (element.getAttribute('data-price-input') === 'true' ||
          element.getAttribute('data-quantity-input') === 'true' ||
          element.getAttribute('data-quantity-select') === 'true' ||
          element.getAttribute('data-amount-input') === 'true') {
        return true;
      }
      
      // Check element types
      const tagName = element.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return true;
      }
      
      // Check if it's inside a select dropdown (for Radix UI or custom selects)
      if (element.closest('[role="listbox"]') || 
          element.closest('[role="combobox"]') ||
          element.closest('[data-radix-select-content]') ||
          element.closest('select')) {
        return true;
      }
      
      // Check if it's a button (but allow clicking buttons)
      if (tagName === 'BUTTON' || element.closest('button')) {
        return true;
      }
      
      return false;
    };

    const scheduleRefocus = () => {
      // Clear any existing timeout
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
      
      // Only refocus if user is not actively interacting
      if (!isUserInteractingRef.current && searchInputRef.current && !paymentDialogOpen) {
        userInteractionTimeoutRef.current = setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement;
          
          // Don't refocus if user is still on an interactive element
          if (!isInteractiveElement(activeElement) && activeElement !== searchInputRef.current) {
            if (searchInputRef.current && !paymentDialogOpen) {
              searchInputRef.current.focus();
            }
          }
        }, IDLE_TIMEOUT);
      }
    };

    // Refocus on click anywhere (but respect interactive elements)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // If clicking on interactive element, mark as interacting
      if (isInteractiveElement(target)) {
        markUserInteracting();
        return;
      }
      
      // Schedule refocus after idle period
      scheduleRefocus();
    };

    // Refocus when window regains focus (tab switching back)
    const handleFocus = () => {
      scheduleRefocus();
    };

    // Global keyboard listener to capture barcode scans even when search is not focused
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if in payment dialog
      if (paymentDialogOpen) {
        return;
      }

      const activeElement = document.activeElement as HTMLElement;
      
      // If typing in any interactive input (price/quantity), allow it
      if (isInteractiveElement(activeElement)) {
        markUserInteracting();
        return;
      }
      
      // If typing anywhere else (or search is not focused), focus search and capture the key
      if (searchInputRef.current) {
        // If it's a printable character (not a control key)
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
          // If search is not focused, focus it and append the character
          if (activeElement !== searchInputRef.current) {
            e.preventDefault();
            e.stopPropagation();
            searchInputRef.current.focus();
            // Append the character to the input value
            const currentValue = searchInputRef.current.value || '';
            searchInputRef.current.value = currentValue + e.key;
            // Trigger onChange manually to update state
            const event = new Event('input', { bubbles: true });
            searchInputRef.current.dispatchEvent(event);
            // Also update state directly
            setSearchTerm(currentValue + e.key);
          }
        }
        // Handle Enter key - process the scan
        else if (e.key === 'Enter' && activeElement !== searchInputRef.current) {
          const currentValue = searchInputRef.current.value || '';
          if (currentValue.trim().length > 0) {
            e.preventDefault();
            e.stopPropagation();
            searchInputRef.current.focus();
            handleScannerInput(currentValue);
          }
        }
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleGlobalKeyDown);
    
    // Initial focus
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleGlobalKeyDown);
      // Clear timeout on unmount
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
    };
  }, [paymentDialogOpen]);

  // Client-side filtering for instant search results
  // This provides instant feedback without API calls
  const filteredProducts = products.filter((product) => {
    // Hide inactive products from the POS sale screen. The global product
    // list now returns inactive items too (so the admin Products tab can
    // manage them), but they must never be sellable from here.
    if (product.is_active === false) return false;

    // Filter by category
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;

    // Filter by search term (client-side)
    const matchesSearch = !searchTerm || (() => {
      const searchLower = searchTerm.toLowerCase().trim();
      if (searchLower.length === 0) return true;

      // Search in name, barcode, SKU
      const nameMatch = product.name?.toLowerCase().includes(searchLower);
      const barcodeMatch = product.barcode?.toLowerCase().includes(searchLower);
      const skuMatch = product.sku?.toLowerCase().includes(searchLower);

      return nameMatch || barcodeMatch || skuMatch;
    })();

    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product, quantity: number = 1, customPrice?: number) => {
    // For testing: Allow negative sales (stock can go below 0)
    // Comment out stock validation for testing purposes
    /*
    const availableStock = product.available_stock ?? product.stock
    const currentQuantity = cart.find((item) => item.id === product.id)?.quantity || 0
    if (currentQuantity >= availableStock) {
      toast({
        variant: "destructive",
        title: "Insufficient Stock",
        description: `Only ${availableStock} units available for ${product.name}`,
      })
      return
    }
    */

    // When custom price is provided, it represents the TOTAL PRICE from barcode
    // Calculate quantity: barcodePrice / originalPrice
    // Original price is the price of 1 unit
    // Barcode price is the total price
    const originalProductPrice = product.price;
    
    // Calculate quantity from scanned price if custom price is provided
    let finalQuantity = quantity;
    let displayPrice = originalProductPrice; // Price to display in price field
    let actualUnitPrice = originalProductPrice; // Actual unit price for line total calculations (always original)
    
    if (customPrice !== undefined && originalProductPrice > 0) {
      // Calculate quantity: barcodePrice / originalPrice
      finalQuantity = customPrice / originalProductPrice;
      finalQuantity = Math.max(0.01, finalQuantity); // Ensure minimum quantity
      
      // Show the scanned price (barcode value) in the price field for display
      displayPrice = customPrice; // Display barcode price in price field
      // But keep actualUnitPrice as original for calculations
      actualUnitPrice = originalProductPrice; // Always use original price for line total
    } else {
      // If no custom price, ensure minimum quantity of 1
      finalQuantity = Math.max(1, quantity);
    }
    
    console.log('addToCart - Barcode price:', customPrice, 'Original price:', originalProductPrice, 'Calculated quantity:', finalQuantity, 'Display price:', displayPrice, 'Actual unit price:', actualUnitPrice);

    // Always create a NEW separate line item for each scan (don't increment existing)
    // Generate unique ID for each scan to allow multiple separate entries
    const uniqueCartItemId = `${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use functional state update to avoid stale closure issues
    setCart((prevCart) => [
      ...prevCart,
      {
        id: uniqueCartItemId, // Unique ID for this cart entry (each scan = new entry)
        productId: product.id, // Store original product ID for reference
        name: product.name,
        price: displayPrice, // Display price (barcode price if scanned, otherwise original)
        originalPrice: originalProductPrice, // Store original product price
        actualUnitPrice: actualUnitPrice, // Actual unit price for line total calculations
        quantity: finalQuantity, // Calculated quantity (barcodePrice / originalPrice)
        category: product.category,
        unitId: product.unitId,
        unitName: product.unitName,
        unit: product.unitName,
      },
    ]);

    lastAddedProductId.current = uniqueCartItemId;
    
    // Use startTransition for non-urgent UI updates (scroll, focus) - doesn't block main thread
    startTransition(() => {
      // Instant scroll to newly added item (use unique cart item ID)
      setTimeout(() => {
        const cartItem = cartItemRefs.current[uniqueCartItemId];
        if (cartItem && cartScrollContainerRef.current) {
          cartItem.scrollIntoView({ 
            behavior: 'auto', // Instant scroll
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }, 0);

      // DISABLED: Auto-focus on price input - removed to prevent interference with scanning
      // Keep focus on search input for rapid scanning
      /*
      if (customPrice === undefined) {
        setTimeout(() => {
          const priceInput = priceInputRefs.current[uniqueCartItemId];
          if (priceInput) {
            priceInput.focus();
            priceInput.select();
          }
        }, 0);
      }
      */
    });

    // Toast removed as per user request - no toast when selecting products
  };

  // Helper function to format quantity with unit
  const formatQuantityWithUnit = (quantity: number, unitName?: string): string => {
    if (!unitName) return quantity.toFixed(2);
    
    const unitLower = unitName.toLowerCase();
    const qty = quantity;
    const formatSmart = (value: number, maxDecimals = 2) =>
      Number(value.toFixed(maxDecimals)).toString();
    
    // For weight units (kgs, kg, kilograms)
    if (unitLower.includes('kg') || unitLower.includes('kilogram')) {
      if (qty >= 1) {
        return `${formatSmart(qty)} kg`;
      } else {
        // Convert to grams for values less than 1kg
        const grams = qty * 1000;
        return `${grams.toFixed(0)} g`;
      }
    }
    
    // For gram units
    if (unitLower.includes('gram') || unitLower === 'g') {
      if (qty >= 1000) {
        const kg = qty / 1000;
        return `${formatSmart(kg)} kg`;
      } else {
        return `${qty.toFixed(0)} g`;
      }
    }
    
    // For piece units (pcs, pieces, piece)
    if (unitLower.includes('pc') || unitLower.includes('piece')) {
      return `${qty.toFixed(0)} pcs`;
    }
    
    // For other units, show with unit name
    return `${formatSmart(qty)} ${unitName}`;
  };

  const formatMoney = (value: number) => {
    const rounded = Number(value);
    if (Number.isInteger(rounded)) {
      return rounded.toLocaleString();
    }
    return rounded.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatQuantityValue = (value: number) => {
    if (Number.isInteger(value)) return String(value);
    return Number(value.toFixed(3)).toString();
  };

  const isWeightUnit = (unitName?: string): boolean => {
    if (!unitName) return false;
    const unitLower = unitName.toLowerCase();
    return (
      unitLower.includes("kg") ||
      unitLower.includes("kilogram") ||
      unitLower.includes("gram") ||
      unitLower === "g"
    );
  };

  const isPieceUnit = (unitName?: string): boolean => {
    if (!unitName) return false;
    const unitLower = unitName.toLowerCase();
    return unitLower.includes("pc") || unitLower.includes("piece");
  };

  const getQuantityPresetOptions = (unitName?: string) => {
    if (isWeightUnit(unitName)) {
      return [
        { value: "0.25", label: "250g", quantity: 0.25 },
        { value: "0.50", label: "500g", quantity: 0.5 },
        { value: "0.75", label: "750g", quantity: 0.75 },
        { value: "1.00", label: "1 KG", quantity: 1 },
        { value: "1.50", label: "1.5 KG", quantity: 1.5 },
        { value: "2.00", label: "2 KG", quantity: 2 },
      ];
    }

    if (isPieceUnit(unitName)) {
      return [
        { value: "1", label: "1", quantity: 1 },
        { value: "2", label: "2", quantity: 2 },
        { value: "3", label: "3", quantity: 3 },
        { value: "5", label: "5", quantity: 5 },
        { value: "10", label: "10", quantity: 10 },
      ];
    }

    return [
      { value: "0.50", label: "0.5", quantity: 0.5 },
      { value: "1.00", label: "1", quantity: 1 },
      { value: "2.00", label: "2", quantity: 2 },
    ];
  };

  const getPresetValueForQuantity = (quantity: number, unitName?: string): string => {
    const presets = getQuantityPresetOptions(unitName);
    const matched = presets.find((preset) => Math.abs(preset.quantity - quantity) < 0.0001);
    return matched?.value ?? "custom";
  };

  // Helper function to get quantity increment based on unit
  const getQuantityIncrement = (unitName?: string): number => {
    if (!unitName) return 1;
    const unitLower = unitName.toLowerCase();
    
    // For weight units (kgs, kg, kilograms, gram, grams, g)
    if (unitLower.includes('kg') || unitLower.includes('kilogram') || 
        unitLower.includes('gram') || unitLower === 'g') {
      // Increment by 0.1 (100 grams) for weight units
      return 0.1;
    }
    
    // For piece units (pcs, pieces, piece)
    if (unitLower.includes('pc') || unitLower.includes('piece')) {
      return 1;
    }
    
    // Default increment
    return 1;
  };

  const updateQuantity = (id: string, change: number) => {
    const item = cart.find((item) => item.id === id);
    // Find product by productId if item has it, otherwise fallback to id (for backward compatibility)
    const product = item && (item as any).productId 
      ? products.find((p) => p.id === (item as any).productId)
      : products.find((p) => p.id === id);

    // For testing: Allow negative sales (stock can go below 0)
    // Comment out stock validation for testing purposes
    /*
    if (item && product) {
      const newQuantity = item.quantity + change
      const availableStock = product.available_stock ?? product.stock

      if (newQuantity > availableStock) {
        toast({
          variant: "destructive",
          title: "Insufficient Stock",
          description: `Only ${availableStock} units available`,
        })
        return
      }
    }
    */

    // Get unit-aware increment
    const unitName = item?.unitName || item?.unit || product?.unitName;
    const currentQuantity = Number(item?.quantity || 0);
    const mode = quantityModes[id] ?? "preset";
    const minQuantity = isPieceUnit(unitName) ? 1 : 0.01;
    let targetQuantity = currentQuantity;

    // Keep weight preset flow simple for sellers:
    // 250g -> 500g, 1kg -> 2kg (and reverse on minus).
    if (mode === "preset" && isWeightUnit(unitName)) {
      const presets = getQuantityPresetOptions(unitName).map((preset) => preset.quantity);
      const presetMin = Math.min(...presets);
      const presetMax = Math.max(...presets);
      targetQuantity =
        change > 0
          ? Math.min(presetMax, Math.max(presetMin, currentQuantity * 2))
          : Math.max(presetMin, currentQuantity / 2);

      // Snap to nearest preset value to avoid float precision mismatches.
      targetQuantity = presets.reduce((best, candidate) =>
        Math.abs(candidate - targetQuantity) < Math.abs(best - targetQuantity) ? candidate : best,
      presets[0]);
    } else {
    const increment = getQuantityIncrement(unitName);
    const actualChange = change > 0 ? increment : -increment;
      targetQuantity = currentQuantity + actualChange;
    }

    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newQuantity = targetQuantity;
          const normalizedQuantity = isPieceUnit(unitName)
            ? Math.round(newQuantity)
            : newQuantity;
          return { ...item, quantity: Math.max(minQuantity, normalizedQuantity) };
        }
        return item;
      })
    );
  };

  const updateQuantityManual = (id: string, newQuantity: number, unitName?: string) => {
    const minQuantity = isPieceUnit(unitName) ? 1 : 0.01;
    const normalizedQuantity = isPieceUnit(unitName)
      ? Math.round(Number(newQuantity))
      : Number(newQuantity);
    const validQuantity = Math.max(minQuantity, normalizedQuantity);
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: validQuantity };
        }
        return item;
      })
    );
  };

  const parseCustomQuantityInput = (rawValue: string, unitName?: string): number | null => {
    const value = rawValue.trim().toLowerCase().replace(/\s+/g, "");
    if (!value) return null;

    if (isWeightUnit(unitName)) {
      const match = value.match(/^(\d*\.?\d+)(kg|kgs|g|gram|grams)?$/);
      if (!match) return null;
      const numericValue = parseFloat(match[1]);
      if (Number.isNaN(numericValue) || numericValue < 0) return null;
      const unitSuffix = match[2];

      if (unitSuffix === "g" || unitSuffix === "gram" || unitSuffix === "grams") {
        return numericValue / 1000;
      }

      if (unitSuffix === "kg" || unitSuffix === "kgs") {
        return numericValue;
      }

      // No suffix provided:
      // - Large integer-like values are usually grams in POS usage (e.g. 250 => 250g)
      // - Smaller values are treated as kg (e.g. 1 => 1kg, 0.5 => 0.5kg)
      if (numericValue >= 10) {
        return numericValue / 1000;
      }
      return numericValue;
    }

    const numericOnly = value.match(/^(\d*\.?\d+)$/);
    if (!numericOnly) return null;
    const parsed = parseFloat(numericOnly[1]);
    if (Number.isNaN(parsed) || parsed < 0) return null;
    return parsed;
  };

  const updateItemPrice = (id: string, newPrice: number) => {
    // Ensure price is valid (>= 0)
    const validPrice = Math.max(0, Number(newPrice));
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          return { ...item, price: validPrice };
        }
        return item;
      })
    );
  };

  const isPriceOverridden = (item: CartItem) => {
    const effectivePrice = Number(item.actualUnitPrice ?? item.price ?? 0);
    const basePrice = Number(item.originalPrice ?? 0);
    return Math.abs(effectivePrice - basePrice) > 0.0001;
  };

  // Runtime selling price for this sale only.
  // Do not fall back to originalPrice when building print/sale payloads.
  const getSellingPrice = (item: CartItem) => {
    const fromEdited = Number(item.actualUnitPrice);
    if (!Number.isNaN(fromEdited) && fromEdited >= 0) return fromEdited;

    const fromDisplay = Number(item.price);
    if (!Number.isNaN(fromDisplay) && fromDisplay >= 0) return fromDisplay;

    return 0;
  };

  const holdCurrentSale = async () => {
    if (cart.length === 0 || !hasBranch) {
      return;
    }

    setIsHoldingSale(true);
    const held = await holdSale(cart, selectedCustomer || undefined);
    if (held) {
      setCart([]);
      setGlobalDiscountValue("");
    }
    setIsHoldingSale(false);
  };

  const handleRetrieveHoldSale = async (index: number) => {
    if (cart.length > 0) {
      const shouldReplace = window.confirm(
        "Current cart will be replaced. Continue?"
      );
      if (!shouldReplace) return;
    }
    setResumingHoldIndex(index);
    const heldSale = await retrieveHoldSale(index);
    if (heldSale) {
      setCart(
        heldSale.map((item) => ({
          ...item,
          originalPrice: Number(item.originalPrice ?? item.price ?? 0),
          actualUnitPrice: Number(item.actualUnitPrice ?? item.price ?? 0),
        }))
      );
    }
    setResumingHoldIndex(null);
  };

  const handleViewHeldSales = async () => {
    if (showHeldSales) {
      setShowHeldSales(false);
      return;
    }

    setIsViewingHeldSales(true);
    await refreshHoldSales();
    setShowHeldSales(true);
    setIsViewingHeldSales(false);
    const element = document.getElementById('held-sales-list');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Printer loading is handled globally by usePrinterSettings hook

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    setQuantityInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setQuantityModes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    setQuantityInputs({});
    setQuantityModes({});
    setGlobalDiscountValue("");
  };

  const subtotal = cart.reduce((sum, item) => sum + getSellingPrice(item) * item.quantity, 0);

  const parsedDiscount = parseFloat(globalDiscountValue) || 0;
  const globalDiscountAmount = globalDiscountType === "percentage" 
    ? (subtotal * parsedDiscount) / 100 
    : parsedDiscount;

  const total = Math.max(0, subtotal - globalDiscountAmount);
  
  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  useEffect(() => {
    if (!paymentDialogOpen) {
      return;
    }

    const numericValue = parseFloat(tenderedAmount);
    if (Number.isNaN(numericValue)) {
      setCalculatedChange(0);
      return;
    }

    setCalculatedChange(Math.max(0, numericValue - total));
  }, [paymentDialogOpen, tenderedAmount, total]);

  const generateTransactionId = () => {
    return `TXN${Date.now().toString().slice(-6)}`;
  };

  const generateReceiptData = (
    transactionId: string,
    paymentMethod: string,
    cart: CartItem[],
    subtotal: number,
    total: number,
    amountPaid: number,
    changeAmount: number
  ) => {
    return {
      transactionId,
      timestamp: new Date().toISOString(),
      items: cart,
      subtotal,
      total,
      paymentMethod,
      cashier: "Muhammad",
      store: "ACE STUDIOS #001",
      amountPaid,
      changeAmount,
    };
  };


  const resetPaymentState = () => {
    setPaymentDialogOpen(false);
    setPaymentMethodPending(null);
    setTenderedAmount("");
    setCalculatedChange(0);
    setPaymentError("");
  };

  const handlePaymentDialogOpenChange = (open: boolean) => {
    if (open) {
      setPaymentDialogOpen(true);
      return;
    }
    resetPaymentState();
  };

  const startPayment = (method: "Cash" | "Card") => {
    if (!hasBranch) {
      return;
    }

    setPaymentMethodPending(method);
    setTenderedAmount(total.toFixed(2));
    setPaymentError("");
    setCalculatedChange(0);
    setPaymentDialogOpen(true);
  };

  const handleTenderedInputChange = (value: string) => {
    setTenderedAmount(value);
    if (paymentError) {
      setPaymentError("");
    }
  };

  const confirmPayment = async () => {
    if (!paymentMethodPending) {
      return;
    }

    const amountNumber = parseFloat(tenderedAmount);
    if (Number.isNaN(amountNumber)) {
      setPaymentError("Enter a valid amount received.");
      return;
    }

    if (amountNumber < total) {
      setPaymentError("Received amount cannot be less than the payable total.");
      return;
    }

    const change = Math.max(0, amountNumber - total);
    setPaymentError("");

    const success = await handlePayment(paymentMethodPending, amountNumber, change);
    if (success) {
      resetPaymentState();
    }
  };

  const handlePayment = async (
    method: "Cash" | "Card",
    amountPaid: number,
    changeAmount: number
  ) => {
    const cartSnapshot = cart.map((item) => ({ ...item }));

    return await withPaymentLoading(async () => {
      try {
        // Prepare items for API
        const saleItems = cartSnapshot.map((item) => {
          // Use productId if available, otherwise fallback to extracting from id
          // (for backward compatibility, though productId should always be set)
          const productId = item.productId || item.id.split('_')[0];
          if (!productId) {
            throw new Error(`Missing product ID for item: ${item.name}`);
          }
          const effectivePrice = getSellingPrice(item);
          return {
            productId,
            quantity: item.quantity,
            price: effectivePrice,
          };
        });

        const branchId = selectedBranchId;

        if (!branchId) {
          throw new Error("A branch must be selected before creating a sale.");
        }

        // Prepare payload
        const payload: any = {
          items: saleItems,
          paymentMethod: method === "Cash" ? "CASH" : "CARD",
          branchId,
          discountAmount: globalDiscountAmount,
        };
        if (selectedCustomer) {
          payload.customerId = selectedCustomer;
        }

        // Check if online
        const isOnline = syncManager.canMakeRequest();
        
        let saleData: any;
        let transactionId: string;
        
        if (isOnline) {
          // Online: Call create sale API
          try {
            const saleResponse = await apiClient.post("/sale", payload);
            saleData = saleResponse.data.data;
            transactionId = saleData.sale_number || generateTransactionId();
          } catch (error: any) {
            // If API call fails, fall back to offline mode
            console.warn("API call failed, saving offline:", error);
            transactionId = generateTransactionId();
            saleData = {
              sale_number: transactionId,
              id: `offline_${transactionId}`,
              _pending: true,
              _offline: true
            };
            
            // Save sale to IndexedDB for later sync
            await offlineDB.saveSale({
              id: transactionId,
              products: saleItems,
              total: total,
              customer: selectedCustomer ? { id: selectedCustomer } : null,
              payment: {
                method: method === "Cash" ? "CASH" : "CARD",
                amountPaid,
                changeAmount
              },
              employeeId: localStorage.getItem("userId") || undefined,
              branchId: branchId || undefined,
              timestamp: Date.now(),
              synced: false,
              discountAmount: globalDiscountAmount,
            });
            
            // Queue the API request for when online
            await offlineAPIClient.post("/sale", payload, {
              priority: 10 // High priority for sales
            });
          }
        } else {
          // Offline: Generate local sale ID and save to IndexedDB
          transactionId = generateTransactionId();
          saleData = {
            sale_number: transactionId,
            id: `offline_${transactionId}`,
            _pending: true,
            _offline: true
          };
          
          // Save sale to IndexedDB for later sync
          await offlineDB.saveSale({
            id: transactionId,
            products: saleItems,
            total: total,
            customer: selectedCustomer ? { id: selectedCustomer } : null,
            payment: {
              method: method === "Cash" ? "CASH" : "CARD",
              amountPaid,
              changeAmount
            },
            employeeId: localStorage.getItem("userId") || undefined,
            branchId: branchId || undefined,
            timestamp: Date.now(),
            synced: false,
            discountAmount: globalDiscountAmount,
          });
          
          // Also queue the API request for when online
          await offlineAPIClient.post("/sale", payload, {
            priority: 10 // High priority for sales
          });
          
          console.log("💾 Sale saved offline, will sync when connection restored");
        }
        const receiptData = generateReceiptData(
          transactionId,
          method,
          cartSnapshot,
          subtotal,
          total,
          amountPaid,
          changeAmount
        );

        // Save transaction to local storage (simulate database)
        const transactions = JSON.parse(
          localStorage.getItem("transactions") || "[]"
        );
        transactions.push(receiptData);
        localStorage.setItem("transactions", JSON.stringify(transactions));

        setLastTransactionId(transactionId);

        // Auto-print receipt
        if (autoPrint) {
          try {
            const receiptDataForServer: ReceiptData = {
              storeName: branchInfo.name,
              tagline: "Quality • Service • Value",
              address: branchInfo.address,
              transactionId: transactionId,
              timestamp: new Date(receiptData.timestamp).toISOString(),
              cashier: receiptData.cashier || "Walk-in",
              customerType: selectedCustomer
                ? customers.find((c) => c.id === selectedCustomer)?.name ||
                  "Walk-in"
                : "Walk-in",
              items: cartSnapshot.map((item) => {
                const unitLabel =
                  (item as any)?.unit?.name ||
                  (item as any)?.unitName ||
                  (item as any)?.unit_name ||
                  (item as any)?.unit ||
                  undefined;
                return {
                  name: item.name,
                  quantity: item.quantity,
                  price: getSellingPrice(item),
                  unit: unitLabel,
                };
              }),
              subtotal: subtotal,
              discount: globalDiscountAmount > 0 ? globalDiscountAmount : undefined,
              total: total,
              paymentMethod: method === "Cash" ? "CASH" : "CARD",
              amountPaid,
              changeAmount: changeAmount > 0 ? changeAmount : undefined,
              thankYouMessage: "Thank you for shopping!",
              footerMessage: "Visit us again soon!",
            };

            // Get printer from global settings (Printer Settings page)
            const printerToUse = getReceiptPrinterObj();
            if (!printerToUse) {
              throw new Error("No receipt printer configured. Go to Printer Settings to select one.");
            }

            const printerObj = {
              ...printerToUse,
              columns: printerToUse.receiptProfile?.columns || { fontA: 48, fontB: 64 },
            };

            const job = {
              copies: 1,
              cut: true,
              openDrawer: false,
            };

            // Print via print server
            // Use same API format as backend: printer, receiptData, job
            await printReceiptViaServer(
              printerObj,
              receiptDataForServer,
              job
            );
          } catch (printError) {
            console.error("Print error:", printError);
            // Print failed - no toast shown
          }
        }

        setTimeout(() => {
          setCart([]);
          setGlobalDiscountValue("");
        }, 300);

        return true;
      } catch (error) {
        console.error("Payment error:", error);
        // Payment failed - no toast shown
        return false;
      }
    });
  };

  // Create optimized lookup maps for O(1) product access
  // Build comprehensive barcode map indexing by barcode, code, and SKU
  // This ensures products can be found by any identifier
  const barcodeMap = useMemo(() => {
    const map = new Map<string, Product>();
    const exactMatches = new Map<string, Product>(); // Track exact matches separately
    
    products.forEach(product => {
      // Index by barcode (if exists)
      if (product.barcode) {
        const barcodeLower = product.barcode.toLowerCase().trim();
        if (barcodeLower) {
          exactMatches.set(barcodeLower, product);
          map.set(barcodeLower, product);
        }
      }
      
      // Index by code (if exists) - this is critical for CODE-PRICE format scanning
      if (product.code) {
        const codeLower = product.code.toLowerCase().trim();
        if (codeLower) {
          exactMatches.set(codeLower, product);
          map.set(codeLower, product);
        }
      }
      
      // Index by SKU (if exists)
      if (product.sku) {
        const skuLower = product.sku.toLowerCase().trim();
        if (skuLower) {
          exactMatches.set(skuLower, product);
          map.set(skuLower, product);
        }
      }
    });
    
    // Store exact matches map for priority lookup
    (map as any).exactMatches = exactMatches;
    
    return map;
  }, [products]);

  const findProductByBarcode = (barcode: string): Product | null => {
    if (!barcode) return null;
    
    const searchKey = barcode.toLowerCase().trim();
    if (!searchKey) return null;
    
    const exactMatches = (barcodeMap as any).exactMatches as Map<string, Product>;
    
    // CRITICAL: Try exact match FIRST - this prevents wrong product matches
    // Exact match has highest priority to avoid prefix matching issues
    if (exactMatches) {
      const exactMatch = exactMatches.get(searchKey);
      if (exactMatch) {
        console.log('Exact match found:', searchKey, '->', exactMatch.name);
        return exactMatch;
      }
    }
    
    // Try exact match from main map
    const exactMatch = barcodeMap.get(searchKey);
    if (exactMatch) {
      console.log('Exact match found (main map):', searchKey, '->', exactMatch.name);
      return exactMatch;
    }
    
    // Only if no exact match, try linear search for startsWith matches
    // This ensures we find the most specific match first
    let bestMatch: Product | null = null;
    let bestMatchLength = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Check barcode field
      if (product.barcode) {
        const barcodeLower = product.barcode.toLowerCase().trim();
        if (barcodeLower === searchKey) {
          // Exact match - return immediately
          return product;
        }
        if (barcodeLower.startsWith(searchKey) && barcodeLower.length > bestMatchLength) {
          bestMatch = product;
          bestMatchLength = barcodeLower.length;
        }
      }
      
      // Check code field
      if (product.code) {
        const codeLower = product.code.toLowerCase().trim();
        if (codeLower === searchKey) {
          // Exact match - return immediately
          return product;
        }
        if (codeLower.startsWith(searchKey) && codeLower.length > bestMatchLength) {
          bestMatch = product;
          bestMatchLength = codeLower.length;
        }
      }
      
      // Check SKU field
      if (product.sku) {
        const skuLower = product.sku.toLowerCase().trim();
        if (skuLower === searchKey) {
          // Exact match - return immediately
          return product;
        }
        if (skuLower.startsWith(searchKey) && skuLower.length > bestMatchLength) {
          bestMatch = product;
          bestMatchLength = skuLower.length;
        }
      }
    }
    
    if (bestMatch) {
      console.log('Best match found:', searchKey, '->', bestMatch.name);
      return bestMatch;
    }
    
    console.warn('No product found for barcode:', searchKey);
    return null;
  };

  const handleBarcodeScan = async () => {
    setScanLoading(true);
    try {
      // Simulate barcode scanning
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate finding a product by barcode
      const randomProduct =
        products[Math.floor(Math.random() * products.length)];
      await addToCart(randomProduct);
    } catch (error) {
      // Scan failed - no toast shown
    } finally {
      setScanLoading(false);
    }
  };

  const handleScannerInput = (scannedValue: string) => {
    // Prevent duplicate processing of the same scan
    const trimmedValue = scannedValue.trim();
    
    // Skip if already processing or if this is the same value we just processed
    if (isProcessingScanRef.current || lastProcessedScanRef.current === trimmedValue) {
      return;
    }
    
    // Mark as processing and store the value
    isProcessingScanRef.current = true;
    lastProcessedScanRef.current = trimmedValue;
    
    // Process immediately - zero delays, zero async operations
    
    // Ultra-fast parsing - single pass extraction
    const dashIndex = trimmedValue.indexOf('-');
    let productCode: string;
    let customPrice: number | undefined = undefined;
    
    if (dashIndex > 0) {
      // Extract code and price in one operation
      productCode = trimmedValue.substring(0, dashIndex).trim();
      const priceStr = trimmedValue.substring(dashIndex + 1).trim();
      // Parse price - handle both integer and decimal values
      // Remove any non-numeric characters except decimal point
      const cleanPriceStr = priceStr.replace(/[^\d.]/g, '');
      const parsedPrice = parseFloat(cleanPriceStr);
      if (!isNaN(parsedPrice) && parsedPrice >= 0 && isFinite(parsedPrice)) {
        customPrice = parsedPrice;
        console.log('Barcode scan - Code:', productCode, 'Raw price string:', priceStr, 'Parsed price:', customPrice);
      } else {
        console.error('Failed to parse price from:', priceStr, 'Cleaned:', cleanPriceStr, 'Parsed:', parsedPrice);
      }
    } else {
      productCode = trimmedValue.trim();
    }

    // Product lookup - use exact code first, then fallback to best match
    const codeLower = productCode.toLowerCase().trim();
    let product: Product | null = null;
    
    // CRITICAL: Try multiple matching strategies to find the correct product
    // 1. First try exact match on the full code (highest priority)
    product = findProductByBarcode(codeLower);
    console.log('Step 1 - Exact code match:', codeLower, 'Found:', product?.name || 'NOT FOUND');
    
    // 2. If not found and we have a price, try matching by price number in product name
    // This handles cases like "ROA432910-180" where "180" is in product name "Roasted Cashew Nuts (180)"
    if (!product && customPrice !== undefined) {
      const priceNumber = Math.round(customPrice).toString();
      // Look for products where name contains the price number in parentheses or as suffix
      const priceMatch = products.find(p => {
        const nameLower = p.name.toLowerCase();
        // Match patterns like "(180)", " 180", or ending with "180"
        return nameLower.includes(`(${priceNumber})`) || 
               nameLower.includes(` ${priceNumber} `) || 
               nameLower.endsWith(` ${priceNumber}`) ||
               nameLower.match(new RegExp(`[^0-9]${priceNumber}[^0-9]`));
      });
      if (priceMatch) {
        product = priceMatch;
        console.log('Step 2 - Price number match:', priceNumber, 'Found:', product.name);
      }
    }
    
    // 3. If not found and code contains numbers, try matching by extracting numeric part
    if (!product && /\d/.test(codeLower)) {
      const numericMatch = codeLower.match(/\d+/);
      if (numericMatch) {
        const numericPart = numericMatch[0];
        product = findProductByBarcode(numericPart);
        console.log('Step 3 - Numeric part match:', numericPart, 'Found:', product?.name || 'NOT FOUND');
      }
    }
    
    // 4. If still not found, try matching product name contains the code
    if (!product) {
      const codeInName = products.find(p => {
        const nameLower = p.name.toLowerCase();
        return nameLower.includes(`(${codeLower})`) || 
               nameLower.includes(` ${codeLower} `) || 
               nameLower.endsWith(` ${codeLower}`);
      });
      if (codeInName) {
        product = codeInName;
        console.log('Step 4 - Name pattern match:', codeLower, 'Found:', product.name);
      }
    }
    
    console.log('FINAL RESULT - Code:', codeLower, 'Price:', customPrice, 'Found Product:', product?.name || 'NOT FOUND', 'ID:', product?.id);
    
    if (!product) {
      console.error('Product not found for scanned code:', productCode, 'Price:', customPrice);
      // Reset processing flag to allow next scan
      isProcessingScanRef.current = false;
      lastProcessedScanRef.current = '';
      return; // Exit early - don't add to cart
    }
    // Add to cart immediately if found (synchronous, no delays)
    if (product) {
      console.log('✅ SUCCESS - Adding to cart:', {
        scannedCode: productCode,
        scannedPrice: customPrice,
        matchedProduct: product.name,
        productId: product.id,
        productCode: product.code,
        productSKU: product.sku,
        productBarcode: product.barcode,
        productPrice: product.price
      });
      addToCart(product, 1, customPrice);
    } else {
      console.error('Product not found for code:', productCode);
    }
    
    // Clear input instantly via direct DOM manipulation (fastest method)
    const input = searchInputRef.current;
    if (input) {
      input.value = '';
      // Reset interaction flag and refocus search input after processing scan
      isUserInteractingRef.current = false;
      setTimeout(() => {
        if (input && !paymentDialogOpen) {
          input.focus();
          input.select();
        }
      }, 10);
      // Use startTransition for non-urgent state update
      startTransition(() => {
        setSearchTerm("");
      });
    } else {
      setSearchTerm("");
    }
    
    // Brief loading indicator (50ms - just enough for visual feedback)
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Reset processing flag after a short delay to allow next scan
      setTimeout(() => {
        isProcessingScanRef.current = false;
        lastProcessedScanRef.current = '';
      }, 100);
    }, 50);
  };

  const handleProductClick = (product: Product) => {
    addToCart(product, 1);
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    // No need to set loading state as we're using cached data
  };

  // Global keyboard shortcuts - DISABLED during scanning to prevent interference
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable all shortcuts when scanning is active
      if (isScanning) {
        return;
      }
      
      // Don't handle shortcuts when typing in inputs or dialogs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // If it's the search input, allow normal typing
        if (target === searchInputRef.current) {
          return;
        }
        // For other inputs, only handle special shortcuts
        // 'C' for Cash, 'D' for Card when in payment dialog
        if (paymentDialogOpen) {
          if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            if (!paymentMethodPending) {
              startPayment("Cash");
            }
            return;
          }
          if (e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            if (!paymentMethodPending) {
              startPayment("Card");
            }
            return;
          }
        }
        return;
      }

      // Global shortcuts (when not in input)
      // Ctrl+Enter for Cash payment
      if (e.key === 'Enter' && e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (cart.length > 0 && total > 0 && !paymentDialogOpen) {
          startPayment("Cash");
        }
        return;
      }

      // Shift+Enter for Card payment
      if (e.key === 'Enter' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (cart.length > 0 && total > 0 && !paymentDialogOpen) {
          startPayment("Card");
        }
        return;
      }

      // 'C' for Cash payment
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (cart.length > 0 && total > 0 && !paymentDialogOpen) {
          startPayment("Cash");
        }
        return;
      }

      // 'D' for Card payment
      if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (cart.length > 0 && total > 0 && !paymentDialogOpen) {
          startPayment("Card");
        }
        return;
      }

      // Any alphabet key (a-z, A-Z) focuses search input - DISABLED to prevent interference with scanning
      // Commented out to prevent focus issues during scanning
      /*
      if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
      */
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cart, total, paymentDialogOpen, paymentMethodPending, startPayment, isScanning]);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Products Section */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">New Sales</h1>
              {lastTransactionId && (
                <p className="text-sm text-green-600">
                  Last transaction: {lastTransactionId}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  onClick={holdCurrentSale}
                  disabled={isHoldingSale || branchLoading || !hasBranch}
                >
                  {isHoldingSale ? "Saving..." : "Hold Sale"}
                </Button>
              )}
              {holdSales.length > 0 && (
                <div className="flex items-center">
                  <Badge
                    variant="secondary"
                    className="mr-2 bg-blue-100 text-blue-800"
                  >
                    {holdSales.length} held
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={handleViewHeldSales}
                    disabled={isViewingHeldSales || holdSalesLoading || branchLoading || !hasBranch}
                  >
                    {isViewingHeldSales || holdSalesLoading ? "Loading..." : "View Held Sales"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          {adminMode && (
            <div className="mb-4 max-w-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                POS Branch
              </label>
              <Select
                value={selectedBranchId || "none"}
                onValueChange={(value) => setSelectedBranchId(value === "none" ? "" : value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={branchLoading ? "Loading branches..." : "Select branch"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select branch</SelectItem>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!hasBranch && !branchLoading && (
                <p className="mt-2 text-sm text-amber-700">
                  Select a branch to use Hold Sale and complete sales.
                </p>
              )}
            </div>
          )}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isScanning ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
              {isScanning && (
                <LoadingSpinner size="sm" className="absolute right-3 top-1/2 transform -translate-y-1/2" />
              )}
              <Input
                ref={searchInputRef}
                placeholder={isScanning ? "Processing scan..." : "Scan barcode or search products..."}
                value={searchTerm}
                onBlur={(e) => {
                  // Don't blur if clicking on interactive elements
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (relatedTarget && (
                    relatedTarget.getAttribute('data-price-input') === 'true' ||
                    relatedTarget.getAttribute('data-quantity-input') === 'true' ||
                    relatedTarget.getAttribute('data-quantity-select') === 'true' ||
                    relatedTarget.getAttribute('data-amount-input') === 'true' ||
                    relatedTarget.tagName === 'SELECT' ||
                    relatedTarget.closest('select')
                  )) {
                    return;
                  }
                  // Schedule refocus after idle period (not immediate)
                  // This allows user to interact with other elements
                }}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  
                  // Clear any pending scan timeout
                  if (scanTimeoutRef.current) {
                    clearTimeout(scanTimeoutRef.current);
                    scanTimeoutRef.current = null;
                  }
                  
                  // Auto-detect barcode scan format (CODE-PRICE) even without Enter
                  // This handles scanners that send data quickly
                  // Only process if the price part looks complete (at least 3 digits to avoid premature processing)
                  if (value.includes('-') && value.length > 6) {
                    // Check if it looks like CODE-PRICE format
                    const parts = value.split('-');
                    if (parts.length >= 2) {
                      const codePart = parts[0].trim();
                      const pricePart = parts.slice(1).join('-').trim();
                      // If code part exists and price part is numeric with at least 3 digits, treat as barcode scan
                      // This prevents processing when user is still typing (e.g., "CODE-8" vs "CODE-8000")
                      if (codePart.length > 0 && /^\d{3,}(\.\d+)?$/.test(pricePart)) {
                        // Skip if Enter key was just pressed (onKeyDown will handle it)
                        if (enterKeyPressedRef.current) {
                          enterKeyPressedRef.current = false;
                          return;
                        }
                        // Small delay to ensure scanner finished sending all data
                        if (scanTimeoutRef.current) {
                          clearTimeout(scanTimeoutRef.current);
                        }
                        scanTimeoutRef.current = setTimeout(() => {
                          const currentValue = searchInputRef.current?.value || '';
                          if (currentValue === value && value.includes('-')) {
                            // Double-check we have a complete price value
                            const finalParts = currentValue.split('-');
                            if (finalParts.length >= 2 && finalParts[1].trim().length > 0) {
                              handleScannerInput(currentValue);
                            }
                          }
                          scanTimeoutRef.current = null;
                        }, 300); // Wait 300ms to ensure scanner finished sending all digits (8000, not just 8)
                      }
                    }
                  }
                }}
                onKeyDown={(e) => {
                  // Detect Enter key (barcode scanner typically sends Enter after data)
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    e.preventDefault();
                    const trimmedValue = searchTerm.trim();
                    
                    // Mark that Enter was pressed to prevent onChange from processing
                    enterKeyPressedRef.current = true;
                    
                    // Check if it's a barcode format (numeric barcode or CODE-PRICE format)
                    const isNumericBarcode = /^\d{8,}$/.test(trimmedValue) ||
                      /^\d{12,13}$/.test(trimmedValue) || // EAN-13, UPC-A
                      /^\d{8}$/.test(trimmedValue); // EAN-8
                    
                    // Check if it's CODE-PRICE format (contains dash)
                    const isCodePriceFormat = trimmedValue.includes('-') && trimmedValue.length > 3;
                    
                    if (isNumericBarcode || isCodePriceFormat) {
                      handleScannerInput(trimmedValue);
                    }
                    
                    // Reset flag after processing
                    setTimeout(() => {
                      enterKeyPressedRef.current = false;
                    }, 100);
                  }
                }}
                className={`pl-10 ${isScanning ? 'border-blue-500 bg-blue-50/50' : ''}`}
                autoFocus
              />
            </div>
          </div>
        </div>

          {/* Printer info - configured globally in Printer Settings */}
          {receiptPrinter && (
            <div className="mb-4 px-4 py-2.5 rounded-xl border border-blue-100 bg-blue-50/60 flex items-center gap-2 text-sm text-blue-800">
              <span className="font-medium">🖨️ {receiptPrinter}</span>
              <span className="text-blue-600 text-xs">(change in Printer Settings)</span>
            </div>
          )}

        {/* Categories */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => handleCategoryChange(category.id)}
              className="whitespace-nowrap"
              disabled={productsLoading}
            >
              {productsLoading && selectedCategory === category.id && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              {category.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 col-span-full">
            <span className="text-2xl mb-2">🛒</span>
            <p className="text-gray-500 text-lg">
              No products found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              // Find cart items by productId (for separate entries) or id (backward compatibility)
              const cartItems = cart.filter((item) => 
                (item as any).productId === product.id || item.id === product.id
              );
              const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="p-2 space-y-1">
                    <h3 className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-bold text-blue-600">
                        Rs {product.price.toLocaleString()}
                      </span>
                      {totalQuantity > 0 && (
                        <Badge className="bg-blue-600 text-[10px] px-1.5 py-0.5">
                          {formatQuantityValue(totalQuantity)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-[320px] bg-white lg:border-l border-gray-200 flex flex-col">
        <div className="border-b border-gray-200 bg-slate-50/60 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Sale Summary</h2>
              {cart.length === 0 && (
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Scan a product or search to start a new sale.
                </p>
              )}
            </div>
            <div className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm">
              {cart.length} item{cart.length === 1 ? "" : "s"}
            </div>
          </div>

          {cart.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="h-7 flex-1 min-w-[100px] border-dashed text-[11px]"
              >
                Clear Cart
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={holdCurrentSale}
                className="h-7 flex-1 min-w-[100px] text-[11px]"
                disabled={isHoldingSale || branchLoading || !hasBranch}
              >
                {isHoldingSale ? "Saving..." : "Hold Sale"}
              </Button>
            </div>
          )}

          {holdSales.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewHeldSales}
              className="mt-3 w-full justify-between border border-gray-200 bg-white hover:bg-white"
              disabled={isViewingHeldSales || holdSalesLoading || branchLoading || !hasBranch}
            >
              <span className="text-sm font-medium text-gray-700">
                {isViewingHeldSales || holdSalesLoading
                  ? "Loading held sales..."
                  : `Held Sales (${holdSales.length})`}
              </span>
              {showHeldSales ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}

          {showHeldSales && holdSalesLoading && (
            <div className="mt-2 rounded-lg border border-dashed border-blue-200 bg-white p-3 text-xs text-gray-500">
              Loading held sales...
            </div>
          )}

          {holdSales.length > 0 && showHeldSales && !holdSalesLoading && (
            <div id="held-sales-list" className="mt-2 rounded-lg border border-dashed border-blue-200 bg-white p-3">
              <div className="max-h-60 pr-2 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                  {holdSales.map((sale, index) => {
                    const saleTotal = sale.items.reduce(
                      (sum, item) => sum + getSellingPrice(item as CartItem) * item.quantity,
                      0
                    );
                    return (
                      <div key={sale.id} className="flex flex-col gap-2 rounded-md border border-gray-200 p-2.5 bg-gray-50/50 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-sm text-gray-800">Sale #{index + 1} - {sale.branchName}</span>
                            <span className="text-xs text-gray-500 mt-1">
                              {sale.items.length} items • Rs {saleTotal.toFixed(2)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 -mt-1 -mr-1 shrink-0"
                            disabled={isDeletingHoldSale}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetHoldSale(index);
                            }}
                          >
                            {isDeletingHoldSale && deleteTargetHoldSale === index ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetrieveHoldSale(index)}
                          className="w-full text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 border-blue-200 h-8 mt-1"
                          disabled={resumingHoldIndex === index}
                        >
                          {resumingHoldIndex === index ? "Resuming..." : "Resume Sale"}
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        </div>

        <div className="flex-1 overflow-hidden">
          <div ref={cartScrollContainerRef} className="h-full overflow-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="mt-8 text-center text-gray-500">
                <p className="font-medium text-gray-600">Your cart is empty</p>
                <p className="text-sm text-gray-500">Add products to see them here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => {
                  const unitName = item.unitName || item.unit;
                  const minQuantity = isPieceUnit(unitName) ? 1 : 0.01;
                  const effectiveUnitPrice = getSellingPrice(item);

                  return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      cartItemRefs.current[item.id] = el;
                    }}
                    className="rounded-md border border-gray-200 bg-white p-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-[11px] font-semibold text-gray-900 leading-snug flex items-center gap-1 flex-wrap">
                          <span className="truncate">{item.name}</span>
                          {isPriceOverridden(item) && (
                            <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 bg-amber-50">
                              <Pencil className="h-2.5 w-2.5 mr-0.5" />
                              Custom
                            </Badge>
                          )}
                        </h4>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="h-5 w-5 p-0 text-red-500 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="mt-1.5 rounded-md border border-gray-100 bg-slate-50 p-2 space-y-2">
                      {/* Price editor */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold tracking-wide text-gray-600">
                            Selling Price (Rs)
                          </label>
                          {isPriceOverridden(item) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1.5 text-[10px] text-amber-700 hover:text-amber-800"
                              onClick={() => {
                                setCart(
                                  cart.map((cartItem) =>
                                    cartItem.id === item.id
                                      ? {
                                          ...cartItem,
                                          actualUnitPrice: cartItem.originalPrice,
                                          price: cartItem.originalPrice,
                                        }
                                      : cartItem,
                                  ),
                                );
                              }}
                            >
                              Reset Default
                            </Button>
                          )}
                        </div>
                          <Input
                            ref={(el) => {
                              priceInputRefs.current[item.id] = el;
                              if (el) {
                              el.setAttribute("data-price-input", "true");
                              }
                            }}
                            type="text"
                            inputMode="decimal"
                          value={
                            priceInputs[item.id] !== undefined
                              ? priceInputs[item.id]
                              : item.actualUnitPrice === 0
                                ? ""
                                : String(item.actualUnitPrice || item.price)
                          }
                            onFocus={() => {
                              isUserInteractingRef.current = true;
                            }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "Tab") {
                              e.preventDefault();
                              const quantityInput = quantityInputRefs.current[item.id];
                              if (quantityInput) {
                                quantityInput.focus();
                                if (quantityInput instanceof HTMLInputElement) {
                                quantityInput.select();
                                }
                              }
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPriceInputs((prev) => ({ ...prev, [item.id]: value }));
                            
                            if (value === "") {
                              setCart(
                                cart.map((cartItem) =>
                                  cartItem.id === item.id
                                    ? { ...cartItem, actualUnitPrice: 0, price: 0 }
                                    : cartItem,
                                ),
                              );
                              return;
                            }
                            
                            if (/^(\d*\.?\d*)$/.test(value)) {
                              if (value === ".") return;
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) && numValue >= 0) {
                                setCart(
                                  cart.map((cartItem) =>
                                    cartItem.id === item.id
                                      ? { ...cartItem, actualUnitPrice: numValue, price: numValue }
                                      : cartItem,
                                  ),
                                );
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            setPriceInputs((prev) => {
                              const newState = { ...prev };
                              delete newState[item.id];
                              return newState;
                            });
                            
                            if (value === "" || value === "." || value === "0") {
                              setCart(
                                cart.map((cartItem) =>
                                  cartItem.id === item.id
                                    ? {
                                        ...cartItem,
                                        actualUnitPrice: cartItem.originalPrice,
                                        price: cartItem.originalPrice,
                                      }
                                    : cartItem,
                                ),
                              );
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) && numValue >= 0) {
                                setCart(
                                  cart.map((cartItem) =>
                                    cartItem.id === item.id
                                      ? { ...cartItem, actualUnitPrice: numValue, price: numValue }
                                      : cartItem,
                                  ),
                                );
                              } else {
                                setCart(
                                  cart.map((cartItem) =>
                                    cartItem.id === item.id
                                      ? {
                                          ...cartItem,
                                          actualUnitPrice: cartItem.originalPrice,
                                          price: cartItem.originalPrice,
                                        }
                                      : cartItem,
                                  ),
                                );
                              }
                            }
                            setTimeout(() => {
                              isUserInteractingRef.current = false;
                            }, 300);
                          }}
                          className={`mt-1 h-7 text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            isPriceOverridden(item) ? "border-amber-400 bg-amber-50" : ""
                          }`}
                        />
                      </div>

                      {/* Quantity + amount based auto-calc */}
                      <div className="grid grid-cols-2 gap-2">
                      <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            Quantity {unitName ? `(${unitName})` : ""}
                        </label>
                          <Input
                            ref={(el) => {
                              quantityInputRefs.current[item.id] = el;
                              if (el) {
                                el.setAttribute("data-quantity-input", "true");
                              }
                            }}
                            type="text"
                            inputMode={isWeightUnit(unitName) ? "text" : "decimal"}
                            placeholder={
                              isPieceUnit(unitName)
                                ? "Enter pieces"
                                : isWeightUnit(unitName)
                                  ? "e.g. 0.25 or 250g"
                                  : "Enter quantity"
                            }
                            value={
                              quantityInputs[item.id] !== undefined
                                ? quantityInputs[item.id]
                                : isPieceUnit(unitName)
                                  ? String(Math.max(1, Math.round(item.quantity)))
                                  : String(item.quantity)
                            }
                            onFocus={() => {
                              isUserInteractingRef.current = true;
                            }}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setQuantityInputs((prev) => ({ ...prev, [item.id]: raw }));
                              const trimmed = raw.trim();
                              if (trimmed === "") return;
                              const parsed = parseCustomQuantityInput(trimmed, unitName);
                              if (parsed === null || parsed <= 0) return;
                              updateQuantityManual(item.id, parsed, unitName);
                            }}
                            onBlur={() => {
                              const currentValue = quantityInputs[item.id];
                              const parsed = currentValue
                                ? parseCustomQuantityInput(currentValue, unitName)
                                : null;
                              if (!currentValue || parsed === null || parsed <= 0) {
                                setQuantityInputs((prev) => ({
                                  ...prev,
                                  [item.id]: isPieceUnit(unitName) ? "1" : "0.01",
                                }));
                                updateQuantityManual(item.id, minQuantity, unitName);
                              } else {
                                updateQuantityManual(item.id, parsed, unitName);
                              }
                              setTimeout(() => {
                                isUserInteractingRef.current = false;
                              }, 300);
                            }}
                            className="mt-1 h-7 text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                      </div>

                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            Total
                          </label>
                          <div className="mt-1 rounded-md border border-blue-100 bg-blue-50 px-2 h-7 flex items-center">
                            <span className="text-xs font-semibold text-blue-900 whitespace-nowrap">
                              Rs {formatMoney(effectiveUnitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_-20px_rgba(15,23,42,0.4)] backdrop-blur">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                <div className="rounded-lg border border-gray-200 bg-slate-50 p-2.5 text-xs">
                  <div className="flex items-center justify-between text-gray-600 text-xs font-medium">
                    <span>Subtotal</span>
                    <span className="text-sm font-semibold text-blue-700">{formatMoney(subtotal)}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-gray-600 text-xs font-medium">Discount</span>
                    <div className="flex items-center space-x-1.5 w-32">
                      <select 
                        value={globalDiscountType} 
                        onChange={(e) => setGlobalDiscountType(e.target.value as "percentage" | "fixed")} 
                        className="h-7 w-12 rounded border border-gray-300 bg-white px-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="fixed">Rs</option>
                        <option value="percentage">%</option>
                      </select>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="0"
                        value={globalDiscountValue} 
                        onChange={(e) => setGlobalDiscountValue(e.target.value)} 
                        className="h-7 w-full px-2 text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  
                  {globalDiscountAmount > 0 && (
                    <div className="mt-1 flex items-center justify-between text-green-600 text-xs font-medium">
                      <span>Discount Given</span>
                      <span>-{formatMoney(globalDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-blue-700 text-sm font-bold">
                    <span>Payable</span>
                    <span>{formatMoney(total)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  onClick={() => startPayment("Cash")}
                  disabled={paymentLoading || branchLoading || !hasBranch}
                  className="h-9 text-xs"
                >
                  <DollarSign className="mr-1.5 h-3.5 w-3.5" />
                  Cash
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startPayment("Card")}
                  disabled={paymentLoading || branchLoading || !hasBranch}
                  className="h-9 text-xs"
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Card
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={paymentDialogOpen}
        onOpenChange={handlePaymentDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentMethodPending ? `${paymentMethodPending} Payment` : "Payment"}
            </DialogTitle>
            <DialogDescription>
              Enter the amount received to calculate the change due.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Payable Amount</span>
                <span className="font-semibold text-gray-900">
                  Rs {formatMoney(total)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-green-600 font-semibold">
                <span>Change Due</span>
                <span>Rs {calculatedChange.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Amount Received
              </label>
              <Input
                type="number"
                autoFocus
                value={tenderedAmount}
                onChange={(e) => handleTenderedInputChange(e.target.value)}
                onKeyDown={(e) => {
                  // Enter: Confirm payment
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmPayment();
                  }
                  // Escape: Cancel payment
                  if (e.key === "Escape") {
                    e.preventDefault();
                    resetPaymentState();
                  }
                }}
                className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="auto-print"
                checked={autoPrint}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAutoPrint(val);
                  localStorage.setItem("pos_auto_print", String(val));
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="auto-print" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                Print Receipt automatically
              </label>
            </div>
            {paymentError && (
              <p className="text-sm text-red-600">{paymentError}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={resetPaymentState}
              disabled={paymentLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={paymentLoading || !paymentMethodPending}
            >
              {paymentLoading
                ? "Processing..."
                : `Confirm ${paymentMethodPending ?? "Payment"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTargetHoldSale !== null} onOpenChange={(open) => !open && !isDeletingHoldSale && setDeleteTargetHoldSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hold Sale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard this held sale permanently? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingHoldSale}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeletingHoldSale}
              onClick={async (e) => {
                e.preventDefault();
                if (deleteTargetHoldSale !== null) {
                  setIsDeletingHoldSale(true);
                  try {
                    await deleteHoldSale(deleteTargetHoldSale);
                  } finally {
                    setIsDeletingHoldSale(false);
                    setDeleteTargetHoldSale(null);
                  }
                }
              }}
            >
              {isDeletingHoldSale ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}