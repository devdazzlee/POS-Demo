"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileText, Loader2, Upload } from "lucide-react";

export interface ExcelField {
  name: string;
  required?: boolean;
  description: ReactNode;
}

export interface ExcelUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  fields: ExcelField[];
  // Anything below the field grid (e.g. "Optional extra columns" caption).
  footnote?: ReactNode;
  // Called when the user picks (or drops) a file. Loading + close handling
  // are done inside this component — return a promise so the dialog can show
  // a spinner and auto-close on resolve.
  onFile: (file: File) => Promise<void> | void;
  // Builds the downloadable template the user can grab as a starting point.
  onDownloadTemplate?: () => void;
}

export function ExcelUploadDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  footnote,
  onFile,
  onDownloadTemplate,
}: ExcelUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const acceptStr =
    ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";

  const handleFile = async (file: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await onFile(file);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-black">{title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={acceptStr}
          className="hidden"
          onChange={onInputChange}
        />

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={busy ? undefined : onDrop}
          onClick={() => !busy && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-black bg-gray-50"
              : "border-gray-300 hover:border-gray-400 bg-gray-50/40"
          } ${busy ? "opacity-60 pointer-events-none" : ""}`}
        >
          <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-base font-medium text-black">Drop your file here</p>
          <p className="text-sm text-gray-500 mt-1">
            CSV, XLSX or XLS — max ~500 rows recommended
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-4 text-sm"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Browse file
          </Button>
        </div>

        {/* Required sheet format */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-black">Required sheet format</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                First row = column headers
              </span>
            </div>
            {onDownloadTemplate && (
              <Button
                variant="outline"
                size="sm"
                className="text-sm text-black"
                onClick={onDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download template
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {fields.map((f) => (
              <div
                key={f.name}
                className="border border-gray-200 rounded-md p-3 text-sm bg-white"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="font-medium text-black">{f.name}</span>
                  {f.required && (
                    <span className="text-xs text-red-600">*required</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          {footnote && (
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">{footnote}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
