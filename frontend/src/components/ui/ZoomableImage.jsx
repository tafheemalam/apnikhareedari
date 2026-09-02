import { useState } from 'react';

export default function ZoomableImage({ src, alt, zoom = 2, className = '' }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  function handleMouseLeave() {
    setZoomed(false);
    setOrigin('50% 50%');
  }

  return (
    <div
      className={`h-full w-full cursor-zoom-in overflow-hidden ${className}`}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-200 ease-out"
        style={{ transform: zoomed ? `scale(${zoom})` : 'scale(1)', transformOrigin: origin }}
      />
    </div>
  );
}
