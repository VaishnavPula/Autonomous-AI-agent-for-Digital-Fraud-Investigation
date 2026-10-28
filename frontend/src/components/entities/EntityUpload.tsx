"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { entitiesService } from "@/lib/entities";
import { EntityItem } from "@/types/entities";
import { entityTypeOptions } from "@/types/entities";
import { Plus, X, User, Database, Smartphone, Globe, Mail, CreditCard, MapPin, FileText, Zap, AlertCircle, Loader2 } from "lucide-react";

const CLASSIFICATIONS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'];

const entityTypeIcons: Record<string, any> = {
  USER: User,
  ACCOUNT: Database,
  DEVICE: Smartphone,
  IP: Globe,
  EMAIL: Mail,
  PHONE: Smartphone,
  TRANSACTION: CreditCard,
  MERCHANT: Database,
  LOCATION: MapPin,
  DOCUMENT: FileText,
  EVENT: Zap,
  CASE: FileText,
};

interface EntityUploadProps {
  caseId: string;
  onSuccess?: (entity: EntityItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function EntityUpload({ caseId, onSuccess, onClose, isOpen = true }: EntityUploadProps) {
  const handleClose = () => onClose?.();
  const [formData, setFormData] = useState({
    entity_type: 'USER',
    name: '',
    value: '',
    attributes: '',
    first_seen: '',
    last_seen: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entity_type) {
      setError("Please select an entity type");
      return;
    }
    if (!formData.value) {
      setError("Please enter a value");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      let attributes: Record<string, any> = {};
      if (formData.attributes) {
        try {
          attributes = JSON.parse(formData.attributes);
        } catch {
          setError("Invalid JSON in attributes");
          setCreating(false);
          return;
        }
      }

      let firstSeen: Date | undefined;
      if (formData.first_seen) {
        firstSeen = new Date(formData.first_seen);
      }

      let lastSeen: Date | undefined;
      if (formData.last_seen) {
        lastSeen = new Date(formData.last_seen);
      }

      const entity = await entitiesService.createEntity({
        case_id: caseId,
        entity_type: formData.entity_type,
        name: formData.name,
        value: formData.value,
        attributes,
        first_seen: firstSeen,
        last_seen: lastSeen,
      });

      onSuccess?.(entity);
      onClose?.();
    } catch (err) {
      console.error("Create failed:", err);
      setError("Failed to create entity. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Entity" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Entity Type *</label>
            <select
              value={formData.entity_type}
              onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
              required
            >
              {entityTypeOptions.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Optional display name"
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Value *</label>
          <input
            type="text"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="e.g., user@example.com, 192.168.1.1, ACC-12345"
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-forensic-text mb-1">Attributes (JSON)</label>
          <textarea
            value={formData.attributes}
            onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
            placeholder='{"department": "finance", "role": "admin"}'
            rows={3}
            className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">First Seen (Optional)</label>
            <input
              type="datetime-local"
              value={formData.first_seen}
              onChange={(e) => setFormData({ ...formData, first_seen: e.target.value })}
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forensic-text mb-1">Last Seen (Optional)</label>
            <input
              type="datetime-local"
              value={formData.last_seen}
              onChange={(e) => setFormData({ ...formData, last_seen: e.target.value })}
              className="w-full px-4 py-2 bg-forensic-bg border border-forensic-border rounded-lg text-forensic-text placeholder-forensic-muted focus:outline-none focus:ring-2 focus:ring-forensic-accent/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button type="submit" loading={creating} disabled={creating}>
            {creating ? "Creating..." : "Create Entity"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}