"""
Generate PNG favicons in multiple sizes from the AWA 3D Studio vector icon.
The icon paths are extracted from the user-provided logo (1784750598bea2.png)
and reconstructed as clean SVG polygons (no rasterization, no pixel art).
"""
import os
import cairosvg
from PIL import Image

OUTPUT_DIR = "/home/z/my-project/public"
ICON_SVG_PATHS = """
  <!-- Left polygon -->
  <path d="M 0,106 L 0,198 L 112,198 L 114,27 L 202,198 L 307,198 L 207,0 L 107,0 Z" fill="{fill}"/>
  <!-- Right polygon -->
  <path d="M 267,0 L 267,54 L 344,119 L 344,198 L 420,198 L 420,71 L 334,0 Z" fill="{fill}"/>
"""

def make_favicon_svg(size: int, bg: str = "#0a0a0f", icon_color: str = "#00c8b4") -> str:
    """Square canvas with centered, aspect-preserving icon."""
    # Original icon: 421x199, aspect ratio = 2.1146
    # Available area inside canvas (with padding): size * 0.85
    # Icon width = avail, icon height = avail / 2.1146
    avail = size * 0.82
    icon_w = avail
    icon_h = avail * 199 / 421
    # Center horizontally, vertically
    offset_x = (size - icon_w) / 2
    offset_y = (size - icon_h) / 2
    scale = icon_w / 421  # scale factor for the icon paths
    return f'''<svg viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}">
  <rect width="{size}" height="{size}" fill="{bg}"/>
  <g transform="translate({offset_x:.4f}, {offset_y:.4f}) scale({scale:.6f})">
    {ICON_SVG_PATHS.format(fill=icon_color)}
  </g>
</svg>'''


def make_white_icon_svg(size: int, bg: str = "#0a0a0f") -> str:
    """Square icon in white for OG image / Apple touch icon variants."""
    return make_favicon_svg(size, bg=bg, icon_color="#FFFFFF")


def render_png(svg_str: str, out_path: str, size: int):
    cairosvg.svg2png(
        bytestring=svg_str.encode("utf-8"),
        write_to=out_path,
        output_width=size,
        output_height=size,
    )
    print(f"  ✓ {out_path} ({size}x{size})")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Standard favicon sizes (PNG)
    png_sizes = [16, 32, 48, 96, 180, 192, 512]
    print("Generating PNG favicons (teal icon on dark bg):")
    for size in png_sizes:
        svg = make_favicon_svg(size, bg="#0a0a0f", icon_color="#00c8b4")
        out_path = f"{OUTPUT_DIR}/favicon-{size}.png"
        render_png(svg, out_path, size)

    # Apple Touch Icon (180x180, white icon on dark bg for high contrast on iOS)
    print("\nGenerating Apple Touch Icon (white icon on dark bg):")
    svg = make_white_icon_svg(180, bg="#0a0a0f")
    render_png(svg, f"{OUTPUT_DIR}/apple-touch-icon.png", 180)

    # Also a pure black-bg white-icon version for OG image use
    print("\nGenerating 512x512 white-icon variant for OG/link previews:")
    svg = make_white_icon_svg(512, bg="#0a0a0f")
    render_png(svg, f"{OUTPUT_DIR}/icon-512-white.png", 512)

    # Generate .ico (multi-resolution) — for legacy browsers
    print("\nGenerating favicon.ico (multi-resolution 16,32,48):")
    ico_images = []
    for size in [16, 32, 48]:
        svg = make_favicon_svg(size, bg="#0a0a0f", icon_color="#00c8b4")
        png_path = f"/tmp/favicon-ico-{size}.png"
        cairosvg.svg2png(
            bytestring=svg.encode("utf-8"),
            write_to=png_path,
            output_width=size,
            output_height=size,
        )
        ico_images.append(Image.open(png_path))
    ico_images[0].save(
        f"{OUTPUT_DIR}/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=ico_images[1:],
    )
    print(f"  ✓ {OUTPUT_DIR}/favicon.ico (multi-resolution)")

    print("\n--- All favicons generated ---")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.startswith("favicon") or f.startswith("icon-") or f.startswith("apple-"):
            path = f"{OUTPUT_DIR}/{f}"
            print(f"  {f}: {os.path.getsize(path)} bytes")


if __name__ == "__main__":
    main()
