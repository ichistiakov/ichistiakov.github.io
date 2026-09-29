// Фотоальбом /albom/: показывает один лист (обложка или разворот момента) и листает.
// Листать: уголки страниц, клавиши ← →, свайп. Наугад: ленточка-закладка на
// развороте и уголок фото из-под обложки (случайный момент, не текущий).
// Якорь #<slug>. Без JS листы идут лентой — этот скрипт только включает режим «книги».
(function () {
  var root = document.querySelector('[data-album]');
  if (!root) return;
  var leaves = Array.prototype.slice.call(root.querySelectorAll('.album-leaf'));
  var ribbon = root.querySelector('.album-ribbon');
  var hint = root.querySelector('.album-hint');
  var live = root.querySelector('.album-sr');
  var total = leaves.length - 1; // моментов, без обложки
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0;

  root.classList.add('is-js');
  if (ribbon) ribbon.hidden = total < 2;

  // подсказка «как листать» — один раз на браузер
  var HINT_KEY = 'album-hint-seen';
  function hintSeen() { try { return localStorage.getItem(HINT_KEY) === '1'; } catch (e) { return false; } }
  if (hint && total > 0 && !hintSeen()) hint.hidden = false;
  function dismissHint() {
    if (!hint || hint.hidden || hint.classList.contains('is-out')) return;
    try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}
    hint.classList.add('is-out');
    setTimeout(function () { hint.hidden = true; }, reduce ? 0 : 600);
  }

  function indexFromHash() {
    var slug = decodeURIComponent(location.hash.slice(1));
    if (!slug) return 0;
    for (var i = 1; i < leaves.length; i++) if (leaves[i].dataset.slug === slug) return i;
    return 0; // неизвестный якорь (момент удалён) — обложка
  }

  function update() {
    root.classList.toggle('at-cover', cur === 0);
    if (live) live.textContent = cur === 0 ? 'Обложка альбома' : 'Страница ' + cur + ' из ' + total;
    var url = location.pathname + location.search + (cur ? '#' + leaves[cur].dataset.slug : '');
    history.replaceState(null, '', url);
  }

  function show(i, dir) {
    if (i < 0 || i >= leaves.length || i === cur) return;
    dismissHint();
    var prev = leaves[cur];
    prev.classList.remove('is-current', 'is-in-next', 'is-in-prev');
    cur = i;
    var leaf = leaves[cur];
    leaf.classList.remove('is-in-next', 'is-in-prev');
    if (!reduce) {
      void leaf.offsetWidth; // перезапуск анимации
      leaf.classList.add(dir < 0 ? 'is-in-prev' : 'is-in-next');
    }
    leaf.classList.add('is-current');
    update();
    // длинный текст на телефоне: новая страница начинается с верха альбома
    if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  function random() {
    if (total < 1 || (total < 2 && cur !== 0)) return;
    var i;
    do { i = 1 + Math.floor(Math.random() * total); } while (i === cur);
    show(i, i < cur ? -1 : 1);
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-go]');
    if (!btn) return;
    e.preventDefault();
    var go = btn.dataset.go;
    if (go === 'next') show(cur + 1, 1);
    else if (go === 'prev') show(cur - 1, -1);
    else if (go === 'random') random();
  });

  document.addEventListener('keydown', function (e) {
    if (document.querySelector('.lightbox.open')) return; // стрелки листают фото в лайтбоксе
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { show(cur + 1, 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { show(cur - 1, -1); e.preventDefault(); }
  });

  var x0 = null, y0 = null;
  var book = root.querySelector('.album-book');
  book.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  book.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    var dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) show(cur + 1, 1); else show(cur - 1, -1);
    }
  });

  window.addEventListener('hashchange', function () { show(indexFromHash(), 1); });

  // стартовый лист — по якорю, без анимации
  var start = indexFromHash();
  if (start) {
    leaves[0].classList.remove('is-current');
    cur = start;
    leaves[cur].classList.add('is-current');
    // браузер сам прокрутит к id-якорю; scroll-margin-top в CSS держит лист под шапкой
  }
  update();
})();
