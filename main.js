// ── Custom cursor (тільки desktop з мишею) ─────────────────────
const isTouch = window.matchMedia('(pointer: coarse)').matches;
let dot = null, ring = null;

if (!isTouch) {
  dot  = document.createElement('div');
  ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  (function lerp() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(lerp);
  })();

  const hoverEls = 'a, button, .filter-btn, .pcard, .service-card, .testi-card, input, textarea, select';
  document.querySelectorAll(hoverEls).forEach(el => {
    el.addEventListener('mouseenter', () => { dot.classList.add('hovering'); ring.classList.add('hovering'); });
    el.addEventListener('mouseleave', () => { dot.classList.remove('hovering'); ring.classList.remove('hovering'); });
  });

  document.addEventListener('mousedown', () => { dot.classList.add('clicking'); ring.classList.add('clicking'); });
  document.addEventListener('mouseup',   () => { dot.classList.remove('clicking'); ring.classList.remove('clicking'); });
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
}

// ── NAV ────────────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Burger ─────────────────────────────────────────────────────
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
document.querySelectorAll('.mm-link').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// ── Scroll-to-top ──────────────────────────────────────────────
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Nav scroll-spy ─────────────────────────────────────────────
const navLinks   = document.querySelectorAll('.nav__links a[href^="#"]');
const spySections = document.querySelectorAll('section[id]');

const spyObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(l => l.classList.remove('nav-active'));
    const link = document.querySelector(`.nav__links a[href="#${entry.target.id}"]`);
    if (link) link.classList.add('nav-active');
  });
}, { rootMargin: '-30% 0px -65% 0px' });

spySections.forEach(s => spyObserver.observe(s));

// ── Stat counter animation ─────────────────────────────────────
function animateCount(el) {
  const raw    = el.textContent;
  const target = parseInt(raw);
  const suffix = raw.replace(/[0-9]/g, '');
  if (isNaN(target)) return;
  const start  = performance.now();
  const dur    = 1400;
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(e * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.hero__stat strong').forEach(animateCount);
    counterObserver.unobserve(entry.target);
  });
}, { threshold: 0.6 });

const statsEl = document.querySelector('.hero__stats');
if (statsEl) counterObserver.observe(statsEl);

// ── Process auto-hover cycle ───────────────────────────────────
// ── Process auto-hover cycle ───────────────────────────────────
(function initProcessCycle() {
  const steps      = [...document.querySelectorAll('.process__step')];
  const connectors = [...document.querySelectorAll('.process__connector')];
  if (!steps.length) return;

  let idx        = 0;
  let paused     = false;
  let cycleTimer = null;
  let hoverTimer = null;

  // Тривалості фаз (мс)
  const T = { card: 650, line: 560, star: 420, fade: 320 };

  function setActive(i) {
    steps.forEach((s, j) => s.classList.toggle('auto-active', j === i));
    idx = i;
  }

  function resetConnector(c) {
    if (!c) return;
    c.classList.remove('line-active', 'star-active', 'star-fade');
  }

  function schedule(ms, fn) {
    cycleTimer = setTimeout(() => { if (!paused) fn(); }, ms);
  }

  function runStep() {
    setActive(idx);
    const nextIdx = (idx + 1) % steps.length;
    const conn    = connectors[idx]; // connector між idx і idx+1

    schedule(T.card, () => {
      if (!conn) {
        // Остання → перша: та ж затримка без коннектора
        schedule(T.line + T.star + T.fade, () => { idx = nextIdx; runStep(); });
        return;
      }

      // Фаза 1: лінія загоряється зліва направо
      conn.classList.add('line-active');

      schedule(T.line, () => {
        // Фаза 2: лінія тухне, зірочка загоряється
        conn.classList.remove('line-active');
        conn.classList.add('star-active');

        schedule(T.star, () => {
          // Фаза 3: зірочка тухне
          conn.classList.add('star-fade');

          schedule(T.fade, () => {
            resetConnector(conn);
            idx = nextIdx;
            runStep();
          });
        });
      });
    });
  }

  // Debounce hover — не реагуємо на швидкий рух між картками
  steps.forEach(step => {
    step.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        paused = true;
        clearTimeout(cycleTimer);
        connectors.forEach(resetConnector);
        steps.forEach(s => s.classList.remove('auto-active'));
      }, 260);
    });
    step.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        paused = false;
        runStep();
      }, 320);
    });
  });

  runStep();
})();

// ── Custom select ──────────────────────────────────────────────
document.querySelectorAll('.form-group select').forEach(select => {
  select.style.display = 'none';
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);

  const label = document.createElement('span');
  label.className = 'custom-select__label';
  label.textContent = select.options[0]?.text || 'Оберіть';

  const arrowSvg = `<svg class="custom-select__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select__trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `<span class="custom-select__label">${select.options[0]?.text || 'Оберіть'}</span>${arrowSvg}`;

  const dropdown = document.createElement('ul');
  dropdown.className = 'custom-select__dropdown';
  dropdown.setAttribute('role', 'listbox');

  [...select.options].forEach((opt, i) => {
    const li = document.createElement('li');
    li.className = 'custom-select__option' + (i === 0 ? ' placeholder' : '');
    li.setAttribute('role', 'option');
    li.textContent = opt.text;
    li.dataset.value = opt.value;
    li.addEventListener('click', e => {
      e.stopPropagation();
      select.value = opt.value;
      const lbl = trigger.querySelector('.custom-select__label');
      lbl.textContent = opt.text;
      lbl.classList.toggle('selected', i !== 0);
      dropdown.querySelectorAll('.custom-select__option').forEach(o => o.classList.remove('active'));
      li.classList.add('active');
      close();
    });
    dropdown.appendChild(li);
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(dropdown);

  let open = false;
  function toggle() { open ? close() : openDrop(); }
  function openDrop() {
    open = true;
    wrapper.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  }
  function close() {
    open = false;
    wrapper.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  trigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'Escape') close();
  });
  document.addEventListener('click', close);
  wrapper.addEventListener('click', e => e.stopPropagation());
});

// ── Dynamic year ───────────────────────────────────────────────
const yearEl = document.getElementById('footerYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Marquee init ───────────────────────────────────────────────
function initMarquee() {
  const track = document.querySelector('.marquee__track');
  if (!track) return;
  const group = track.querySelector('.marquee__group');
  if (!group) return;

  // Видаляємо попередні клони (якщо є)
  track.querySelectorAll('.marquee__group ~ .marquee__group').forEach(g => g.remove());

  const gw = group.getBoundingClientRect().width;
  if (!gw) return;

  // Клонуємо поки track не заповнить 2.5× ширини екрану
  const needed = Math.ceil((window.innerWidth * 2.5) / gw) + 1;
  for (let i = 1; i < needed; i++) {
    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  // Анімуємо рівно на ширину однієї групи (px, не %)
  track.style.setProperty('--mq-dist', `-${gw}px`);
}

// Чекаємо шрифти для точного вимірювання
(document.fonts ? document.fonts.ready : Promise.resolve()).then(initMarquee);

// ── Project data ───────────────────────────────────────────────
// coverPos: 'top' | 'center' | 'bottom' | '50% 30%'
// wide: true  → займає 2 колонки
// tall: true  → займає 2 рядки

const PROJECTS = [

  // ── AI-фото ──────────────────────────────────────────────────
  {
    id: 'fashion',
    cat: 'photo',
    tag: 'Fashion Brand',        tagColor: '',
    title: 'Fashion Brand Shoot',
    coverPos: 'top',     
    items: [
      { type: 'img', src: 'img/portfolio/2b06ff3e9ec4077a01eca190f4658fa4_cdd394dd_f31a_4b61_ae15_8c72ac4e72de.png' },
      { type: 'img', src: 'img/portfolio/IMG_5692.PNG' }
    ]
  },
  {
    id: 'beauty',
    cat: 'photo',
    tag: 'AI-фото · Beauty',     tagColor: '',
    title: 'AI Beauty Brand',
    tall: true,
    coverPos: 'c',        
    items: [
      { type: 'img', src: 'img/portfolio/4cef482e1964798bc12eab5235d1e3c5_7aa2f510_318f_4104_a8c2_fdaf1e2b25b3.png' },
      { type: 'img', src: 'img/portfolio/76b34d0049a98415cc596939a2581c2d_7e455519_bbfa_46d9_8200_5781f9703dcf.png' },
      { type: 'img', src: 'img/portfolio/f8ba6398be6a35e9962209f69a692300_f823017d_f3a4_4e8f_8667_ca044c061f55.png' }
    ]
  },
  {
    id: 'lifestyle',
    cat: 'photo',
    tag: 'AI-фото · Lifestyle',  tagColor: '',
    title: 'AI Lifestyle для блогера',
    coverPos: 'center',          
    tall: true,
    items: [
      { type: 'img', src: 'img/portfolio/photo_2026-04-21_10-49-01.jpg' }
    ]
  },
  {
    id: 'frames',
    cat: 'photo',
    tag: 'AI-фото · Зйомка',    tagColor: '',
    title: 'Зйомка · Кадри',
    tall: true,
    coverPos: 'top',          
    items: [
      { type: 'img', src: 'img/portfolio/кадр 1 .jpg' },
      { type: 'img', src: 'img/portfolio/кадр 2 .png' },
      { type: 'img', src: 'img/portfolio/кадр 3 .jpg' },
      { type: 'img', src: 'img/portfolio/кадр 4.jpg' },
      { type: 'img', src: 'img/portfolio/кадр 5.jpg' },
      { type: 'img', src: 'img/portfolio/5.1 кадр.jpg' }
    ]
  },
  {
    id: 'process',
    cat: 'photo',
    tag: 'Behind the scenes',    tagColor: '',
    title: 'Процес роботи',
    coverPos: 'center',         
    items: [
      { type: 'img', src: 'img/portfolio/Процес 1.jpg' },
      { type: 'img', src: 'img/portfolio/процес 2.jpg' },
      { type: 'img', src: 'img/portfolio/процес 3.jpg' },
      { type: 'img', src: 'img/portfolio/процес 4.jpg' },
      { type: 'img', src: 'img/portfolio/процес 5 .jpg' }
    ]
  },
  {
    id: 'visuals',
    cat: 'photo',
    tag: 'AI-фото · Візуал',     tagColor: '',
    title: 'Візуалізації',
    coverPos: 'center',        
    items: [
      { type: 'img', src: 'img/portfolio/візуалізація .jpg' },
      { type: 'img', src: 'img/portfolio/світшот .jpg' }
    ]
  },

  // ── Відео ─────────────────────────────────────────────────────
  {
    id: 'reels',
    cat: 'video',
    tag: 'Відео · Reels',        tagColor: 'yellow',
    title: 'Рекламний відеоролик',
    items: [
      { type: 'video', src: 'img/portfolio/IMG_5999.MOV' }
    ]
  },
  {
    id: 'promo',
    cat: 'video',
    tag: 'Відео · Promo',        tagColor: 'yellow',
    title: 'Проморолик',
    items: [
      { type: 'video', src: 'img/portfolio/Проморолик.MOV' }
    ]
  },
  {
    id: 'videos',
    cat: 'video',
    tag: 'Відео · Серія',        tagColor: 'yellow',
    title: 'Відеосерія',
    wide: true,
    items: [
      { type: 'video', src: 'img/portfolio/від 1.mp4' },
      { type: 'video', src: 'img/portfolio/від 2.mp4' },
      { type: 'video', src: 'img/portfolio/від 3.mp4' },
      { type: 'video', src: 'img/portfolio/від 4.mp4' },
      { type: 'video', src: 'img/portfolio/від 5.mp4' },
      { type: 'video', src: 'img/portfolio/відео світшот .mp4' }
    ]
  },

  // ── YouTube ───────────────────────────────────────────────────
  {
    id: 'youtube',
    cat: 'youtube',
    tag: 'YouTube · Thumbnail',  tagColor: 'pink',
    title: 'Обкладинки для YouTube',
    coverPos: 'center',        
    items: [
      { type: 'img', src: 'img/portfolio/Обклад для блогера.png' }
    ]
  },

  // ── Реклама ───────────────────────────────────────────────────
  {
    id: 'hookah',
    cat: 'ad',
    tag: 'Реклама · Stories',    tagColor: 'pink',
    title: 'Home Нукан',
    coverPos: 'center',        
    items: [
      { type: 'img', src: 'img/portfolio/photo_2026-04-20_15-40-01.jpg' }
    ]
  },
  {
    id: 'crypto',
    cat: 'ad',
    tag: 'Реклама · Stories',    tagColor: 'yellow',
    title: 'Криптообмінник',
    coverPos: 'center',       
    items: [
      { type: 'img', src: 'img/portfolio/photo_2026-04-20_15-40-02.jpg' }
    ]
  },
  {
    id: 'house',
    cat: 'ad',
    tag: 'Реклама · Нерухомість', tagColor: '',
    title: 'Nagirniy House',
    coverPos: 'center',         
    items: [
      { type: 'img', src: 'img/portfolio/photo_2026-04-20_15-40-02 (2).jpg' }
    ]
  },
  {
    id: 'branding',
    cat: 'ad',
    tag: 'Брендинг · Дизайн',   tagColor: '',
    title: 'Брендинг · Візитівки',
    coverPos: 'center',          
    items: [
      { type: 'img', src: 'img/portfolio/Візитівка.jpg' },
      { type: 'img', src: 'img/portfolio/Візитівки.jpg' }
    ]
  },

];

// ── Lightbox ────────────────────────────────────────────────────
let lbProject = null;
let lbIndex   = 0;

const lightbox  = document.getElementById('lightbox');
const lbStage   = document.getElementById('lbStage');
const lbTitle   = document.getElementById('lbTitle');
const lbCounter = document.getElementById('lbCounter');
const lbThumbs  = document.getElementById('lbThumbs');
const lbPrev    = document.getElementById('lbPrev');
const lbNext    = document.getElementById('lbNext');

function openLightbox(project, index) {
  lbProject = project;

  lbThumbs.innerHTML = project.items.map((item, i) => {
    if (item.type === 'video') {
      return `<div class="lb-thumb lb-thumb--video" data-i="${i}" role="button" tabindex="0" aria-label="Відео ${i + 1}">
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg>
      </div>`;
    }
    return `<img src="${item.src}" alt="Мініатюра ${i + 1}" class="lb-thumb" data-i="${i}" loading="lazy" />`;
  }).join('');

  lbThumbs.querySelectorAll('.lb-thumb').forEach(t => {
    t.addEventListener('click', e => { e.stopPropagation(); lbGoTo(+t.dataset.i); });
  });

  lbGoTo(index);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  const vid = lbStage.querySelector('video');
  if (vid) vid.pause();
  lbProject = null;
}

function lbGoTo(index) {
  const vid = lbStage.querySelector('video');
  if (vid) vid.pause();

  lbIndex = index;
  const item  = lbProject.items[index];
  const total = lbProject.items.length;

  lbStage.innerHTML = '';
  if (item.type === 'video') {
    const v = document.createElement('video');
    v.src = item.src;
    v.controls = true;
    v.autoplay = true;
    v.className = 'lb-media';
    lbStage.appendChild(v);
  } else {
    const img = new Image();
    img.src = item.src;
    img.alt = lbProject.title;
    img.className = 'lb-media';
    lbStage.appendChild(img);
  }

  lbTitle.textContent   = lbProject.title;
  lbCounter.textContent = total > 1 ? `${index + 1} / ${total}` : '';

  lbPrev.style.display = index === 0           ? 'none' : 'flex';
  lbNext.style.display = index === total - 1   ? 'none' : 'flex';

  lbThumbs.style.display = total > 1 ? 'flex' : 'none';
  lbThumbs.querySelectorAll('.lb-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === index);
    if (i === index) t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);

lightbox.addEventListener('click', e => {
  if (!e.target.closest('.lightbox__stage') &&
      !e.target.closest('.lightbox__footer') &&
      !e.target.closest('.lightbox__nav') &&
      !e.target.closest('.lightbox__close')) {
    closeLightbox();
  }
});
lbPrev.addEventListener('click', () => lbGoTo(lbIndex - 1));
lbNext.addEventListener('click', () => lbGoTo(lbIndex + 1));

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft'  && lbIndex > 0)                       lbGoTo(lbIndex - 1);
  if (e.key === 'ArrowRight' && lbProject && lbIndex < lbProject.items.length - 1) lbGoTo(lbIndex + 1);
});

let touchStartX = 0;
lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 50) return;
  if (dx > 0 && lbIndex > 0) lbGoTo(lbIndex - 1);
  if (dx < 0 && lbProject && lbIndex < lbProject.items.length - 1) lbGoTo(lbIndex + 1);
});

// ── Render grid ─────────────────────────────────────────────────
const INITIAL_COUNT = 6;
let currentFilter = 'photo';
let showAll = false;

function buildCard(p) {
  const cover = p.items[0];
  const count = p.items.length;

  const pos = p.coverPos ? ` style="object-position:${p.coverPos}"` : '';
  const coverHTML = cover.type === 'video'
    ? `<video src="${cover.src}" autoplay muted loop playsinline class="pcard__media"></video>`
    : `<img src="${cover.src}" alt="${p.title}" loading="lazy" class="pcard__media"${pos} />`;

  const badgeHTML = count > 1
    ? `<div class="pcard__count">
         <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
         ${count}
       </div>`
    : '';

  const playHTML = cover.type === 'video'
    ? `<div class="pcard__play">
         <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg>
       </div>`
    : '';

  const cls = ['pcard', p.wide ? 'pcard--wide' : '', p.tall ? 'pcard--tall' : ''].filter(Boolean).join(' ');

  return `
    <div class="${cls}" data-id="${p.id}" tabindex="0" role="button" aria-label="Відкрити проєкт ${p.title}">
      <div class="pcard__thumb">${coverHTML}</div>
      ${playHTML}
      ${badgeHTML}
      <div class="pcard__overlay">
        <div class="pcard__open">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
        </div>
        <div class="pcard__meta">
          <span class="tag${p.tagColor ? ' tag--' + p.tagColor : ''}">${p.tag}</span>
          <h4 class="pcard__title">${p.title}</h4>
        </div>
      </div>
    </div>
  `;
}

function setGridCols(list) {
  const grid = document.getElementById('worksGrid');
  const n = list.length;
  if (!n) return;

  const hasWide = list.some(p => p.wide);
  let cols;

  if (n === 1) {
    cols = list[0].wide ? 2 : 1;
  } else if (hasWide && n <= 3) {
    // wide-елемент + мало карток → 2 колонки, щоб wide заповнив рядок
    cols = 2;
  } else {
    cols = Math.min(n, 3);
  }

  grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 420px))`;
}

function attachCardEvents(grid) {
  grid.querySelectorAll('.pcard').forEach(card => {
    const open = () => {
      const project = PROJECTS.find(p => p.id === card.dataset.id);
      if (project) openLightbox(project, 0);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    card.addEventListener('mouseenter', () => { dot?.classList.add('hovering'); ring?.classList.add('hovering'); });
    card.addEventListener('mouseleave', () => { dot?.classList.remove('hovering'); ring?.classList.remove('hovering'); });
  });
}

const BTN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="6 9 12 15 18 9"/></svg>`;

function setButton(state, hiddenCount) {
  const moreEl = document.getElementById('worksShowMore');
  if (state === 'show') {
    moreEl.innerHTML = `
      <button class="show-more-btn" id="showMoreBtn">
        Показати ще ${hiddenCount} ${BTN_SVG}
      </button>`;
    document.getElementById('showMoreBtn').addEventListener('click', showMoreCards);
  } else if (state === 'hide') {
    moreEl.innerHTML = `
      <button class="show-more-btn show-more-btn--hide" id="hideBtn">
        Сховати ${BTN_SVG}
      </button>`;
    document.getElementById('hideBtn').addEventListener('click', hideCards);
  } else {
    moreEl.innerHTML = '';
  }
}

function appendCard(p, delay) {
  const grid = document.getElementById('worksGrid');
  const tmp  = document.createElement('div');
  tmp.innerHTML = buildCard(p).trim();
  const card = tmp.firstElementChild;
  card.classList.add('pcard--entering');
  grid.appendChild(card);
  attachCardEvents(grid);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.transitionDelay = delay + 's';
    card.classList.remove('pcard--entering');
    card.addEventListener('transitionend', () => { card.style.transitionDelay = ''; }, { once: true });
  }));
}

function showMoreCards() {
  const list   = currentFilter === 'all' ? PROJECTS : PROJECTS.filter(p => p.cat === currentFilter);
  const toAdd  = list.slice(INITIAL_COUNT);
  const moreEl = document.getElementById('worksShowMore');

  moreEl.classList.add('fading');
  setTimeout(() => {
    showAll = true;
    toAdd.forEach((p, i) => appendCard(p, i * 0.07));
    setGridCols(list);
    setButton('hide', list.length - INITIAL_COUNT);
    moreEl.classList.remove('fading');
  }, 200);
}

function hideCards() {
  const grid   = document.getElementById('worksGrid');
  const moreEl = document.getElementById('worksShowMore');
  const cards  = [...grid.querySelectorAll('.pcard')];
  const toRemove = cards.slice(INITIAL_COUNT);

  moreEl.classList.add('fading');

  toRemove.forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.05}s`;
    card.classList.add('pcard--leaving');
  });

  const totalMs = (toRemove.length - 1) * 50 + 380;
  setTimeout(() => {
    toRemove.forEach(c => c.remove());
    showAll = false;
    const list = currentFilter === 'all' ? PROJECTS : PROJECTS.filter(p => p.cat === currentFilter);
    setGridCols(list.slice(0, INITIAL_COUNT));
    setButton('show', list.length - INITIAL_COUNT);
    moreEl.classList.remove('fading');
    document.getElementById('works').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, totalMs);
}

function _render() {
  const grid   = document.getElementById('worksGrid');
  const list   = currentFilter === 'all' ? PROJECTS : PROJECTS.filter(p => p.cat === currentFilter);
  const display = list.slice(0, INITIAL_COUNT);
  const hidden  = list.length - INITIAL_COUNT;

  grid.innerHTML = display.map(buildCard).join('');
  setGridCols(display);
  attachCardEvents(grid);
  grid.querySelectorAll('.pcard').forEach((el, i) => {
    el.setAttribute('data-reveal', 'zoom-in');
    el.dataset.revealDelay = +(i * 0.08).toFixed(2);
    revealObserver.observe(el);
  });

  setButton(hidden > 0 ? 'show' : 'none', hidden);
}

function renderGrid(filter) {
  currentFilter = filter;
  showAll = false;
  _render();
}

// ── Filter ──────────────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGrid(btn.dataset.filter);
  });
});

// ── Contact form → Telegram ─────────────────────────────────────
const TG_TOKEN   = 'заміни тут';
const TG_CHAT_ID = 'заміни тут';

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
function isValidPhone(v) {
  return /^[\+]?[\d\s\-\(\)]{7,15}$/.test(v.replace(/\s/g, ''));
}
function setFieldError(input, msg) {
  input.classList.add('field-error');
  let err = input.parentElement.querySelector('.field-error-msg');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error-msg';
    input.parentElement.appendChild(err);
  }
  err.textContent = msg;
}
function clearFieldError(input) {
  input.classList.remove('field-error');
  input.parentElement.querySelector('.field-error-msg')?.remove();
}

document.getElementById('contactForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');

  const data    = new FormData(form);
  const name    = (data.get('name')    || '').trim();
  const contact = (data.get('email')   || '').trim();
  const service = (data.get('service') || '—');
  const message = (data.get('message') || '').trim();

  // Валідація
  let hasError = false;

  const nameInput    = form.querySelector('[name="name"]');
  const contactInput = form.querySelector('[name="email"]');

  clearFieldError(nameInput);
  clearFieldError(contactInput);

  if (name.length < 2) {
    setFieldError(nameInput, 'Введіть ім\'я (мінімум 2 символи)');
    hasError = true;
  }
  if (!contact) {
    setFieldError(contactInput, 'Введіть email або номер телефону');
    hasError = true;
  } else if (!isValidEmail(contact) && !isValidPhone(contact)) {
    setFieldError(contactInput, 'Невірний формат — введіть email або номер телефону');
    hasError = true;
  }
  if (hasError) return;

  const text = `📩 <b>Нова заявка з сайту!</b>\n\n` +
               `👤 <b>Ім'я:</b> ${name}\n` +
               `📬 <b>Контакт:</b> ${contact}\n` +
               `🎯 <b>Послуга:</b> ${service}\n` +
               `💬 <b>Повідомлення:</b>\n${message}`;

  btn.disabled    = true;
  btn.textContent = 'Надсилаємо...';

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
    });

    if (!res.ok) throw new Error();

    form.innerHTML = `
      <div class="form-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3>Заявку надіслано!</h3>
        <p>Дякую за звернення. Відповім протягом 24 годин.</p>
      </div>`;
  } catch {
    btn.disabled    = false;
    btn.textContent = 'Надіслати заявку';
    alert('Помилка надсилання. Спробуй ще раз або напиши напряму в Telegram.');
  }
});

// ── Scroll Reveal ───────────────────────────────────────────────
const revealMap = [
  { sel: '.hero__content',     v: 'fade-right', delay: 0 },
  { sel: '.hero__visual',      v: 'fade-left',  delay: 0.2 },
  { sel: '.about__photo-wrap', v: 'fade-right', delay: 0 },
  { sel: '.about__chip--1',    v: 'fade-right', delay: 0.2 },
  { sel: '.about__chip--2',    v: 'fade-left',  delay: 0.35 },
  { sel: '.about__chip--3',    v: 'fade-right', delay: 0.5 },
  { sel: '.about__text',       v: 'fade-left',  delay: 0.15 },
  { sel: '.section-header',    v: 'fade-up',    delay: 0 },
  { sel: '.process__step',     v: 'zoom-up',    delay: null },
  { sel: '.service-card',      v: 'zoom-up',    delay: null },
  { sel: '.testi-card',        v: 'fade-up',    delay: null },
  { sel: '.contact__text',     v: 'fade-right', delay: 0 },
  { sel: '.contact__form',     v: 'fade-left',  delay: 0.2 },
];

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.style.transitionDelay = (el.dataset.revealDelay || '0') + 's';
    el.classList.add('revealed');
    revealObserver.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealMap.forEach(({ sel, v, delay }) => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.setAttribute('data-reveal', v);
    el.dataset.revealDelay = delay !== null ? delay : +(i * 0.12).toFixed(2);
    revealObserver.observe(el);
  });
});

// ── Initial render ──────────────────────────────────────────────
renderGrid('photo');
