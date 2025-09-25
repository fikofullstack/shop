document.addEventListener('DOMContentLoaded', () => {
  // ---------- конфиг ----------
  const CHIP_ANIM_MS = 180; // должен совпадать с transition .chip в CSS (0.18s)

  // ---------- утилиты ----------
  const qs = (s, ctx = document) => ctx.querySelector(s);
  const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const chipId = (group, value) => `chip--${group}--${value}`.replace(/\s+/g, '-').toLowerCase();
  const safeText = v => (v == null ? '' : String(v));

  // ---------- DOM ссылки (без падающих ошибок) ----------
  const chipsContainer = qs('#selected-chips');
  const productsContainer = qs('#productsContainer');
  const resultsCount = qs('#resultsCount');
  const sortSelect = qs('#sortSelect');
  const btnList = qs('#btnList');
  const btnGrid = qs('#btnGrid');

  // предупреждения (не критично)
  if (!productsContainer) console.warn('Warning: #productsContainer not found');
  if (!chipsContainer) console.warn('Warning: #selected-chips not found');

  // ---------- демо-данные (твои products) ----------
  const products = [
    {id:1, title:'T-Shirt Red S', price:29, color:'Red', size:'S', material:'Cotton', image:''},
    {id:2, title:'T-Shirt Blue M', price:35, color:'Blue', size:'M', material:'Cotton', image:''},
    {id:3, title:'Leather Jacket L', price:199, color:'Black', size:'L', material:'Leather', image:''},
    {id:4, title:'Wool Sweater M', price:89, color:'Black', size:'M', material:'Wool', image:''},
    {id:5, title:'Casual Shirt L', price:45, color:'Blue', size:'L', material:'Cotton', image:''},
    {id:6, title:'Denim Jacket M', price:120, color:'Blue', size:'M', material:'Cotton', image:''},
    {id:7, title:'Trousers L', price:75, color:'Black', size:'L', material:'Polyester', image:''},
    {id:8, title:'Shirt S', price:40, color:'Red', size:'S', material:'Cotton', image:''},
    {id:9, title:'Coat L', price:210, color:'Black', size:'L', material:'Leather', image:''},
    {id:10, title:'Hoodie M', price:60, color:'Blue', size:'M', material:'Cotton', image:''},
    {id:11, title:'Shorts S', price:25, color:'Red', size:'S', material:'Polyester', image:''},
    {id:12, title:'Sweatpants M', price:55, color:'Black', size:'M', material:'Cotton', image:''},
  ];

  // ---------- dropdown: open/close и keyboard ----------
  function closeOtherDropdowns(except = null) {
    qsa('.dropdown.open').forEach(d => {
      if (d !== except) {
        d.classList.remove('open');
        const b = qs('.dropdown-button', d);
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setupDropdown(drop) {
    const btn = qs('.dropdown-button', drop);
    const list = qs('.dropdown-list', drop);

    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drop.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) closeOtherDropdowns(drop);
    });

    // keyboard: Enter/Space open, Esc close
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      } else if (e.key === 'Escape') {
        drop.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });

    if (list) {
      list.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          drop.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          btn.focus();
        }
      });
    }

    // close when clicking outside this dropdown
    document.addEventListener('click', (e) => {
      if (!drop.contains(e.target)) {
        drop.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  qsa('.dropdown').forEach(setupDropdown);

  // глобальное закрытие по ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      qsa('.dropdown.open').forEach(d => {
        d.classList.remove('open');
        const b = qs('.dropdown-button', d);
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // ---------- chips: add / remove (с анимацией) ----------
  function addChip(group, value, checkbox) {
    if (!chipsContainer) return;
    const id = chipId(group, value);
    if (qs(`#${id}`)) return; // уже есть

    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.id = id;

    const span = document.createElement('span');
    span.className = 'label';
    span.textContent = `${group}: ${value}`;

    const btn = document.createElement('button');
    btn.className = 'remove';
    btn.type = 'button';
    btn.title = 'Удалить фильтр';
    btn.innerHTML = '✕';

    btn.addEventListener('click', () => {
      // снять чекбокс и анимированно удалить чип
      if (checkbox) checkbox.checked = false;
      chip.classList.add('removing');
      setTimeout(() => chip.remove(), CHIP_ANIM_MS);
      // перерендерим продукты чуть позже (после анимации)
      setTimeout(renderProducts, CHIP_ANIM_MS + 10);
    });

    chip.appendChild(span);
    chip.appendChild(btn);
    chipsContainer.appendChild(chip);
  }

  function removeChip(id) {
    const el = qs(`#${id}`);
    if (!el) return;
    el.classList.add('removing');
    setTimeout(() => el.remove(), CHIP_ANIM_MS);
  }

  // клик по чипу — опционально: открыть соответствующий dropdown и сфокусировать кнопку
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      // ожидаем id формата chip--group--value
      const parts = chip.id.split('--');
      if (parts.length >= 3) {
        const groupRaw = parts[1]; // может быть lowercased
        // пробуем найти .dropdown[data-group="GroupName"] — учитываем Title Case
        const guess = groupRaw.replace(/-/g, ' ');
        // пробуем несколько вариантов (точное соответствие, title case)
        const ddExact = document.querySelector(`.dropdown[data-group="${guess}"]`) ||
                        document.querySelector(`.dropdown[data-group="${capitalize(guess)}"]`);
        if (ddExact) {
          const btn = qs('.dropdown-button', ddExact);
          if (btn) {
            closeOtherDropdowns(ddExact);
            ddExact.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            btn.focus();
          }
        }
      }
    });
  }

  function capitalize(s) {
    return s.replace(/\b\w/g, c => c.toUpperCase());
  }

  // ---------- чекбоксы: init, синхронизация с чипами ----------
  function initFilterCheckboxes() {
    qsa('.filter').forEach(chk => {
      // fallback: если dataset.group нет, взять ближайший .dropdown[data-group]
      if (!chk.dataset.group) {
        const dd = chk.closest('.dropdown');
        if (dd && dd.dataset.group) chk.dataset.group = dd.dataset.group;
      }
      // fallback для data-value
      if (!chk.dataset.value) chk.dataset.value = chk.value || chk.getAttribute('value') || chk.nextSibling?.textContent?.trim();

      // если чекбокс уже отмечен при загрузке — создаём чип
      if (chk.checked) {
        addChip(chk.dataset.group || 'Filter', chk.dataset.value || chk.value, chk);
      }

      chk.addEventListener('change', (e) => {
        const checkbox = e.target;
        const group = checkbox.dataset.group || 'Filter';
        const value = checkbox.dataset.value || checkbox.value;
        const id = chipId(group, value);

        if (checkbox.checked) addChip(group, value, checkbox);
        else removeChip(id);

        // немедленный рендер результатов
        renderProducts();
      });
    });
  }

  initFilterCheckboxes();

  // ---------- фильтрация / сортировка ----------
  function getActiveFilters() {
    const active = {};
    qsa('.filter:checked').forEach(chk => {
      const g = chk.dataset.group || 'Filter';
      if (!active[g]) active[g] = new Set();
      active[g].add(chk.dataset.value || chk.value);
    });
    for (const k in active) active[k] = Array.from(active[k]);
    return active;
  }

  function passesPriceFilter(prod, ranges) {
    if (!ranges || ranges.length === 0) return true;
    for (const r of ranges) {
      if (r.includes('+')) {
        const min = Number(r.replace('+',''));
        if (!isNaN(min) && prod.price >= min) return true;
      } else {
        const [min,max] = r.split('-').map(Number);
        if (!isNaN(min) && !isNaN(max) && prod.price >= min && prod.price <= max) return true;
      }
    }
    return false;
  }

  function filterProducts(productsList, activeFilters) {
    return productsList.filter(p => {
      if (activeFilters.Size && activeFilters.Size.length && !activeFilters.Size.includes(p.size)) return false;
      if (activeFilters.Color && activeFilters.Color.length && !activeFilters.Color.includes(p.color)) return false;
      if (activeFilters.Material && activeFilters.Material.length && !activeFilters.Material.includes(p.material)) return false;
      if (activeFilters.Price && activeFilters.Price.length && !passesPriceFilter(p, activeFilters.Price)) return false;
      return true;
    });
  }

  function sortProducts(list, sortKey) {
    if (!sortKey || sortKey === 'default') return list;
    const copy = [...list];
    if (sortKey === 'price-asc') copy.sort((a,b) => a.price - b.price);
    else if (sortKey === 'price-desc') copy.sort((a,b) => b.price - a.price);
    return copy;
  }

  // ---------- рендер карточек ----------
  function renderProducts() {
    if (!productsContainer) return;
    const active = getActiveFilters();
    let filtered = filterProducts(products, active);
    const sortVal = sortSelect ? sortSelect.value : 'default';
    filtered = sortProducts(filtered, sortVal);

    if (resultsCount) resultsCount.textContent = `Результаты: ${filtered.length}`;
    productsContainer.innerHTML = '';

    const cols = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cols')) || 1;

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product';
      if (cols > 1) card.classList.add('product--grid');

      const img = document.createElement('div');
      img.className = 'product__img';
      if (p.image) {
        const im = document.createElement('img');
        im.src = p.image;
        im.alt = p.title;
        im.style.width = '100%';
        im.style.height = '100%';
        im.style.objectFit = 'cover';
        img.appendChild(im);
      }

      const info = document.createElement('div');
      info.className = 'product__info';
      info.innerHTML = `
        <div class="product__title">${escapeHtml(p.title)}</div>
        <div class="product__meta">${escapeHtml(p.color)} · ${escapeHtml(p.size)} · ${escapeHtml(p.material)}</div>
        <div class="product__price">$${p.price}</div>
      `;

      card.appendChild(img);
      card.appendChild(info);
      productsContainer.appendChild(card);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------- переключатель list/grid + адаптив ----------
  function setLayout(mode) {
    if (mode === 'list') {
      document.documentElement.style.setProperty('--cols', 1);
      if (btnList) btnList.classList.add('active');
      if (btnGrid) btnGrid.classList.remove('active');
    } else {
      // подбираем колонки по ширине
      const w = window.innerWidth;
      let cols = 3;
      if (w < 600) cols = 1;
      else if (w < 960) cols = 2;
      else cols = 3;
      document.documentElement.style.setProperty('--cols', cols);
      if (btnGrid) btnGrid.classList.add('active');
      if (btnList) btnList.classList.remove('active');
    }
    renderProducts();
  }

  if (btnList && btnGrid) {
    btnList.addEventListener('click', () => setLayout('list'));
    btnGrid.addEventListener('click', () => setLayout('grid'));
  }

  window.addEventListener('resize', () => {
    if (!btnGrid || !btnGrid.classList.contains('active')) return;
    const w = window.innerWidth;
    let cols = 3;
    if (w < 600) cols = 1;
    else if (w < 960) cols = 2;
    else cols = 3;
    document.documentElement.style.setProperty('--cols', cols);
    renderProducts();
  });

  // если есть селектор сортировки — навесим слушатель
  if (sortSelect) sortSelect.addEventListener('change', () => renderProducts());

  // ---------- стартовая инициализация ----------
  // Рендер чипов для уже чекнутых (если есть)
  qsa('.filter:checked').forEach(chk => {
    addChip(chk.dataset.group || 'Filter', chk.dataset.value || chk.value, chk);
  });

  // стартовый режим
  setLayout('grid');

  // первый рендер
  renderProducts();
});
