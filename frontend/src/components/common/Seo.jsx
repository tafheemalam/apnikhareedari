import { Helmet } from 'react-helmet-async';

export const SITE_NAME = 'ApniKhareedari';
export const SITE_URL = 'https://apnikhareedari.pk';
const DEFAULT_DESCRIPTION =
  "Shop electronics, fashion, home essentials and more at ApniKhareedari — Pakistan's trusted online store with Cash on Delivery available nationwide.";

export default function Seo({ title, description, path, image, type = 'website', noindex = false, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Online Shopping in Pakistan`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
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
