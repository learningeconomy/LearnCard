import type { CredentialCategory } from '../types/messages';

export const CATEGORY_OPTIONS: ReadonlyArray<{ value: CredentialCategory; label: string }> = [
  { value: 'Achievement', label: 'Achievement' },
  { value: 'ID', label: 'ID' },
  { value: 'Learning History', label: 'Studies' },
  { value: 'Work History', label: 'Experiences' },
  { value: 'Social Badge', label: 'Boosts' },
  { value: 'Accomplishment', label: 'Portfolio' },
  { value: 'Accommodation', label: 'Assistance' },
] as const;

export const getCategoryLabel = (val: CredentialCategory | null | undefined) => {
  if (!val) return 'Set Category';
  const found = CATEGORY_OPTIONS.find((o) => o.value === val);
  return found?.label ?? val;
};
