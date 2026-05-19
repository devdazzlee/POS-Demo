"use client";

import { useState, useEffect, useCallback } from "react";
import { getPrinters } from "@/lib/print-server";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface PrinterInfo {
  name: string;
  isDefault?: boolean;
  status?: string;
  receiptProfile?: {
    roll?: string;
    printableWidthMM?: number;
    columns?: { fontA: number; fontB: number };
  };
  [key: string]: any; // extra fields the server may return
}

export interface PrinterSettings {
  receiptPrinter: string | null; // name of receipt printer
  barcodePrinter: string | null; // name of barcode printer
}

const STORAGE_KEY = "pos_printer_settings";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function loadSettings(): PrinterSettings {
  if (typeof window === "undefined") return { receiptPrinter: null, barcodePrinter: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PrinterSettings;
  } catch {}
  return { receiptPrinter: null, barcodePrinter: null };
}

function persistSettings(s: PrinterSettings) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function usePrinterSettings() {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PrinterSettings>(loadSettings);

  /* Fetch available printers from print-server / backend */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPrinters();
      if (result.success && result.data) {
        setPrinters(result.data as PrinterInfo[]);

        // Auto-select defaults if nothing saved yet
        setSettings((prev) => {
          const list = result.data as PrinterInfo[];
          const defaultP = list.find((p) => p.isDefault) || list[0];
          const updated = { ...prev };
          if (!prev.receiptPrinter && defaultP) updated.receiptPrinter = defaultP.name;
          if (!prev.barcodePrinter && defaultP) updated.barcodePrinter = defaultP.name;
          persistSettings(updated);
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to load printers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* Setters */
  const setReceiptPrinter = useCallback((name: string) => {
    setSettings((prev) => {
      const next = { ...prev, receiptPrinter: name };
      persistSettings(next);
      return next;
    });
  }, []);

  const setBarcodePrinter = useCallback((name: string) => {
    setSettings((prev) => {
      const next = { ...prev, barcodePrinter: name };
      persistSettings(next);
      return next;
    });
  }, []);

  /* Convenience getters that return full PrinterInfo objects */
  const getReceiptPrinterObj = useCallback((): PrinterInfo | null => {
    if (!settings.receiptPrinter) return null;
    return printers.find((p) => p.name === settings.receiptPrinter) ?? { name: settings.receiptPrinter };
  }, [printers, settings.receiptPrinter]);

  const getBarcodePrinterObj = useCallback((): PrinterInfo | null => {
    if (!settings.barcodePrinter) return null;
    return printers.find((p) => p.name === settings.barcodePrinter) ?? { name: settings.barcodePrinter };
  }, [printers, settings.barcodePrinter]);

  return {
    printers,
    loading,
    settings,
    receiptPrinter: settings.receiptPrinter,
    barcodePrinter: settings.barcodePrinter,
    setReceiptPrinter,
    setBarcodePrinter,
    getReceiptPrinterObj,
    getBarcodePrinterObj,
    refresh,
  };
}
