#!/usr/bin/env python3
"""分析肖像边缘白边的真实形态，输出诊断信息。"""

from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
TARGETS = [
    "src/assets/portraits/kang-le.png.bak",
    "src/assets/portraits/xie-yongkang.png.bak",
]


def analyze(rel: str) -> None:
    img = Image.open(REPO_ROOT / rel).convert("RGBA")
    arr = np.array(img)
    rgb = arr[..., :3]
    a = arr[..., 3]

    print(f"\n=== {rel} ({img.width}x{img.height}) ===")
    print(f"  alpha 分布: 0 的像素 = {(a == 0).sum()}, 255 的 = {(a == 255).sum()}, "
          f"半透明 = {((a > 0) & (a < 255)).sum()}")

    # 边界判定：alpha=255 的区域里，紧邻 alpha<255 的像素（"实边"）
    semi_or_zero = a < 255
    # 用移位找 4 邻域存在透明的 不透明 像素
    opaque_edge = np.zeros_like(a, dtype=bool)
    opaque_edge[1:, :] |= semi_or_zero[:-1, :]
    opaque_edge[:-1, :] |= semi_or_zero[1:, :]
    opaque_edge[:, 1:] |= semi_or_zero[:, :-1]
    opaque_edge[:, :-1] |= semi_or_zero[:, 1:]
    opaque_edge &= (a == 255)

    # 在 opaque_edge 里统计 RGB 偏白的
    oe_rgb = rgb[opaque_edge]
    if oe_rgb.shape[0] > 0:
        whiteish = (
            (oe_rgb[:, 0] >= 200)
            & (oe_rgb[:, 1] >= 200)
            & (oe_rgb[:, 2] >= 200)
        )
        print(f"  不透明实边像素: {opaque_edge.sum()} 个, 其中偏白 {whiteish.sum()} 个")
        print(f"  实边平均 RGB: R={oe_rgb[:,0].mean():.0f} G={oe_rgb[:,1].mean():.0f} B={oe_rgb[:,2].mean():.0f}")
        print(f"  实边最大 RGB: R={oe_rgb[:,0].max()} G={oe_rgb[:,1].max()} B={oe_rgb[:,2].max()}")

    # 半透明像素的 RGB 统计
    semi = (a > 0) & (a < 255)
    semi_rgb = rgb[semi]
    if semi_rgb.shape[0] > 0:
        white_semi = (
            (semi_rgb[:, 0] >= 200)
            & (semi_rgb[:, 1] >= 200)
            & (semi_rgb[:, 2] >= 200)
        )
        print(f"  半透明像素: {semi.sum()} 个, 其中偏白 {white_semi.sum()} 个")
        print(f"  半透明平均 RGB: R={semi_rgb[:,0].mean():.0f} G={semi_rgb[:,1].mean():.0f} B={semi_rgb[:,2].mean():.0f}")


for t in TARGETS:
    if (REPO_ROOT / t).exists():
        analyze(t)
