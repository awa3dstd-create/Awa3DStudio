#!/usr/bin/env python3
"""
Regenerate the 3 Conócenos (about) section images — FINAL approach.

GOAL: Sharp (no aliasing) AND correct proportions (no stretching).

METHOD:
1. CROP the source first to match the container aspect ratio (no stretching)
2. Downscale to the exact container size at 3x retina (with extra headroom)
3. NO UnsharpMask (over-sharpening causes aliasing when browser downscales further)
4. LANCZOS downscaling + quality 95 + no chroma subsampling (4:4:4)

Output dimensions match what was confirmed sharp in previous iterations:
  - salon-boiserie-3x.jpg:      834×1113 (3:4 portrait)
  - dormitorio-natural-3x.jpg:  834×834  (1:1 square)
  - torre-curva-ocaso-3x.jpg:   834×1113 (3:4 portrait)

Display dimensions on screen (measured):
  - At DPR=1: 278×371 / 278×278 / 278×371
  - At DPR=2: 556×742 / 556×556 / 556×742
  - At DPR=3: 834×1113 / 834×834 / 834×1113  ← our output matches this
"""

from PIL import Image
import os

OUT_DIR = "/home/z/my-project/public/portfolio"

JOBS = [
    ("salon-boiserie.jpg",      "salon-boiserie-3x.jpg",      834, 1113),  # 3:4 portrait
    ("dormitorio-natural.jpg",  "dormitorio-natural-3x.jpg",  834,  834),  # 1:1 square
    ("torre-curva-ocaso.jpg",   "torre-curva-ocaso-3x.jpg",   834, 1113),  # 3:4 portrait
]


def crop_to_aspect(im, target_w, target_h):
    """Center-crop the image to match the target aspect ratio. Does NOT stretch."""
    src_w, src_h = im.size
    src_aspect = src_w / src_h
    target_aspect = target_w / target_h

    if src_aspect > target_aspect:
        # Source is wider than target → crop width
        new_w = int(round(src_h * target_aspect))
        new_h = src_h
        left = (src_w - new_w) // 2
        top = 0
    else:
        # Source is taller than target → crop height
        new_w = src_w
        new_h = int(round(src_w / target_aspect))
        left = 0
        top = (src_h - new_h) // 2

    return im.crop((left, top, left + new_w, top + new_h))


def process(src_path, out_path, target_w, target_h):
    im = Image.open(src_path)
    im = im.convert("RGB")
    src_w, src_h = im.size

    print(f"  {os.path.basename(src_path)}: {src_w}×{src_h} (aspect {src_w/src_h:.3f})")
    print(f"    target: {target_w}×{target_h} (aspect {target_w/target_h:.3f})")

    # Step 1: center-crop to target aspect ratio (no stretching)
    im_cropped = crop_to_aspect(im, target_w, target_h)
    print(f"    after crop: {im_cropped.size[0]}×{im_cropped.size[1]}")

    # Step 2: downscale to exact target size with LANCZOS
    im_resized = im_cropped.resize((target_w, target_h), Image.LANCZOS)

    # NOTE: NO UnsharpMask — over-sharpening introduces aliasing when the
    # browser further downscales the image for display.

    # Step 3: save with quality 95 and no chroma subsampling
    im_resized.save(
        out_path,
        "JPEG",
        quality=95,
        subsampling=0,   # 4:4:4 — no chroma subsampling
        optimize=True,
        progressive=True,
    )

    size_kb = os.path.getsize(out_path) / 1024
    print(f"    saved: {out_path} ({size_kb:.0f} KB)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Regenerating Conócenos images (CROP to aspect + LANCZOS, no UnsharpMask)...")
    print()
    for src_name, out_name, tw, th in JOBS:
        src_path = os.path.join(OUT_DIR, src_name)
        out_path = os.path.join(OUT_DIR, out_name)
        if not os.path.exists(src_path):
            print(f"  MISSING source: {src_path}")
            continue
        process(src_path, out_path, tw, th)
        print()
    print("Done.")


if __name__ == "__main__":
    main()
