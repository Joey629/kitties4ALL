import { useEffect } from 'react';

function setFavicon(emoji: string) {
  const href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function useDocumentMeta(title: string, icon: string, app?: 'admin' | 'companion' | 'experience') {
  useEffect(() => {
    document.title = title;
    setFavicon(icon);
    if (app) {
      document.documentElement.dataset.app = app;
      return () => {
        delete document.documentElement.dataset.app;
      };
    }
  }, [title, icon, app]);
}
