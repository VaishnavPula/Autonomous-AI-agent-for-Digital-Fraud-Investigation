"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { timelineService } from "@/lib/timeline";
import { TimelineEventItem } from "@/types/timeline";
import { timelineEventTypeOptions } from "@/types/timeline";
import { Plus, X, AlertCircle, Loader2, Clock, Calendar, Clock as ClockIcon, Calendar as CalendarIcon } from "lucide-react";

interface TimelineUploadProps {
  caseId: string;
  onSuccess?: (event: TimelineEventItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function TimelineUpload({ caseId, onSuccess, onClose, isOpen = true }: TimelineUploadProps) {
  const handleClose = () => onClose?.();
  const [formData, setFormData] = useState({
    event_type: 'LOGIN',
    timestamp: new Date().toISOString().slice(0, 16),
    entity_ids: '',
    description: '',
    details: '',
    evidence_ids: '',
    source: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event_type) {
      setError("Please select an event type");
      return;
    }
    if (!formData.description) {
      setError("Please enter a description");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      let entityIds: string[] = [];
      if (formData.entity_ids) {
        entityIds = formData.entity_ids.split(',').map(id => id.trim()).filter(Boolean);
      }

      let evidenceIds: string[] = [];
      if (formData.evidence_ids) {
        evidenceIds = formData.evidence_ids.split(',').map(id => id.trim()).filter(Boolean);
      }

      let details: Record<string, any> = {};
      if (formData.details) {
        try {
          details = JSON.parse(formData.details);
        } catch {
          setError("Invalid JSON in details");
          setCreating(false);
          return;
        }
      }

      const event = await timelineService.createEvent({
        case_id: caseId,
        event_type: formData.event_type,
        timestamp: new Date(formData.timestamp),
        entity_ids: entityIds,
        description: formData.description,
        details,
        evidence_ids: evidenceIds,
        source: formData.source,
      });

      onSuccess?.(event);
      onClose?.();
    } catch (err) {
      console.error("Create failed:", err);
      setError("Failed to create timeline event. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Timeline Event" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Event Type *</label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              required
            >
              {timelineEventTypeOptions.map(type => (
                <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Timestamp *</label>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forensic-muted" />
              <input
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the event..."
            rows={3}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Entity IDs (comma-separated)</label>
            <input
              type="text"
              value={formData.entity_ids}
              onChange={(e) => setFormData({ ...formData, entity_ids: e.target.value })}
              placeholder="ENT-001, ENT-002"
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., System Log, Manual Entry, API"
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
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

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Details (JSON)</label>
          <textarea
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            placeholder='{"ip": "192.168.1.1", "user_agent": "Mozilla/5.0..."}'
            rows={3}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 font-mono text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" loading={creating} disabled={creating}>
            {creating ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}