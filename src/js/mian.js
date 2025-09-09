import '../sass/style.scss';



    var swiper = new Swiper(".mySwiper", {
    spaceBetween: 30,
    loop: true, // чтобы слайды крутились по кругу
    autoplay: {
      delay: 5000, // 5 секунд
      disableOnInteraction: false, // не останавливать после ручного свайпа
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
  });
(function(){
  const track   = document.getElementById('pp-track');
  const slides  = Array.from(track.children);
  const dotsBox = document.querySelector('.pp-dots');
  const prev    = document.querySelector('.pp-prev');
  const next    = document.querySelector('.pp-next');

  let currentIndex = 0;

  // --- 1) Создаём точки
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', 'Slide ' + (i+1));
    dot.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(dot);
  });
  const dots = Array.from(dotsBox.children);

  // --- 2) Функция перехода на слайд
  function goTo(i){
    currentIndex = Math.max(0, Math.min(slides.length - 1, i));
    slides[currentIndex].scrollIntoView({ behavior:'smooth', inline:'center' });
    updateDots();
  }

  // --- 3) Обновление активной точки
  function updateDots(){
    dots.forEach(d => d.classList.remove('is-active'));
    dots[currentIndex]?.classList.add('is-active');
  }

  // --- 4) Стрелки
  function step(){
    const gap = parseFloat(getComputedStyle(track).gap) || 64;
    const w   = slides[0]?.clientWidth || 320;
    return w + gap;
  }
  prev.addEventListener('click', ()=> goTo(currentIndex - 1));
  next.addEventListener('click', ()=> goTo(currentIndex + 1));

  // --- 5) Синхронизация при скролле
  function syncDots(){
    const center = track.scrollLeft + track.clientWidth / 2;
    let idx = 0, best = Infinity;
    slides.forEach((el, i) => {
      const mid = el.offsetLeft + el.clientWidth/2;
      const d = Math.abs(mid - center);
      if (d < best){ best = d; idx = i; }
    });
    if (idx !== currentIndex){
      currentIndex = idx;
      updateDots();
    }
  }
  track.addEventListener('scroll', ()=>{ clearTimeout(track._t); track._t=setTimeout(syncDots,80); });
  window.addEventListener('resize', syncDots);

  // --- 6) Клик по слайду
  slides.forEach((slide, i) => {
    slide.style.cursor = 'pointer';
    slide.addEventListener('click', () => {
      if (i === currentIndex){
        goTo(Math.min(slides.length - 1, i + 1));
      } else {
        goTo(i);
      }
    });
  });

  // --- 7) Старт всегда с первого
  slides[0].scrollIntoView({behavior:'auto', inline:'center'});
  currentIndex = 0;
  updateDots();
})();
