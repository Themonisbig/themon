import React from 'react';

/**
 * Original creepy porcelain doll: lace bonnet, cracked face, stitched mouth,
 * hollow eyes that glow red. Fully vector, drawn in code.
 *
 * Coordinate system: origin = neck. Head centre ≈ (0,-180). Shoes ≈ y 1190.
 *
 * theta: head/body rotation in degrees. 0 = facing camera, 180 = back turned.
 */
export type DollProps = {
  theta?: number;
  bodyTheta?: number;
  eyeGlow?: number; // 0..1
  mouth?: number; // 0..1 jaw open (lip-sync)
  tilt?: number; // head tilt degrees
  redLight?: number; // 0..1 red key light on the porcelain
  showBody?: boolean;
  id?: string;
};

const SCALLOP = (rx: number, ry: number, n: number, r: number, cy = 0) =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return {x: Math.cos(a) * rx, y: cy + Math.sin(a) * ry, r};
  });

export const DOLL_VIEWBOX = '-330 -400 660 1640';

export const Doll: React.FC<DollProps> = ({
  theta = 0,
  bodyTheta,
  eyeGlow = 0,
  mouth = 0,
  tilt = 0,
  redLight = 0,
  showBody = true,
  id = 'doll',
}) => {
  const rad = (theta * Math.PI) / 180;
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const bRad = ((bodyTheta ?? theta) * Math.PI) / 180;
  const bs = Math.sin(bRad);
  const bc = Math.cos(bRad);
  const faceVisible = c > 0.02;
  const backVisible = c < -0.02;
  const faceX = s * 112;
  const backX = -s * 112;
  const bodyW = 0.86 + 0.14 * Math.abs(bc);
  const g = (n: string) => `${id}-${n}`;
  const u = (n: string) => `url(#${g(n)})`;
  const glow = Math.max(0, Math.min(1, eyeGlow));
  const jaw = Math.max(0, Math.min(1, mouth));

  return (
    <g>
      <defs>
        <radialGradient id={g('porcelain')} cx="45%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="55%" stopColor="#efe2cf" />
          <stop offset="100%" stopColor="#b9a58f" />
        </radialGradient>
        <radialGradient id={g('bonnet')} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#3b2147" />
          <stop offset="70%" stopColor="#1a0d22" />
          <stop offset="100%" stopColor="#09040c" />
        </radialGradient>
        <linearGradient id={g('dress')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c1636" />
          <stop offset="60%" stopColor="#150a1c" />
          <stop offset="100%" stopColor="#07030a" />
        </linearGradient>
        <linearGradient id={g('dressSide')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.75" />
          <stop offset="30%" stopColor="#000" stopOpacity="0" />
          <stop offset="70%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id={g('socket')} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="70%" stopColor="#140609" />
          <stop offset="100%" stopColor="#4a2a2a" />
        </radialGradient>
        <radialGradient id={g('eye')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2f2" />
          <stop offset="25%" stopColor="#ff3048" />
          <stop offset="100%" stopColor="#7a0010" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('eyeBloom')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff2a40" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#ff0022" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff0022" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('redkey')} cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#ff1f3d" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff1f3d" stopOpacity="0" />
        </radialGradient>
        <clipPath id={g('faceClip')}>
          <ellipse cx="0" cy="0" rx="122" ry="146" />
        </clipPath>
      </defs>

      {showBody && (
        <g>
          {/* legs + shoes */}
          {[-1, 1].map((k) => (
            <g key={k} transform={`translate(${k * 62 * bodyW}, 0)`}>
              <rect x={-24} y={1010} width={48} height={150} rx={20} fill="#e9dccb" />
              <rect x={-24} y={1040} width={48} height={14} fill="#2a1630" opacity={0.7} />
              <rect x={-24} y={1080} width={48} height={14} fill="#2a1630" opacity={0.7} />
              <path d="M -34 1150 Q -36 1196 0 1200 L 44 1200 Q 60 1196 52 1168 Q 40 1150 0 1148 Z" fill="#0c0610" />
              <circle cx={10} cy={1162} r={6} fill="#c51c35" />
            </g>
          ))}

          {/* dress */}
          <g transform={`scale(${bodyW},1)`}>
            <path
              d="M -128 10 Q -150 300 -230 700 Q -270 900 -300 1030 L 300 1030 Q 270 900 230 700 Q 150 300 128 10 Q 0 40 -128 10 Z"
              fill={u('dress')}
            />
            {/* pleats */}
            {[-180, -110, -40, 40, 110, 180].map((x, i) => (
              <path
                key={i}
                d={`M ${x * 0.35} 120 Q ${x * 0.7} 600 ${x} 1025`}
                stroke="#4a2a58"
                strokeWidth={3}
                opacity={0.5}
                fill="none"
              />
            ))}
            <path
              d="M -128 10 Q -150 300 -230 700 Q -270 900 -300 1030 L 300 1030 Q 270 900 230 700 Q 150 300 128 10 Q 0 40 -128 10 Z"
              fill={u('dressSide')}
            />
            {/* lace hem */}
            {Array.from({length: 26}, (_, i) => (
              <circle key={i} cx={-300 + i * 24} cy={1034} r={16} fill="#e8dfd2" />
            ))}
            {Array.from({length: 26}, (_, i) => (
              <circle key={`h${i}`} cx={-300 + i * 24} cy={1036} r={6} fill="#1a0d22" />
            ))}
            {/* blood-red sash */}
            <path d="M -175 430 Q 0 470 175 430 L 182 475 Q 0 515 -182 475 Z" fill="#8a0014" />
          </g>

          {/* front details */}
          {bc > 0.02 && (
            <g transform={`translate(${bs * 90}, 0) scale(${bc}, 1)`}>
              {[150, 230, 310, 390].map((y) => (
                <g key={y}>
                  <circle cx={0} cy={y} r={11} fill="#c51c35" />
                  <circle cx={-3} cy={y - 3} r={3} fill="#ff8d9a" />
                </g>
              ))}
              {/* bow on sash */}
              <path d="M 0 452 L -70 410 L -66 500 Z" fill="#b3001b" />
              <path d="M 0 452 L 70 410 L 66 500 Z" fill="#b3001b" />
              <circle cx={0} cy={452} r={18} fill="#d4102b" />
            </g>
          )}
          {/* back details: corset lacing */}
          {bc < -0.02 && (
            <g transform={`translate(${-bs * 90}, 0) scale(${-bc}, 1)`}>
              <path d="M 0 60 L 0 430" stroke="#0a0410" strokeWidth={8} />
              {Array.from({length: 8}, (_, i) => (
                <path
                  key={i}
                  d={`M -26 ${80 + i * 44} L 26 ${102 + i * 44} M 26 ${80 + i * 44} L -26 ${102 + i * 44}`}
                  stroke="#c51c35"
                  strokeWidth={5}
                />
              ))}
              {/* huge back bow */}
              <path d="M 0 452 L -120 380 Q -150 452 -120 530 Z" fill="#b3001b" />
              <path d="M 0 452 L 120 380 Q 150 452 120 530 Z" fill="#b3001b" />
              <path d="M -8 460 L -60 640 L -30 630 L 0 470 Z" fill="#8a0014" />
              <path d="M 8 460 L 60 640 L 30 630 L 0 470 Z" fill="#8a0014" />
              <circle cx={0} cy={452} r={26} fill="#d4102b" />
            </g>
          )}

          {/* arms (hang outside the dress) */}
          {[-1, 1].map((k) => (
            <g key={k}>
              <path
                d={`M ${k * 128 * bodyW} 40 Q ${k * 215 * bodyW} 260 ${k * 222 * bodyW} 560`}
                stroke="#1d0f25"
                strokeWidth={62}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={`M ${k * 128 * bodyW} 40 Q ${k * 215 * bodyW} 260 ${k * 222 * bodyW} 560`}
                stroke="#3a2046"
                strokeWidth={10}
                strokeLinecap="round"
                fill="none"
                opacity={0.6}
                transform={`translate(${-k * 14},0)`}
              />
              {/* lace cuff */}
              {Array.from({length: 7}, (_, i) => (
                <circle key={i} cx={k * 222 * bodyW - 30 + i * 10} cy={575 + (i % 2) * 6} r={12} fill="#e8dfd2" />
              ))}
              {/* porcelain hand with jointed fingers */}
              <g transform={`translate(${k * 222 * bodyW}, 600)`}>
                <ellipse cx={0} cy={18} rx={30} ry={36} fill={u('porcelain')} />
                {[-18, -6, 6, 18].map((fx, i) => (
                  <rect key={i} x={fx - 6} y={40} width={12} height={46 - Math.abs(fx) * 0.6} rx={6} fill="#e6d8c4" />
                ))}
                <path d="M -12 10 L 6 34" stroke="#5a4038" strokeWidth={2} opacity={0.6} />
              </g>
            </g>
          ))}

          {/* lace ruff collar */}
          {SCALLOP(150 * bodyW, 34, 22, 26, 22).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={i % 2 ? '#efe7da' : '#ddd2c2'} />
          ))}
          <ellipse cx={0} cy={22} rx={120 * bodyW} ry={22} fill="#f4ede2" />
        </g>
      )}

      {/* ---------------- head ---------------- */}
      <g transform={`rotate(${tilt}, 0, 0) translate(0, -185)`}>
        {/* outer lace frill of bonnet */}
        {SCALLOP(192, 198, 30, 28).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={i % 2 ? '#2a1632' : '#20102a'} />
        ))}
        <ellipse cx={0} cy={0} rx={182} ry={188} fill={u('bonnet')} />
        {/* bonnet seams sweep with rotation */}
        {[-0.6, -0.2, 0.2, 0.6].map((k, i) => {
          const x = Math.sin(Math.asin(k) + rad) * 182;
          const vis = Math.cos(Math.asin(k) + rad);
          return (
            <path
              key={i}
              d={`M ${x * 0.15} -186 Q ${x} 0 ${x * 0.15} 186`}
              stroke="#4c2c5a"
              strokeWidth={3}
              fill="none"
              opacity={vis < 0 ? 0.55 : 0}
            />
          );
        })}

        {backVisible && (
          <g transform={`translate(${backX}, 40) scale(${-c}, 1)`}>
            <path d="M 0 0 L -95 -62 Q -120 0 -95 62 Z" fill="#b3001b" />
            <path d="M 0 0 L 95 -62 Q 120 0 95 62 Z" fill="#b3001b" />
            <path d="M -60 -38 L -10 -6 M 60 -38 L 10 -6" stroke="#ff4d63" strokeWidth={4} opacity={0.6} />
            <path d="M -6 8 L -40 150 L -16 142 L 0 14 Z" fill="#8a0014" />
            <path d="M 6 8 L 40 150 L 16 142 L 0 14 Z" fill="#8a0014" />
            <circle cx={0} cy={0} r={20} fill="#d4102b" />
          </g>
        )}

        {faceVisible && (
          <g transform={`translate(${faceX}, 6) scale(${c}, 1)`}>
            {/* inner lace frame around face */}
            {SCALLOP(140, 162, 28, 20).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={i % 2 ? '#efe7da' : '#d9cdbc'} />
            ))}
            <ellipse cx={0} cy={0} rx={122} ry={146} fill={u('porcelain')} />
            <g clipPath={u('faceClip')}>
              {/* side shading for roundness */}
              <ellipse cx={-70} cy={10} rx={80} ry={150} fill="#7b6658" opacity={0.18} />
              <ellipse cx={0} cy={0} rx={122} ry={146} fill={u('redkey')} opacity={redLight} />
              {/* cracks */}
              <path
                d="M -38 -146 L -30 -112 L -44 -88 L -28 -60 L -36 -40 M -44 -88 L -66 -78 M -30 -112 L -12 -104"
                stroke="#2b1b1d"
                strokeWidth={2.6}
                fill="none"
                strokeLinejoin="round"
              />
              <path d="M 120 10 L 92 24 L 98 48 L 76 70 M 92 24 L 70 18" stroke="#2b1b1d" strokeWidth={2.4} fill="none" />
              <path d="M -20 146 L -14 120 L -26 104" stroke="#2b1b1d" strokeWidth={2} fill="none" />
              {/* cheeks */}
              <circle cx={-72} cy={38} r={26} fill="#e2858e" opacity={0.28} />
              <circle cx={72} cy={38} r={26} fill="#e2858e" opacity={0.28} />
            </g>
            {/* brows, painted thin and high */}
            <path d="M -80 -66 Q -48 -88 -18 -70" stroke="#3b2523" strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d="M 80 -66 Q 48 -88 18 -70" stroke="#3b2523" strokeWidth={4} fill="none" strokeLinecap="round" />
            {/* eyes */}
            {[-1, 1].map((k) => (
              <g key={k} transform={`translate(${k * 46}, -16)`}>
                <ellipse cx={0} cy={0} rx={33} ry={38} fill={u('socket')} />
                {/* painted lashes */}
                {[-24, -12, 0, 12, 24].map((lx) => (
                  <path key={lx} d={`M ${lx} -34 L ${lx * 1.3} -50`} stroke="#1a0d0e" strokeWidth={3} strokeLinecap="round" />
                ))}
                {/* drip under eye */}
                <path d={`M ${k * 8} 36 Q ${k * 10} 60 ${k * 6} 78`} stroke="#1a0d0e" strokeWidth={3} opacity={0.55} fill="none" />
                <circle cx={0} cy={2} r={10 + glow * 6} fill={glow > 0.05 ? u('eye') : '#3a1a1a'} />
                <circle cx={0} cy={2} r={3.5} fill={glow > 0.05 ? '#fff' : '#120708'} opacity={0.4 + glow * 0.6} />
                {glow > 0.02 && <circle cx={0} cy={2} r={95} fill={u('eyeBloom')} opacity={glow} />}
                {glow > 0.02 && <circle cx={0} cy={2} r={40} fill={u('eyeBloom')} opacity={glow} />}
              </g>
            ))}
            {/* nose */}
            <path d="M -8 40 Q 0 48 8 40" stroke="#8d6d60" strokeWidth={3} fill="none" strokeLinecap="round" />
            {/* mouth: tiny painted lips + a long stitched seam */}
            <g transform="translate(0, 84)">
              <ellipse cx={0} cy={2} rx={24 + jaw * 8} ry={4 + jaw * 30} fill="#120206" />
              {jaw > 0.05 && <ellipse cx={0} cy={6 + jaw * 8} rx={14 + jaw * 4} ry={jaw * 14} fill="#4d0410" />}
              <path d={`M -22 ${-2 - jaw * 26} Q 0 ${-12 - jaw * 26} 22 ${-2 - jaw * 26} Q 0 ${4 - jaw * 26} -22 ${-2 - jaw * 26} Z`} fill="#a3132a" />
              <path d={`M -18 ${4 + jaw * 30} Q 0 ${12 + jaw * 30} 18 ${4 + jaw * 30} Q 0 ${0 + jaw * 30} -18 ${4 + jaw * 30} Z`} fill="#a3132a" />
              <path d="M -86 -10 Q -60 4 -26 0 M 26 0 Q 60 4 86 -10" stroke="#2b1517" strokeWidth={3} fill="none" />
              {[-78, -62, -46, -34, 34, 46, 62, 78].map((x) => {
                const y = x < 0 ? -10 + ((x + 86) / 60) * 10 : -10 + ((86 - x) / 60) * 10;
                return <path key={x} d={`M ${x - 4} ${y - 9} L ${x + 4} ${y + 9}`} stroke="#2b1517" strokeWidth={3} strokeLinecap="round" />;
              })}
            </g>
            {/* chin ribbon ties */}
            <path d="M -110 90 Q -60 170 -10 178" stroke="#a3001b" strokeWidth={14} fill="none" strokeLinecap="round" />
            <path d="M 110 90 Q 60 170 10 178" stroke="#a3001b" strokeWidth={14} fill="none" strokeLinecap="round" />
            <circle cx={0} cy={178} r={14} fill="#d4102b" />
          </g>
        )}
      </g>
    </g>
  );
};
