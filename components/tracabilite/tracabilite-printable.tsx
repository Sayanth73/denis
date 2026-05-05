"use client";

import * as React from "react";

type TracabilitePrintableProps = {
  children: React.ReactNode;
};

/**
 * Wraps the traceability result content in a div with className="print-target".
 * The print-target class is referenced by the @media print block in app/globals.css
 * to isolate the printable region (hides everything else on the page).
 *
 * Used by TracabiliteUpstream and TracabiliteDownstream via useReactToPrint contentRef.
 */
export const TracabilitePrintable = React.forwardRef<
  HTMLDivElement,
  TracabilitePrintableProps
>(function TracabilitePrintable({ children }, ref) {
  return (
    <div ref={ref} className="print-target">
      {children}
    </div>
  );
});

TracabilitePrintable.displayName = "TracabilitePrintable";
