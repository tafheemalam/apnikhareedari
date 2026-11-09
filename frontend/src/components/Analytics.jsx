import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// GA4's own gtag config has send_page_view disabled (see index.html) because
// this is a client-routed SPA — without this, GA would only ever record the
// single page the visitor first landed on, never the pages they navigate to.
export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;

    // Pages that fetch their own data before rendering <Seo> (product,
    // category) don't have their real <title> set yet on the next tick, so
    // wait for the <title> text to actually change before sending — with a
    // ceiling so a page whose title never changes still reports.
    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      observer.disconnect();
      clearTimeout(ceiling);
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    };

    const titleEl = document.querySelector('title');
    const observer = new MutationObserver(send);
    if (titleEl) observer.observe(titleEl, { childList: true });
    const ceiling = setTimeout(send, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(ceiling);
    };
  }, [location.pathname, location.search]);

  return null;
}
