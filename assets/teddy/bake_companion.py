# Companion-accessory bake stage (hand stage — named per sprite-gen delivery
# contract; the engine has no strip-companion composer). Deterministic PIL
# placement: accessories are scaled/pasted onto fixed anchors derived from
# measured landmarks, and per-frame into walk/run strips via per-cell head-top
# tracking. Anchors below are tuned constants; edit and re-run to adjust.
from PIL import Image
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # repo root
ASSETS = os.path.join(ROOT, "assets", "teddy")
PUBLIC = os.path.join(ROOT, "public", "teddy")
TMP = r"C:\Users\Ansyar\AppData\Local\Temp\opencode"


def load(name, folder=ASSETS):
    return Image.open(os.path.join(folder, name)).convert("RGBA")


# --- anchor tuning constants (canvas px) ---
# Front (teddy-base.png, 520x520): head top y=25, face center x~258
FRONT_HAT = dict(cx=258, base_y=78, w=95, h=95)      # squat cone on crown
FRONT_SCARF = dict(cx=258, ring_y=225, w=185, ring_frac=0.35)  # ring around neck
# Side (teddy-side-right.png, 1024x1024): head top y=49, crown x~505
SIDE_HAT = dict(cx=495, base_y=165, w=170, h=150)    # squat cone on crown
SIDE_SCARF = dict(cx=505, ring_y=360, w=380, ring_frac=0.45)   # ring around neck


def paste_centered(canvas, art, cx, base_y, w, h=None):
    """Scale art to width w (and height h if given), paste so its bottom-center
    sits at (cx, base_y)."""
    if h is None:
        h = round(art.size[1] * w / art.size[0])
    art = art.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(art, (cx - w // 2, base_y - h))
    return canvas


def paste_ring(canvas, art, cx, ring_y, w, ring_frac):
    """Scale art to width w and paste so the ring's vertical center (at
    ring_frac of the art height) lands at ring_y."""
    h = round(art.size[1] * w / art.size[0])
    art = art.resize((w, h), Image.LANCZOS)
    canvas.alpha_composite(art, (cx - w // 2, ring_y - round(h * ring_frac)))
    return canvas


def bake_front():
    base = load("teddy-base.png", PUBLIC)
    hat = load("party-hat.png")
    scarf = load("cozy-scarf.png")
    with_hat = base.copy()
    paste_centered(with_hat, hat, **FRONT_HAT)
    with_scarf = base.copy()
    paste_ring(with_scarf, scarf, **FRONT_SCARF)
    both = base.copy()
    paste_ring(both, scarf, **FRONT_SCARF)
    paste_centered(both, hat, **FRONT_HAT)
    with_hat.convert("RGB").save(os.path.join(TMP, "front-hat.png"))
    with_scarf.convert("RGB").save(os.path.join(TMP, "front-scarf.png"))
    both.convert("RGB").save(os.path.join(TMP, "front-both.png"))


def bake_side():
    side = load("teddy-side-right.png", PUBLIC)
    hat = load("party-hat-side.png")
    scarf = load("cozy-scarf-side.png")
    with_hat = side.copy()
    paste_centered(with_hat, hat, **SIDE_HAT)
    with_scarf = side.copy()
    paste_ring(with_scarf, scarf, **SIDE_SCARF)
    both = side.copy()
    paste_ring(both, scarf, **SIDE_SCARF)
    paste_centered(both, hat, **SIDE_HAT)
    with_hat.resize((520, 520)).convert("RGB").save(os.path.join(TMP, "side-hat.png"))
    with_scarf.resize((520, 520)).convert("RGB").save(os.path.join(TMP, "side-scarf.png"))
    both.resize((520, 520)).convert("RGB").save(os.path.join(TMP, "side-both.png"))


def bake_strips():
    """Bake per-frame companion strips: for each source cell, track the
    head-top (topmost opaque pixel) and paste the side-view accessory at the
    tuned anchor offset, scaled by teddy-height ratio."""
    side = load("teddy-side-right.png", PUBLIC)
    side_alpha = side.split()[3]
    side_bbox = side_alpha.getbbox()  # (347, 49, 708, 968)
    side_top = side_bbox[1]
    side_h = side_bbox[3] - side_top  # 919
    # anchors measured on the side still, expressed relative to head top
    REL_HAT = dict(dx=SIDE_HAT["cx"] - 445, dy=SIDE_HAT["base_y"] - side_top,
                   w=SIDE_HAT["w"], h=SIDE_HAT["h"])
    REL_SCARF = dict(dx=SIDE_SCARF["cx"] - 445, dy=SIDE_SCARF["ring_y"] - side_top,
                     w=SIDE_SCARF["w"], ring_frac=SIDE_SCARF["ring_frac"])
    jobs = [
        ("teddy-walk.webp", 34, ["party-hat-side.png", "cozy-scarf-side.png"],
         ["teddy-hat-walk-strip.png", "teddy-scarf-walk-strip.png"]),
        ("side-run-asfilmed.strip.png", 15, ["party-hat-side.png", "cozy-scarf-side.png"],
         ["teddy-hat-run-strip.png", "teddy-scarf-run-strip.png"]),
    ]
    for src_name, n_cells, arts, outs in jobs:
        strip = load(src_name, PUBLIC)
        cw, ch = strip.size[0] // n_cells, strip.size[1]
        for art_name, out_name in zip(arts, outs):
            art = load(art_name)
            out = Image.new("RGBA", strip.size, (0, 0, 0, 0))
            for i in range(n_cells):
                cell = strip.crop((i * cw, 0, (i + 1) * cw, ch))
                a = cell.split()[3]
                bbox = a.getbbox()
                if bbox is None:
                    continue
                top_y = bbox[1]
                # first row with a solid presence (bbox top can be soft edge)
                xs = []
                for y in range(top_y, min(top_y + 20, ch)):
                    xs = [x for x in range(cw) if a.getpixel((x, y)) > 128]
                    if len(xs) >= 3:
                        top_y = y
                        break
                if not xs:
                    continue
                top_x = sum(xs) / len(xs)
                # teddy height in this cell drives the accessory scale
                t_h = bbox[3] - top_y
                s = t_h / side_h
                if "hat" in out_name:
                    # strips have no headroom above the crown (teddy is drawn
                    # flush to the cell top): shrink to ~84.5% so the pompom
                    # clears y=0 in the worst cell (top_y≈5-6 at strip scale)
                    w, h = round(REL_HAT["w"] * s * 0.845), round(REL_HAT["h"] * s * 0.845)
                    small = art.resize((w, h), Image.LANCZOS)
                    px, py = round(top_x + REL_HAT["dx"] * s) - w // 2, top_y + round(REL_HAT["dy"] * s) - h
                    if i < 3:
                        print(f"  {out_name} cell{i}: top=({top_x:.0f},{top_y}) s={s:.3f} paste=({px},{py}) wh=({w},{h})")
                    out.alpha_composite(small, (px + i * cw, py))
                else:
                    w = round(REL_SCARF["w"] * s)
                    h = round(art.size[1] * w / art.size[0])
                    small = art.resize((w, h), Image.LANCZOS)
                    out.alpha_composite(small, (round(top_x + REL_SCARF["dx"] * s) - w // 2 + i * cw,
                                                top_y + round(REL_SCARF["dy"] * s) - round(h * REL_SCARF["ring_frac"])))
            out.save(os.path.join(ASSETS, out_name))
            print("baked", out_name, out.size)
            # QA previews: overlay companion onto source cells 0, mid, late
            for k in [0, n_cells // 2, n_cells - 2]:
                cell = strip.crop((k * cw, 0, (k + 1) * cw, ch))
                comp = cell.copy()
                comp.alpha_composite(out.crop((k * cw, 0, (k + 1) * cw, ch)))
                comp.convert("RGB").save(os.path.join(TMP, f"qa-{out_name[:-4]}-cell{k}.png"))


def emit_runtime():
    """Emit runtime-ready assets to public/teddy: front-view idle overlays as
    1024x1024 canvases (fractions align with every emotion still), plus WebP
    companion strips mirroring the walk/run grid geometry."""
    hat = load("party-hat.png")
    scarf = load("cozy-scarf.png")
    # front anchors ×2 (measured on the 520 base, emitted on the 1024 family)
    front_hat = dict(cx=FRONT_HAT["cx"] * 2, base_y=FRONT_HAT["base_y"] * 2,
                     w=FRONT_HAT["w"] * 2, h=FRONT_HAT["h"] * 2)
    front_scarf = dict(cx=FRONT_SCARF["cx"] * 2, ring_y=FRONT_SCARF["ring_y"] * 2,
                       w=FRONT_SCARF["w"] * 2, ring_frac=FRONT_SCARF["ring_frac"])
    for name, art, placer in [
        ("teddy-hat.png", hat, lambda c: paste_centered(c, art, **front_hat)),
        ("teddy-scarf.png", scarf, lambda c: paste_ring(c, art, **front_scarf)),
    ]:
        canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
        placer(canvas)
        canvas.save(os.path.join(PUBLIC, name))
        print("emitted", name)
    for src, out in [
        ("teddy-hat-walk-strip.png", "teddy-hat-walk.webp"),
        ("teddy-scarf-walk-strip.png", "teddy-scarf-walk.webp"),
        ("teddy-hat-run-strip.png", "teddy-hat-run.webp"),
        ("teddy-scarf-run-strip.png", "teddy-scarf-run.webp"),
    ]:
        strip = load(src)
        strip.save(os.path.join(PUBLIC, out), "WEBP", quality=90, method=4)
        print("emitted", out, os.path.getsize(os.path.join(PUBLIC, out)) // 1024, "KB")


if __name__ == "__main__":
    bake_front()
    bake_side()
    bake_strips()
    emit_runtime()
    print("baked previews to", TMP)
