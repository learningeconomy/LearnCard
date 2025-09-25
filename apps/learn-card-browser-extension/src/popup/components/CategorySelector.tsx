import React, { useEffect, useId, useRef } from 'react';
import type { CredentialCategory } from '../../types/messages';
import { CATEGORY_OPTIONS, getCategoryLabel } from '../constants';

export type CategorySelectorProps = {
  value: CredentialCategory | undefined;
  disabled?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (value: CredentialCategory) => void;
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  disabled,
  isOpen,
  onOpen,
  onClose,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isOpen, onClose]);

  // Keyboard interactions
  useEffect(() => {
    if (!isOpen) return;
    // Focus first item when opening
    const first = menuRef.current?.querySelector<HTMLButtonElement>('.menu-item');
    first?.focus();
  }, [isOpen]);

  const onTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const onMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!isOpen) return;
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('.menu-item') ?? []);
    const idx = items.findIndex((el) => el === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[(idx + 1) % items.length] ?? items[0];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[(idx - 1 + items.length) % items.length] ?? items[0];
      prev?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      triggerRef.current?.focus();
    }
  };

  return (
    <div className="category" ref={containerRef}>
      <button
        className="btn-secondary btn-small"
        ref={triggerRef}
        onClick={() => (isOpen ? onClose() : onOpen())}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={disabled}
        onKeyDown={onTriggerKeyDown}
      >
        {getCategoryLabel(value)}
      </button>
      {isOpen && (
        <div
          id={menuId}
          className="category-menu"
          role="menu"
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
        >
          {CATEGORY_OPTIONS.map(({ value: v, label }) => (
            <button
              key={v}
              className="menu-item"
              role="menuitem"
              onClick={() => {
                onSelect(v);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
