/** Ilustración vectorial original de SalesIA. Sin peticiones externas ni imágenes generadas por IA. */
export default function CommerceMascot() {
  return (
    <svg className="salesia-mascot" viewBox="0 0 390 360" role="img" aria-label="Carrito de compras sonriente con productos y gráficos de ventas">
      <defs>
        <filter id="mascot-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="9" stdDeviation="9" floodColor="#94685e" floodOpacity=".15"/></filter>
      </defs>
      <g className="mascot-sparkles" fill="#ffbd70">
        <path d="M329 83l4 11 11 4-11 4-4 11-4-11-11-4 11-4Z"/>
        <path d="M76 129l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#73c8ac"/>
        <circle cx="102" cy="64" r="5" fill="#8c9ff0"/>
        <circle cx="308" cy="176" r="4" fill="#f5a4a4"/>
      </g>
      <g className="mascot-chart" transform="translate(230 39) rotate(10)">
        <rect width="106" height="85" rx="17" fill="#fff" stroke="#e2e6f5" strokeWidth="3"/>
        <rect x="20" y="48" width="15" height="21" rx="5" fill="#81d5be"/>
        <rect x="43" y="34" width="15" height="35" rx="5" fill="#70aee8"/>
        <rect x="66" y="19" width="15" height="50" rx="5" fill="#ffb584"/>
        <path d="m21 29 14-8 13 5 19-14" stroke="#4b7d86" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      </g>
      <ellipse cx="191" cy="322" rx="142" ry="18" fill="#eca5a2" opacity=".3"/>
      <g className="mascot-parcel" transform="translate(72 60) rotate(-14)">
        <rect width="75" height="79" x="0" y="8" rx="12" fill="#ffd28f" stroke="#eda76f" strokeWidth="3"/>
        <path d="M3 33h70M36 9v30" stroke="#efab6a" strokeWidth="4"/>
        <path d="M28 12c-23-25-28 8 7 13 32-7 25-36 5-13" stroke="#d87364" strokeWidth="5" fill="none" strokeLinecap="round"/>
      </g>
      <g className="mascot-body" filter="url(#mascot-shadow)">
        <path d="M81 142h29l19 108c2 9 9 15 18 15h142" stroke="#34526f" strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M119 161h186l-22 78c-2 10-11 17-22 17H145c-9 0-16-6-18-15Z" fill="#49bfa6" stroke="#248b85" strokeWidth="5" strokeLinejoin="round"/>
        <path d="M137 177h151l-11 40H145Z" fill="#81d9bd" opacity=".62"/>
        <path d="M148 185v48M178 183v52M209 183v52M240 183v52M270 182l-4 50" stroke="#2ba38d" strokeWidth="4" opacity=".42"/>
        <g className="mascot-eyes">
          <ellipse cx="173" cy="215" rx="10" ry="12" fill="#253d53"/>
          <ellipse cx="241" cy="215" rx="10" ry="12" fill="#253d53"/>
          <circle cx="177" cy="211" r="3.5" fill="#fff"/>
          <circle cx="245" cy="211" r="3.5" fill="#fff"/>
        </g>
        <circle cx="151" cy="234" r="9" fill="#ff8b9b" opacity=".9"/>
        <circle cx="262" cy="234" r="9" fill="#ff8b9b" opacity=".9"/>
        <path d="M189 235q18 22 36 0" stroke="#254c55" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <circle cx="156" cy="286" r="20" fill="#334f69"/>
        <circle cx="156" cy="286" r="9" fill="#e9f8f2"/>
        <circle cx="268" cy="286" r="20" fill="#334f69"/>
        <circle cx="268" cy="286" r="9" fill="#e9f8f2"/>
      </g>
      <g className="mascot-tag" transform="translate(25 238) rotate(-12)">
        <rect width="76" height="47" rx="14" fill="#fff" stroke="#e1eaf0" strokeWidth="2"/>
        <text x="38" y="20" textAnchor="middle" fontSize="9" fontWeight="800" fill="#6f8497">VENTAS</text>
        <text x="38" y="36" textAnchor="middle" fontSize="14" fontWeight="900" fill="#25867c">+18%</text>
      </g>
      <path d="m327 247 12-10 12 10v19h-24Z" fill="#8c9ff0" opacity=".7"/>
    </svg>
  );
}
