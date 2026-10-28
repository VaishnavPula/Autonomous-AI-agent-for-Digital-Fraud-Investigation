"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { transactionsService } from "@/lib/transactions";
import { TransactionItem } from "@/types/transactions";
import { Plus, X, FileText, AlertCircle, Loader2, Download, Share2, Upload } from "lucide-react";

interface TransactionUploadProps {
  caseId: string;
  onSuccess?: (tx: TransactionItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function TransactionUpload({ caseId, onSuccess, onClose, isOpen = true }: TransactionUploadProps) {
  const handleClose = () => onClose?.();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});
  const [step, setStep] = useState<'file' | 'mapping'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headers: string[] = [];
  const requiredFields = ['transaction_id', 'amount', 'timestamp'];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    parseHeaders(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const parseHeaders = async (file: File) => {
    try {
      const content = await file.text();
      let parsedHeaders: string[] = [];
      
      if (file.name.endsWith('.csv')) {
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          parsedHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        }
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(content);
        if (Array.isArray(data) && data.length > 0) {
          parsedHeaders = Object.keys(data[0]);
        }
      }
      
      headers.length = 0;
      headers.push(...parsedHeaders);
      
      // Auto-map common fields
      const autoMapping: Record<string, string> = {};
      const fieldMappings: Record<string, string[]> = {
        transaction_id: ['transaction_id', 'txn_id', 'tx_id', 'id', 'trans_id'],
        amount: ['amount', 'amt', 'value', 'transaction_amount'],
        currency: ['currency', 'curr', 'ccy'],
        timestamp: ['timestamp', 'date', 'time', 'datetime', 'trans_date', 'transaction_date'],
        sender_entity_id: ['sender', 'sender_id', 'from', 'from_entity', 'originator'],
        receiver_entity_id: ['receiver', 'receiver_id', 'to', 'to_entity', 'beneficiary'],
        merchant_entity_id: ['merchant', 'merchant_id', 'merchant_name'],
        payment_method: ['payment_method', 'method', 'type'],
        status: ['status', 'state', 'txn_status'],
      };
      
      for (const [field, possibleNames] of Object.entries(fieldMappings)) {
        for (const header of parsedHeaders) {
          if (possibleNames.some(pn => header.toLowerCase().includes(pn.toLowerCase()))) {
            autoMapping[field] = header;
            break;
          }
        }
      }
      
      setColumnMapping(autoMapping);
      setStep('mapping');
    } catch (err) {
      console.error("Failed to parse file:", err);
      setError("Failed to parse file. Please check format.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    // Validate required fields are mapped
    const missingRequired = requiredFields.filter(field => !columnMapping[field]);
    if (missingRequired.length > 0) {
      setError(`Required fields not mapped: ${missingRequired.join(', ')}`);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const result = await transactionsService.importTransactions(file, caseId, columnMapping, defaultValues);
      onSuccess?.(result.items[0]);
      onClose?.();
    } catch (err) {
      console.error("Import failed:", err);
      setError("Failed to import transactions. Please check file format and mappings.");
    } finally {
      setCreating(false);
    }
  };

  const handleBack = () => {
    setStep('file');
    setFile(null);
    setColumnMapping({});
    setDefaultValues({});
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 'file' ? "Import Transactions" : "Map Columns"} size="lg">
      {step === 'file' && (
        <div className="space-y-4">
          <div className="relative">
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                dragActive
                  ? "border-forensic-accent bg-forensic-accent/5"
                  : "border-forensic-border hover:border-forensic-accent/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileInputChange}
                className="hidden"
                id="transaction-file-input"
              />
              <label htmlFor="transaction-file-input" className="cursor-pointer">
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-3 p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                      <FileText className="w-10 h-10 text-forensic-accent" />
                      <div className="text-left">
                        <p className="font-medium text-forensic-text truncate max-w-[300px]">{file.name}</p>
                        <p className="text-sm text-forensic-muted">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFile(null);
                          setStep('file');
                        }}
                      >
                        <X className="w-5 h-5 text-forensic-muted" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileText className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
                    <p className="text-forensic-text mb-1">Drag & drop a CSV or JSON file, or click to browse</p>
                    <p className="text-sm text-forensic-muted">Required columns: Transaction ID, Amount, Timestamp</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {file && (
            <Button onClick={() => {}} disabled className="w-full opacity-50">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Parsing file...
            </Button>
          )}

          {!file && (
            <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          )}
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-forensic-text">File: {file?.name}</h3>
              <p className="text-sm text-forensic-muted">{headers.length} columns detected</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {headers.map(header => {
              const isMapped = Object.values(columnMapping).includes(header);
              const mappedField = Object.entries(columnMapping).find(([_, h]) => h === header)?.[0];
              return (
                <div key={header} className="flex items-center gap-3 p-3 bg-forensic-bg rounded-lg border border-forensic-border/50">
                  <span className="font-mono text-sm text-forensic-text w-48 truncate">{header}</span>
                  <span className="text-xs text-forensic-muted px-2 py-0.5 rounded bg-forensic-border">
                    {isMapped ? `→ ${mappedField}` : 'Unmapped'}
                  </span>
                  <select
                    value={mappedField || ''}
                    onChange={(e) => {
                      const newMapping = { ...columnMapping };
                      if (e.target.value) {
                        // Remove previous mapping for this header
                        Object.keys(newMapping).forEach(k => {
                          if (newMapping[k] === header) delete newMapping[k];
                        });
                        newMapping[e.target.value] = header;
                      } else {
                        Object.keys(newMapping).forEach(k => {
                          if (newMapping[k] === header) delete newMapping[k];
                        });
                      }
                      setColumnMapping(newMapping);
                    }}
                    className="flex-1 px-3 py-2 bg-forensic-surface border border-forensic-border rounded-lg text-forensic-text text-sm focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
                  >
                    <option value="">— Do not import —</option>
                    <optgroup label="Required">
                      <option value="transaction_id">Transaction ID *</option>
                      <option value="amount">Amount *</option>
                      <option value="timestamp">Timestamp *</option>
                    </optgroup>
                    <optgroup label="Entities">
                      <option value="sender_entity_id">Sender Entity ID</option>
                      <option value="receiver_entity_id">Receiver Entity ID</option>
                      <option value="merchant_entity_id">Merchant Entity ID</option>
                    </optgroup>
                    <optgroup label="Optional">
                      <option value="currency">Currency</option>
                      <option value="payment_method">Payment Method</option>
                      <option value="status">Status</option>
                      <option value="device_entity_id">Device Entity ID</option>
                      <option value="ip_entity_id">IP Entity ID</option>
                      <option value="location_entity_id">Location Entity ID</option>
                    </optgroup>
                  </select>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={handleBack}>
              <Share2 className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button type="submit" onClick={handleSubmit} loading={creating} disabled={creating}>
              {creating ? "Importing..." : "Import Transactions"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}