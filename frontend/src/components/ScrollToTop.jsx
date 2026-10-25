import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position on navigation the way a normal
// multi-page site does, so clicking a product card while scrolled down a
// listing landed on the new page at that same scroll depth — often right in
// the middle of the Customer Reviews section instead of the top.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
