#!/usr/bin/env python3
"""
精准去除人物肖像头发边缘白边。

策略（基于边缘诊断）：
  - 只处理"半透明 且 RGB 偏白"的像素（白晕本体）。
  - 把这些像素的 RGB 替换为 8 邻域中 alpha 最大（最不透明）像素的 RGB
    —— 即把白晕染成周围发色/肤色，而非保留白色。
  - 对 alpha 不做侵蚀，避免损伤正常发丝。
  - 最后对全图做 alpha 预乘（RGB *= alpha/255），保证任意背景合成无白圈，
    同时保留发丝主体细节。

这样对康乐（白晕明显）效果显著，对谢永康（仅零星白边）只做最小干预。
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent

TARGETS = [
    "src/assets/portraits/kang-le.png",
    "src/assets/portraits/xie-yongkang.png",
]

# "偏白"阈值：三通道都 >= WHITE_THRESH 视为白晕候选
WHITE_THRESH = 200


def defringe_white_halo(rgb: np.ndarray, alpha: np.ndarray) -> tuple[np.ndarray, int]:
    """只替换"半透明 + 偏白"像素的 RGB。

    返回 (新 RGB, 被替换的像素数)。
    """
    h, w = alpha.shape
    semi = (alpha > 0) & (alpha < 255)
    whiteish = (
        semi
        & (rgb[..., 0] >= WHITE_THRESH)
        & (rgb[..., 1] >= WHITE_THRESH)
        & (rgb[..., 2] >= WHITE_THRESH)
    )
    fixed = 0
    if not np.any(whiteish):
        return rgb, 0

    a_pad = np.pad(alpha, 1, mode="edge")
    rgb_pad = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode="edge")

    ys, xs = np.where(whiteish)

    # 在 8 邻域里挑 alpha 最大的（最不透明）那个的 RGB
    best_alpha = alpha[ys, xs].astype(np.int32).copy()
    best_rgb = rgb[ys, xs].copy()

    offsets = [
        (-1, -1), (-1, 0), (-1, 1),
        (0, -1),           (0, 1),
        (1, -1),  (1, 0),  (1, 1),
    ]
    for dy, dx in offsets:
        ny = ys + dy + 1
        nx = xs + dx + 1
        na = a_pad[ny, nx].astype(np.int32)
        nr = rgb_pad[ny, nx]
        better = na > best_alpha
        for c in range(3):
            best_rgb[:, c] = np.where(better, nr[:, c], best_rgb[:, c])
        best_alpha = np.where(better, na, best_alpha)

    out = rgb.copy()
    out[ys, xs] = best_rgb
    fixed = int(whiteish.sum())
    return out, fixed


def process(rel: str) -> dict:
    path = REPO_ROOT / rel
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[..., :3].copy()
    alpha = arr[..., 3].copy()

    semi = (alpha > 0) & (alpha < 255)
    white_before = int((
        semi
        & (rgb[..., 0] >= WHITE_THRESH)
        & (rgb[..., 1] >= WHITE_THRESH)
        & (rgb[..., 2] >= WHITE_THRESH)
    ).sum())

    # 1) 仅对白晕像素 defringe
    rgb_fixed, fixed_count = defringe_white_halo(rgb, alpha)

    # 2) Alpha 预乘（消除任意背景合成时的残余白晕）
    a_norm = alpha.astype(np.float32) / 255.0
    rgb_premult = (
        rgb_fixed.astype(np.float32) * a_norm[..., None]
    ).round().clip(0, 255).astype(np.uint8)

    out = np.dstack([rgb_premult, alpha])
    Image.fromarray(out, mode="RGBA").save(path)

    # 处理后再统计（用原图 RGB 概念判定，预乘后边缘白已被 alpha 衰减）
    return {
        "path": rel,
        "size": f"{img.width}x{img.height}",
        "white_halo_before": white_before,
        "white_halo_fixed": fixed_count,
    }


def main() -> int:
    for rel in TARGETS:
        p = REPO_ROOT / rel
        if not p.exists():
            print(f"[skip] 文件不存在: {p}")
            continue
        info = process(rel)
        print(
            f"[ok] {info['path']} ({info['size']})  "
            f"白晕像素: 修复 {info['white_halo_fixed']} / {info['white_halo_before']}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
