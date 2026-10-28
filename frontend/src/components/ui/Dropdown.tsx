'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Portal } from './Portal';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect?: (value: string, item: DropdownItem) => void;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, onSelect, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && !item.divider) {
      onSelect?.(item.value, item);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div ref={triggerRef}>{trigger}</div>
      <Portal>
        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              'fixed z-50 mt-1.5 min-w-[180px] bg-forensic-surface border border-forensic-border rounded-lg shadow-xl',
              'animate-fade-in',
              align === 'right' ? 'right-0' : 'left-0'
            )}
            onKeyDown={handleKeyDown}
            role="menu"
            tabIndex={-1}
          >
            <div className="py-1">
              {items.map((item, index) => (
                item.divider ? (
                  <div key={`divider-${index}`} className="h-px bg-forensic-border my-1" role="separator" />
                ) : (
                  <button
                    key={item.value}
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                      'hover:bg-forensic-elevated focus:outline-none focus:bg-forensic-elevated',
                      item.danger ? 'text-red-400' : 'text-forensic-text',
                      item.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    role="menuitem"
                    tabIndex={-1}
                  >
                    {item.icon && <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                  </button>
                )
              ))}
            </div>
          </div>
        )}
      </Portal>
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
  label,
  error,
  hint,
  leftIcon,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn('w-full', className)} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-forensic-text mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 bg-forensic-bg border rounded-lg',
          'text-forensic-text transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-forensic-accent/50 focus:border-forensic-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          leftIcon ? 'pl-10' : 'pl-4',
          'pr-10',
          error && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500',
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
      >
        {leftIcon && (
          <span className="absolute left-3 text-forensic-muted">{leftIcon}</span>
        )}
        <span className={cn('truncate flex-1', !selectedOption && !value && 'text-forensic-muted/50')}>
          {selectedOption?.label || value || placeholder || 'Select...'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-forensic-muted flex-shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <Portal>
          <div
            className={cn(
              'fixed z-50 mt-1.5 w-full max-h-60 overflow-auto bg-forensic-surface border border-forensic-border rounded-lg shadow-xl',
              'animate-fade-in'
            )}
            role="listbox"
            aria-label={label}
          >
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                disabled={option.disabled}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors',
                  'hover:bg-forensic-elevated focus:outline-none focus:bg-forensic-elevated',
                  option.disabled && 'opacity-50 cursor-not-allowed',
                  value === option.value && 'bg-forensic-accent/10 text-forensic-accent'
                )}
                role="option"
                aria-selected={value === option.value}
                aria-disabled={option.disabled}
              >
                {value === option.value && <Check className="w-4 h-4 text-forensic-accent flex-shrink-0" />}
                <span className="flex-1 truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </Portal>
      )}
      {error && <p className="mt-1.5 text-sm text-red-400" role="alert">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-forensic-muted">{hint}</p>}
    </div>
  );
}