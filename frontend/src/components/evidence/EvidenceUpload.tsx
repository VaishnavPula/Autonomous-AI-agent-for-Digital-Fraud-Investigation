"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { evidenceService } from "@/lib/evidence";
import { EvidenceItem } from "@/types/evidence";

interface EvidenceUploadProps {
  caseId: string;
  onSuccess?: (evidence: EvidenceItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const EVIDENCE_TYPES = [
  'CSV', 'JSON', 'TXT', 'PDF', 'IMAGE', 'LOG',
  'TRANSACTION_EXPORT', 'ACCOUNT_RECORD', 'DEVICE_RECORD',
  'IP_LOG', 'COMMUNICATION_METADATA', 'DOCUMENT',
  'BROWSER_FINGERPRINT', 'DEVICE_FINGERPRINT', 'OTHER'
];

const CLASSIFICATIONS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];

export function EvidenceUpload({ caseId, onSuccess, onClose, isOpen = true }: EvidenceUploadProps) {
  const handleClose = () => onClose?.();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    evidence_type: 'OTHER',
    original_filename: '',
    timestamp: '',
    entity_references: '',
    classification: 'INTERNAL',
    metadata: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFormData(prev => ({
      ...prev,
      original_filename: selectedFile.name,
    }));
    setError(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    if (!formData.source) {
      setError("Please enter a source");
      return;
    }
    if (!formData.evidence_type) {
      setError("Please select an evidence type");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let timestamp: Date | undefined;
      if (formData.timestamp) {
        timestamp = new Date(formData.timestamp);
      }

      let entityRefs: Record<string, any> = {};
      if (formData.entity_references) {
        try {
          entityRefs = JSON.parse(formData.entity_references);
        } catch {
          setError("Invalid JSON in entity references");
          setUploading(false);
          return;
        }
      }

      let meta: Record<string, any> = {};
      if (formData.metadata) {
        try {
          meta = JSON.parse(formData.metadata);
        } catch {
          setError("Invalid JSON in metadata");
          setUploading(false);
          return;
        }
      }

      const evidence = await evidenceService.uploadEvidence(file, {
        case_id: caseId,
        source: formData.source,
        evidence_type: formData.evidence_type,
        original_filename: formData.original_filename,
        timestamp,
        entity_references: entityRefs,
        classification: formData.classification,
        metadata: meta,
      });

      onSuccess?.(evidence);
      onClose?.();
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload evidence. Please try again.");
    } finally {
      setUploading(false);
    }
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Evidence" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={handleFileInputChange}
              className="hidden"
              id="evidence-file-input"
            />
            <label htmlFor="evidence-file-input" className="cursor-pointer">
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
                      }}
                    >
                      <X className="w-5 h-5 text-forensic-muted" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-forensic-muted mx-auto mb-4" />
                  <p className="text-forensic-text mb-1">Drag & drop a file here, or click to browse</p>
                  <p className="text-sm text-forensic-muted">Supports: CSV, JSON, TXT, PDF, Images, Logs</p>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Source *</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., Bank API, Internal System, Manual Entry"
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Evidence Type *</label>
            <select
              value={formData.evidence_type}
              onChange={(e) => setFormData({ ...formData, evidence_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              required
            >
              {EVIDENCE_TYPES.map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Original Filename *</label>
          <input
            type="text"
            value={formData.original_filename}
            onChange={(e) => setFormData({ ...formData, original_filename: e.target.value })}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Timestamp (Optional)</label>
            <input
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Classification</label>
            <select
              value={formData.classification}
              onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
              className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            >
              {CLASSIFICATIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Entity References (JSON)</label>
          <textarea
            value={formData.entity_references}
            onChange={(e) => setFormData({ ...formData, entity_references: e.target.value })}
            placeholder='{"account_id": "ACC-123", "transaction_id": "TXN-456"}'
            rows={3}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Metadata (JSON)</label>
          <textarea
            value={formData.metadata}
            onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
            placeholder='{"notes": "Manual entry", "confidence": 0.9}'
            rows={3}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 font-mono text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button type="submit" loading={uploading} disabled={!file}>
            {uploading ? "Uploading..." : "Upload Evidence"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}