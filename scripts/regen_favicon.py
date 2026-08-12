#!/usr/bin/env python3
"""
Regenerate the AWA 3D Studio favicon — v2 (uses the actual studio logo mark).

DESIGN (per user spec):
- Black rounded-square background (#0a0a0f, the studio's page bg)
- The actual studio logo mark (two-polygon "M"-like architectural form)
  in WHITE, centered, scaled to fit comfortably inside the square
- Original logo viewBox is 421×199 (aspect ~2.11:1) — we scale it to fit
  ~80% of the canvas width, leaving ~10% padding on each side

This matches the navbar logo mark exactly (same geometry, just white on black
instead of teal on dark).

GENERATES:
- favicon.svg            (vector, primary — used by modern browsers)
- favicon-16.png         (16x16, classic tab size)
- favicon-32.png         (32x32, retina tab)
- favicon-48.png         (48x48, Windows taskbar)
- favicon-96.png         (96x96, Windows desktop)
- favicon-180.png        (180x180, apple-touch-icon)
- favicon-192.png        (192x192, Android/PWA)
- favicon-512.png        (512x512, PWA / OG image)
- favicon.ico            (multi-size ICO: 16+32+48)
- apple-touch-icon.png   (180x180, opaque for iOS)
- icon-512-white.png     (white mark on transparent — for dark contexts)
"""

import os
from PIL import Image, ImageDraw

OUT_DIR = "/home/z/my-project/public"

# Studio colors
BLACK = (10, 10, 15)         # #0a0a0f — page background
WHITE = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

# Canvas parameters
CORNER_RADIUS_RATIO = 0.18   # rounded square corners (18% of canvas size)

# Logo geometry — matches src/components/awa/logo.tsx IconMark exactly
# Two polygons forming the studio's "M"-like architectural mark
LOGO_LEFT_POLYGON = [
    (0, 106), (0, 198), (112, 198), (114, 27),
    (202, 198), (307, 198), (207, 0), (107, 0),
]
LOGO_RIGHT_POLYGON = [
    (267, 0), (267, 54), (344, 119), (344, 198),
    (420, 198), (420, 71), (334, 0),
]
LOGO_VIEWBOX_W = 421
LOGO_VIEWBOX_H = 199


def write_favicon_svg():
    """Write the master SVG favicon — black rounded square + white logo mark."""
    # Logo scale: fit width to ~78% of canvas, leaving ~11% padding each side
    # Canvas is 512. Logo width = 512 * 0.78 = 400.
    # Scale = 400 / 421 = 0.9501
    # Logo height after scale = 199 * 0.9501 = 189.07
    # Vertical padding = (512 - 189) / 2 = 161.5
    scale = 0.78 * 512 / LOGO_VIEWBOX_W
    offset_x = (512 - LOGO_VIEWBOX_W * scale) / 2
    offset_y = (512 - LOGO_VIEWBOX_H * scale) / 2

    def fmt_pt(p):
        return f"{p[0] * scale + offset_x:.2f} {p[1] * scale + offset_y:.2f}"

    left_path = "M " + " L ".join(fmt_pt(p) for p in LOGO_LEFT_POLYGON) + " Z"
    right_path = "M " + " L ".join(fmt_pt(p) for p in LOGO_RIGHT_POLYGON) + " Z"

    svg = f"""<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AWA 3D Studio">
  <!-- Black rounded-square background -->
  <rect width="512" height="512" rx="92" ry="92" fill="#0a0a0f"/>
  <!-- Studio logo mark in white (same geometry as navbar IconMark) -->
  <path d="{left_path}" fill="#ffffff"/>
  <path d="{right_path}" fill="#ffffff"/>
</svg>
"""
    svg_path = os.path.join(OUT_DIR, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"  wrote {svg_path}")


def make_rounded_square(size, fill_color):
    """Create a rounded-square image with the given fill color."""
    img = Image.new("RGBA", (size, size), TRANSPARENT)
    draw = ImageDraw.Draw(img)
    radius = int(size * CORNER_RADIUS_RATIO)
    fill = fill_color + (255,) if len(fill_color) == 3 else fill_color
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=radius,
        fill=fill,
    )
    return img


def draw_logo_mark(img, size, color=WHITE):
    """Draw the studio's two-polygon logo mark on the given image.
    The mark is scaled to fit ~78% of the canvas width, centered vertically."""
    draw = ImageDraw.Draw(img)

    # Scale logo to fit 78% of canvas width
    scale = 0.78 * size / LOGO_VIEWBOX_W
    offset_x = (size - LOGO_VIEWBOX_W * scale) / 2
    offset_y = (size - LOGO_VIEWBOX_H * scale) / 2

    def scale_pt(p):
        return (p[0] * scale + offset_x, p[1] * scale + offset_y)

    left = [scale_pt(p) for p in LOGO_LEFT_POLYGON]
    right = [scale_pt(p) for p in LOGO_RIGHT_POLYGON]

    fill = color + (255,) if len(color) == 3 else color
    draw.polygon(left, fill=fill)
    draw.polygon(right, fill=fill)


def make_favicon_png(size, with_background=True):
    """Create a PNG favicon at the given size.
    with_background=True → black rounded square + white logo
    with_background=False → transparent background + white logo only
    """
    # For small sizes, use 4x supersampling + LANCZOS downscale for clean edges
    ss = 4 if size <= 96 else 1
    big_size = size * ss

    if with_background:
        big = make_rounded_square(big_size, BLACK)
    else:
        big = Image.new("RGBA", (big_size, big_size), TRANSPARENT)

    draw_logo_mark(big, big_size, WHITE)

    if ss > 1:
        img = big.resize((size, size), Image.LANCZOS)
    else:
        img = big

    return img


def make_ico(sizes=(16, 32, 48)):
    """Create a multi-size .ico file."""
    imgs = [make_favicon_png(s) for s in sizes]
    ico_path = os.path.join(OUT_DIR, "favicon.ico")
    imgs[0].save(ico_path, format="ICO", sizes=[(s, s) for s in sizes], append_images=imgs[1:])
    print(f"  wrote {ico_path} (sizes: {list(sizes)})")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Regenerating AWA 3D Studio favicon v2 (black bg + white studio logo)...")
    print()

    # 1. SVG (vector source of truth)
    write_favicon_svg()

    # 2. PNGs at all sizes
    png_sizes = [16, 32, 48, 96, 180, 192, 512]
    for s in png_sizes:
        img = make_favicon_png(s, with_background=True)
        out_path = os.path.join(OUT_DIR, f"favicon-{s}.png")
        img.save(out_path, "PNG", optimize=True)
        print(f"  wrote {out_path} ({os.path.getsize(out_path)} bytes)")

    # 3. apple-touch-icon.png (180×180, opaque for iOS — iOS adds its own corners)
    img180 = make_favicon_png(180, with_background=True)
    # Composite onto opaque black background to remove alpha
    apple_bg = Image.new("RGB", (180, 180), BLACK)
    apple_bg.paste(img180, (0, 0), img180)
    apple_path = os.path.join(OUT_DIR, "apple-touch-icon.png")
    apple_bg.save(apple_path, "PNG", optimize=True)
    print(f"  wrote {apple_path}")

    # 4. icon-512-white.png — white logo on transparent (for dark contexts)
    img_white = make_favicon_png(512, with_background=False)
    white_path = os.path.join(OUT_DIR, "icon-512-white.png")
    img_white.save(white_path, "PNG", optimize=True)
    print(f"  wrote {white_path}")

    # 5. ICO (multi-size)
    make_ico((16, 32, 48))

    print()
    print("Done.")


if __name__ == "__main__":
    main()
