/**
 * Shared input/label styles for Builder variant editors.
 *
 * Kept in one place so the inspector form feels coherent across every
 * policy/termination variant. Any editor that introduces a new field
 * should import from here rather than invent its own classes — a
 * mismatched border radius or font size looks immediately wrong in
 * the stack of sections.
 */

export const LABEL = 'text-xs font-medium text-grayscale-700';

export const INPUT =
    'w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-poppins';

/**
 * Pill-shaped toggle button (used by the "what they submit" chip
 * picker in the practice editor, and reusable for any multi-select).
 */
export const CHIP_BASE =
    'py-1.5 px-3 rounded-full text-xs font-medium transition-colors border';

export const CHIP_ACTIVE = 'bg-grayscale-900 border-grayscale-900 text-white';

export const CHIP_INACTIVE =
    'bg-white border-grayscale-300 text-grayscale-700 hover:bg-grayscale-10';
