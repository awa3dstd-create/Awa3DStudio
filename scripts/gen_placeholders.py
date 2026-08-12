#!/usr/bin/env python3
"""
Generate placeholder portfolio images for AWA 3D Studio.
Until the real renders are delivered, these high-quality SVG-based
placeholders simulate architectural renders with the correct aesthetic.

Each image is rendered as a high-resolution JPG (2400x1500) and saved
to /home/z/my-project/public/portfolio/ with the exact filenames
expected by the data module.

When the real images arrive, simply overwrite the files in
public/portfolio/ — no code changes needed.
"""

import os
import subprocess
import textwrap
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/public/portfolio")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Each entry is (filename, palette, scene_name, scene_description)
# Palette: dict with colors used to build the architectural composition
IMAGES = [
    {
        "name": "salon-luminoso.jpg",
        "title": "Residencia Invernadero",
        "mood": "Doble altura, luz cenital, vegetación interior",
        "bg": "#1a1f1c",
        "wall": "#3a3a32",
        "wall2": "#52524a",
        "floor": "#1f1d18",
        "accent": "#9bb083",
        "highlight": "#d4d8c5",
        "light": "#fff5dc",
    },
    {
        "name": "comedor-japandi.jpg",
        "title": "Comedor Rattan",
        "mood": "Japandi, rattan, lino, luz filtrada",
        "bg": "#1a1815",
        "wall": "#3d3833",
        "wall2": "#524b43",
        "floor": "#1e1b16",
        "accent": "#a8957a",
        "highlight": "#c9b89d",
        "light": "#f3e8d0",
    },
    {
        "name": "pasillo-salon-otono.jpg",
        "title": "Vestíbulo Otoño",
        "mood": "Paleta cálida, nogal, rattan",
        "bg": "#1f1812",
        "wall": "#3d2e21",
        "wall2": "#55402d",
        "floor": "#241a11",
        "accent": "#b8804a",
        "highlight": "#d4a574",
        "light": "#f5d8a8",
    },
    {
        "name": "salon-boiserie.jpg",
        "title": "Residencia Chelsea",
        "mood": "Boiserie clásica contemporánea",
        "bg": "#15171c",
        "wall": "#2c2f38",
        "wall2": "#3d4250",
        "floor": "#181a20",
        "accent": "#7a8090",
        "highlight": "#a8b0c0",
        "light": "#e8eaf0",
    },
    {
        "name": "dormitorio-natural.jpg",
        "title": "Dormitorio Nogal",
        "mood": "Nogal americano, cabecero tapizado",
        "bg": "#181612",
        "wall": "#33291f",
        "wall2": "#473828",
        "floor": "#1c1610",
        "accent": "#9a7752",
        "highlight": "#c4a07a",
        "light": "#f0d8b4",
    },
    {
        "name": "torre-curva-ocaso.jpg",
        "title": "Torre Horizonte",
        "mood": "Torre curva, hormigón, ocaso",
        "bg": "#1a0f0a",
        "wall": "#3a2418",
        "wall2": "#5c3a24",
        "floor": "#1a0f08",
        "accent": "#d4762e",
        "highlight": "#e8a050",
        "light": "#ffc878",
    },
    {
        "name": "comedor-classic.jpg",
        "title": "Comedor Classic",
        "mood": "Clásico, lámpara de araña, terciopelo óxido",
        "bg": "#161014",
        "wall": "#2e2329",
        "wall2": "#423239",
        "floor": "#16101a",
        "accent": "#8e5a48",
        "highlight": "#b88068",
        "light": "#f0d0a8",
    },
    {
        "name": "salon-chimenea-negro.jpg",
        "title": "Salón Chimenea Negra",
        "mood": "Mármol negro marquina, fuego",
        "bg": "#0a0a0d",
        "wall": "#18181d",
        "wall2": "#26262e",
        "floor": "#08080a",
        "accent": "#d4762e",
        "highlight": "#ffb050",
        "light": "#fff0c0",
    },
]


def build_svg(spec: dict) -> str:
    """Build a sophisticated SVG composition simulating an architectural render."""
    bg = spec["bg"]
    wall = spec["wall"]
    wall2 = spec["wall2"]
    floor = spec["floor"]
    accent = spec["accent"]
    highlight = spec["highlight"]
    light = spec["light"]
    title = spec["title"]
    mood = spec["mood"]

    # ViewBox 16:10 — 2400x1500 at scale
    return textwrap.dedent(f"""
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1500" preserveAspectRatio="xMidYMid slice">
      <defs>
        <!-- Wall gradient: subtle vertical from wall to wall2 -->
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="{wall2}" />
          <stop offset="55%" stop-color="{wall}" />
          <stop offset="100%" stop-color="{bg}" />
        </linearGradient>

        <!-- Floor gradient -->
        <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="{floor}" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#000000" />
        </linearGradient>

        <!-- Light cone from upper window -->
        <linearGradient id="lightCone" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="{light}" stop-opacity="0.55" />
          <stop offset="40%" stop-color="{light}" stop-opacity="0.18" />
          <stop offset="100%" stop-color="{light}" stop-opacity="0" />
        </linearGradient>

        <!-- Glow filter for accent -->
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id="softBig" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="60" />
        </filter>

        <!-- Wood grain pattern (subtle horizontal lines) -->
        <pattern id="wood" x="0" y="0" width="240" height="40" patternUnits="userSpaceOnUse">
          <rect width="240" height="40" fill="{floor}" />
          <line x1="0" y1="14" x2="240" y2="14" stroke="#000" stroke-opacity="0.18" stroke-width="1" />
          <line x1="0" y1="28" x2="240" y2="28" stroke="#000" stroke-opacity="0.10" stroke-width="1" />
          <line x1="80" y1="0" x2="80" y2="40" stroke="#000" stroke-opacity="0.08" stroke-width="1" />
          <line x1="160" y1="0" x2="160" y2="40" stroke="#000" stroke-opacity="0.06" stroke-width="1" />
        </pattern>

        <!-- Marble veining (for chimenea negro) -->
        <pattern id="marble" x="0" y="0" width="600" height="600" patternUnits="userSpaceOnUse">
          <rect width="600" height="600" fill="{wall}" />
          <path d="M0,120 Q150,90 300,150 T600,120" stroke="{highlight}" stroke-opacity="0.08" fill="none" stroke-width="2" />
          <path d="M0,300 Q200,280 400,320 T600,300" stroke="{highlight}" stroke-opacity="0.06" fill="none" stroke-width="1.5" />
          <path d="M0,470 Q180,450 360,490 T600,470" stroke="{highlight}" stroke-opacity="0.05" fill="none" stroke-width="1" />
        </pattern>
      </defs>

      <!-- Background -->
      <rect width="2400" height="1500" fill="{bg}" />

      <!-- Wall (top 60%) -->
      <rect x="0" y="0" width="2400" height="950" fill="url(#wallGrad)" />

      <!-- Large floor-to-ceiling window (left side) -->
      <rect x="180" y="120" width="900" height="780" fill="{bg}" />
      <rect x="180" y="120" width="900" height="780" fill="url(#lightCone)" />
      <!-- Window frame -->
      <rect x="180" y="120" width="900" height="780" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="6" />
      <line x1="480" y1="120" x2="480" y2="900" stroke="#000" stroke-opacity="0.4" stroke-width="4" />
      <line x1="780" y1="120" x2="780" y2="900" stroke="#000" stroke-opacity="0.4" stroke-width="4" />
      <line x1="180" y1="510" x2="1080" y2="510" stroke="#000" stroke-opacity="0.3" stroke-width="3" />
      <!-- Distant landscape hint through window -->
      <rect x="180" y="510" width="900" height="390" fill="{bg}" opacity="0.4" />
      <ellipse cx="630" cy="900" rx="500" ry="60" fill="{accent}" opacity="0.12" filter="url(#softBig)" />

      <!-- Right wall accent panel -->
      <rect x="1500" y="0" width="900" height="950" fill="url(#wallGrad)" />
      <rect x="1500" y="0" width="4" height="950" fill="#000" opacity="0.4" />

      <!-- Boiserie-style vertical moldings on right wall -->
      <g opacity="0.35">
        <line x1="1620" y1="100" x2="1620" y2="850" stroke="{highlight}" stroke-opacity="0.4" stroke-width="1.5" />
        <line x1="1740" y1="100" x2="1740" y2="850" stroke="{highlight}" stroke-opacity="0.4" stroke-width="1.5" />
        <line x1="1860" y1="100" x2="1860" y2="850" stroke="{highlight}" stroke-opacity="0.4" stroke-width="1.5" />
        <line x1="1980" y1="100" x2="1980" y2="850" stroke="{highlight}" stroke-opacity="0.4" stroke-width="1.5" />
        <line x1="2100" y1="100" x2="2100" y2="850" stroke="{highlight}" stroke-opacity="0.4" stroke-width="1.5" />
        <line x1="2220" y1="100" x2="2220" y2="850" stroke="{highlight}" stroke-opacity="0.4" stroke-width="1.5" />
      </g>

      <!-- Floor -->
      <rect x="0" y="950" width="2400" height="550" fill="url(#wood)" />
      <!-- Floor reflection of window light -->
      <polygon points="180,950 1080,950 1280,1500 0,1500" fill="{light}" opacity="0.08" filter="url(#softBig)" />

      <!-- Furniture: low sideboard / console under window -->
      <rect x="320" y="780" width="680" height="120" fill="{wall}" />
      <rect x="320" y="780" width="680" height="120" fill="#000" opacity="0.15" />
      <rect x="320" y="780" width="680" height="6" fill="#000" opacity="0.5" />
      <!-- Sideboard legs -->
      <rect x="340" y="900" width="14" height="80" fill="#000" opacity="0.6" />
      <rect x="966" y="900" width="14" height="80" fill="#000" opacity="0.6" />

      <!-- Sculptural vase / object on sideboard -->
      <ellipse cx="660" cy="770" rx="40" ry="14" fill="#000" opacity="0.4" />
      <path d="M620,770 Q610,720 630,690 Q650,660 660,640 Q670,660 690,690 Q710,720 700,770 Z"
            fill="{accent}" opacity="0.85" />
      <ellipse cx="660" cy="690" rx="22" ry="6" fill="{highlight}" opacity="0.4" />

      <!-- Plant (left corner) -->
      <rect x="1180" y="820" width="80" height="80" fill="{wall}" opacity="0.8" />
      <ellipse cx="1220" cy="820" rx="50" ry="12" fill="{wall2}" />
      <g opacity="0.85">
        <path d="M1220,820 Q1180,720 1210,580 Q1230,520 1220,470" stroke="{accent}" stroke-width="3" fill="none" />
        <path d="M1220,820 Q1280,720 1260,580 Q1240,520 1220,470" stroke="{accent}" stroke-width="3" fill="none" />
        <path d="M1220,820 Q1220,720 1220,560 Q1220,500 1220,440" stroke="{accent}" stroke-width="3" fill="none" />
        <ellipse cx="1210" cy="580" rx="40" ry="14" fill="{accent}" opacity="0.55" transform="rotate(-20 1210 580)" />
        <ellipse cx="1260" cy="600" rx="40" ry="14" fill="{accent}" opacity="0.55" transform="rotate(25 1260 600)" />
        <ellipse cx="1220" cy="500" rx="35" ry="12" fill="{accent}" opacity="0.65" transform="rotate(-5 1220 500)" />
      </g>

      <!-- Floor lamp (right side) -->
      <line x1="2080" y1="900" x2="2080" y2="500" stroke="#000" stroke-width="4" opacity="0.7" />
      <ellipse cx="2080" cy="900" rx="50" ry="10" fill="#000" opacity="0.5" />
      <path d="M2030,500 L2130,500 L2110,420 L2050,420 Z" fill="{wall2}" />
      <ellipse cx="2080" cy="500" rx="50" ry="8" fill="{highlight}" opacity="0.7" filter="url(#soft)" />

      <!-- Soft ceiling light glow -->
      <ellipse cx="630" cy="0" rx="600" ry="200" fill="{light}" opacity="0.18" filter="url(#softBig)" />

      <!-- AWA watermark (subtle, bottom right) -->
      <g transform="translate(2080, 1390)" opacity="0.6">
        <text x="0" y="0" fill="{highlight}" font-family="'Space Grotesk', sans-serif" font-size="22" font-weight="700" letter-spacing="0.05em">Awa3D Studio</text>
        <text x="0" y="28" fill="{highlight}" font-family="'Space Grotesk', sans-serif" font-size="13" font-weight="400" opacity="0.7">— {title}</text>
      </g>

      <!-- Grain overlay (faint noise) -->
      <rect width="2400" height="1500" fill="url(#marble)" opacity="0.04" />
    </svg>
    """).strip()


def svg_to_jpg(svg_path: Path, jpg_path: Path, width: int = 2400, height: int = 1500):
    """Convert SVG to JPG. Tries cairosvg first (pure Python), then CLI tools."""
    # Preferred: cairosvg
    try:
        import cairosvg
        png_bytes = cairosvg.svg2png(
            url=str(svg_path),
            output_width=width,
            output_height=height,
        )
        # cairosvg writes PNG — convert to JPG via Pillow for smaller size
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
        img.save(jpg_path, "JPEG", quality=92, optimize=True, progressive=True)
        return True
    except Exception as e:
        print(f"    cairosvg failed: {e}")

    # Fallbacks (CLI tools)
    for cmd in [
        ["rsvg-convert", "-w", str(width), "-h", str(height), "-f", "jpg", "-o", str(jpg_path), str(svg_path)],
        ["convert", "-density", "150", str(svg_path), "-resize", f"{width}x{height}", "-quality", "95", str(jpg_path)],
    ]:
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return True
        except (FileNotFoundError, subprocess.CalledProcessError):
            continue
    return False


def main():
    print(f"Generating {len(IMAGES)} portfolio placeholders in {OUT_DIR}")
    converted = 0
    for spec in IMAGES:
        svg = build_svg(spec)
        svg_path = OUT_DIR / (Path(spec["name"]).stem + ".svg")
        jpg_path = OUT_DIR / spec["name"]
        svg_path.write_text(svg, encoding="utf-8")
        print(f"  - {spec['name']} ({spec['title']})...")
        if svg_to_jpg(svg_path, jpg_path):
            converted += 1
            print(f"    OK  ({jpg_path.stat().st_size // 1024} KB)")
            # Remove intermediate SVG
            svg_path.unlink(missing_ok=True)
        else:
            print(f"    WARN: no SVG→JPG converter available, kept SVG at {svg_path}")

    print(f"\nDone. {converted}/{len(IMAGES)} images converted to JPG.")
    print("Files in portfolio/:")
    for f in sorted(OUT_DIR.iterdir()):
        print(f"  {f.name} ({f.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
