import React from 'react';
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
  return (
    <div className="category">
      <button
        className="btn-secondary btn-small"
        onClick={() => (isOpen ? onClose() : onOpen())}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        {getCategoryLabel(value)}
      </button>
      {isOpen && (
        <div className="category-menu" role="menu">
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
