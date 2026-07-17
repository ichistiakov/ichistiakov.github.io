# AGENTS.md — инструкция для AI-агента

Это личный блог на Hugo с четырьмя темами оформления. Файл написан для тебя — агента, которому владелец поручил развернуть, настроить или вести этот сайт.

## Команды

```bash
hugo server                          # локальный предпросмотр (тема из hugo.toml)
hugo server --theme midnight         # предпросмотр другой темы без правки конфига
hugo --gc --minify                   # боевая сборка в public/
./scripts/preview-all.sh             # собрать все 4 темы разом + страницу-переключатель
```

Требуется Hugo **extended** ≥ 0.146 (`brew install hugo` или бинарник с github.com/gohugoio/hugo/releases).

## Карта репозитория

- `hugo.toml` — имя, домен, меню, активная тема (`theme = "..."`).
- `data/site.yaml` — ссылки, подвал, список проектов. Используется всеми темами.
- `content/` — страницы (`kto-ya.md`, `proekty.md`, `now.md`, `biblioteka.md`, `kontakty.md`) и посты (`blog/<slug>/index.md`).
- `themes/` — 4 темы: `meridian`, `manuscript`, `signal`, `midnight`.
- `layouts/` — ОБЩИЕ для всех тем шорткоды (`carousel`, `figimg`), render-image-хук, 404, robots.txt, партиалы `schema.html` и `page-extras.html`. Не дублируй их в темы.
- `assets/img/hero.jpg` — портрет владельца (страница «Кто я»); `assets/js/carousel.js` и `assets/js/lightbox.js` — общий JS карусели и лайтбокса (увеличение картинок по клику), подключаются в `baseof.html` каждой темы.

## Как добавить пост

Пост — это page bundle: папка `content/blog/<slug>/` с файлом `index.md`. Быстрый способ:

```bash
hugo new content --kind blog blog/moy-post
```

Frontmatter-поля: `title`, `date`, `tags` (список), `summary` (анонс в списке блога), опционально `hideCover: true` (не показывать обложку внутри поста) и `discuss: <url>` (ссылка «Обсудить →»).

- Обложка — файл `cover.jpg`/`cover.png` рядом с `index.md`; сама появляется в списке блога, в начале поста и в og:image.
- Картинки — в подпапке `img/` рядом; вставка обычным markdown `![Подпись](img/foto.jpg "Подпись")`. Hugo сам сожмёт до 1400px.
- Фото с управлением размером: `{{</* figimg src="img/x.jpg" caption="Подпись" class="is-half" */>}}`.
- Галерея: шорткод `carousel`, внутри — markdown-картинки, каждая строка = слайд (см. пост `post-s-fotografiyami`).
- Любая картинка в теле статьи открывается на весь экран по клику (лайтбокс). Картинки карусели тоже: открываются крупно и листаются между собой (стрелки/←→/свайп). Дописывать ничего не нужно.

## Правила работы с темами

- Все токены стиля (цвета, шрифты, ширина колонки) — CSS-переменные в начале `themes/<тема>/assets/css/main.css`. Смена акцентного цвета = правка одной переменной.
- Контентная задача (пост, страница, правка текста) не должна трогать `layouts/` — ни темы, ни общие.
- Стилевая правка делается только в АКТИВНОЙ теме, не во всех четырёх сразу (если владелец не попросил иначе).
- Подключение нового шрифта: `<link>` в `layouts/baseof.html` темы + переменная `--font`/`--font-serif` в её CSS.
- Перед коммитом собери все 4 темы — они разделяют контент и общие layouts, ломать чужую тему нельзя:

```bash
for t in meridian manuscript signal midnight; do hugo --theme $t -d /tmp/check-$t --quiet || echo "FAIL: $t"; done
```

## Известные грабли Hugo (проверено на практике)

1. **Внутренние ссылки — только `.RelPermalink`**, никаких `"/path/" | relURL`. При сборке с path-baseURL (превью тем, project pages на GitHub) `relURL` даёт битые пути.
2. **Кириллические теги** — ссылки на термы строить только через `.GetTerms "tags"` → `.RelPermalink`. Конструкция `site.GetPage (printf "/tags/%s" (urlize .))` кириллицу не находит.
3. **Плоская структура layouts** (Hugo 0.146+): `layouts/home.html`, `page.html`, `section.html`, `blog/page.html` — без папки `_default/`. Не смешивать со старой схемой.
4. **`languageCode` устарел** — используем `locale = "ru-RU"` (уже в конфиге).
5. **Email в mailto** — писать `&#64;` вместо `@` (`{{ replace . "@" "&#64;" | safeHTML }}`), иначе goldmark-автолинк ломает разметку.
6. **Внешние ссылки в content/*.md** — сырым HTML `<a href="..." target="_blank" rel="noopener">` (в конфиге включён `unsafe = true`). Внутренние — обычным markdown.
7. **SVG не проходит через image processing** — обложки и картинки постов только растровые (jpg/png/webp).
8. **`baseURL` со слэшем на конце** — иначе поедут абсолютные ссылки (og, canonical, sitemap).

## Деплой

- **GitHub Pages** — workflow `.github/workflows/hugo.yml` уже в репо: включить Pages (Source: GitHub Actions) и пушнуть в `main`.
- **Свой VPS** — `cp deploy-vps.sh.example deploy.sh`, заполнить переменные вверху; без флагов скрипт делает dry-run, реальная заливка `./deploy.sh --go`. Никогда не запускай `--go` без явной просьбы владельца.
- **Vercel / Netlify / Cloudflare Pages** — build command `hugo --gc --minify`, output `public`, переменная окружения `HUGO_VERSION=0.162.1`.

## Чего не делать без явной просьбы владельца

- Не менять активную тему и не «улучшать» дизайн по собственной инициативе.
- Не деплоить (`--go`, пуш в main с включённым Pages — это тоже деплой).
- Не удалять посты и страницы.
- Не трогать чужие темы при стилевых правках.
