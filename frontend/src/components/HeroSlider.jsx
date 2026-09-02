import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const AUTOPLAY_MS = 5000;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function ChevronIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

function SlideLink({ href, className, children }) {
  if (!href) return <div className={className}>{children}</div>;
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export default function HeroSlider({ banners }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [banners]);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, banners.length]);

  if (!banners.length) return null;

  function goTo(i) {
    setIndex((i + banners.length) % banners.length);
  }

  return (
    <section
      className="relative w-full overflow-hidden rounded-xl bg-slate-100 shadow-[0_4px_12px_rgba(4,120,87,0.08)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/9] w-full sm:aspect-[2.5/1]">
        {banners.map((banner, i) => (
          <SlideLink
            key={banner.id}
            href={banner.link_url}
            className={`group absolute inset-0 block transition-opacity duration-700 ease-in-out ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <img src={banner.image_url} alt={banner.title || ''} className="h-full w-full object-cover" />
            {(banner.title || banner.link_url) && (
              <div className="absolute inset-0 flex w-full items-center bg-gradient-to-r from-white/90 via-white/50 to-transparent p-6 sm:w-3/5 sm:p-12">
                <div className="flex flex-col items-start gap-4">
                  {banner.title && (
                    <h2 className="max-w-md text-xl font-extrabold leading-tight text-slate-900 drop-shadow-sm sm:text-4xl">
                      {banner.title}
                    </h2>
                  )}
                  {banner.link_url && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors group-hover:bg-emerald-700">
                      Shop Now
                      <ArrowIcon />
                    </span>
                  )}
                </div>
              </div>
            )}
          </SlideLink>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-800 shadow-sm backdrop-blur-sm hover:bg-white sm:block"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-slate-800 shadow-sm backdrop-blur-sm hover:bg-white sm:block"
          >
            <ChevronIcon direction="right" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-300'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
