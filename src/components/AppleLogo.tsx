import React from 'react';

interface AppleLogoProps {
  size?: number;
  className?: string;
  fill?: string;
  style?: React.CSSProperties;
}

export const AppleLogo: React.FC<AppleLogoProps> = ({
  size = 18,
  className = '',
  fill = 'currentColor',
  style = {}
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill}
      className={`inline-block shrink-0 ${className}`}
      style={{ display: 'inline-block', verticalAlign: '-0.125em', ...style }}
      aria-label="Apple"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.62-.75 1.04-1.8 1.01-2.85-.92.04-2.04.61-2.69 1.37-.58.67-.99 1.74-.95 2.79 1.03.08 2.01-.56 2.63-1.31z" />
    </svg>
  );
};

export const ApplePayBadge: React.FC<{ size?: number; className?: string; fill?: string }> = ({
  size = 20,
  className = '',
  fill = 'currentColor'
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 font-bold tracking-tight ${className}`} style={{ lineHeight: 1 }}>
      <AppleLogo size={size} fill={fill} />
      <span className="font-semibold" style={{ fontSize: `${size * 1.08}px`, letterSpacing: '-0.03em' }}>Pay</span>
    </div>
  );
};

export const AppleCareBadge: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-0.5 font-bold ${className}`} style={{ lineHeight: 1 }}>
      <AppleLogo size={size} fill="#ff3b30" />
      <span className="text-red-500 font-bold" style={{ fontSize: `${size * 0.95}px` }}>Care+</span>
    </div>
  );
};
