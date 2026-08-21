#!/usr/bin/env python3
"""Render the ZynCoder Studio 2500 x 1686 LINE rich-menu image.

Usage:
    python scripts/generate-rich-menu.py

The output is written to output/rich-menu/zyncoder-studio-rich-menu.png.
Only Pillow is required:  python -m pip install Pillow

Set RICH_MENU_FONT_PATH to a .ttf/.otf font file if the default font lookup
does not suit your machine.  The supplied copy uses English labels so it is
portable; edit CARDS below to localise it.
"""

from __future__ import annotations

import math
import os
from pathlib import Path
from typing import Callable, Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


WIDTH, HEIGHT = 2500, 1686  # LINE's rich-menu large image size
ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = ROOT / "assets" / "rich-menu" / "zyncoder-abstract-background.png"
OUTPUT = ROOT / "output" / "rich-menu" / "zyncoder-studio-rich-menu.png"

# The grid is deliberately aligned to easy-to-register Rich Menu areas.
# Each tuple is (x, y, width, height), ordered left-to-right, top-to-bottom.
TAP_AREAS = [
    (92, 658, 756, 453),
    (872, 658, 756, 453),
    (1652, 658, 756, 453),
    (92, 1141, 756, 453),
    (872, 1141, 756, 453),
    (1652, 1141, 756, 453),
]

CARDS = [
    ("SMART SOLUTIONS", "Automate the work\nthat slows you down", "Explore services", "flow", (63, 218, 255)),
    ("LINE OA & BOTS", "Conversations that\nmove customers forward", "Build your bot", "chat", (92, 249, 180)),
    ("OUR PORTFOLIO", "See systems crafted\nfor ambitious teams", "View our work", "tiles", (176, 129, 255)),
    ("PACKAGES", "Clear scopes. Smart\ninvestment. Real results.", "Compare packages", "layers", (255, 185, 85)),
    ("FREE CONSULTATION", "Tell us the workflow\nyou want to transform", "Start a project", "compass", (255, 118, 160)),
    ("STUDIO UPDATES", "Fresh ideas, releases\nand special offers", "Get updates", "spark", (98, 169, 255)),
]


def blend(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    """Mix two RGB colours."""
    t = max(0.0, min(1.0, t))
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def font_path() -> Path:
    """Find a sensible UI font, allowing an explicit override."""
    candidates: Iterable[str] = (
        [os.environ["RICH_MENU_FONT_PATH"]] if os.getenv("RICH_MENU_FONT_PATH") else []
    )
    candidates = list(candidates) + [
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return path
    raise RuntimeError(
        "No usable font was found. Set RICH_MENU_FONT_PATH to a .ttf or .otf file."
    )


def make_font(path: Path, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    if bold and path.name.lower() == "segoeui.ttf":
        bold_path = path.with_name("segoeuib.ttf")
        if bold_path.exists():
            return ImageFont.truetype(bold_path, size)
    if bold and path.name.lower() == "tahoma.ttf":
        bold_path = path.with_name("tahomabd.ttf")
        if bold_path.exists():
            return ImageFont.truetype(bold_path, size)
    return ImageFont.truetype(path, size)


def cover(image: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    """Resize/crop an image so it fills target_size without distortion."""
    target_w, target_h = target_size
    scale = max(target_w / image.width, target_h / image.height)
    size = (round(image.width * scale), round(image.height * scale))
    image = image.resize(size, Image.Resampling.LANCZOS)
    left = (image.width - target_w) // 2
    top = (image.height - target_h) // 2
    return image.crop((left, top, left + target_w, top + target_h))


def procedural_background() -> Image.Image:
    """A self-contained fallback, so the script works without the optional asset."""
    image = Image.new("RGB", (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(image)
    for y in range(HEIGHT):
        t = y / (HEIGHT - 1)
        draw.line((0, y, WIDTH, y), fill=blend((3, 12, 46), (6, 26, 79), t))

    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    for radius in range(1040, 0, -24):
        alpha = round(0.25 * (1 - radius / 1064) ** 2 * 255)
        glow_draw.ellipse((1450 - radius, -240 - radius, 1450 + radius, -240 + radius), fill=(24, 181, 255, alpha))
    return Image.alpha_composite(image.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(28)))


def background() -> Image.Image:
    if BACKGROUND.exists():
        base = cover(Image.open(BACKGROUND).convert("RGB"), (WIDTH, HEIGHT)).convert("RGBA")
    else:
        base = procedural_background()

    # Make the generated art secondary to the hierarchy and typography.
    shade = Image.new("RGBA", (WIDTH, HEIGHT), (2, 9, 36, 118))
    base = Image.alpha_composite(base, shade)
    base.putalpha(Image.new("L", (WIDTH, HEIGHT), 255))
    return base


def translucent_layer(size: tuple[int, int], color: tuple[int, int, int, int], radius: int) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=color)
    return layer


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def card_surface(width: int, height: int, accent: tuple[int, int, int]) -> Image.Image:
    """Build a glass card with depth and a quiet accent bloom."""
    card = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mask = rounded_mask((width, height), 34)

    wash = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    wash_draw = ImageDraw.Draw(wash)
    for y in range(height):
        t = y / (height - 1)
        wash_draw.line((0, y, width, y), fill=(15, 35, 82, int(190 - 85 * t)))
    card.paste(wash, mask=mask)

    bloom = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    bloom_draw = ImageDraw.Draw(bloom)
    for r in range(280, 0, -16):
        alpha = int(0.20 * (1 - r / 296) ** 2 * 255)
        bloom_draw.ellipse((width - 120 - r, -70 - r, width - 120 + r, -70 + r), fill=(*accent, alpha))
    bloom = bloom.filter(ImageFilter.GaussianBlur(16))
    card.alpha_composite(bloom)

    edge = ImageDraw.Draw(card)
    edge.rounded_rectangle((1, 1, width - 2, height - 2), radius=34, outline=(183, 220, 255, 68), width=2)
    edge.line((34, 1, width - 34, 1), fill=(*accent, 235), width=4)
    # A lower divider gives the call-to-action its own subtle space.
    edge.line((40, height - 88, width - 40, height - 88), fill=(197, 225, 255, 31), width=2)
    return card


def line_icon(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], fill: tuple[int, int, int, int], width: int = 7) -> None:
    draw.line(points, fill=fill, width=width, joint="curve")


def draw_icon(canvas: Image.Image, kind: str, box: tuple[int, int, int, int], accent: tuple[int, int, int]) -> None:
    """Draw a compact, line-style icon without requiring an icon-font dependency."""
    x, y, w, h = box
    icon = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(icon)
    white = (239, 250, 255, 255)
    accent_a = (*accent, 255)
    muted = (*blend(accent, (255, 255, 255), 0.45), 180)
    sw = 7

    if kind == "flow":
        line_icon(d, [(13, 58), (32, 58), (48, 30), (73, 30)], accent_a, sw)
        line_icon(d, [(51, 17), (76, 30), (63, 51)], white, sw)
        d.ellipse((12, 50, 25, 63), outline=muted, width=4)
    elif kind == "chat":
        d.rounded_rectangle((12, 12, 76, 64), radius=17, outline=white, width=sw)
        d.polygon([(30, 62), (31, 76), (46, 64)], fill=white)
        for cx in (31, 44, 57):
            d.ellipse((cx - 3, 35 - 3, cx + 3, 35 + 3), fill=accent_a)
    elif kind == "tiles":
        for left, top in ((10, 10), (47, 10), (10, 47), (47, 47)):
            d.rounded_rectangle((left, top, left + 27, top + 27), radius=8, outline=white if left == 10 else accent_a, width=sw - 1)
    elif kind == "layers":
        d.polygon([(44, 10), (78, 29), (44, 48), (10, 29)], outline=white, width=sw)
        d.line((11, 45, 44, 64, 77, 45), fill=accent_a, width=sw, joint="curve")
        d.line((11, 59, 44, 78, 77, 59), fill=muted, width=sw, joint="curve")
    elif kind == "compass":
        d.ellipse((10, 10, 78, 78), outline=white, width=sw)
        d.polygon([(56, 24), (48, 52), (28, 63), (37, 37)], outline=accent_a, width=sw)
        d.ellipse((40, 40, 48, 48), fill=white)
    elif kind == "spark":
        d.polygon([(44, 7), (51, 32), (78, 42), (51, 51), (44, 79), (35, 51), (10, 42), (35, 32)], outline=white, width=sw)
        d.line((12, 12, 26, 26), fill=accent_a, width=sw - 1)
        d.line((66, 61, 78, 75), fill=accent_a, width=sw - 1)
    else:
        raise ValueError(f"Unknown icon: {kind}")

    # Soft glow makes the tiny icon read clearly against the glass.
    glow = icon.filter(ImageFilter.GaussianBlur(13))
    glow.putalpha(glow.getchannel("A").point(lambda p: min(140, p)))
    canvas.alpha_composite(glow, (x, y))
    canvas.alpha_composite(icon, (x, y))


def draw_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font: ImageFont.FreeTypeFont, fill: tuple[int, int, int, int], **kwargs: object) -> None:
    draw.multiline_text(xy, text, font=font, fill=fill, spacing=kwargs.pop("spacing", 4), **kwargs)


def draw_header(canvas: Image.Image, fonts: dict[str, ImageFont.FreeTypeFont]) -> None:
    d = ImageDraw.Draw(canvas)
    # Logo mark
    d.rounded_rectangle((92, 83, 208, 199), radius=32, fill=(34, 205, 255, 230), outline=(214, 250, 255, 180), width=2)
    d.text((120, 106), "ZC", font=fonts["mark"], fill=(4, 20, 59, 255))
    d.text((235, 87), "ZYNCODER", font=fonts["brand"], fill=(246, 251, 255, 255))
    d.text((238, 143), "STUDIO", font=fonts["smallcaps"], fill=(136, 214, 255, 255))
    d.text((92, 277), "WE BUILD MOMENTUM", font=fonts["eyebrow"], fill=(103, 227, 255, 255))
    d.text((92, 333), "Make your business", font=fonts["headline"], fill=(248, 252, 255, 255))
    d.text((92, 430), "flow smarter.", font=fonts["headline"], fill=(93, 221, 255, 255))
    d.text((96, 544), "Automation, AI & LINE OA systems that give your team more time to grow.", font=fonts["subhead"], fill=(199, 221, 243, 235))

    # Right-side orbit ornament, carefully non-interactive so it does not compete with the menu grid.
    cx, cy = 2132, 342
    for r, alpha in ((210, 38), (158, 60), (106, 95)):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(100, 220, 255, alpha), width=2)
    d.ellipse((2114, 324, 2150, 360), fill=(91, 223, 255, 230))
    d.ellipse((2017, 215, 2041, 239), fill=(173, 132, 255, 210))
    d.ellipse((2253, 366, 2271, 384), fill=(123, 241, 196, 220))
    d.line((2040, 226, 2132, 342, 2262, 375), fill=(116, 207, 255, 76), width=2)


def draw_card(canvas: Image.Image, area: tuple[int, int, int, int], data: tuple[str, str, str, str, tuple[int, int, int]], fonts: dict[str, ImageFont.FreeTypeFont]) -> None:
    x, y, width, height = area
    title, description, cta, icon_kind, accent = data

    # Shadow then surface.
    shadow = translucent_layer((width, height), (0, 4, 26, 165), 34).filter(ImageFilter.GaussianBlur(20))
    canvas.alpha_composite(shadow, (x, y + 17))
    canvas.alpha_composite(card_surface(width, height, accent), (x, y))

    d = ImageDraw.Draw(canvas)
    draw_icon(canvas, icon_kind, (x + 42, y + 42, 88, 88), accent)
    d.text((x + 151, y + 51), title, font=fonts["card_title"], fill=(238, 249, 255, 255))
    draw_text(d, (x + 42, y + 160), description, fonts["card_copy"], (202, 221, 239, 245), spacing=10)
    d.text((x + 43, y + height - 63), cta.upper(), font=fonts["cta"], fill=(*accent, 255))
    # Arrow button
    pill_left = x + width - 114
    d.rounded_rectangle((pill_left, y + height - 82, pill_left + 69, y + height - 32), radius=20, fill=(*accent, 45), outline=(*accent, 130), width=2)
    d.line((pill_left + 20, y + height - 57, pill_left + 47, y + height - 57), fill=(244, 252, 255, 255), width=4)
    d.line((pill_left + 39, y + height - 66, pill_left + 49, y + height - 57, pill_left + 39, y + height - 48), fill=(244, 252, 255, 255), width=4, joint="curve")


def render() -> Path:
    font = font_path()
    fonts = {
        "mark": make_font(font, 41, True),
        "brand": make_font(font, 42, True),
        "smallcaps": make_font(font, 23, True),
        "eyebrow": make_font(font, 24, True),
        "headline": make_font(font, 83, True),
        "subhead": make_font(font, 28),
        "card_title": make_font(font, 25, True),
        "card_copy": make_font(font, 36, True),
        "cta": make_font(font, 20, True),
    }
    canvas = background()
    draw_header(canvas, fonts)
    for area, data in zip(TAP_AREAS, CARDS):
        draw_card(canvas, area, data, fonts)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUTPUT, "PNG", optimize=True)
    return OUTPUT


if __name__ == "__main__":
    rendered = render()
    print(f"Created {rendered} ({WIDTH}x{HEIGHT})")
    print("Tap areas (x, y, width, height):")
    for area, (title, *_rest) in zip(TAP_AREAS, CARDS):
        print(f"  {title:<20} {area}")
