// Лайтбокс для картинок в теле статьи: клик по картинке — увеличение на весь экран.
// Галерейный режим: если картинка внутри карусели, в лайтбоксе можно листать
// влево-вправо между картинками той же карусели (стрелки, клавиши ←/→, свайп).
// Одиночная картинка вне карусели открывается без стрелок.
(function () {
  var imgs = Array.prototype.slice.call(document.querySelectorAll('.prose figure img'));
  if (!imgs.length) return;

  // Группа для навигации: все картинки одной карусели по порядку, иначе — сама картинка.
  function groupOf(img) {
    var car = img.closest('.carousel');
    if (car) return Array.prototype.slice.call(car.querySelectorAll('figure img'));
    return [img];
  }
  // Подпись: carousel.js кладёт её в data-caption (после удаления figcaption); фолбэк — figcaption.
  function capOf(img) {
    if (img.getAttribute('data-caption')) return img.getAttribute('data-caption');
    var fig = img.closest('figure');
    var fc = fig && fig.querySelector('figcaption');
    return fc ? fc.innerHTML : '';
  }

  var overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Закрыть">✕</button>' +
    '<button class="lightbox-arrow lightbox-prev" type="button" aria-label="Предыдущая"><span aria-hidden="true">‹</span></button>' +
    '<img class="lightbox-img" alt="">' +
    '<button class="lightbox-arrow lightbox-next" type="button" aria-label="Следующая"><span aria-hidden="true">›</span></button>' +
    '<div class="lightbox-counter"></div>' +
    '<div class="lightbox-cap"></div>';
  document.body.appendChild(overlay);

  var lbImg = overlay.querySelector('.lightbox-img');
  var lbCap = overlay.querySelector('.lightbox-cap');
  var lbCounter = overlay.querySelector('.lightbox-counter');
  var btnPrev = overlay.querySelector('.lightbox-prev');
  var btnNext = overlay.querySelector('.lightbox-next');
  var btnClose = overlay.querySelector('.lightbox-close');

  var group = [];
  var index = 0;

  function show(i) {
    if (!group.length) return;
    index = (i % group.length + group.length) % group.length;
    var img = group[index];
    lbImg.src = img.currentSrc || img.src;
    var cap = capOf(img);
    lbCap.innerHTML = cap || '';
    lbCap.style.display = cap ? '' : 'none';
    var multi = group.length > 1;
    btnPrev.hidden = !multi;
    btnNext.hidden = !multi;
    lbCounter.textContent = multi ? (index + 1) + ' / ' + group.length : '';
    lbCounter.style.display = multi ? '' : 'none';
  }
  function open(img) {
    group = groupOf(img);
    var start = group.indexOf(img);
    show(start < 0 ? 0 : start);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('open');
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
  }

  imgs.forEach(function (img) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function () { open(img); });
  });

  // Клик по фону закрывает; по стрелкам/картинке/крестику — нет.
  overlay.addEventListener('click', close);
  lbImg.addEventListener('click', function (e) { e.stopPropagation(); });
  btnClose.addEventListener('click', function (e) { e.stopPropagation(); close(); });
  btnPrev.addEventListener('click', function (e) { e.stopPropagation(); show(index - 1); });
  btnNext.addEventListener('click', function (e) { e.stopPropagation(); show(index + 1); });

  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' && group.length > 1) { show(index - 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight' && group.length > 1) { show(index + 1); e.preventDefault(); }
  });

  // Свайп по картинке
  var x0 = null;
  lbImg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lbImg.addEventListener('touchend', function (e) {
    if (x0 === null || group.length < 2) { x0 = null; return; }
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
