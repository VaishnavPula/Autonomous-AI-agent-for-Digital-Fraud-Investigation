"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { riskService } from "@/lib/risk";
import { FraudSignalItem } from "@/types/risk";
import { signalTypeOptions, signalSeverityOptions } from "@/types/risk";
import { Plus, X, AlertCircle, Loader2 } from "lucide-react";

interface RiskUploadProps {
  caseId: string;
  onSuccess?: (signal: FraudSignalItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function RiskUpload({ caseId, onSuccess, onClose, isOpen = true }: RiskUploadProps) {
  const handleClose = () => onClose?.();
  const [formData, setFormData] = useState({
    signal_type: 'UNUSUAL_AMOUNT',
    severity: 'MEDIUM',
    observed_value: '',
    expected_value: '',
    deviation: 0,
    reason: '',
    evidence_ids: '',
    score_contribution: 0,
    confidence: 1,
    metadata: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.signal_type) {
      setError("Please select a signal type");
      return;
    }
    if (!formData.severity) {
      setError("Please select a severity");
      return;
    }
    if (!formData.reason) {
      setError("Please enter a reason");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      let evidenceIds: string[] = [];
      if (formData.evidence_ids) {
        evidenceIds = formData.evidence_ids.split(',').map(id => id.trim()).filter(Boolean);
      }

      let metadata: Record<string, any> = {};
      if (formData.metadata) {
        try {
          metadata = JSON.parse(formData.metadata);
        } catch {
          setError("Invalid JSON in metadata");
          setCreating(false);
          return;
        }
      }

      const signal = await riskService.createSignal({
        case_id: caseId,
        signal_type: formData.signal_type,
        severity: formData.severity,
        observed_value: formData.observed_value,
        expected_value: formData.expected_value,
        deviation: formData.deviation,
        reason: formData.reason,
        evidence_ids: evidenceIds,
        score_contribution: formData.score_contribution,
        confidence: formData.confidence,
        metadata,
      });

      onSuccess?.(signal);
      onClose?.();
    } catch (err) {
      console.error("Create failed:", err);
      setError("Failed to create fraud signal. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Fraud Signal" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Signal Type *</label>
            <select
              value={formData.signal_type}
              onChange={(e) => setFormData({ ...formData, signal_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              required
            >
              {signalTypeOptions.map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Severity *</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              required
            >
              {signalSeverityOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Observed Value *</label>
            <input
              type="text"
              value={formData.observed_value}
              onChange={(e) => setFormData({ ...formData, observed_value: e.target.value })}
              placeholder="e.g., $50,000"
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Expected Value</label>
            <input
              type="text"
              value={formData.expected_value}
              onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
              placeholder="e.g., $5,000"
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Deviation *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.deviation}
              onChange={(e) => setFormData({ ...formData, deviation: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Score Contribution</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.score_contribution}
              onChange={(e) => setFormData({ ...formData, score_contribution: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Confidence</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) || 1 })}
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Evidence IDs (comma-separated)</label>
            <input
              type="text"
              value={formData.evidence_ids}
              onChange={(e) => setFormData({ ...formData, evidence_ids: e.target.value })}
              placeholder="EV-001, EV-002"
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Reason *</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Explain why this signal was triggered..."
            rows={3}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Metadata (JSON)</label>
          <textarea
            value={formData.metadata}
            onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
            placeholder='{"source_system": "transaction_monitor", "rule_id": "RULE-001"}'
            rows={3}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 font-mono text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" loading={creating} disabled={creating}>
            {creating ? "Creating..." : "Create Signal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}