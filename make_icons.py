"""Generate Per Piece icons. Rendered at 8x and downsampled so the 16px
version stays crisp. Re-run only if the mark changes."""
from PIL import Image, ImageDraw, ImageFont

GREEN = (31, 157, 85, 255)
WHITE = (255, 255, 255, 255)
FONT = "C:/Windows/Fonts/segoeuib.ttf"


def render(size):
    s = size * 8
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=GREEN)

    # Peso sign, optically centred in the upper two thirds.
    f = ImageFont.truetype(FONT, int(s * 0.60))
    x0, y0, x1, y1 = d.textbbox((0, 0), "\u20b1", font=f)
    d.text(((s - (x1 - x0)) / 2 - x0, s * 0.44 - (y1 - y0) / 2 - y0),
           "\u20b1", font=f, fill=WHITE)

    # Divider + short bar: reads as "per unit" rather than just "money".
    bw, bh = s * 0.46, max(2, s * 0.055)
    d.rounded_rectangle([(s - bw) / 2, s * 0.72, (s + bw) / 2, s * 0.72 + bh],
                        radius=bh / 2, fill=WHITE)
    sw = bw * 0.5
    d.rounded_rectangle([(s - sw) / 2, s * 0.84, (s + sw) / 2, s * 0.84 + bh],
                        radius=bh / 2, fill=(255, 255, 255, 150))

    return img.resize((size, size), Image.LANCZOS)


for n in (16, 48, 128):
    render(n).save(f"icons/icon{n}.png")
    print("icons/icon%d.png" % n)
