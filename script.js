/* B-wide 会社サイト(第1期) モック 共通スクリプト
   仕様: 2026-10-05_詳細設計書.md 3章(コンポーネント)・6章(フォーム) */
(() => {
  document.documentElement.classList.remove('no-js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ヘッダー: トップのファーストビュー上は透明 → 過ぎたら白 ---------- */
  const header = document.querySelector('.l-header');
  const hero = document.querySelector('[data-hero]');
  const fixedCta = document.querySelector('.c-fixed-cta');

  if (header && hero && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      const past = !entry.isIntersecting;
      header.classList.toggle('is-transparent', !past);
      header.classList.toggle('is-solid', past);
      if (fixedCta) fixedCta.classList.toggle('is-hidden', !past);
    }, { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` });
    io.observe(hero);
  } else if (header) {
    const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- グローバルナビのドロップダウン ---------- */
  const dropdownItems = document.querySelectorAll('.c-gnav__item[data-dropdown]');
  const closeAll = (except) => dropdownItems.forEach((item) => {
    if (item === except) return;
    item.classList.remove('is-open');
    item.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', 'false');
  });
  dropdownItems.forEach((item) => {
    const btn = item.querySelector('button');
    const open = (state) => {
      closeAll(item);
      item.classList.toggle('is-open', state);
      btn.setAttribute('aria-expanded', String(state));
    };
    btn.addEventListener('click', () => open(!item.classList.contains('is-open')));
    if (window.matchMedia('(hover: hover)').matches) {
      item.addEventListener('mouseenter', () => open(true));
      item.addEventListener('mouseleave', () => open(false));
    }
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { open(false); btn.focus(); }
    });
    item.addEventListener('focusout', (e) => {
      if (!item.contains(e.relatedTarget)) open(false);
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.c-gnav__item[data-dropdown]')) closeAll();
  });

  /* ---------- スマホメニュー(フォーカスを閉じ込める) ---------- */
  const drawer = document.getElementById('drawer');
  const menuBtn = document.querySelector('.l-header__menu-btn');
  if (drawer && menuBtn) {
    const closeBtn = drawer.querySelector('.l-drawer__close');
    const focusables = () => drawer.querySelectorAll('a[href], button:not([disabled])');
    const setOpen = (state) => {
      drawer.classList.toggle('is-open', state);
      drawer.setAttribute('aria-hidden', String(!state));
      menuBtn.setAttribute('aria-expanded', String(state));
      document.body.classList.toggle('is-locked', state);
      if (state) closeBtn.focus(); else menuBtn.focus();
    };
    menuBtn.addEventListener('click', () => setOpen(true));
    closeBtn.addEventListener('click', () => setOpen(false));
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab') return;
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- スクロールでのフェードイン ---------- */
  const reveals = document.querySelectorAll('.js-reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const rio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        rio.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach((el, i) => {
      const delay = el.dataset.delay;
      if (delay) el.style.transitionDelay = `${delay}s`;
      rio.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- ページ内ナビの現在位置 ---------- */
  const anchorLinks = document.querySelectorAll('.c-anchor-nav a[href^="#"]');
  if (anchorLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    anchorLinks.forEach((a) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) map.set(target, a);
    });
    const aio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        anchorLinks.forEach((a) => a.classList.remove('is-active'));
        map.get(entry.target)?.classList.add('is-active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    map.forEach((_, target) => aio.observe(target));
  }

  /* ---------- タブ(ご利用の流れ): 左右キーで移動、#storage / #transport で初期選択 ---------- */
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        select(tab);
        history.replaceState(null, '', `#${tab.dataset.hash}`);
      });
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') select(tabs[(i + 1) % tabs.length], true);
        if (e.key === 'ArrowLeft') select(tabs[(i - 1 + tabs.length) % tabs.length], true);
      });
    });
    const initial = tabs.find((t) => `#${t.dataset.hash}` === location.hash) || tabs[0];
    select(initial);
  });

  /* ---------- 事例の絞り込み(モック用。本番は /case/type/〇〇/ へのページ遷移) ---------- */
  const caseFilter = document.querySelector('[data-case-filter]');
  if (caseFilter) {
    const type = new URLSearchParams(location.search).get('type') || 'all';
    const valid = ['all', 'storage', 'transport', 'circuit', 'towing'].includes(type) ? type : 'all';
    caseFilter.querySelectorAll('a').forEach((a) => {
      if (a.dataset.filter === valid) a.setAttribute('aria-current', 'page');
    });
    let shown = 0;
    document.querySelectorAll('[data-case-list] [data-types]').forEach((card) => {
      const on = valid === 'all' || card.dataset.types.split(' ').includes(valid);
      card.hidden = !on;
      if (on) shown += 1;
    });
    const empty = document.querySelector('[data-case-empty]');
    if (empty) empty.hidden = shown > 0;
  }

  /* ---------- FAQ: #faq-xx があれば開く ---------- */
  if (location.hash.startsWith('#faq-')) {
    const target = document.querySelector(location.hash);
    if (target && target.tagName === 'DETAILS') target.open = true;
  }

  /* ---------- お問い合わせフォーム ---------- */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const allowed = {
      type: ['storage', 'transport', 'circuit', 'towing', 'visit', 'other'],
      customer: ['personal', 'business'],
    };
    const params = new URLSearchParams(location.search);
    // 許可した値のときだけラジオを選ぶ。値はページに出力しない(XSS対策)
    const preset = (param, name) => {
      const v = params.get(param);
      if (!allowed[param].includes(v)) return;
      const input = form.querySelector(`input[name="${name}"][value="${v}"]`);
      if (input) input.checked = true;
    };
    preset('type', 'inquiry_type');
    preset('customer', 'customer_type');

    // 条件付きで表示する項目
    const value = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const toggle = (selector, show) => {
      const field = form.querySelector(selector);
      if (!field) return;
      field.hidden = !show;
      field.querySelectorAll('input, select, textarea').forEach((el) => { el.disabled = !show; });
      if (!show) field.classList.remove('is-error');
    };
    const applyConditions = () => {
      const type = value('inquiry_type');
      toggle('[data-cond="business"]', value('customer_type') === 'business');
      toggle('[data-cond="visit"]', type === 'visit');
      toggle('[data-cond="plate"]', type === 'storage' || type === 'circuit');
    };
    form.addEventListener('change', applyConditions);
    applyConditions();

    // 見学日は翌日以降
    const tomorrow = new Date(Date.now() + 86400000);
    const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    form.querySelectorAll('input[type="date"]').forEach((el) => { el.min = minDate; });

    const summary = form.querySelector('.c-form__summary');
    const setError = (field, on) => {
      field.classList.toggle('is-error', on);
      field.querySelectorAll('input, select, textarea').forEach((el) => {
        if (on) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      });
    };
    const checkField = (field) => {
      if (field.hidden) return true;
      const rule = field.dataset.validate;
      const inputs = [...field.querySelectorAll('input, select, textarea')].filter((el) => !el.disabled);
      if (!rule || !inputs.length) return true;
      const el = inputs[0];
      const v = (el.value || '').trim();
      switch (rule) {
        case 'choice': return inputs.some((i) => i.checked);
        case 'required': return v.length > 0 && (!el.maxLength || el.maxLength < 0 || v.length <= el.maxLength);
        case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        case 'tel': return /^\d{10,11}$/.test(v.replace(/-/g, ''));
        case 'date': return v !== '' && v >= minDate;
        case 'date-optional': return v === '' || v >= minDate;
        case 'max': return v.length <= Number(el.maxLength > 0 ? el.maxLength : Infinity);
        case 'agree': return el.checked;
        default: return true;
      }
    };
    form.querySelectorAll('[data-validate]').forEach((field) => {
      field.addEventListener('change', () => { if (field.classList.contains('is-error')) setError(field, !checkField(field)); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errors = [];
      form.querySelectorAll('[data-validate]').forEach((field) => {
        const ok = checkField(field);
        setError(field, !ok);
        if (!ok) errors.push(field);
      });
      if (errors.length) {
        summary.hidden = false;
        summary.querySelector('[data-count]').textContent = errors.length;
        const ul = summary.querySelector('ul');
        ul.innerHTML = '';
        errors.forEach((field) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          const target = field.querySelector('input:not([disabled]), select, textarea');
          a.href = `#${target.id}`;
          a.textContent = field.querySelector('.c-field__error').textContent;
          li.appendChild(a);
          ul.appendChild(li);
        });
        summary.focus();
        errors[0].querySelector('input:not([disabled]), select, textarea')?.focus({ preventScroll: true });
        summary.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        return;
      }
      summary.hidden = true;
      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.textContent = '送信しています…';
      // モックのため送信はせず、完了ページへ移動する(本番は Contact Form 7)
      setTimeout(() => { location.href = form.getAttribute('action'); }, 600);
    });
  }

  /* ---------- 年表示 ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
