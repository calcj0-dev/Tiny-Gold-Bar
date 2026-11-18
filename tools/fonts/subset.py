"""丸ゴシック（M PLUS Rounded 1c）から、このゲームで使う文字だけを取り出して woff2 にする。

使う文字：src/data/i18n/*.json の文言、英数字と記号（数字・単位・URL）。
文言を変えて新しい漢字などが増えたら、作り直す（作り方は tools/fonts/README.md）。

    python tools/fonts/subset.py <元の ttf があるフォルダ> public/fonts
"""

import glob
import json
import os
import sys

from fontTools import subset

WEIGHTS = {"Medium": 500, "Bold": 700, "ExtraBold": 800}


def texts(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from texts(v)


def main(src_dir: str, out_dir: str) -> None:
    chars = set()
    root = os.path.join(os.path.dirname(__file__), "..", "..")
    for path in glob.glob(os.path.join(root, "src", "data", "i18n", "*.json")):
        with open(path, encoding="utf-8") as f:
            for s in texts(json.load(f)):
                chars.update(s)
    # 英数字と記号（数字・単位・URL・タイトルの v0.0.0 など）
    chars.update(chr(c) for c in range(0x20, 0x7F))
    chars.update("，．、。・：；？！（）「」『』〜…―ー＋−×÷＝￥")
    text = "".join(sorted(chars))
    os.makedirs(out_dir, exist_ok=True)
    for name in WEIGHTS:
        src = os.path.join(src_dir, f"MPLUSRounded1c-{name}.ttf")
        out = os.path.join(out_dir, f"rounded-{name.lower()}.woff2")
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        font = subset.load_font(src, opts)
        sub = subset.Subsetter(opts)
        sub.populate(text=text)
        sub.subset(font)
        subset.save_font(font, out, opts)
        print(out, os.path.getsize(out), "bytes")
    print(len(text), "chars")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
