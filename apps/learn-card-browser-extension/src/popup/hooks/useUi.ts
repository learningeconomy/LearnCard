import { useState } from 'react';

export const useUi = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const [optsOpen, setOptsOpen] = useState(false);

  const [status, setStatus] = useState<string | null>(null);

  return {
    menuOpen,
    setMenuOpen,

    optsOpen,
    setOptsOpen,

    status,
    setStatus,
  } as const;
};
