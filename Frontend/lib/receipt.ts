// Shared receipt rendering — used by sales-history and returns screens so a
// receipt looks identical across the app (HTML preview + WhatsApp PDF +
// browser print).

import { type ReceiptData } from "@/lib/print-server";

export type { ReceiptData };

// Loose Sale shape — both Sale (sales-history) and ReturnItem (returns)
// satisfy this. Anything optional is `?` so callers don't have to fill in
// fields they don't have.
export interface ReceiptSourceSale {
  id?: string;
  sale_number?: string | null;
  sale_date?: string | null;
  created_at?: string | null;
  subtotal?: string | number | null;
  total_amount?: string | number | null;
  discount_amount?: string | number | null;
  tax_amount?: string | number | null;
  payment_method?: string | null;
  notes?: string | null;
  customer?: { name?: string | null; email?: string | null } | null;
  branch?: { name?: string | null; address?: string | null } | null;
  sale_items?: Array<{
    product?: { name?: string | null; sku?: string | null } & Record<string, any>;
    quantity?: number | null;
    unit_price?: string | number | null;
    line_total?: string | number | null;
    item_type?: string | null;
  }> | null;
}

export interface BranchInfoFallback {
  name: string;
  address: string;
}

export const buildReceiptBranchLine = (
  storeName?: string,
  _address?: string,
): string => {
  const name = typeof storeName === "string" ? storeName.trim() : "";
  if (!name || ["ADMIN", "ACE STUDIOS"].includes(name.toUpperCase())) {
    return "Karachi, Pakistan";
  }
  return `${name}, Karachi, Pakistan`;
};

const num = (v: any): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
};

export const prepareReceiptDataFromSale = (
  sale: ReceiptSourceSale,
  branch: BranchInfoFallback,
  opts?: { transactionLabel?: string; itemFilter?: (item: NonNullable<ReceiptSourceSale["sale_items"]>[number]) => boolean },
): ReceiptData => {
  const allItems = sale.sale_items || [];
  const items = (opts?.itemFilter ? allItems.filter(opts.itemFilter) : allItems).map((item) => {
    const lineTotal = num(item.line_total);
    const qty = Math.abs(num(item.quantity) || 1);
    const unitPrice =
      item.unit_price != null ? Math.abs(num(item.unit_price)) : Math.abs(lineTotal) / Math.max(1, qty);
    const unitLabel =
      (item.product as any)?.unit?.name ||
      (item.product as any)?.unit_name ||
      (item as any)?.unit?.name ||
      (item as any)?.unit_name ||
      (item as any)?.unitName ||
      undefined;
    return {
      name: item.product?.name || "Unnamed Item",
      quantity: qty,
      price: unitPrice,
      unit: unitLabel,
    };
  });

  const subtotalFromApi = num(sale.subtotal);
  const subtotal =
    subtotalFromApi > 0
      ? subtotalFromApi
      : items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const discount = num(sale.discount_amount);
  const taxAmount = num(sale.tax_amount);
  const total = Math.abs(num(sale.total_amount));
  const taxable = Math.max(0, subtotal - discount);
  const taxPercent = taxable > 0 && taxAmount > 0 ? (taxAmount / taxable) * 100 : undefined;

  const storeName = sale.branch?.name || branch.name || "ACE STUDIOS";
  const storeAddress = sale.branch?.address || branch.address || "";

  return {
    storeName,
    tagline: "Quality • Service • Value",
    address: storeAddress,
    transactionId: opts?.transactionLabel || sale.sale_number || sale.id || "",
    timestamp: sale.created_at || sale.sale_date || new Date().toISOString(),
    cashier: "Walk-in",
    customerType: sale.customer?.name || sale.customer?.email || "Walk-in",
    items,
    subtotal,
    discount: discount > 0 ? discount : undefined,
    taxPercent,
    total,
    paymentMethod: sale.payment_method || "CASH",
    amountPaid: total,
    changeAmount: 0,
    promo: sale.notes || undefined,
    thankYouMessage: "Thank you for shopping!",
    footerMessage: "Visit us again soon!",
  };
};

const money = (n: number) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const generateReceiptHtml = (data: ReceiptData, logoDataUri = ""): string => {
  const subtotal = Number(data.subtotal || 0);
  const discount = Number(data.discount || 0);
  const taxPercent = data.taxPercent || 0;
  const tax = taxPercent > 0 ? (subtotal - discount) * (taxPercent / 100) : 0;
  const total = data.total ?? Math.max(0, subtotal - discount + tax);
  const paid = data.amountPaid ?? total;
  const change = data.changeAmount ?? 0;
  const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

  const itemsHtml = (data.items || [])
    .map((item) => {
      const name = String(item.name || "");
      const qty = (item.quantity ?? 0).toString() + (item.unit ? ` ${item.unit}` : "");
      const rate = money(Number(item.price || 0) * Number(item.quantity || 0));
      return `<div class="item-row">
  <div class="item-name">${name}</div>
  <div class="item-qty">${qty}</div>
  <div class="item-rate">${rate}</div>
</div>`;
    })
    .join("");

  const promoHtml = data.promo ? `<div class="promo">Promo: ${data.promo}</div>` : "";
  const branchLine = buildReceiptBranchLine(data.storeName, data.address);
  const footerLines = [
    "Branch: 021 34892110",
    "Delivery Hotline WhatsApp: +92 342 3344040",
    "Website: acestudios.com",
  ];
  const footerHtml = footerLines.map((line) => `<div class="footer-line">${line}</div>`).join("");
  const aceHtml = `
<div class="divider-thin"></div>
<div class="powered-by">Powered by Ace Studios</div>
<div class="ace-line">+92 336 2500357</div>`;
  const logoSrc = logoDataUri || (typeof window !== "undefined" ? `${window.location.origin}/logo.png` : "/logo.png");

  return `
<div class="receipt">
<div class="logo">
<img src="${logoSrc}" alt="Logo" class="logo-img" />
</div>
<div class="store-name">${branchLine}</div>
<div class="tagline">${data.tagline || "Quality - Service - Value"}</div>
${data.strn ? `<div class="strn">${data.strn}</div>` : ""}

<div class="divider"></div>

<div class="row-lr"><span class="label">Receipt #</span><span class="value">${data.transactionId}</span></div>
<div class="row-lr"><span class="label">Date</span><span class="value">${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}</span></div>
<div class="row-lr"><span class="label">Cashier</span><span class="value">${data.cashier || "Walk-in"}</span></div>
<div class="row-lr"><span class="label">Customer</span><span class="value">${data.customerType || "Walk-in"}</span></div>

<div class="divider"></div>

<div class="items-header">
  <div class="item-col">ITEM</div>
  <div class="qty-col">QTY</div>
  <div class="rate-col">RATE</div>
</div>
<div class="items-divider"></div>

<div class="items-list">
${itemsHtml}
</div>

<div class="divider"></div>

<div class="row-lr"><span class="label">Subtotal</span><span class="value">PKR ${money(subtotal)}</span></div>
${
  discount > 0
    ? `<div class="row-lr"><span class="label">Discount</span><span class="value">- PKR ${money(discount)}</span></div>`
    : ""
}
<div class="row-lr total-row"><span class="label">Grand Total</span><span class="value">PKR ${money(total)}</span></div>

<div class="divider"></div>

<div class="row-lr"><span class="label">Payment</span><span class="value">${(data.paymentMethod || "CASH").toUpperCase()}</span></div>
${
  paid !== undefined && paid !== null
    ? `<div class="row-lr"><span class="label">Paid</span><span class="value">PKR ${money(paid)}</span></div>`
    : ""
}
${
  change > 0
    ? `<div class="row-lr"><span class="label">Change</span><span class="value">PKR ${money(change)}</span></div>`
    : ""
}

${promoHtml}

<div class="divider"></div>

<div class="barcode-section">
  <svg id="barcode-svg"></svg>
  <div class="barcode-number" id="barcode-number">${data.transactionId}</div>
</div>

<div class="thank-you">${data.thankYouMessage || "Thank you for shopping!"}</div>
${footerHtml}
${aceHtml}
</div>
`;
};

export const receiptPageWrapper = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; background: white;
  height: 100%; min-height: 100%;
  overflow-x: hidden; overflow-y: auto;
  font-family: 'Helvetica', 'Arial', sans-serif;
  width: 100%; max-width: 100%;
}
body { display: block; width: 100%; box-sizing: border-box; padding: 0; }
.receipt {
  width: 100%; max-width: 100%;
  background: #ffffff; color: #000000;
  padding: 20px 16px 24px 16px;
  margin: 0; overflow: hidden;
  word-wrap: break-word; overflow-wrap: break-word;
  font-weight: bold; box-sizing: border-box; display: block;
}
.logo { text-align: center; margin-bottom: 5mm; }
.logo-img {
  max-width: 42mm; max-height: 22mm;
  width: auto; height: auto;
  display: block; margin: 0 auto;
  object-fit: contain;
}
.store-name {
  font-weight: bold; font-size: 11pt; text-align: center;
  margin-top: 1mm; margin-bottom: 2mm; color: #000000; line-height: 1.2;
}
.tagline {
  font-size: 9.4pt; text-align: center;
  margin-bottom: 2mm; color: #000000; font-weight: bold; line-height: 1.2;
}
.divider { border-top: 1px dotted #000; margin: 3mm 0; height: 0; width: 100%; }
.divider-thin { border-top: 0.5px dotted #000; margin: 3mm 0; height: 0; width: 100%; }
.row-lr {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; margin: 2mm 0;
  font-size: 9.4pt; line-height: 1.3; word-break: break-word;
}
.row-lr .label { flex: 0 0 45%; text-align: left; font-weight: bold; color: #000000; }
.row-lr .value { flex: 1; text-align: right; font-weight: bold; color: #000000; word-break: break-all; }
.total-row { font-size: 11.2pt; margin-top: 2mm; font-weight: bold; }
.items-header {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; font-weight: bold; font-size: 11.2pt;
  margin-bottom: 1mm; color: #000000;
}
.items-divider { border-top: 1px solid #000; margin: 2mm 0 0 0; height: 0; width: 100%; }
.items-list { padding-top: 5mm; }
.items-list .item-row:first-child { margin-top: 0; }
.item-col { flex: 0 0 56%; text-align: left; padding-right: 2mm; }
.qty-col { flex: 0 0 14%; text-align: right; padding-right: 2mm; }
.rate-col { flex: 1; text-align: right; }
.item-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  width: 100%; margin: 2mm 0;
  font-size: 9.4pt; line-height: 1.3; word-break: break-word;
}
.item-name { flex: 0 0 56%; text-align: left; padding-right: 2mm; word-break: break-word; }
.item-qty { flex: 0 0 14%; text-align: right; padding-right: 2mm; word-break: break-word; }
.item-rate { flex: 1; text-align: right; word-break: break-all; }
.barcode-section { text-align: center; margin: 4mm 0; }
.barcode-section svg { max-width: 48mm; height: 14mm; display: block; margin: 0 auto; }
.barcode-number {
  font-size: 9.8pt; margin-top: 2mm; font-weight: bold;
  letter-spacing: 1px; color: #000000; text-align: center;
}
.thank-you {
  font-size: 10.6pt; margin-top: 4mm; margin-bottom: 2mm;
  font-weight: bold; text-align: center; color: #000000; line-height: 1.2;
}
.footer-line {
  font-size: 9.8pt; margin: 1mm 0; font-weight: bold;
  text-align: center; color: #000000; line-height: 1.2;
}
.promo {
  font-size: 9.4pt; text-align: center; margin: 2mm 0;
  color: #000000; font-weight: bold; line-height: 1.3; word-break: break-word;
}
.powered-by {
  font-size: 8.5pt; text-align: center; margin: 3mm 0 1mm 0;
  color: #000000; font-weight: bold; line-height: 1.2;
}
.ace-line {
  font-size: 8pt; text-align: center; margin: 1mm 0;
  color: #000000; font-weight: bold; line-height: 1.2;
}
</style>
</head>
<body>
${content}
<script>
window.onload = function() {
  const barcodeElement = document.getElementById('barcode-svg');
  const barcodeNumber = document.getElementById('barcode-number')?.textContent || '';
  if (barcodeElement && barcodeNumber && window.JsBarcode) {
    try {
      JsBarcode(barcodeElement, barcodeNumber, {
        format: "CODE128",
        width: 2, height: 50,
        displayValue: false, margin: 0,
        background: "#ffffff", lineColor: "#000000"
      });
    } catch (err) { console.error('Barcode generation failed:', err); }
  }
};
</script>
</body>
</html>
`;

// Build a thermal-receipt-sized PDF (80mm wide) from receiptData using jsPDF.
// Returns null if jsPDF can't load.
export const buildReceiptPdfBlob = async (
  receiptData: ReceiptData,
  logoDataUri = "",
): Promise<{ blob: Blob; filename: string } | null> => {
  if (!receiptData) return null;
  const { jsPDF } = await import("jspdf");

  const widthMm = 80;
  const doc = new jsPDF({ unit: "mm", format: [widthMm, 297] });
  const left = 4;
  const right = widthMm - 4;
  const usable = right - left;
  let y = 6;
  const lineGap = 4;
  const sectionGap = 2;

  const writeCentered = (text: string, opts?: { bold?: boolean; size?: number }) => {
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(opts?.size ?? 9);
    const lines = doc.splitTextToSize(text, usable);
    lines.forEach((ln: string) => {
      doc.text(ln, widthMm / 2, y, { align: "center" });
      y += lineGap;
    });
  };
  const writeRow = (label: string, value: string, opts?: { bold?: boolean; size?: number }) => {
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(opts?.size ?? 8.5);
    doc.text(label, left, y);
    doc.text(value, right, y, { align: "right" });
    y += lineGap;
  };
  const hr = () => {
    doc.setLineDashPattern([0.6, 0.6], 0);
    doc.setLineWidth(0.2);
    doc.line(left, y, right, y);
    doc.setLineDashPattern([], 0);
    y += sectionGap + 2;
  };

  if (logoDataUri) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = logoDataUri;
      });
      const aspect = img.naturalWidth / img.naturalHeight || 2;
      const maxW = 44;
      const maxH = 20;
      let imgW = maxW;
      let imgH = imgW / aspect;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = imgH * aspect;
      }
      const x = (widthMm - imgW) / 2;
      doc.addImage(logoDataUri, "PNG", x, y, imgW, imgH);
      y += imgH + 5;
    } catch {
      // ignore — image load failed; continue without logo
    }
  }

  if (receiptData.storeName) writeCentered(receiptData.storeName, { bold: true, size: 11 });
  if (receiptData.address) writeCentered(receiptData.address, { size: 8.5 });
  writeCentered(receiptData.tagline || "Quality - Service - Value", { size: 8 });
  hr();

  const when = receiptData.timestamp ? new Date(receiptData.timestamp) : new Date();
  writeRow("Receipt #", String(receiptData.transactionId));
  writeRow("Date", `${when.toLocaleDateString()} ${when.toLocaleTimeString()}`);
  writeRow("Cashier", receiptData.cashier || "Walk-in");
  writeRow("Customer", receiptData.customerType || "Walk-in");
  hr();

  const colItemMaxWidth = usable * 0.6;
  const qtyAnchor = left + usable * 0.74;
  const rateAnchor = right;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("ITEM", left, y);
  doc.text("QTY", qtyAnchor, y, { align: "right" });
  doc.text("RATE", rateAnchor, y, { align: "right" });
  y += 2;
  doc.setLineWidth(0.3);
  doc.line(left, y, right, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const rowGap = 4.5;
  for (const it of receiptData.items || []) {
    const name = String(it.name || "");
    const qty = `${it.quantity}${it.unit ? ` ${it.unit}` : ""}`;
    const rate = money(Number(it.price || 0) * Number(it.quantity || 0));
    const nameLines: string[] = doc.splitTextToSize(name, colItemMaxWidth);
    doc.text(nameLines, left, y);
    doc.text(qty, qtyAnchor, y, { align: "right" });
    doc.text(rate, rateAnchor, y, { align: "right" });
    y += rowGap * Math.max(1, nameLines.length);
  }
  y += 1;
  hr();

  writeRow("Subtotal", `PKR ${money(receiptData.subtotal || 0)}`);
  if (receiptData.discount && Number(receiptData.discount) > 0) {
    writeRow("Discount", `- PKR ${money(receiptData.discount)}`);
  }
  writeRow("Grand Total", `PKR ${money(receiptData.total ?? 0)}`, { bold: true, size: 10 });
  hr();

  writeRow("Payment", String(receiptData.paymentMethod || "CASH").toUpperCase());
  if (receiptData.amountPaid != null) {
    writeRow("Paid", `PKR ${money(receiptData.amountPaid)}`);
  }
  if (receiptData.changeAmount && receiptData.changeAmount > 0) {
    writeRow("Change", `PKR ${money(receiptData.changeAmount)}`);
  }
  hr();

  writeCentered(receiptData.thankYouMessage || "Thank you for shopping!", { bold: true, size: 9.5 });
  writeCentered("Branch: 021 34892110", { size: 8 });
  writeCentered("Delivery Hotline WhatsApp: +92 342 3344040", { size: 8 });
  writeCentered("Website: acestudios.com", { size: 8 });

  const blob = doc.output("blob");
  const filename = `receipt-${receiptData.transactionId || "sale"}.pdf`;
  return { blob, filename };
};

// Normalize a phone number for wa.me (digits only, +92 for local 03... numbers).
export const normalizeWhatsAppNumber = (raw?: string | null): string => {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
};

// Open a wa.me URL with the receipt PDF attached when supported (Web Share API),
// otherwise download the PDF + open wa.me with a "please attach the file" note.
export const shareReceiptOnWhatsApp = async (
  receiptData: ReceiptData,
  logoDataUri: string,
  phone?: string | null,
): Promise<{ shared: boolean; fellBack: boolean }> => {
  const pdf = await buildReceiptPdfBlob(receiptData, logoDataUri);
  if (!pdf) throw new Error("Failed to generate receipt PDF");

  const file = new File([pdf.blob], pdf.filename, { type: "application/pdf" });
  const navAny = navigator as any;
  if (navAny.canShare && navAny.canShare({ files: [file] }) && navAny.share) {
    try {
      await navAny.share({
        files: [file],
        title: `Receipt ${receiptData.transactionId}`,
        text: `Receipt ${receiptData.transactionId} — ${receiptData.storeName || ""}`.trim(),
      });
      return { shared: true, fellBack: false };
    } catch (err: any) {
      if (err?.name === "AbortError") return { shared: false, fellBack: false };
      // fall through to download
    }
  }

  const url = URL.createObjectURL(pdf.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdf.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const normalized = normalizeWhatsAppNumber(phone || "");
  const note = `Receipt ${receiptData.transactionId} downloaded as ${pdf.filename}. Please attach the file in this chat.`;
  const waUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(note)}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");

  return { shared: true, fellBack: true };
};

// Convenience: download a receipt PDF directly.
export const downloadReceiptPdf = async (
  receiptData: ReceiptData,
  logoDataUri: string,
): Promise<void> => {
  const pdf = await buildReceiptPdfBlob(receiptData, logoDataUri);
  if (!pdf) throw new Error("Failed to generate receipt PDF");
  const url = URL.createObjectURL(pdf.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdf.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
