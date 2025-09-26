document.addEventListener('DOMContentLoaded', () => {
  // ---------- helpers ----------
  const ANIM_MS = 180; // должен совпадать с .chip transition (0.18s)

  function chipId(group, value) {
    return `chip--${group}--${value}`.replace(/\s+/g, '-').toLowerCase();
  }

  function qs(sel, ctx = document) { return ctx.querySelector(sel); }
  function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

  // ---------- DOM refs (safe) ----------
  const chipsContainer = qs('#selected-chips');
  const productsContainer = qs('#productsContainer');
  const resultsCount = qs('#resultsCount');
  const sortSelect = qs('#sortSelect');
  const btnList = qs('#btnList');
  const btnGrid = qs('#btnGrid');

  // если какие-то элементы отсутствуют — логируем, но не ломаем
  if (!productsContainer) console.warn('productsContainer not found (#productsContainer)');
  if (!chipsContainer) console.warn('selected-chips container not found (#selected-chips)');

  // ---------- products data (demo) ----------
  const products = [
    {id:1, title:'T-Shirt Red S', price:29, color:'Red', size:'S', material:'Cotton', image:'/rename/1.png'},
    {id:2, title:'T-Shirt Blue M', price:35, color:'Blue', size:'M', material:'Cotton', image:''},
    {id:3, title:'Leather Jacket L', price:199, color:'Black', size:'L', material:'Leather', image:''},
    {id:4, title:'Wool Sweater M', price:89, color:'Black', size:'M', material:'Wool', image:''},
    {id:5, title:'Casual Shirt L', price:45, color:'Blue', size:'L', material:'Cotton', image:''},
    {id:6, title:'Denim Jacket M', price:120, color:'Blue', size:'M', material:'Cotton', image:''},
    {id:7, title:'Trousers L', price:75, color:'Black', size:'L', material:'Polyester', image:'/rename/7.png'},
    {id:8, title:'Shirt S', price:40, color:'Red', size:'S', material:'Cotton', image:'/rename/8.png'},
    {id:9, title:'Coat L', price:210, color:'Black', size:'L', material:'Leather', image:'/rename/9.png'},
    {id:10, title:'Hoodie M', price:60, color:'Blue', size:'M', material:'Cotton', image:'/rename/10.png'},
    {id:11, title:'Shorts S', price:25, color:'Red', size:'S', material:'Polyester', image:'/rename/11.png'},
    {id:12, title:'Sweatpants M', price:55, color:'Black', size:'M', material:'Cotton', image:'/rename/12.png'},
  ];

  // ---------- dropdown open/close management ----------
  function setupDropdowns() {
    qsa('.dropdown').forEach(drop => {
      const btn = qs('.dropdown-button', drop);
      const list = qs('.dropdown-list', drop);

      if (!btn) return;

      // click on button toggles open/closed
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const isOpen = drop.classList.toggle('open');
        // set aria-expanded for accessibility
        btn.setAttribute('aria-expanded', String(isOpen));
        // if opened, close other dropdowns
        if (isOpen) closeOtherDropdowns(drop);
      });

      // close when clicking outside
      document.addEventListener('click', (e) => {
        if (!drop.contains(e.target)) {
          drop.classList.remove('open');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });

      // keyboard support: Enter/Space toggle, Esc close
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
      // optional: keyboard inside list to close with Esc
      if (list) {
        list.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            drop.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            btn.focus();
          }
        });
      }
    });
  }

  function closeOtherDropdowns(current) {
    qsa('.dropdown.open').forEach(d => {
      if (d !== current) {
        d.classList.remove('open');
        const b = qs('.dropdown-button', d);
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---------- chips management ----------
  function addChip(group, value, checkbox) {
    if (!chipsContainer) return;
    const id = chipId(group, value);
    if (qs('#' + id)) return; // уже есть

    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.id = id;

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = `${group}: ${value}`;

    const btnRemove = document.createElement('button');
    btnRemove.className = 'remove';
    btnRemove.type = 'button';
    btnRemove.title = 'Удалить фильтр';
    btnRemove.innerHTML = '✕';

    btnRemove.addEventListener('click', () => {
      // визуальное удаление + синхронизация чекбокса
      chip.classList.add('removing');
      if (checkbox) checkbox.checked = false;
      setTimeout(() => chip.remove(), ANIM_MS);
      // после снятия чекбокса — перерендер продуктов
      setTimeout(renderProducts, ANIM_MS + 10);
    });

    chip.appendChild(label);
    chip.appendChild(btnRemove);
    chipsContainer.appendChild(chip);
  }

  function removeChipById(id) {
    const el = qs('#' + id);
    if (!el) return;
    el.classList.add('removing');
    setTimeout(() => el.remove(), ANIM_MS);
  }

  // При клике на контейнер чипов — если клик по лейблу, открыть соответствующий dropdown
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      // parse group и value из id (chip--group--value)
      const parts = chip.id.split('--');
      if (parts.length >= 3) {
        const group = parts[1];
        // найдем dropdown с data-group == Group (регистрозависимость может быть важна)
        const dd = document.querySelector(`.dropdown[data-group="${capitalize(group)}"]`);
        if (dd) {
          const btn = qs('.dropdown-button', dd);
          if (btn) {
            // откроем dropdown и сфокусируем кнопку
            closeOtherDropdowns(dd);
            dd.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
            btn.focus();
          }
        }
      }
    });
  }

  // helper to transform group (chip id uses lowercase from chipId) back to Title case
  function capitalize(str) {
    if (!str) return str;
    return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ---------- filter checkbox handling ----------
  // create map from checkbox -> event will add/remove chips
  function initFilterCheckboxes() {
    qsa('.filter').forEach(chk => {
      // ensure data-group exists. if not, fallback to parent .dropdown data-group
      if (!chk.dataset.group) {
        const dd = chk.closest('.dropdown');
        if (dd && dd.dataset.group) chk.dataset.group = dd.dataset.group;
      }
      // ensure data-value fallback
      if (!chk.dataset.value) chk.dataset.value = chk.value || chk.getAttribute('value') || chk.nextSibling?.textContent?.trim();

      chk.addEventListener('change', (e) => {
        const checkbox = e.target;
        const value = checkbox.dataset.value;
        const group = checkbox.dataset.group || 'Filter';
        const id = chipId(group, value);

        if (checkbox.checked) {
          addChip(group, value, checkbox);
        } else {
          // remove chip and update UI
          removeChipById(id);
        }
        // rerender product list immediately (or after removing animation if you prefer)
        // if you want waiting for removal animation, wrap in setTimeout(...)
        renderProducts();
      });
    });
  }

  // ---------- filtering logic (copied + slightly hardened) ----------
  function getActiveFilters() {
    const active = {};
    qsa('.filter:checked').forEach(chk => {
      const g = chk.dataset.group || chk.getAttribute('data-group') || 'Filter';
      if (!active[g]) active[g] = new Set();
      active[g].add(chk.dataset.value || chk.value);
    });
    for (const k in active) active[k] = Array.from(active[k]);
    return active;
  }

  function passesPriceFilter(prod, priceRanges) {
    if (!priceRanges || priceRanges.length === 0) return true;
    for (const r of priceRanges) {
      if (r.includes('+')) {
        const min = Number(r.replace('+',''));
        if (prod.price >= min) return true;
      } else {
        const [min,max] = r.split('-').map(Number);
        if (!isNaN(min) && !isNaN(max) && prod.price >= min && prod.price <= max) return true;
      }
    }
    return false;
  }

  function filterProducts(productsList, activeFilters) {
    return productsList.filter(p => {
      if (activeFilters.Size && activeFilters.Size.length) {
        if (!activeFilters.Size.includes(p.size)) return false;
      }
      if (activeFilters.Color && activeFilters.Color.length) {
        if (!activeFilters.Color.includes(p.color)) return false;
      }
      if (activeFilters.Material && activeFilters.Material.length) {
        if (!activeFilters.Material.includes(p.material)) return false;
      }
      if (activeFilters.Price && activeFilters.Price.length) {
        if (!passesPriceFilter(p, activeFilters.Price)) return false;
      }
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

  // ---------- render ----------
  function renderProducts() {
    if (!productsContainer) return;
    const activeFilters = getActiveFilters();
    let filtered = filterProducts(products, activeFilters);
    const sortVal = sortSelect ? sortSelect.value : 'default';
    filtered = sortProducts(filtered, sortVal);
    if (resultsCount) resultsCount.textContent = `Результаты: ${filtered.length}`;

    productsContainer.innerHTML = '';

    // кол-во колонок по CSS-переменной
    const cols = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cols')) || 1;

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product';
      if (cols > 1) card.classList.add('product--grid');

      const img = document.createElement('div');
      img.className = 'product__img';
      if (p.image) {
        const imgele = document.createElement('img');
        imgele.src = p.image;
        imgele.alt = p.title;
        imgele.style.width = '100%';
        imgele.style.height = '100%';
        imgele.style.objectFit = 'cover';
        img.appendChild(imgele);
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

  // safe escape (very small util)
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------- layout toggle (list/grid) ----------
  function setLayout(mode) {
    if (mode === 'list') {
      document.documentElement.style.setProperty('--cols', 1);
      if (btnList) btnList.classList.add('active');
      if (btnGrid) btnGrid.classList.remove('active');
    } else {
      // compute default based on width for grid
      let cols = 3;
      const w = window.innerWidth;
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

  // adapt columns on resize when grid active
  window.addEventListener('resize', () => {
    if (!btnGrid || !btnGrid.classList.contains('active')) return;
    let cols = 3;
    const w = window.innerWidth;
    if (w < 600) cols = 1;
    else if (w < 960) cols = 2;
    else cols = 3;
    document.documentElement.style.setProperty('--cols', cols);
    renderProducts();
  });

  // ---------- initialisation ----------
  setupDropdowns();
  initFilterCheckboxes();
  // render initial chips for already-checked checkboxes (if any)
  qsa('.filter:checked').forEach(chk => {
    addChip(chk.dataset.group || 'Filter', chk.dataset.value || chk.value, chk);
  });

  // default layout: grid
  setLayout('grid');

  // initial render
  renderProducts();

  // close dropdowns on ESC globally
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      qsa('.dropdown.open').forEach(d => {
        d.classList.remove('open');
        const b = qs('.dropdown-button', d);
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // ------------ end DOMContentLoaded ------------
});


export {}