// ═══════════════════════════════════════════
// LeapSphere — Interactions & Effects
// ═══════════════════════════════════════════

(function () {
  'use strict';

  // ─── Language state ───
  var currentLang = localStorage.getItem('ls-lang') || 'en';

  // ─── DOM references ───
  var navbar = document.getElementById('navbar');
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  var langToggle = document.getElementById('langToggle');
  var canvas = document.getElementById('particleCanvas');
  var ctx = canvas.getContext('2d');

  // ═══════════ 1. SCROLL REVEAL ═══════════
  var revealElements = document.querySelectorAll('[data-reveal]');
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  revealElements.forEach(function (el) { revealObserver.observe(el); });

  // ═══════════ 2. NAVBAR SCROLL ═══════════
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  });

  // ═══════════ 3. HAMBURGER MENU ═══════════
  hamburger.addEventListener('click', function () {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // ═══════════ 4. SMOOTH SCROLL ═══════════
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ═══════════ 5. LANGUAGE TOGGLE ═══════════
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('ls-lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-en]').forEach(function (el) {
      var text = el.getAttribute('data-' + lang);
      if (text) el.textContent = text;
    });

    document.querySelectorAll('[data-en-placeholder]').forEach(function (el) {
      var ph = el.getAttribute('data-' + lang + '-placeholder');
      if (ph) el.placeholder = ph;
    });
  }

  langToggle.addEventListener('click', function () {
    applyLanguage(currentLang === 'en' ? 'fr' : 'en');
  });

  applyLanguage(currentLang);

  // ═══════════ 6. MODALS ═══════════
  var termsModal = document.getElementById('termsModal');
  var privacyModal = document.getElementById('privacyModal');

  document.getElementById('openTerms').addEventListener('click', function () {
    termsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('openPrivacy').addEventListener('click', function () {
    privacyModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  document.querySelectorAll('.modal-close').forEach(function (btn) {
    btn.addEventListener('click', function () {
      termsModal.classList.remove('active');
      privacyModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      termsModal.classList.remove('active');
      privacyModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // ═══════════ 7. PARTICLE CANVAS ═══════════
  var particles = [];
  var PARTICLE_COUNT = 700;
  var colors = [
    'rgba(131, 116, 241, ',
    'rgba(118, 212, 235, ',
    'rgba(107, 92, 231, ',
    'rgba(168, 153, 245, ',
    'rgba(157, 228, 245, ',
  ];

  var scrollTarget = 0;
  var scrollCurrent = 0;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function createParticle() {
    var layer = Math.floor(Math.random() * 3);
    // Use the actual canvas size, fallback to a tall height just in case layout is slow
    var w = canvas.offsetWidth || window.innerWidth;
    var h = canvas.offsetHeight || (window.innerHeight * 3);

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      radius: layer === 0
        ? Math.random() * 1.2 + 0.4
        : layer === 1
          ? Math.random() * 1.8 + 0.8
          : Math.random() * 2.5 + 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: layer === 0
        ? Math.random() * 0.22 + 0.05
        : layer === 1
          ? Math.random() * 0.32 + 0.1
          : Math.random() * 0.42 + 0.15,
      speedX: (Math.random() - 0.5) * (0.12 + layer * 0.1),
      speedY: (Math.random() - 0.5) * (0.12 + layer * 0.1),
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.018 + 0.004,
      layer: layer,
      parallaxFactor: [0.01, 0.05, 0.20][layer],
    };
  }

  function initParticles() {
    particles.length = 0;
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function drawParticles() {
    var w = canvas.offsetWidth;
    var h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    scrollTarget = window.scrollY * 1.3;
    scrollCurrent += (scrollTarget - scrollCurrent) * 0.015;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var parallaxOffset = scrollCurrent * p.parallaxFactor;

      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += p.pulseSpeed;

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      var pulseAlpha = p.alpha + Math.sin(p.pulse) * 0.12;
      var a = Math.max(0.02, Math.min(pulseAlpha, 0.65));
      var drawY = p.y - parallaxOffset;

      ctx.beginPath();
      ctx.arc(p.x, drawY, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + a + ')';
      ctx.fill();
    }

    var connectionRadius = 130;
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        if (Math.abs(particles[i].layer - particles[j].layer) > 1) continue;
        var dx = particles[i].x - particles[j].x;
        var piOff = scrollCurrent * particles[i].parallaxFactor;
        var pjOff = scrollCurrent * particles[j].parallaxFactor;
        var dy = (particles[i].y - piOff) - (particles[j].y - pjOff);
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionRadius) {
          var lineAlpha = (1 - dist / connectionRadius) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y - piOff);
          ctx.lineTo(particles[j].x, particles[j].y - pjOff);
          ctx.strokeStyle = 'rgba(131, 116, 241, ' + lineAlpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(drawParticles);
  }

  // Delay initial setup slightly to ensure grid layout and wrapper heights are fully settled
  setTimeout(function () {
    resizeCanvas();
    initParticles();
    requestAnimationFrame(drawParticles);
  }, 100);

  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      resizeCanvas();
      initParticles();
    }, 200);
  });

  // ═══════════ 8. PARALLAX (HERO CONTENT) ═══════════
  var heroContent = document.querySelector('.hero-content');
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        if (scrollY < window.innerHeight) {
          var offset = scrollY * 0.28;
          heroContent.style.transform = 'translateY(' + offset + 'px)';
          heroContent.style.opacity = Math.max(0, 1 - scrollY / (window.innerHeight * 0.75));
        }
        ticking = false;
      });
      ticking = true;
    }
  });

  // ═══════════ 9. WORKFLOW HOVER SCALE ═══════════
  // Pure CSS handles the animation (springy cubic-bezier in styles.css).
  // JS just sets the default state so steps start at a gentle reduced scale,
  // then pop to full on hover — giving a "reactive" feel without rAF choppiness.
  var workflowSteps = document.querySelectorAll('.workflow-step');

  // Start steps at a subtle resting state (slightly dim) so hover "activates" them
  workflowSteps.forEach(function (step) {
    step.style.opacity = '1';
    step.style.transform = 'scale(0.99)';

    step.addEventListener('mouseenter', function () {
      step.style.transform = 'scale(1.05) translateX(5px)';
      step.style.opacity = '1';
    });

    step.addEventListener('mouseleave', function () {
      step.style.transform = 'scale(0.99)';
      step.style.opacity = '1';
    });
  });

})();
