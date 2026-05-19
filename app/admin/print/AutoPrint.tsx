"use client";

import { useEffect } from "react";

export function AutoPrint() {
  useEffect(() => {
    const onAfter = () => window.close();
    window.addEventListener("afterprint", onAfter);
    const t = setTimeout(() => window.print(), 350);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", onAfter);
    };
  }, []);
  return null;
}
