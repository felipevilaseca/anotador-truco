"""One-off script to rasterize the app icon as PNG (no PIL available).
Draws a green table background with a white card and a red diamond pip.
"""
import struct
import zlib
import os

BG = (13, 90, 63)
CARD = (250, 250, 247)
CARD_SHADOW = (8, 60, 42)
PIP = (191, 32, 51)


def rounded_rect_mask(x, y, x0, y0, x1, y1, r):
    if x1 <= x0 or y1 <= y0:
        return False
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    if x < x0 + r and y < y0 + r:
        return (x - (x0 + r)) ** 2 + (y - (y0 + r)) ** 2 <= r * r
    if x > x1 - r and y < y0 + r:
        return (x - (x1 - r)) ** 2 + (y - (y0 + r)) ** 2 <= r * r
    if x < x0 + r and y > y1 - r:
        return (x - (x0 + r)) ** 2 + (y - (y1 - r)) ** 2 <= r * r
    if x > x1 - r and y > y1 - r:
        return (x - (x1 - r)) ** 2 + (y - (y1 - r)) ** 2 <= r * r
    return True


def diamond_mask(x, y, cx, cy, hw, hh):
    dx = abs(x - cx) / hw
    dy = abs(y - cy) / hh
    return dx + dy <= 1.0


def make_icon(size, path):
    px = [[BG for _ in range(size)] for _ in range(size)]

    bg_r = size * 0.20
    card_x0, card_y0 = size * 0.20, size * 0.14
    card_x1, card_y1 = size * 0.80, size * 0.86
    card_r = size * 0.07

    shadow_off = size * 0.02

    cx, cy = size / 2, size / 2
    hw, hh = size * 0.16, size * 0.24

    small_cx1, small_cy1 = card_x0 + size * 0.09, card_y0 + size * 0.10
    small_cx2, small_cy2 = card_x1 - size * 0.09, card_y1 - size * 0.10
    small_hw, small_hh = size * 0.035, size * 0.05

    for y in range(size):
        for x in range(size):
            if not rounded_rect_mask(x, y, 0, 0, size - 1, size - 1, bg_r):
                px[y][x] = BG
                continue
            if rounded_rect_mask(x, y, card_x0 + shadow_off, card_y0 + shadow_off,
                                  card_x1 + shadow_off, card_y1 + shadow_off, card_r):
                px[y][x] = CARD_SHADOW
            if rounded_rect_mask(x, y, card_x0, card_y0, card_x1, card_y1, card_r):
                px[y][x] = CARD
                if diamond_mask(x, y, cx, cy, hw, hh):
                    px[y][x] = PIP
                if diamond_mask(x, y, small_cx1, small_cy1, small_hw, small_hh):
                    px[y][x] = PIP
                if diamond_mask(x, y, small_cx2, small_cy2, small_hw, small_hh):
                    px[y][x] = PIP

    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            r, g, b = px[y][x]
            raw += bytes((r, g, b))

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(png)


if __name__ == '__main__':
    base = os.path.join(os.path.dirname(__file__), '..', 'icons')
    make_icon(192, os.path.join(base, 'icon-192.png'))
    make_icon(512, os.path.join(base, 'icon-512.png'))
    make_icon(180, os.path.join(base, 'apple-touch-icon.png'))
    print('done')
