import React from 'react';

interface KnightLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const KnightLogo: React.FC<KnightLogoProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Sword Blade */}
        <path
          d="M50 15L50 75"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Sword Tip */}
        <path
          d="M50 15L45 20L55 20L50 15Z"
          fill="white"
        />
        
        {/* Sword Guard */}
        <path
          d="M35 45L65 45L65 50L35 50L35 45Z"
          fill="white"
        />
        
        {/* Sword Handle */}
        <path
          d="M45 50L45 75L55 75L55 50L45 50Z"
          fill="white"
        />
        
        {/* Handle Grip Lines */}
        <path
          d="M47 55L47 70M53 55L53 70"
          stroke="url(#handleGradient)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        
        {/* Code Symbol - </> */}
        <g transform="translate(25, 25)">
          <path
            d="M10 10L5 15L10 20M20 10L25 15L20 20"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.5 5L12.5 25"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
        
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="handleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default KnightLogo;
