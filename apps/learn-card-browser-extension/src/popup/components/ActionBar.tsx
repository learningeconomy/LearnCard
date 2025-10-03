import React from 'react';
import type { CredentialCandidate } from '../../types/messages';

export type ActionBarProps = {
  candidates: CredentialCandidate[];
  selected: boolean[];
  setSelected: (next: boolean[]) => void;
  saving: boolean;
  onBulkSave: () => void;
};

export const ActionBar: React.FC<ActionBarProps> = ({ candidates, selected, setSelected, saving, onBulkSave }) => {
  const eligibleCount = candidates.filter((c) => !c.claimed && c.source !== 'link').length;
  const selectedCount = candidates.reduce((acc, c, i) => acc + (!c.claimed && c.source !== 'link' && selected[i] ? 1 : 0), 0);
  const allChecked = eligibleCount > 0 && candidates.every((c, i) => (c.claimed || c.source === 'link' ? true : !!selected[i]));

  if (eligibleCount === 0) return null;

  return (
    <>
      <label className="select-all">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => {
            const all = e.target.checked;
            setSelected(candidates.map((c) => (c.claimed || c.source === 'link' ? false : all)));
          }}
        />
        <span>Select all</span>
      </label>
      <button className="btn-primary" onClick={onBulkSave} disabled={saving || selectedCount === 0}>
        {saving ? 'Claiming…' : `Claim ${selectedCount} Credential${selectedCount === 1 ? '' : 's'}`}
      </button>
    </>
  );
};

export default ActionBar;
