#!/usr/bin/env python3
"""
Generate every icon the app and the Play listing need, from one definition.

Run: python3 scripts/make-icons.py

The mark is the one the website already uses in its nav — an "IT" monogram in
the brand lime — so this is not a new identity, it is the existing one at the
sizes Android and Play ask for. Keeping it here rather than in a design file
means a brand colour change is a one-line edit and a re-run, and the eight
outputs cannot drift apart.

Android's adaptive icon crops the foreground layer hard: the launcher may mask
it to a circle, a squircle or a rounded square, and only the centre 66% is
guaranteed to survive. SAFE below is that fraction, and the monogram is fitted
inside it rather than to the canvas — art sized to the full 512 loses its edges
on most launchers.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

INK = (8, 10, 14)
LIME = (169, 243, 0)
CYAN = (26, 209, 209)
FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
MARK = "IT"

# Fraction of an adaptive-icon layer that every launcher mask keeps.
SAFE = 0.66

ASSETS = Path(__file__).resolve().parent.parent / "apps" / "mobile" / "assets"
LISTING = Path(__file__).resolve().parent.parent / "docs" / "play-store" / "listing"


def fitted(text: str, w: float, h: float) -> ImageFont.FreeTypeFont:
    """Largest size whose ink box fits inside w x h."""
    lo, hi, best = 10, 2000, ImageFont.truetype(FONT, 10)
    while lo <= hi:
        mid = (lo + hi) // 2
        f = ImageFont.truetype(FONT, mid)
        box = f.getbbox(text)
        if box[2] - box[0] <= w and box[3] - box[1] <= h:
            best, lo = f, mid + 1
        else:
            hi = mid - 1
    return best


def centred(draw, text, font, cx, cy, fill):
    """Centre on the ink box, not the em box — otherwise it sits low."""
    box = font.getbbox(text)
    draw.text(
        (cx - (box[2] - box[0]) / 2 - box[0], cy - (box[3] - box[1]) / 2 - box[1]),
        text, font=font, fill=fill,
    )


def glow(img, colour, cx, cy, radius, alpha):
    """The soft radial light the app paints behind its hero."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius], fill=colour + (alpha,)
    )
    return Image.alpha_composite(img, layer.filter(ImageFilter.GaussianBlur(radius * 0.55)))


def lime_field(size: int, mark=True, mark_fill=INK, safe=1.0) -> Image.Image:
    """The brand field. `mark=False` gives the bare layer an adaptive icon needs
    behind a separate foreground — drawing the monogram on both would print it
    twice, once at the wrong size."""
    img = Image.new("RGBA", (size, size), LIME + (255,))
    img = glow(img, (255, 255, 255), size * 0.22, size * 0.16, size * 0.42, 70)
    if mark:
        centred(
            ImageDraw.Draw(img), MARK,
            fitted(MARK, size * 0.60 * safe, size * 0.42 * safe),
            size / 2, size / 2, mark_fill + (255,),
        )
    return img


def transparent_mark(size: int, fill, safe=1.0) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    centred(
        ImageDraw.Draw(img), MARK,
        fitted(MARK, size * 0.60 * safe, size * 0.42 * safe),
        size / 2, size / 2, fill,
    )
    return img


def write(img: Image.Image, path: Path, flatten_to=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    if flatten_to is not None:
        bg = Image.new("RGBA", img.size, flatten_to + (255,))
        img = Image.alpha_composite(bg, img)
        img.convert("RGB").save(path)
    else:
        img.save(path)
    print(f"  {path.relative_to(path.parents[3])}  {img.size[0]}x{img.size[1]}")


def main():
    print("app assets")
    # Play rejects alpha on the launcher icon, so this one is flattened.
    write(lime_field(1024), ASSETS / "icon.png", flatten_to=LIME)

    # Adaptive icon: dark monogram on its own layer, lime field behind it.
    write(transparent_mark(512, INK + (255,), SAFE), ASSETS / "android-icon-foreground.png")
    write(lime_field(512, mark=False), ASSETS / "android-icon-background.png")

    # Themed icons (Android 13+): a silhouette the launcher tints itself.
    write(transparent_mark(432, (255, 255, 255, 255), SAFE), ASSETS / "android-icon-monochrome.png")

    # The splash sits on the brand ground, so the mark is lime here, not dark.
    write(transparent_mark(1024, LIME + (255,)), ASSETS / "splash-icon.png")

    write(lime_field(48), ASSETS / "favicon.png", flatten_to=LIME)

    print("play listing")
    write(lime_field(512), LISTING / "icon-512.png", flatten_to=LIME)

    # Feature graphic, at exactly the 1024x500 Play requires. If its asset
    # library calls this "too small to crop", the panel is bound to another
    # slot — open it from the Feature graphic box, not the app icon box.
    K = 1
    fg = Image.new("RGBA", (1024 * K, 500 * K), INK + (255,))
    fg = glow(fg, LIME, 190 * K, 90 * K, 340 * K, 95)
    fg = glow(fg, CYAN, 950 * K, 470 * K, 300 * K, 60)
    d = ImageDraw.Draw(fg)
    tile = lime_field(150 * K)
    fg.paste(tile, (86 * K, 175 * K), tile)
    d.text((272 * K, 196 * K), "Itoby",
           font=ImageFont.truetype(FONT, 86 * K), fill=(248, 248, 250, 255))
    d.text((276 * K, 300 * K), "One account. Every tool.",
           font=ImageFont.truetype(FONT, 34 * K), fill=(160, 165, 172, 255))
    write(fg, LISTING / "feature-graphic-1024x500.png", flatten_to=INK)


if __name__ == "__main__":
    main()
