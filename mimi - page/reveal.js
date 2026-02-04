  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ====== Reveal + parallax-like progress (no blur) ======
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

  revealEls.forEach((el, i) => {
    if (!el.dataset.revealAmp) {
      const amp = 10 + (i % 7) * 2; // 10..22
      el.dataset.revealAmp = String(amp);
    }
  });

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function applyProgress(el, p){
    const type = el.getAttribute('data-reveal') || 'up';
    const amp = Number(el.dataset.revealAmp || 14);
    const inv = 1 - p;

    let tx = 0, ty = 0, sc = 1, rx = 0;

    if (type === 'left')  tx =  amp * inv;
    if (type === 'right') tx = -amp * inv;
    if (type === 'up')    ty =  amp * inv;
    if (type === 'down')  ty = -amp * inv;

    if (type === 'zoom')  { ty = (amp * 0.6) * inv; sc = 1 - 0.04 * inv; }
    if (type === 'tilt')  { ty = (amp * 0.8) * inv; rx = 7 * inv; }

    el.style.opacity = String(p);

    const t = (type === 'tilt')
      ? `perspective(900px) rotateX(${rx.toFixed(2)}deg) translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(3)})`
      : `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(3)})`;

    el.style.transform = t;
  }

  function computeProgress(el){
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // зона анимации: от низа (92%) до чуть выше середины (25%)
    const start = vh * 0.92;
    const end   = vh * 0.25;

    const p = (start - r.top) / (start - end);
    return clamp(p, 0, 1);
  }

  // --- оптимизация через IO + "первый экран сразу" ---
  const active = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) active.add(en.target);
      else active.delete(en.target);
    });
  }, { rootMargin: '120% 0px 120% 0px', threshold: 0 });

  revealEls.forEach(el => io.observe(el));

  let ticking = false;

  function updateActive(){
    active.forEach(el => {
      const p = computeProgress(el);

      // если элемент уже на экране при заходе — сразу показываем
      if (p > 0) el.classList.add('in');

      if (prefersReduced) {
        el.classList.add('in');
        el.style.opacity = '';
        el.style.transform = '';
        return;
      }

      // Важно: чтобы на первом экране не было "полупрозрачности",
      // если элемент уже реально виден — фиксируем p=1
      // (обычно это hero и первый блок)
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const mostlyInView = r.top < vh * 0.90; // можешь подстроить (0.15..0.30)
      applyProgress(el, mostlyInView ? 1 : p);
    });
  }

  function onScrollOptimized(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActive();
      ticking = false;
    });
  }

  // старт: сразу, без ожидания скролла
  window.addEventListener('load', onScrollOptimized);
  window.addEventListener('scroll', onScrollOptimized, { passive: true });
  window.addEventListener('resize', onScrollOptimized);

  // также сразу после подключения скрипта
  onScrollOptimized();

  // Year
  document.getElementById('year').textContent = new Date().getFullYear();


  (() => {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const imgEl = lb.querySelector('.lightbox-img');
  const closeBtn = lb.querySelector('.lightbox-close');

  let lastFocus = null;

  const open = (src, alt = '') => {
    if (!src) return;

    lastFocus = document.activeElement;

    imgEl.alt = alt || '';
    imgEl.src = src;

    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    closeBtn?.focus?.();
  };

  const close = () => {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');

    imgEl.removeAttribute('src');
    imgEl.alt = '';

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  };

  // Делегирование по всем картинкам
  document.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;

    // исключаем сам лайтбокс
    if (img.classList.contains('lightbox-img')) return;

    // если поставишь data-no-lightbox — не будет открываться
    if (img.hasAttribute('data-no-lightbox')) return;

    // если картинка внутри ссылки — отменяем переход и открываем
    const a = img.closest('a');
    if (a && a.getAttribute('href') && a.getAttribute('href') !== '#') {
      e.preventDefault();
    }

    // берём src максимально надёжно
    const src =
      img.getAttribute('data-full') ||
      img.currentSrc ||
      img.src;

    open(src, img.alt);
  });

  // закрытие
  closeBtn?.addEventListener('click', close);

  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lb.classList.contains('open')) close();
  });

  // если картинка не загрузилась — чтобы было понятно
  imgEl.addEventListener('error', () => {
    console.warn('[lightbox] image failed to load:', imgEl.src);
  });
})();


document.querySelectorAll('.faq-item').forEach(item=>{
  item.addEventListener('toggle',()=>{

    if(item.open){
      document.querySelectorAll('.faq-item').forEach(el=>{
        if(el!==item) el.open=false;
      });
    }

  });
});
