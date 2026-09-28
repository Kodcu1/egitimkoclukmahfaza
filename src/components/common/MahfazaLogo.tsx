import React from 'react';

interface MahfazaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  subtitle?: string;
}

export const MahfazaLogo: React.FC<MahfazaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  subtitle = 'Eğitim Koçluk-Danışmanlık',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Gold & Black Circular Seal Icon */}
      <div
        className={`relative shrink-0 rounded-full shadow-lg p-0.5 bg-gradient-to-tr from-[#8a6828] via-[#e2c174] to-[#f7e4a7] ${sizeClasses[size]}`}
      >
        <div className="w-full h-full rounded-full bg-[#0d0f12] flex items-center justify-center p-[2px] border border-[#d4af37]/60 overflow-hidden relative shadow-inner">
          {/* Detailed SVG Vector Graphic of Mahfaza.co Emblem */}
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full text-[#d4af37]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circular gradient */}
            <circle cx="100" cy="100" r="96" fill="#0c0d10" stroke="url(#goldGradient)" strokeWidth="4" />
            <circle cx="100" cy="100" r="90" stroke="url(#goldGradient2)" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="82" stroke="url(#goldGradient)" strokeWidth="1.5" />

            {/* Ornamental Top Motif / Tughra Silhouette */}
            <g transform="translate(100, 52) scale(0.65)">
              <path
                d="M-22 -14 C-15 -32, 0 -38, 12 -28 C24 -18, 18 -4, 4 -2 C-10 0, -25 -6, -22 -14 Z"
                stroke="url(#goldGradient)"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M-8 -35 C-2 -44, 15 -44, 20 -28 C26 -8, 8 10, -18 8 C-35 6, -20 -15, -8 -35 Z"
                stroke="url(#goldGradient)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M-30 0 C-10 4, 15 4, 30 0 M-2 8 L-2 -46 M10 -40 L10 12"
                stroke="url(#goldGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* Central Banner Box */}
            <rect
              x="18"
              y="85"
              width="164"
              height="30"
              rx="4"
              fill="#121318"
              stroke="url(#goldGradient)"
              strokeWidth="2.5"
            />
            {/* Inner banner borders */}
            <line x1="22" y1="88" x2="178" y2="88" stroke="url(#goldGradient2)" strokeWidth="1" />
            <line x1="22" y1="112" x2="178" y2="112" stroke="url(#goldGradient2)" strokeWidth="1" />

            {/* Central Typography: MAHFAZA.CO */}
            <text
              x="100"
              y="106"
              textAnchor="middle"
              fill="url(#goldGradient)"
              fontSize="16"
              fontWeight="900"
              letterSpacing="2.5"
              fontFamily="Cinzel, Georgia, serif"
            >
              MAHFAZA.CO
            </text>

            {/* Göktürk / Ornamental Ancient Runes Pattern Ring */}
            <g opacity="0.9">
              <text
                x="100"
                y="145"
                textAnchor="middle"
                fill="url(#goldGradient)"
                fontSize="12"
                fontWeight="bold"
                letterSpacing="3"
                fontFamily="sans-serif"
              >
                𐰃𐰦𐰍 𐰺𐰭 𐰋𐰴 𐰢
              </text>
              <circle cx="100" cy="100" r="74" stroke="url(#goldGradient2)" strokeWidth="1" opacity="0.6" />
            </g>

            {/* Gradients */}
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3e096" />
                <stop offset="35%" stopColor="#d4af37" />
                <stop offset="70%" stopColor="#aa7c11" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
              <linearGradient id="goldGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#b38728" />
                <stop offset="100%" stopColor="#fbf5b7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight uppercase ${textColor} ${
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
              }`}
            >
              Mahfaza<span className="text-[#c59e35]">.co</span>
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wider hidden sm:block truncate max-w-[220px]">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
