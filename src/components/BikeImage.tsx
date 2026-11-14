import { useState } from 'react';
import { resolveBikeImage } from '../lib/imageMap.ts';

interface BikeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fallbackLabel?: string;
}

export function BikeImage({
  src,
  alt,
  className = '',
  priority = false,
  fallbackLabel = 'CHAND MOTORS',
}: BikeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveBikeImage(src);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-zinc-400 border border-zinc-800 ${className}`}
      >
        <svg
          viewBox="0 0 64 32"
          className="w-16 h-8 text-zinc-700 mb-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="14" cy="22" r="7" />
          <circle cx="50" cy="22" r="7" />
          <path d="M14 22L26 11H38L50 22M26 11L32 22H42M38 11L44 7" />
        </svg>
        <span className="text-xs font-medium tracking-wide text-zinc-500 px-3 text-center">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
