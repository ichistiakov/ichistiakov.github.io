#!/usr/bin/env bash
# Сборка всех 4 тем в public-preview/ + страница-переключатель.
# Запуск из корня репозитория:  ./scripts/preview-all.sh
# Потом:  cd public-preview && python3 -m http.server 8000
# и откройте http://localhost:8000/
set -euo pipefail
cd "$(dirname "$0")/.."

THEMES=(meridian manuscript signal midnight)

rm -rf public-preview
mkdir -p public-preview

for theme in "${THEMES[@]}"; do
  echo "→ Сборка $theme → public-preview/$theme"
  hugo --theme "$theme" --baseURL "/$theme/" -d "public-preview/$theme" --quiet --cleanDestinationDir
done

cat > public-preview/index.html <<'HTML'
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Выбор темы</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 60px auto; padding: 0 24px; line-height: 1.6; }
  h1 { letter-spacing: -0.02em; }
  ul { list-style: none; padding: 0; }
  li { padding: 14px 0; border-bottom: 1px solid #e5e5e5; }
  a { font-size: 20px; font-weight: 600; color: #0f766e; text-decoration: none; }
  a:hover { text-decoration: underline; }
  span { display: block; color: #666; font-size: 15px; margin-top: 2px; }
</style>
</head>
<body>
<h1>Четыре темы — выбирайте</h1>
<ul>
  <li><a href="/meridian/">meridian</a><span>спокойный гротеск: белый фон, изумрудный акцент, сериф в постах</span></li>
  <li><a href="/manuscript/">manuscript</a><span>редакционный сериф: бумажный фон, буквица, нумерация секций</span></li>
  <li><a href="/signal/">signal</a><span>дерзкий минимализм: узкая колонка, огненный акцент, моно-детали</span></li>
  <li><a href="/midnight/">midnight</a><span>тёмная инверсия: почти чёрный фон, циановый акцент, duotone-фото</span></li>
</ul>
</body>
</html>
HTML

echo "✓ Готово: public-preview/ (4 темы + index.html)"
echo "  Просмотр: cd public-preview && python3 -m http.server 8000"
