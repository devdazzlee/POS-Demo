/**
 * Kiosk Printing Utilities
 * 
 * Detects if running in kiosk mode and provides optimized printing functions
 */

/**
 * Check if running in Chrome kiosk mode
 * Detects common kiosk indicators including --kiosk-printing flag
 */
export function isKioskMode(): boolean {
  // Check for kiosk-specific conditions
  if (typeof window === 'undefined') return false;

  // Check URL parameter for kiosk-printing flag (from batch file)
  const urlParams = new URLSearchParams(window.location.search);
  const hasKioskPrintingParam = urlParams.get('kiosk-printing') === 'true' ||
                                 urlParams.get('kiosk') === 'true';

  // Check if running in fullscreen without address bar (common in kiosk)
  const isFullscreen = window.innerHeight === screen.height && 
                       window.innerWidth === screen.width &&
                       !window.navigator.userAgent.includes('Headless');

  // Check for kiosk indicators in user agent (some setups add this)
  const userAgent = window.navigator.userAgent.toLowerCase();
  const hasKioskIndicators = userAgent.includes('kiosk');

  // Check localStorage flag (can be set manually)
  const kioskFlag = localStorage.getItem('kiosk_mode') === 'true';

  // Check if window.print is available (required for kiosk printing)
  const canPrint = typeof window.print === 'function';

  // Return true if any kiosk indicator is present
  return (hasKioskPrintingParam || isFullscreen || hasKioskIndicators || kioskFlag) && canPrint;
}

/**
 * Silent print function - optimized for kiosk mode
 * In kiosk mode: Prints directly to default printer, no dialogs
 * In normal mode: Shows print dialog
 */
export function silentPrint(content?: string | HTMLElement): void {
  if (content) {
    // If content provided, create temporary print view
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print</title>
            <style>
              @media print {
                @page { margin: 0; size: auto; }
                body { margin: 0; }
              }
              body { font-family: Arial, sans-serif; padding: 20px; }
            </style>
          </head>
          <body>
            ${typeof content === 'string' ? content : ''}
          </body>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                // Close after printing in kiosk mode
                if (${isKioskMode()}) {
                  setTimeout(() => window.close(), 100);
                }
              }, 100);
            };
          </script>
        </html>
      `);
      printWindow.document.close();
      
      // If element provided, append it
      if (typeof content !== 'string' && printWindow.document.body) {
        printWindow.document.body.appendChild(content);
      }
    }
  } else {
    // Direct print of current page
    window.print();
  }
}

/**
 * Print receipt optimized for kiosk mode
 */
export function printReceipt(receiptHTML: string): void {
  if (isKioskMode()) {
    // Kiosk mode: Silent print
    silentPrint(receiptHTML);
  } else {
    // Normal mode: Use existing print logic
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }
}

/**
 * Enable kiosk mode manually (for testing or configuration)
 */
export function enableKioskMode(): void {
  localStorage.setItem('kiosk_mode', 'true');
}

/**
 * Disable kiosk mode
 */
export function disableKioskMode(): void {
  localStorage.setItem('kiosk_mode', 'false');
}

/**
 * Get default printer info (for display purposes)
 * In kiosk mode, always uses Windows default printer
 */
export function getDefaultPrinterInfo(): { name: string; isDefault: boolean } {
  return {
    name: 'Default Printer',
    isDefault: true
  };
}



