"use client";

import { useEffect, useState } from "react";

// Fetches /logo.png once on mount and converts it to a `data:image/png;base64,...`
// URI. Using a data URI guarantees the logo renders inside srcDoc iframes and
// jsPDF documents, where absolute or relative URL resolution gets flaky.
export function useLogoDataUri(): string {
  const [uri, setUri] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/logo.png");
        if (!res.ok) return;
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled && typeof reader.result === "string") {
            setUri(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        // ignore — no logo available
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return uri;
}
