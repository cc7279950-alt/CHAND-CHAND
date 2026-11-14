interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ size = 'md' }: BrandLogoProps) {
  const iconClass = size === 'lg' ? 'w-9 h-9' : size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const textClass =
    size === 'lg'
      ? 'text-3xl tracking-[0.14em]'
      : size === 'sm'
        ? 'text-lg tracking-[0.12em]'
        : 'text-2xl tracking-[0.14em]';

  return (
    <span className="inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className={iconClass}
        aria-hidden="true"
      >
        <rect x="1.5" y="1.5" width="37" height="37" rx="6" stroke="#27272A" strokeWidth="1.5" fill="#111114" />
        <path
          d="M25.5 10.5C19.6 10.5 14.8 14.8 14.8 20C14.8 25.2 19.6 29.5 25.5 29.5C22.1 27.6 20 24.1 20 20C20 15.9 22.1 12.4 25.5 10.5Z"
          fill="#FFFFFF"
        />
        <path
          d="M23 18.2L31 15.5L27.5 20L31 24.5L23 21.8V18.2Z"
          fill="#D91E2A"
        />
      </svg>
      <span className={`font-display font-bold text-white leading-none ${textClass}`}>
        CHAND
      </span>
    </span>
  );
}
