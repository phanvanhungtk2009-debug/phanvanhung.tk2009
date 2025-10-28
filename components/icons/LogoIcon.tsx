import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props} aria-label="DA NANG GREEN Logo">
    <defs>
      <linearGradient id="logoLeafGradient" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#34d399" /> 
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    
    {/* Main leaf/drop shape */}
    <path
      d="M50 0 C20 25, 20 75, 50 100 C80 75, 80 25, 50 0 Z"
      fill="url(#logoLeafGradient)"
    />
    
    {/* The transparent wave cutout */}
    <path
      d="M0 70 Q 25 58, 50 70 T 100 70 L 100 100 L 0 100 Z"
      fill="#ffffff"
      // FIX: Cast 'destination-out' to 'any' to resolve TypeScript error for non-standard CSS property value.
      style={{ mixBlendMode: 'destination-out' as any }}
    />
    
     {/* The blue wave line accent */}
     <path
      d="M0 72 Q 25 60, 50 72 T 100 72"
      stroke="#0d9488"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);