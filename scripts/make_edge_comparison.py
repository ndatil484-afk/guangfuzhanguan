#!/usr/bin/env python3
"""生成边缘对比图：把处理前(.bak)和处理后头像的头部边缘区域裁剪放大并排。"""

from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "src" / "assets" / "portraits" / "_edge_compare"
OUT_DIR.mkdir(exist_ok=True)

PAIRS = [
    ("kang-le.png", "kang-le"),
    ("xie-yongkang.png", "xie-yongkang"),
]


def composite_on(rgb_a: np.ndarray, alpha: np.ndarray, bg: tuple[int, int, int]) -> Image.Image:
    """把 RGBA 合成到指定纯色背景上（模拟网页实际显示）。"""
    a = alpha.astype(np.float32) / 255.0
    bg_arr = np.array(bg, dtype=np.float32)
    out = rgb_a.astype(np.float32) * a[..., None] + bg_arr * (1.0 - a)[..., None]
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


def make_compare(rel: str, label: str) -> None:
    before = Image.open(REPO_ROOT / "src/assets/portraits" / f"{rel}.bak").convert("RGBA")
    after = Image.open(REPO_ROOT / "src/assets/portraits" / rel).convert("RGBA")

    # 头部通常在上部 5%~40% 区域；裁出该区域的中央 60% 宽
    w, h = before.size
    crop = before.crop((int(w * 0.20), int(h * 0.05), int(w * 0.80), int(h * 0.42)))
    crop_a = after.crop((int(w * 0.20), int(h * 0.05), int(w * 0.80), int(h * 0.42)))

    # 放大 2x 便于看清发丝
    crop = crop.resize((crop.width * 2, crop.height * 2), Image.LANCZOS)
    crop_a = crop_a.resize((crop_a.width * 2, crop_a.height * 2), Image.LANCZOS)

    # 合成到深色背景（模拟网页 #1a1610）和浅色背景两种
    ba = np.array(crop)
    aa = np.array(crop_a)
    for bg_name, bg in [("dark", (26, 22, 16)), ("light", (240, 240, 240))]:
        b_img = composite_on(ba[..., :3], ba[..., 3], bg)
        a_img = composite_on(aa[..., :3], aa[..., 3], bg)
        # 左右拼接，中间加分隔线
        gap = Image.new("RGB", (4, b_img.height), (201, 168, 76))
        combined = Image.new("RGB", (b_img.width + 4 + a_img.width, b_img.height), bg)
        combined.paste(b_img, (0, 0))
        combined.paste(gap, (b_img.width, 0))
        combined.paste(a_img, (b_img.width + 4, 0))
        out = OUT_DIR / f"{label}_{bg_name}.png"
        combined.save(out)
        print(f"  写出 {out.relative_to(REPO_ROOT)}")


for rel, label in PAIRS:
    print(f"=== {label} ===")
    make_compare(rel, label)
