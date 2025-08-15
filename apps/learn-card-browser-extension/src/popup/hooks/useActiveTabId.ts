import { useEffect, useState } from 'react';

export const useActiveTabId = () => {
  const [tabId, setTabId] = useState<number | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs?.[0]?.id ?? null;
      setTabId(id ?? null);
    });
  }, []);

  return tabId;
};
