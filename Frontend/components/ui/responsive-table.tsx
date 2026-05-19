import React from "react";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className = "" }: ResponsiveTableProps) {
  return (
    <div className={`w-full overflow-x-auto -mx-4 md:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 md:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

