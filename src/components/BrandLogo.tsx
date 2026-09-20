import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  customLogoUrl?: string | null;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showSubtitle = true,
  customLogoUrl,
  className = "",
}) => {
  if (customLogoUrl) {
    const heightClass =
      size === "sm" ? "h-12" : size === "md" ? "h-20" : size === "lg" ? "h-32" : "h-44";
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <img
          src={customLogoUrl}
          alt="1000 عشبة - جُمعت لأجلك"
          className={`${heightClass} object-contain drop-shadow-md`}
        />
      </div>
    );
  }

  // Dimensions based on size
  const scale = size === "sm" ? 0.45 : size === "md" ? 0.7 : size === "lg" ? 1 : 1.35;
  const width = Math.round(360 * scale);
  const height = Math.round(240 * scale);

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 360 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm transition-transform hover:scale-[1.01]"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D8AC38" />
            <stop offset="50%" stopColor="#B3861B" />
            <stop offset="100%" stopColor="#8C630D" />
          </linearGradient>
          <linearGradient id="goldLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5DC7D" />
            <stop offset="100%" stopColor="#C49B28" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F3E5AB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C49B28" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Arch Border (Ancient Egyptian Shrine) */}
        <path
          d="M 110 135 L 110 55 C 110 22, 250 22, 250 55 L 250 135"
          stroke="url(#goldGrad)"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M 115 135 L 115 57 C 115 28, 245 28, 245 57 L 245 135"
          stroke="url(#goldGrad)"
          strokeWidth="1"
          strokeDasharray="2 3"
          fill="none"
        />

        {/* Sun Glow Behind Ankh */}
        <circle cx="180" cy="36" r="22" fill="url(#sunGlow)" />

        {/* Sun Rays */}
        <g stroke="url(#goldGrad)" strokeWidth="1.2" strokeLinecap="round">
          <line x1="180" y1="14" x2="180" y2="8" />
          <line x1="164" y1="20" x2="158" y2="15" />
          <line x1="196" y1="20" x2="202" y2="15" />
          <line x1="152" y1="32" x2="145" y2="30" />
          <line x1="208" y1="32" x2="215" y2="30" />
          <line x1="156" y1="44" x2="150" y2="48" />
          <line x1="204" y1="44" x2="210" y2="48" />
        </g>

        {/* The Sacred Ankh (Key of Life) */}
        <g fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round">
          {/* Oval head */}
          <ellipse cx="180" cy="30" rx="6.5" ry="9" />
          {/* Horizontal crossbar */}
          <line x1="170" y1="42" x2="190" y2="42" strokeWidth="2.5" />
          {/* Vertical stem */}
          <line x1="180" y1="42" x2="180" y2="56" strokeWidth="2.5" />
        </g>

        {/* Left Hieroglyphic Column (Eye of Horus, Bread, Shrine) */}
        <g stroke="url(#goldGrad)" strokeWidth="1.2" fill="none">
          {/* Eye of Horus */}
          <path d="M 125 45 C 128 40, 137 40, 140 45 C 137 49, 128 49, 125 45 Z" />
          <circle cx="132" cy="45" r="2" fill="url(#goldGrad)" />
          <path d="M 132 47 L 132 53" />
          <path d="M 134 48 C 137 51, 140 50, 141 53" />

          {/* Bread loaf glyph */}
          <path d="M 128 62 C 128 58, 136 58, 136 62 Z" fill="url(#goldGrad)" />

          {/* Cup/Water glyph */}
          <path d="M 126 72 C 127 76, 137 76, 138 72 Z" />
          <line x1="124" y1="72" x2="140" y2="72" />
        </g>

        {/* Right Hieroglyphic Column (Sacred Horus Falcon & Staff) */}
        <g stroke="url(#goldGrad)" strokeWidth="1.2" fill="none">
          {/* Reeds / Feather */}
          <path d="M 226 40 L 226 52" />
          <path d="M 223 44 C 226 40, 226 50, 223 52" />
          {/* Falcon silhouette */}
          <path
            d="M 224 64 C 222 62, 227 58, 232 60 C 234 62, 235 66, 233 70 C 235 73, 237 78, 238 82 L 232 82 C 229 78, 228 73, 227 70 C 225 72, 223 75, 223 79 L 221 79 C 222 74, 223 68, 224 64 Z"
            fill="url(#goldGrad)"
          />
        </g>

        {/* Left Healer / Priestess (Kneeling with outstretched hands) */}
        <g fill="#182A22" stroke="url(#goldGrad)" strokeWidth="1.2">
          {/* Headdress & Head */}
          <circle cx="138" cy="88" r="5" fill="url(#goldGrad)" />
          {/* Nemes / Royal Hair cloth */}
          <path d="M 134 88 C 133 93, 134 99, 138 103 L 135 104 C 131 99, 130 92, 134 88 Z" fill="url(#goldGrad)" />
          {/* Body & Torso */}
          <path d="M 137 94 C 134 100, 132 108, 133 118 L 143 118 C 141 108, 140 100, 137 94 Z" fill="#182A22" />
          {/* Arms reaching to the sacred mortar */}
          <path d="M 139 100 C 145 103, 153 105, 162 108" fill="none" stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinecap="round" />
          {/* Knees & Robe */}
          <path d="M 133 118 C 130 120, 126 123, 126 128 L 148 128 C 148 123, 145 120, 143 118 Z" fill="#182A22" />
        </g>

        {/* Right Healer / Priestess (Mirrored) */}
        <g fill="#182A22" stroke="url(#goldGrad)" strokeWidth="1.2">
          {/* Head */}
          <circle cx="222" cy="88" r="5" fill="url(#goldGrad)" />
          {/* Headdress */}
          <path d="M 226 88 C 227 93, 226 99, 222 103 L 225 104 C 229 99, 230 92, 226 88 Z" fill="url(#goldGrad)" />
          {/* Body */}
          <path d="M 223 94 C 226 100, 228 108, 227 118 L 217 118 C 219 108, 220 100, 223 94 Z" fill="#182A22" />
          {/* Arms reaching to mortar */}
          <path d="M 221 100 C 215 103, 207 105, 198 108" fill="none" stroke="url(#goldGrad)" strokeWidth="1.8" strokeLinecap="round" />
          {/* Knees */}
          <path d="M 227 118 C 230 120, 234 123, 234 128 L 212 128 C 212 123, 215 120, 217 118 Z" fill="#182A22" />
        </g>

        {/* Center: Ancient Medicinal Plant Blooming from Mortar */}
        {/* Leaves & Herbs */}
        <g stroke="url(#goldGrad)" strokeWidth="1" fill="#182A22">
          {/* Central Stem */}
          <path d="M 180 105 L 180 58" stroke="#132B20" strokeWidth="2.5" strokeLinecap="round" />

          {/* Top leaves */}
          <path d="M 180 58 C 175 52, 172 45, 180 42 C 188 45, 185 52, 180 58 Z" fill="#182A22" stroke="url(#goldGrad)" />
          {/* Side pairs of leaves */}
          <path d="M 180 68 C 170 63, 164 68, 166 75 C 174 76, 178 72, 180 68 Z" fill="#182A22" stroke="url(#goldGrad)" />
          <path d="M 180 68 C 190 63, 196 68, 194 75 C 186 76, 182 72, 180 68 Z" fill="#182A22" stroke="url(#goldGrad)" />
          <path d="M 180 80 C 168 76, 160 83, 162 90 C 172 90, 177 84, 180 80 Z" fill="#182A22" stroke="url(#goldGrad)" />
          <path d="M 180 80 C 192 76, 200 83, 198 90 C 188 90, 183 84, 180 80 Z" fill="#182A22" stroke="url(#goldGrad)" />
          <path d="M 180 92 C 166 90, 158 97, 162 104 C 172 102, 176 96, 180 92 Z" fill="#182A22" stroke="url(#goldGrad)" />
          <path d="M 180 92 C 194 90, 202 97, 198 104 C 188 102, 184 96, 180 92 Z" fill="#182A22" stroke="url(#goldGrad)" />
        </g>

        {/* Pestle (يد الهاون) */}
        <path
          d="M 188 84 L 202 70 C 204 68, 207 70, 205 73 L 194 92 Z"
          fill="url(#goldGrad)"
        />

        {/* Central Botanical Mortar (الهاون الصيدلاني) */}
        <path
          d="M 160 102 Q 180 99 200 102 L 196 118 Q 180 128 164 118 Z"
          fill="#182A22"
          stroke="url(#goldGrad)"
          strokeWidth="2.5"
        />
        {/* Mortar Pedestal Base */}
        <path
          d="M 172 118 L 170 126 L 190 126 L 188 118 Z"
          fill="url(#goldGrad)"
        />
        <line x1="166" y1="126" x2="194" y2="126" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Divider line under emblem */}
        <line x1="85" y1="138" x2="275" y2="138" stroke="url(#goldGrad)" strokeWidth="2.2" strokeLinecap="round" />

        {/* Typography: "1000 عشبة" */}
        <text
          x="180"
          y="172"
          textAnchor="middle"
          fontSize="30"
          fontWeight="900"
          fontFamily="'Cairo', sans-serif"
          fill="#132B20"
          letterSpacing="1"
        >
          1000 عشبة
        </text>

        {showSubtitle && (
          <>
            {/* Subtitle: "جُمعت لأجلك" */}
            <text
              x="180"
              y="196"
              textAnchor="middle"
              fontSize="18"
              fontWeight="700"
              fontFamily="'Amiri', serif"
              fill="#182A22"
            >
              جُمعت لأجلك
            </text>

            {/* Left and Right Accent Lines for Slogan */}
            <line x1="85" y1="192" x2="125" y2="192" stroke="url(#goldGrad)" strokeWidth="1.8" />
            <line x1="235" y1="192" x2="275" y2="192" stroke="url(#goldGrad)" strokeWidth="1.8" />

            {/* Winged Solar Disc (قرص الشمس المجنح) */}
            <g transform="translate(180, 216)">
              {/* Central Solar Circle */}
              <circle cx="0" cy="0" r="7" fill="url(#goldLight)" stroke="url(#goldGrad)" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="4.5" fill="#B3861B" />

              {/* Left Wing */}
              <g stroke="url(#goldGrad)" strokeWidth="1" fill="#D8AC38">
                <path d="M -7 -1 C -18 -6, -38 -6, -55 -2 C -42 1, -25 2, -7 2 Z" />
                <path d="M -7 2 C -20 4, -36 5, -50 7 C -38 7, -22 6, -7 4 Z" opacity="0.85" />
                <path d="M -7 4 C -18 7, -30 9, -42 12 C -30 10, -18 7, -7 5 Z" opacity="0.7" />
              </g>

              {/* Right Wing (Mirrored) */}
              <g stroke="url(#goldGrad)" strokeWidth="1" fill="#D8AC38">
                <path d="M 7 -1 C 18 -6, 38 -6, 55 -2 C 42 1, 25 2, 7 2 Z" />
                <path d="M 7 2 C 20 4, 36 5, 50 7 C 38 7, 22 6, 7 4 Z" opacity="0.85" />
                <path d="M 7 4 C 18 7, 30 9, 42 12 C 30 10, 18 7, 7 5 Z" opacity="0.7" />
              </g>
            </g>
          </>
        )}
      </svg>
    </div>
  );
};
