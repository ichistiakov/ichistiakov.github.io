#!/usr/bin/env python3
"""Экспорт марок альбома «как на сайте» — с рамкой, перфорацией и датой — в PNG.

Собирает сайт во временную папку, берёт из /albom/ каждую марку и снимает её
headless Chrome'ом тем же CSS, что на сайте (прозрачный фон, без наклона, ×3).

Запуск из корня репозитория:
  ./scripts/export-stamps.py              # прозрачный фон, ×3 → stamps/<slug>.png
  ./scripts/export-stamps.py --telegram   # для поста: ×2, бумажный фон → stamps/<slug>_tg.png
  ./scripts/export-stamps.py --zoom 1.5 --bg "#fbf5e8" --pad 20 --out папка
По умолчанию PNG ложатся в ../pictures/album/stamps/ (вне git сайта).
Telegram заливает прозрачный фон фото чёрным — для поста нужен --bg.
Нужны: hugo, Google Chrome. Только стандартная библиотека Python.
"""
import argparse
import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
root = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser(description="Марки альбома с рамкой в PNG")
ap.add_argument("--telegram", action="store_true", help="пресет для поста: ×2, бумажный фон, поля")
ap.add_argument("--zoom", type=float, help="масштаб от CSS-размера 168×196 (по умолчанию 3)")
ap.add_argument("--bg", help="цвет фона, например #fbf5e8 (по умолчанию прозрачный)")
ap.add_argument("--pad", type=int, help="поля вокруг марки, css px до зума (по умолчанию 8)")
ap.add_argument("--out", type=Path, default=root.parent / "pictures" / "album" / "stamps")
a = ap.parse_args()
ZOOM = a.zoom or (2 if a.telegram else 3)
PAD = a.pad if a.pad is not None else (24 if a.telegram else 8)
BG = a.bg or ("#fbf5e8" if a.telegram else "transparent")   # #fbf5e8 — бумага альбома
SUFFIX = "_tg" if a.telegram else ""
W, H = round((168 + 2 * PAD) * ZOOM), round((196 + 2 * PAD) * ZOOM)
out_dir = a.out
out_dir.mkdir(parents=True, exist_ok=True)

with tempfile.TemporaryDirectory() as tmp:
    pub = Path(tmp) / "public"
    subprocess.run(["hugo", "--quiet", "-d", str(pub)], cwd=root, check=True)
    page = (pub / "albom" / "index.html").read_text()
    css = re.search(r'<link[^>]+href="?(/css/[^"\s>]+\.css)', page).group(1)

    # лист момента: data-slug, внутри .stamp — img (или заглушка) и номинал
    leaves = re.findall(r'data-slug="?([\w-]+)"?.*?(<div class="?stamp"?>.*?</div>)', page, re.S)
    if not leaves:
        sys.exit("В /albom/ нет моментов с маркой")

    for slug, stamp in leaves:
        # абсолютные пути сайта → файлы временной сборки
        stamp = re.sub(r'src="?/([^"\s>]+)"?', lambda m: f'src="file://{pub}/{m.group(1)}"', stamp)
        stamp = stamp.replace('loading=lazy', '').replace('loading="lazy"', '')
        doc = f"""<!doctype html><html data-theme="light"><head>
<link rel="stylesheet" href="file://{pub}{css}">
<style>
  html, body {{ margin: 0; background: {BG} !important; }}
  body {{ padding-top: 100px; }}  /* sips режет по центру: окно H+200, марка в [100, 100+H] */
  .album {{ margin: 0; max-width: none; }}
  /* по центру: sips режет по центру, а окно Chrome не бывает уже ~500px */
  .wrap {{ zoom: {ZOOM}; padding: {PAD}px; width: fit-content; margin: 0 auto; }}
  /* окно уже 800px — гасим мобильную вёрстку марки, берём десктопную */
  .stamp-wrap {{ position: static !important; margin: 0 !important; transform: none; }}
  .stamp {{ width: 168px !important; height: 196px !important; gap: 6px !important; }}
  .stamp-denom {{ font-size: 13px !important; }}
</style></head><body>
<div class="album"><div class="wrap"><div class="stamp-wrap">{stamp}</div></div></div>
</body></html>"""
        src = Path(tmp) / f"{slug}.html"
        src.write_text(doc)
        png = out_dir / f"{slug}{SUFFIX}.png"
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                        "--allow-file-access-from-files", "--default-background-color=00000000",
                        # headless съедает ~90px высоты окна — снимаем с запасом, потом обрезаем
                        f"--window-size={max(W, 600)},{H + 200}", "--virtual-time-budget=3000",
                        f"--screenshot={png}", f"file://{src}"],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(["sips", "-c", str(H), str(W), str(png)],  # по центру
                       check=True, stdout=subprocess.DEVNULL)
        print(f"→ {png}  ({html.unescape(slug)})")
