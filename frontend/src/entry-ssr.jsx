import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SiteContext } from './context/SiteContext';
import ReturnPolicy from './pages/ReturnPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';

// Pages that are pure, synchronous content (no data fetched after mount) can be
// fully prerendered to static HTML. Pages that load data via useEffect (e.g.
// ShippingInfo's zone table) can't — SSR only runs the render phase, not effects
// — so they're left to the normal client-rendered SPA shell.
export const STATIC_PAGES = {
  '/return-policy': ReturnPolicy,
  '/privacy-policy': PrivacyPolicy,
  '/terms': Terms,
};

// renderToStaticMarkup inlines each page's <Seo><Helmet> output (title/meta/
// link tags) in place in the body instead of hoisting it to <head> — there's
// no live <head> to hoist into outside a browser. The caller (prerender.mjs)
// pulls those tags out of the returned HTML string and moves them to <head>.
export function renderStaticPage(path, settings) {
  const Page = STATIC_PAGES[path];
  if (!Page) throw new Error(`No static page registered for ${path}`);

  return renderToStaticMarkup(
    <HelmetProvider>
      <StaticRouter location={path}>
        <SiteContext.Provider value={{ categories: [], settings, loading: false, hasBasketOption: false }}>
          <Page />
        </SiteContext.Provider>
      </StaticRouter>
    </HelmetProvider>,
  );
}
