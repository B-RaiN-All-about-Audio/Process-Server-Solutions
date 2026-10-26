import re

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 576" width="1024" height="576">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091426" />
      <stop offset="45%" stop-color="#0d1b33" />
      <stop offset="100%" stop-color="#060c18" />
    </linearGradient>

    <!-- Teal Glow & Gradients -->
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="50%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#0891b2" />
    </linearGradient>

    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0e7490" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#083344" stop-opacity="0.85" />
    </linearGradient>

    <!-- Orange / Yellow Pin & Envelope Gradients -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="40%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>

    <linearGradient id="amberTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="shadowHeavy" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#030712" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- Dark Background Canvas -->
  <rect width="1024" height="576" fill="url(#bgNavy)" />

  <!-- Background Orbit / Radar Swirl Arcs -->
  <g opacity="0.3" stroke="#0ea5e9" stroke-width="2.5" fill="none">
    <ellipse cx="512" cy="225" rx="190" ry="140" stroke-dasharray="14 18" />
    <ellipse cx="512" cy="225" rx="230" ry="170" stroke-dasharray="6 22" />
  </g>

  <!-- ================= EMBLEM CONTAINER (Centered at X=512, Y=210) ================= -->
  <g id="emblem-group">
    <!-- Teal Shield Contour Backdrop -->
    <path d="M512 85 C575 85 640 105 660 145 C660 235 605 305 512 342 C419 305 364 235 364 145 C384 105 449 85 512 85 Z"
          fill="url(#shieldGrad)" stroke="#14b8a6" stroke-width="7" stroke-linejoin="round" filter="url(#shadowHeavy)" />

    <!-- Shield Inner Bevel Accent -->
    <path d="M512 102 C562 102 622 118 640 152 C640 226 592 288 512 320 C432 288 384 226 384 152 C402 118 462 102 512 102 Z"
          fill="none" stroke="#06b6d4" stroke-width="2.5" opacity="0.65" />

    <!-- Radar / GPS Map Pin (Orange / Yellow) -->
    <!-- Pin Head & Pointer -->
    <path d="M512 105 C552 105 578 132 578 170 C578 208 538 265 512 288 C486 265 446 208 446 170 C446 132 472 105 512 105 Z"
          fill="url(#goldGrad)" stroke="#091426" stroke-width="8" stroke-linejoin="round" />

    <!-- GPS Circuit Traces on Pin -->
    <g stroke="#091426" stroke-width="4.5" fill="none" stroke-linecap="round">
      <path d="M428 145 L458 145 M418 178 L460 178 M436 208 L475 208" />
      <circle cx="424" cy="145" r="5" fill="#38bdf8" stroke="#091426" stroke-width="3" />
      <circle cx="414" cy="178" r="5" fill="#38bdf8" stroke="#091426" stroke-width="3" />
      <circle cx="432" cy="208" r="5" fill="#38bdf8" stroke="#091426" stroke-width="3" />
      
      <!-- Target ring inside Pin head -->
      <circle cx="512" cy="165" r="26" fill="#091426" stroke="#091426" stroke-width="2" />
      <circle cx="512" cy="165" r="16" fill="#ffffff" />
    </g>

    <!-- Speed / Motion lines behind arm (Left) -->
    <g stroke="#f97316" stroke-width="6" stroke-linecap="round" opacity="0.95">
      <line x1="335" y1="230" x2="425" y2="230" />
      <line x1="365" y1="245" x2="415" y2="245" />
      <line x1="385" y1="260" x2="430" y2="260" stroke="#f59e0b" stroke-width="5" />
    </g>

    <!-- Arm / Sleeve (Orange with dark borders) -->
    <polygon points="380,210 452,204 456,252 380,265" fill="url(#orangeGrad)" stroke="#091426" stroke-width="7" stroke-linejoin="round" />
    <line x1="395" y1="236" x2="445" y2="232" stroke="#fde047" stroke-width="3.5" stroke-linecap="round" />

    <!-- White Cuff -->
    <polygon points="452,204 472,202 476,250 456,252" fill="#ffffff" stroke="#091426" stroke-width="6.5" stroke-linejoin="round" />

    <!-- Hand (Flesh tone grasping envelope) -->
    <g id="hand-grip" stroke="#091426" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
      <!-- Back of hand & thumb -->
      <path d="M472 208 C495 200 522 202 546 206 C558 208 554 220 540 224 L502 226" fill="#fed7aa" />
      <!-- Fingers wrapped around envelope -->
      <path d="M502 226 C514 226 534 228 544 230 C548 238 540 248 528 248 L490 248" fill="#fdba74" />
      <path d="M490 248 C505 248 525 250 534 254 C538 262 528 268 514 268 L480 268" fill="#fb923c" />
      <path d="M480 266 C492 266 508 268 518 272 C522 280 512 284 500 284 L474 278" fill="#f97316" />
    </g>

    <!-- Legal Envelope with "SERVED" Rubber Stamp -->
    <g id="legal-envelope" filter="url(#shadowHeavy)">
      <!-- Main Envelope body (tilted angle) -->
      <polygon points="518,206 626,162 668,212 558,260" fill="#fde047" stroke="#091426" stroke-width="7" stroke-linejoin="round" />
      
      <!-- Envelope Flap V-Fold -->
      <polyline points="518,206 596,218 626,162" fill="#fef08a" stroke="#091426" stroke-width="5" stroke-linejoin="round" />
      <polyline points="558,260 596,218 668,212" fill="none" stroke="#d97706" stroke-width="2.5" />

      <!-- Notary / Certified Seal in Corner -->
      <circle cx="636" cy="186" r="12" fill="#d97706" stroke="#091426" stroke-width="3" />
      <path d="M636 178 L638 184 L644 186 L638 188 L636 194 L634 188 L628 186 L634 184 Z" fill="#fde047" />

      <!-- Red/Black Rubber Stamp Box: "SERVED" -->
      <g transform="translate(584, 222) rotate(-16)">
        <rect x="-38" y="-14" width="76" height="28" rx="3" fill="#091426" stroke="#091426" stroke-width="2" />
        <rect x="-35" y="-11" width="70" height="22" rx="2" fill="#fef08a" stroke="#091426" stroke-width="2" />
        <text x="0" y="5" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="14" fill="#091426" letter-spacing="1.5">
          SERVED
        </text>
      </g>
    </g>
  </g>

  <!-- ================= TYPOGRAPHY SECTION ================= -->
  <!-- Line 1: "YOU'VE BEEN" in bold golden italics -->
  <text x="512" y="412" text-anchor="middle" font-family="'Arial Black', 'Impact', sans-serif" font-style="italic" font-weight="900" font-size="46" fill="url(#amberTextGrad)" stroke="#091426" stroke-width="4" paint-order="stroke fill" letter-spacing="3" filter="url(#shadowHeavy)">
    YOU'VE BEEN
  </text>

  <!-- Line 2: "SERVED" in large bold angular display white lettering -->
  <text x="512" y="482" text-anchor="middle" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-size="82" fill="#ffffff" stroke="#091426" stroke-width="9" paint-order="stroke fill" letter-spacing="5" filter="url(#shadowHeavy)">
    SERVED
  </text>

  <!-- Line 3: "PROCESS SERVERS SOLUTION" in tracking cyan -->
  <text x="512" y="524" text-anchor="middle" font-family="'Inter', 'Arial', sans-serif" font-weight="800" font-size="20" fill="#2dd4bf" stroke="#091426" stroke-width="3" paint-order="stroke fill" letter-spacing="6">
    PROCESS SERVERS SOLUTION
  </text>
</svg>'''

with open('public/logo.svg', 'w') as f:
    f.write(svg_content)
print("public/logo.svg successfully generated")
