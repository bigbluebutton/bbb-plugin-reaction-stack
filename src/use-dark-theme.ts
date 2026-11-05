import * as React from 'react';

/*
 * BigBlueButton implements its dark theme with DarkReader and announces changes
 * through a `darkmodechange` window event. DarkReader also marks <html> with
 * `data-darkreader-*` attributes, which lets us read the current state on load.
 */
const detect = () => {
  const html = document.documentElement;
  return html.getAttribute('data-darkreader-scheme') === 'dark'
    || (html.hasAttribute('data-darkreader-mode') && html.getAttribute('data-darkreader-scheme') !== 'light')
    || !!document.querySelector('style.darkreader');
};

export function useDarkTheme(): boolean {
  const [dark, setDark] = React.useState(detect);

  React.useEffect(() => {
    const onChange = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled;
      setDark(typeof enabled === 'boolean' ? enabled : detect());
    };
    window.addEventListener('darkmodechange', onChange);

    // Fallback for clients that toggle DarkReader without the event.
    const observer = new MutationObserver(() => setDark(detect()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-darkreader-mode', 'data-darkreader-scheme'],
    });

    setDark(detect());
    return () => {
      window.removeEventListener('darkmodechange', onChange);
      observer.disconnect();
    };
  }, []);

  return dark;
}
