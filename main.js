// ── Custom cursor ──────────────────────────────────────────────
const dot  = document.createElement('div');
const ring = document.createElement('div');
dot.className  = 'cursor-dot';
ring.className = 'cursor-ring';
document.body.append(dot, ring);

let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left  = mx + 'px';
  dot.style.top   = my + 'px';
});

// Ring follows with lerp
(function lerp() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(lerp);
})();

// Hover effect on interactive elements
const hoverEls = 'a, button, .filter-btn, .work-item, .service-card, .testi-card, input, textarea, select';
document.querySelectorAll(hoverEls).forEach(el => {
  el.addEventListener('mouseenter', () => { dot.classList.add('hovering'); ring.classList.add('hovering'); });
  el.addEventListener('mouseleave', () => { dot.classList.remove('hovering'); ring.classList.remove('hovering'); });
});

document.addEventListener('mousedown', () => { dot.classList.add('clicking'); ring.classList.add('clicking'); });
document.addEventListener('mouseup',   () => { dot.classList.remove('clicking'); ring.classList.remove('clicking'); });

// Hide when leaving window
document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

// NAV scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// Burger menu
const burger = document.getElementById('burger');
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

// Video play on click
document.querySelectorAll('.work-item').forEach(item => {
  const video = item.querySelector('.work-item__video');
  if (!video) return;
  item.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      item.querySelector('.work-item__play').style.opacity = '0';
    } else {
      video.pause();
      item.querySelector('.work-item__play').style.opacity = '1';
    }
  });
});

// Works filter
const filterBtns = document.querySelectorAll('.filter-btn');
const workItems = document.querySelectorAll('.work-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    workItems.forEach(item => {
      if (filter === 'all' || item.dataset.cat === filter) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  });
});

// Contact form
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  form.innerHTML = `
    <div class="form-success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3>Заявку надіслано!</h3>
      <p>Дякую за звернення. Відповім протягом 24 годин.</p>
    </div>
  `;
});

// ── Scroll Reveal ──────────────────────────────────────────────
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
  { sel: '.work-item',         v: 'zoom-in',    delay: null },
  { sel: '.testi-card',        v: 'fade-up',    delay: null },
  { sel: '.contact__text',     v: 'fade-right', delay: 0 },
  { sel: '.contact__form',     v: 'fade-left',  delay: 0.2 },
];

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const delay = el.dataset.revealDelay || '0';
    el.style.transitionDelay = delay + 's';
    el.classList.add('revealed');
    revealObserver.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

revealMap.forEach(({ sel, v, delay }) => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.dataset.reveal = v;
    el.setAttribute('data-reveal', v);
    el.dataset.revealDelay = delay !== null ? delay : +(i * 0.12).toFixed(2);
    revealObserver.observe(el);
  });
});
