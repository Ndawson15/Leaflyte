'use client';

interface AppLogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

export default function AppLogo({ size = 16, className = '', alt = '' }: AppLogoProps) {
  return (
    <img
      src="/leaflyte.png"
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={`shrink-0 select-none ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
