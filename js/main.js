(() => {
  const root = document.documentElement;
  const isFr = (root.lang || '').toLowerCase().startsWith('fr');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('nav');
  let lenis = null;

  // reCAPTCHA v3 (public site key).
  const RECAPTCHA_SITE_KEY = '6LcA--stAAAAAOlO7rUGPXRGFtpC5zwwVLiCXly5';
  let recaptchaPromise = null;

  // Formspree endpoint shared by the popup and the inline footer form.
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mbgdapyj';

  // reCAPTCHA rejects unlisted domains (e.g. localhost), so skip it in local dev.
  const isLocalDev = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname);

  initMenu();
  initCtaModal();
  initFooterForms();
  initQuestionnaire();
  initCarousels();
  placeOptionsLine();

  const hasGsap = window.gsap && window.ScrollTrigger;
  if (!hasGsap) {
    root.classList.remove('js');
    trackNav(() => window.scrollY);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (!reducedMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  trackNav(() => window.scrollY, lenis);

  if (reducedMotion) {
    root.classList.remove('js');
    return;
  }

  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.09,
      overwrite: true,
    }),
  });

  gsap.fromTo('.practice__list', { '--line': 0 }, {
    '--line': 1,
    ease: 'none',
    scrollTrigger: { trigger: '.practice__list', start: 'top 80%', end: 'bottom 55%', scrub: true },
  });

  initOptionsReveal();
  initAdamOrbit();
  initHeroTyping();
  initLossTyping();

  // Draws the options divider line as the section scrolls, and fades each row
  // in once the line has passed that row's subtitle.
  function initOptionsReveal() {
    const section = document.querySelector('.options');
    const list = document.querySelector('.options-list');
    const line = document.querySelector('.options-line');
    const rows = [...document.querySelectorAll('.options-row')];
    if (!section || !list || !line || !rows.length) return;

    gsap.set(rows, { opacity: 0, y: 25.9 });
    line.style.setProperty('--opline', 0);

    let fractions = [];
    const measure = () => {
      const listTop = list.getBoundingClientRect().top;
      const height = list.offsetHeight || 1;
      fractions = rows.map((row) => {
        const title = row.querySelector('.options-row__title') || row;
        const rect = title.getBoundingClientRect();
        return Math.min(1, Math.max(0, (rect.top + rect.height / 2 - listTop) / height));
      });
    };

    const apply = (progress) => {
      line.style.setProperty('--opline', progress);
      rows.forEach((row, i) => {
        const shown = progress >= fractions[i];
        const isShown = row.dataset.shown === '1';
        if (shown && !isShown) {
          row.dataset.shown = '1';
          gsap.to(row, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' });
        } else if (!shown && isShown) {
          row.dataset.shown = '0';
          gsap.to(row, { opacity: 0, y: 25.9, duration: 0.5, ease: 'power2.out' });
        }
      });
    };

    ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      end: 'bottom 65%',
      onRefresh: (self) => { measure(); apply(self.progress); },
      onUpdate: (self) => apply(self.progress),
    });
  }

  // Keeps the single options divider line aligned with the text column.
  function placeOptionsLine() {
    const list = document.querySelector('.options-list');
    const line = document.querySelector('.options-line');
    const body = document.querySelector('.options-row__body');
    if (!list || !line || !body) return;
    const place = () => {
      line.style.left = `${body.getBoundingClientRect().left - list.getBoundingClientRect().left}px`;
    };
    place();
    window.addEventListener('resize', place);
  }

  function trackNav(getY, smooth) {
    if (!nav) return;
    const update = (y) => {
      nav.classList.toggle('is-scrolled', y > 24);
      nav.classList.toggle('is-past-hero', y > window.innerHeight);
    };
    if (smooth) smooth.on('scroll', (e) => update(e.scroll));
    else window.addEventListener('scroll', () => update(getY()), { passive: true });
    window.addEventListener('resize', () => update(getY()), { passive: true });
    update(getY());
  }

  // Slides a horizontal card row when its arrow buttons are pressed.
  function initCarousels() {
    initCarousel(
      document.getElementById('services-track'),
      [...document.querySelectorAll('.services__arrows .services__arrow')],
    );
  }

  function initCarousel(track, buttons) {
    if (!track) return;
    const cards = [...track.children];
    if (!cards.length) return;

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = () => cards[0].getBoundingClientRect().width + gap;

    const prevBtn = buttons.find((btn) => Number(btn.dataset.dir) === -1);
    const nextBtn = buttons.find((btn) => Number(btn.dataset.dir) === 1);

    const updateArrows = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 1;
      if (nextBtn) nextBtn.disabled = track.scrollLeft >= max - 1;
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        track.scrollBy({
          left: Number(btn.dataset.dir) * step(),
          behavior: reducedMotion ? 'auto' : 'smooth',
        });
      });
    });

    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows, { passive: true });
    updateArrows();
  }

  function initMenu() {
    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('menu');
    if (!btn || !menu) return;

    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open
        ? (isFr ? 'Fermer le menu' : 'Close menu')
        : (isFr ? 'Ouvrir le menu' : 'Open menu'));
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(() => {
          if (btn.getAttribute('aria-expanded') === 'true') menu.classList.add('is-open');
        });
      } else {
        menu.classList.remove('is-open');
        setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 300);
      }
    };

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (canHover) {
      let closeTimer;
      const cancelClose = () => clearTimeout(closeTimer);
      const scheduleClose = () => {
        cancelClose();
        closeTimer = setTimeout(() => setOpen(false), 180);
      };
      const openNow = () => { cancelClose(); setOpen(true); };

      btn.addEventListener('mouseenter', openNow);
      menu.addEventListener('mouseenter', cancelClose);
      btn.addEventListener('mouseleave', scheduleClose);
      menu.addEventListener('mouseleave', scheduleClose);
    } else {
      btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        btn.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (btn.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target)) setOpen(false);
    });
  }

  // Loads reCAPTCHA v3 once and resolves with the grecaptcha API.
  function loadRecaptcha() {
    if (window.grecaptcha && window.grecaptcha.execute) {
      return new Promise((resolve) => window.grecaptcha.ready(() => resolve(window.grecaptcha)));
    }
    if (!recaptchaPromise) {
      recaptchaPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=' + RECAPTCHA_SITE_KEY;
        script.async = true;
        script.defer = true;
        script.onload = () => (window.grecaptcha
          ? window.grecaptcha.ready(() => resolve(window.grecaptcha))
          : reject(new Error('reCAPTCHA unavailable')));
        script.onerror = () => reject(new Error('reCAPTCHA failed to load'));
        document.head.appendChild(script);
      });
    }
    return recaptchaPromise;
  }

  // Resolves with a fresh v3 token for the "submit" action (null in local dev).
  function recaptchaToken() {
    if (isLocalDev || !RECAPTCHA_SITE_KEY) return Promise.resolve(null);
    return loadRecaptcha().then((gre) => gre.execute(RECAPTCHA_SITE_KEY, { action: 'submit' }));
  }

  // Posts a form to Formspree with a fresh reCAPTCHA token. Defaults to the
  // shared endpoint; pages with their own Formspree form pass theirs in.
  function postToFormspree(form, endpoint = FORMSPREE_ENDPOINT) {
    return recaptchaToken()
      .catch(() => null)
      .then((token) => {
        const data = new FormData(form);
        if (token) data.append('g-recaptcha-response', token);
        return fetch(endpoint, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
        });
      })
      .then((res) => {
        if (res.ok) return;
        return res.json()
          .catch(() => ({}))
          .then((data) => {
            const msg = data && data.errors && data.errors[0] && data.errors[0].message;
            throw new Error(msg || (isFr ? 'L’envoi a échoué. Veuillez réessayer.' : 'Submission failed. Please try again.'));
          });
      });
  }

  // The inline footer form submits to Formspree directly (no popup).
  function initFooterForms() {
    document.querySelectorAll('.cta-form').forEach((form) => {
      const button = form.querySelector('.cta-form__button');
      const label = button ? button.textContent : '';
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!button || button.disabled) return;
        if (FORMSPREE_ENDPOINT.indexOf('your-form-id') !== -1) {
          console.warn('Set FORMSPREE_ENDPOINT in js/main.js to enable the footer form.');
          return;
        }
        button.disabled = true;
        button.textContent = isFr ? 'Envoi\u2026' : 'Sending\u2026';
        postToFormspree(form)
          .then(() => {
            form.reset();
            button.textContent = isFr ? 'Merci!' : 'Thanks!';
          })
          .catch((err) => {
            console.error('Formspree error:', err);
            button.textContent = isFr ? 'Réessayer' : 'Try again';
          })
          .finally(() => {
            window.setTimeout(() => {
              button.disabled = false;
              button.textContent = label;
            }, 2500);
          });
      });
    });
  }

  // Brand questionnaire page: posts to its own Formspree form (the form's
  // action attribute) and swaps in a thank-you message on success.
  function initQuestionnaire() {
    const form = document.getElementById('brand-questionnaire');
    if (!form) return;
    const done = document.getElementById('brand-questionnaire-done');
    const button = form.querySelector('.questionnaire__submit');
    const status = form.querySelector('.questionnaire__status');
    const label = button.textContent;
    const endpoint = form.getAttribute('action');

    const showStatus = (msg) => {
      status.textContent = msg;
      status.hidden = false;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (button.disabled) return;
      status.hidden = true;

      const empty = [...form.querySelectorAll('[required]')].find((el) => !el.value.trim());
      if (empty) {
        empty.focus();
        showStatus(isFr ? 'Veuillez remplir les champs marqués d’un *.' : 'Please fill in the fields marked with *.');
        return;
      }
      if (endpoint.indexOf('your-form-id') !== -1) {
        console.warn('Set the Formspree form ID in brand-questionnaire/index.html.');
        showStatus(isFr ? 'Ce formulaire n’est pas encore connecté.' : 'This form is not connected yet.');
        return;
      }

      button.disabled = true;
      button.textContent = isFr ? 'Envoi\u2026' : 'Sending…';
      postToFormspree(form, endpoint)
        .then(() => {
          form.reset();
          form.hidden = true;
          if (done) { done.hidden = false; done.focus(); }
        })
        .catch((err) => {
          console.error('Formspree error:', err);
          showStatus(err.message || (isFr ? 'Une erreur est survenue. Veuillez réessayer.' : 'Something went wrong. Please try again.'));
        })
        .finally(() => {
          button.disabled = false;
          button.textContent = label;
        });
    });
  }

  // Every CTA (any [data-cta-open] trigger) opens one shared, blurred-backdrop
  // dialog. The dialog form posts to Formspree.
  function initCtaModal() {
    const triggers = [...document.querySelectorAll('[data-cta-open]')];
    if (!triggers.length) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'cta-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal__backdrop" data-modal-close></div>
      <div class="modal__card" role="dialog" aria-modal="true" aria-labelledby="cta-modal-title">
        <button class="modal__close" type="button" aria-label="${isFr ? 'Fermer' : 'Close'}" data-modal-close>&times;</button>
        <h2 class="modal__title" id="cta-modal-title">${isFr ? 'Collaborer avec LeapSphere' : 'Partner with LeapSphere'}</h2>
        <div class="modal__body">
          <!-- Endpoint is set via FORMSPREE_ENDPOINT in js/main.js -->
          <form class="modal__form" action="${FORMSPREE_ENDPOINT}" method="POST">
            <label class="visually-hidden" for="cta-modal-email">${isFr ? 'Adresse courriel' : 'Email address'}</label>
            <input class="modal__input" id="cta-modal-email" type="email" name="email" placeholder="${isFr ? 'entrez votre courriel' : 'enter your email'}" autocomplete="email" required>
            <button class="modal__submit" type="submit">${isFr ? 'Envoyer' : 'Submit'}</button>
            <p class="modal__status" role="status" aria-live="polite" hidden></p>
          </form>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const card = modal.querySelector('.modal__card');
    const form = modal.querySelector('.modal__form');
    const status = modal.querySelector('.modal__status');
    const submitBtn = modal.querySelector('.modal__submit');
    let lastFocused = null;

    const open = () => {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.documentElement.classList.add('modal-open');
      if (lenis) lenis.stop();
      if (!isLocalDev) loadRecaptcha().catch(() => {});
      const target = modal.querySelector('.modal__close');
      if (target) target.focus();
    };

    const close = () => {
      modal.hidden = true;
      document.documentElement.classList.remove('modal-open');
      if (lenis) lenis.start();
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    };

    triggers.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open();
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-modal-close]')) close();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Endpoint not configured yet: keep the placeholder usable.
      if (FORMSPREE_ENDPOINT.indexOf('your-form-id') !== -1) { close(); return; }

      status.hidden = true;
      status.classList.remove('is-error');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = isFr ? 'Envoi\u2026' : 'Sending\u2026'; }

      postToFormspree(form)
        .then(() => {
          form.reset();
          status.textContent = isFr ? 'Merci, nous communiquerons avec vous sous peu.' : 'Thanks, we will be in touch shortly.';
          status.hidden = false;
          setTimeout(close, 1200);
        })
        .catch((err) => {
          status.textContent = err.message || (isFr ? 'Une erreur est survenue. Veuillez réessayer.' : 'Something went wrong. Please try again.');
          status.classList.add('is-error');
          status.hidden = false;
        })
        .finally(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = isFr ? 'Envoyer' : 'Submit'; }
        });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) close();
    });

    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || modal.hidden) return;
      const focusables = card.querySelectorAll('button, input, a[href]');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // Keeps retyping the adjective before "clients" every 4.5 seconds, cycling
  // through the list below. The rest of the title is static, with no typing.
  // The word is backspaced from its end, then the next one typed from its start.
  function initHeroTyping() {
    const cycleEl = document.getElementById('hero-cycle');
    if (!cycleEl) return;

    const phrases = isFr
      ? ['idéaux', 'convaincus', 'fidèles', 'ambassadeurs']
      : ['right', 'paying', 'recurring', 'referring'];
    let i = 0;

    setInterval(() => {
      const prev = phrases[i];
      i = (i + 1) % phrases.length;
      const next = phrases[i];
      const state = { chars: prev.length };
      gsap.timeline({ defaults: { ease: 'none' } })
        .to(state, {
          duration: 0.6,
          chars: 0,
          onUpdate: () => { cycleEl.textContent = prev.slice(0, Math.round(state.chars)); },
        })
        .to(state, {
          duration: 1,
          chars: next.length,
          onUpdate: () => { cycleEl.textContent = next.slice(0, Math.round(state.chars)); },
        });
    }, 4500);
  }

  // Home: the ADAM loop starts in the hero as a small green bubble (only its
  // core showing). While the page scrolls from the hero to the ADAM section
  // it holds still on screen, grows, and the rings and functions fade in.
  // Once it reaches its own spot in the ADAM section it scrolls normally.
  function initAdamOrbit() {
    const slot = document.querySelector('.hero__orb');
    const loop = document.querySelector('.adam__loop');
    const intro = document.querySelector('.adam__intro');
    if (!slot || !loop || !intro) return;

    const HERO_SCALE = 0.65;
    const pair = [loop, intro];
    const extras = loop.querySelectorAll('.adam__ring, .adam__track');
    const nodes = loop.querySelectorAll('.adam__nodes li');

    // Page coordinates of an element's centre, ignoring transforms.
    const centre = (el) => {
      let x = el.offsetWidth / 2;
      let y = el.offsetHeight / 2;
      for (let n = el; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
      return { x, y };
    };
    let offset = { x: 0, y: 0 };
    const measure = () => {
      const from = centre(slot);
      const to = centre(loop);
      offset = { x: from.x - to.x, y: from.y - to.y };
      return offset;
    };

    const clamp = gsap.utils.clamp(0, 1);
    const grow = gsap.parseEase('power2.inOut');
    // 0..1 progress of a step that starts at `at` and lasts `len`.
    const step = (p, at, len) => clamp((p - at) / len);

    // p runs 0 -> 1 from the top of the page until the loop reaches its own
    // place. The move is linear and 1:1 with the scroll, so it cancels the
    // scroll exactly and the loop holds still on screen.
    const render = (p) => {
      gsap.set(pair, {
        x: offset.x * (1 - p),
        y: offset.y * (1 - p),
        scale: HERO_SCALE + (1 - HERO_SCALE) * grow(step(p, 0.25, 0.6)),
      });
      gsap.set(extras, { opacity: step(p, 0.5, 0.45) });
      nodes.forEach((li, i) => gsap.set(li, { opacity: step(p, 0.6 + i * 0.03, 0.25) }));
      gsap.set(intro, { opacity: step(p, 0.65, 0.3) });
    };

    ScrollTrigger.create({
      start: 0,
      end: () => Math.max(1, -measure().y),
      onUpdate: (self) => render(self.progress),
      onRefresh: (self) => render(self.progress),
    });
    measure();
    render(0);
  }

  // Types out the loss section title once it scrolls into view.
  function initLossTyping() {
    const titleEl = document.getElementById('loss-text');
    if (!titleEl || !gsap.plugins || !gsap.plugins.text) return;

    const text = titleEl.textContent;
    titleEl.textContent = '';

    ScrollTrigger.create({
      trigger: titleEl,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(titleEl, { duration: Math.max(0.8, text.length * 0.06), text, ease: 'none' });
      },
    });
  }
})();
