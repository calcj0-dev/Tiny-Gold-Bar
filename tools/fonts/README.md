# 丸ゴシックの作り方

画面の文字は丸ゴシック **M PLUS Rounded 1c**（SIL Open Font License 1.1。`public/fonts/OFL.txt`）を使う。
外部（Google Fonts）から読み込まず、このゲームで使う文字だけを取り出した woff2 を `public/fonts/` に置く（通信先を増やさないため。プライバシーの文言は Vercel Analytics だけのまま）。

**文言を変えて、新しい漢字などが増えたら作り直す。** 作り直さないと、その文字だけ別の書体で表示される。

```
pip install fonttools brotli
# 元の ttf（Medium・Bold・ExtraBold）を https://github.com/google/fonts/tree/main/ofl/mplusrounded1c から取る
python tools/fonts/subset.py <元の ttf があるフォルダ> public/fonts
```
