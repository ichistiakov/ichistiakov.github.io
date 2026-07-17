/* Карусель-листалка для постов блога.
   Берёт <figure> внутри .carousel, собирает в дорожку со слайдами,
   добавляет стрелки по бокам, точки-навигацию и подпись снизу.
   Управление: клик по стрелкам, клик по точке, свайп, стрелки клавиатуры. */
(function () {
  'use strict';

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function init(root) {
    var figures = Array.prototype.slice.call(root.querySelectorAll('figure'));
    if (!figures.length) return;

    // Собираем подписи и убираем дублирующую figcaption — подпись покажем одну, снизу.
    var captions = figures.map(function (fig) {
      var c = fig.querySelector('figcaption');
      var text = c ? c.innerHTML : '';
      if (c) c.parentNode.removeChild(c);
      // сохраняем подпись на картинке, чтобы её мог показать лайтбокс
      var im = fig.querySelector('img');
      if (im && text) im.setAttribute('data-caption', text);
      return text;
    });

    root.innerHTML = '';
    root.classList.add('carousel--ready');

    var viewport = el('div', 'carousel-viewport');
    var track = el('div', 'carousel-track');
    figures.forEach(function (fig, i) {
      var slide = el('div', 'carousel-slide', {
        role: 'group',
        'aria-roledescription': 'слайд',
        'aria-label': (i + 1) + ' из ' + figures.length
      });
      slide.appendChild(fig);
      track.appendChild(slide);
    });
    viewport.appendChild(track);
    root.appendChild(viewport);

    var n = figures.length;
    var index = 0;
    var single = n < 2;

    var caption = el('div', 'carousel-caption');
    var dotsWrap, counter, prev, next;

    if (!single) {
      prev = el('button', 'carousel-arrow carousel-prev', { type: 'button', 'aria-label': 'Предыдущий слайд' });
      next = el('button', 'carousel-arrow carousel-next', { type: 'button', 'aria-label': 'Следующий слайд' });
      prev.innerHTML = '<span aria-hidden="true">‹</span>';
      next.innerHTML = '<span aria-hidden="true">›</span>';
      root.appendChild(prev);
      root.appendChild(next);
      prev.addEventListener('click', function () { go(index - 1); });
      next.addEventListener('click', function () { go(index + 1); });
    }

    root.appendChild(caption);

    if (!single) {
      var nav = el('div', 'carousel-nav');
      dotsWrap = el('div', 'carousel-dots');
      figures.forEach(function (_, i) {
        var d = el('button', 'carousel-dot', { type: 'button', 'aria-label': 'Слайд ' + (i + 1) });
        d.addEventListener('click', function () { go(i); });
        dotsWrap.appendChild(d);
      });
      counter = el('div', 'carousel-counter');
      nav.appendChild(dotsWrap);
      nav.appendChild(counter);
      root.appendChild(nav);

      // клавиатура
      root.tabIndex = 0;
      root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { go(index - 1); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { go(index + 1); e.preventDefault(); }
      });

      // свайп
      var x0 = null;
      viewport.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      viewport.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        x0 = null;
      });
    }

    function go(i) {
      index = (i % n + n) % n;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      caption.innerHTML = captions[index] || '';
      caption.style.display = captions[index] ? '' : 'none';
      if (dotsWrap) {
        Array.prototype.forEach.call(dotsWrap.children, function (d, di) {
          d.setAttribute('aria-current', di === index ? 'true' : 'false');
        });
      }
      if (counter) counter.textContent = (index + 1) + ' / ' + n;
    }

    go(0);
  }

  function boot() {
    var list = document.querySelectorAll('.carousel');
    Array.prototype.forEach.call(list, init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
