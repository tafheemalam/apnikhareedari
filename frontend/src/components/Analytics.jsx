import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// GA4's own gtag config has send_page_view disabled (see index.html) because
// this is a client-routed SPA — without this, GA would only ever record the
// single page the visitor first landed on, never the pages they navigate to.
export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    // react-helmet-async commits the new <title> in its own effect, which can
    // run after this one — defer a tick so page_title isn't the page being
    // navigated away from.
    const id = setTimeout(() => {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }, 0);
    return () => clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
}
