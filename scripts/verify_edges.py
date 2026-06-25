#!/usr/bin/env python3
"""量化验证：在深色背景上合成头像后，统计头部边缘附近的"白边残留"。"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
BG = (26, 22, 16)  # 模拟网页卡片背景

PAIRS = [
    ("kang-le.png", "kang-le"),
    ("xie-yongkang.png", "xie-yongkang"),
]


def composite(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    a = alpha.astype(np.float32) / 255.0
    bg = np.array(BG, dtype=np.float32)
    out = rgb.astype(np.float32) * a[..., None] + bg * (1.0 - a)[..., None]
    return out.clip(0, 255).astype(np.uint8)


def edge_halo_score(img_arr: np.ndarray) -> dict:
    """统计合成图里"明显亮于背景"且紧邻透明区的像素（白边残留指标）。"""
    gray = img_arr.mean(axis=2).astype(np.float32)
    # 亮度阈值：比背景(均值~21)亮 60 以上视为"亮"
    bright = gray > (sum(BG) / 3 + 60)

    # 找透明边界（合成图里等于背景的区域紧邻非背景区域）
    # 用 alpha 直接判断更准
    return int(bright.sum())


def score(rel: str, label: str, which: str) -> dict:
    path = REPO_ROOT / "src/assets/portraits" / (rel if which == "after" else f"{rel}.bak")
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    comp = composite(arr[..., :3], arr[..., 3])

    # 只看头部区域（上部 5%~42%），避免衣服/背景干扰
    w, h = img.size
    head = comp[int(h * 0.05):int(h * 0.42), int(w * 0.20):int(w * 0.80)]
    # 头部边缘 halo：用 alpha 边界做 mask，膨胀几圈
    a = arr[..., 3][int(h * 0.05):int(h * 0.42), int(w * 0.20):int(w * 0.80)]
    a_img = Image.fromarray(a, mode="L")
    # 外圈带：透明区 膨胀 4px 后减去原透明区 → 头部外侧 4px 圈
    dilated = a_img.filter(ImageFilter.MaxFilter(size=9))
    outer_ring = np.array(dilated) > 128
    outer_ring &= (a <= 20)  # 原本几乎透明
    # 这个外圈上的亮像素数 = 白边残留强度
    ring_pixels = outer_ring.sum()
    if ring_pixels == 0:
        return {"label": label, "which": which, "ring_bright": 0, "ring_total": 0}
    ring_gray = head[..., :3].mean(axis=2)[outer_ring]
    bright = int((ring_gray > (sum(BG) / 3 + 50)).sum())
    return {
        "label": label,
        "which": which,
        "ring_bright": bright,
        "ring_total": int(ring_pixels),
        "ring_mean_gray": float(ring_gray.mean()),
    }


for rel, label in PAIRS:
    b = score(rel, label, "before")
    a = score(rel, label, "after")
    print(
        f"{label:14s}  头部外缘 4px 圈亮像素: "
        f"{b['ring_bright']:5d}/{b['ring_total']:<5d}  →  "
        f"{a['ring_bright']:5d}/{a['ring_total']:<5d}   "
        f"(平均灰度 {b.get('ring_mean_gray', 0):.1f} → {a.get('ring_mean_gray', 0):.1f})"
    )
