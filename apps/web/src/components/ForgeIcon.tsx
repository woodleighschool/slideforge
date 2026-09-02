export function ForgeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 440 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="badgeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141c30" />
          <stop offset="0.5" stopColor="#080c16" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        <linearGradient id="moltenGrad" x1="0.05" y1="0.05" x2="0.95" y2="0.95">
          <stop offset="0" stopColor="#fff6da" />
          <stop offset="0.22" stopColor="#ffc36a" />
          <stop offset="0.5" stopColor="#ED6B17" />
          <stop offset="0.78" stopColor="#b8380f" />
          <stop offset="1" stopColor="#5e1503" />
        </linearGradient>
        <linearGradient id="steelHeadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef1f4" />
          <stop offset="0.4" stopColor="#aab2bd" />
          <stop offset="0.75" stopColor="#5c6472" />
          <stop offset="1" stopColor="#2b313c" />
        </linearGradient>
        <linearGradient id="steelHandleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b93a1" />
          <stop offset="1" stopColor="#2b313c" />
        </linearGradient>
        <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="tightBlur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect x="10" y="10" width="420" height="420" rx="92" fill="url(#badgeGrad)" />
      <ellipse
        cx="255"
        cy="185"
        rx="165"
        ry="150"
        fill="#ED6B17"
        opacity="0.5"
        filter="url(#softBlur)"
      />
      <ellipse
        cx="255"
        cy="185"
        rx="90"
        ry="82"
        fill="#ffb347"
        opacity="0.55"
        filter="url(#softBlur)"
      />
      <g transform="rotate(-7 220 225)">
        <rect x="86" y="135" width="310" height="222" rx="26" fill="#000000" opacity="0.4" />
      </g>
      <g transform="rotate(-7 220 218)">
        <rect
          x="74"
          y="120"
          width="310"
          height="222"
          rx="26"
          fill="url(#moltenGrad)"
          stroke="#4a1002"
          strokeWidth="3"
        />
        <rect x="102" y="156" width="188" height="24" rx="6" fill="#fff6da" opacity="0.85" />
        <rect x="102" y="192" width="110" height="9" rx="4.5" fill="#7a2607" opacity="0.55" />
        <rect x="102" y="216" width="252" height="9" rx="4.5" fill="#7a2607" opacity="0.4" />
        <rect x="102" y="240" width="160" height="9" rx="4.5" fill="#7a2607" opacity="0.4" />
      </g>
      <g opacity="0.9">
        <path
          d="M300 90 L340 40"
          stroke="#ffd98a"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#tightBlur)"
        />
        <path
          d="M330 120 L385 96"
          stroke="#ffb347"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#tightBlur)"
        />
        <path
          d="M270 60 L262 12"
          stroke="#ffe6ad"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#tightBlur)"
        />
        <path
          d="M352 150 L404 158"
          stroke="#ED6B17"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#tightBlur)"
        />
      </g>
      <g>
        <path
          d="M312 96 l7.5 19 l19 7.5 l-19 7.5 l-7.5 19 l-7.5 -19 l-19 -7.5 l19 -7.5 z"
          fill="#fff2c4"
        />
        <path
          d="M350 142 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 l12 -5 z"
          fill="#ED6B17"
          opacity="0.95"
        />
        <path
          d="M284 66 l4 9.5 l9.5 4 l-9.5 4 l-4 9.5 l-4 -9.5 l-9.5 -4 l9.5 -4 z"
          fill="#C9A227"
        />
        <circle cx="336" cy="112" r="4.5" fill="#ffe6ad" />
        <circle cx="368" cy="124" r="3" fill="#ffb347" />
        <circle cx="316" cy="58" r="2.6" fill="#fff2c4" />
      </g>
      <ellipse
        cx="278"
        cy="150"
        rx="46"
        ry="30"
        fill="#fff6da"
        opacity="0.85"
        filter="url(#tightBlur)"
      />
      <g transform="rotate(-40 272 262)">
        <rect x="246" y="204" width="54" height="240" rx="27" fill="url(#steelHandleGrad)" />
        <rect x="259" y="224" width="12" height="196" rx="6" fill="#ffffff" opacity="0.22" />
      </g>
      <g transform="rotate(-40 272 262)">
        <rect
          x="206"
          y="156"
          width="134"
          height="86"
          rx="18"
          fill="url(#steelHeadGrad)"
          stroke="#1c212a"
          strokeWidth="4"
        />
        <rect x="220" y="166" width="104" height="18" rx="8" fill="#ffffff" opacity="0.55" />
      </g>
    </svg>
  );
}
