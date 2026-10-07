"""Bake a breathe (idle-breathing) preview GIF for Teddy's neutral front still."""
from PIL import Image

from sprite_gen.effects.breathe import (
    anatomy_report,
    bake_breathe_sequence,
    recommended_breathe_frames,
)

from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = ROOT / "teddy-base.png"
OUT = ROOT / "assets/teddy/idle-breathe-gentle.gif"

# Gentle + slow: 3.5% swell, one breath per 3s loop (12 drawings @ 250ms)
cfg = {"breathe": {"depth": 0.035, "breaths": 1, "lag": 0.12}}

base = Image.open(BASE).convert("RGBA")
print("recommended frames:", recommended_breathe_frames(cfg))
# 12 drawings, 1 breath -> 12 samples per breath at 250ms = one breath per 3s
n = 12

rep = anatomy_report([base], cfg)
text = rep if isinstance(rep, str) else str(rep)
print("anatomy:", text[:2000])

frames, phases = bake_breathe_sequence([base.copy() for _ in range(n)], cfg)
frames[0].save(
    OUT, save_all=True, append_images=frames[1:],
    duration=250, loop=0, disposal=2,
)
print("wrote:", OUT)
