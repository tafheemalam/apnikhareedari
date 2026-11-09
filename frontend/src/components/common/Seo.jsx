import { Helmet } from 'react-helmet-async';

export const SITE_NAME = 'ApniKhareedari';
export const SITE_URL = 'https://apnikhareedari.pk';
const DEFAULT_DESCRIPTION =
  "Shop electronics, fashion, home essentials and more at ApniKhareedari — Pakistan's trusted online store with Cash on Delivery available nationwide.";
const MAX_DESCRIPTION_LENGTH = 160;

// Collapses stray whitespace/newlines (plain-text admin fields can contain
// them) and clips to Google's effective snippet length at a word boundary,
// so a long product/category description never ships as an oversized or
// multi-line meta tag.
function toMetaDescription(raw) {
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= MAX_DESCRIPTION_LENGTH) return collapsed;
  const clipped = collapsed.slice(0, MAX_DESCRIPTION_LENGTH - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${lastSpace > 100 ? clipped.slice(0, lastSpace) : clipped}…`;
}

export default function Seo({ title, description, path, image, type = 'website', noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Online Shopping in Pakistan`;
  const metaDescription = toMetaDescription(description || DEFAULT_DESCRIPTION);
  const canonical = path ? `${SITE_URL}${path}` : undefined;
  const schemas = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {image && <meta name="twitter:image" content={image} />}

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
