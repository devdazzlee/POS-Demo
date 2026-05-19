import React from "react";

interface ResponsivePageProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function ResponsivePage({
  children,
  title,
  description,
  actions,
}: ResponsivePageProps) {
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm md:text-base text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2">{actions}</div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

