/* ============================================================
   LeapSphere — interactions
   Lenis smooth scroll + GSAP (typing, hero morph, horizontal, reveals)
   ============================================================ */
gsap.registerPlugin(ScrollTrigger, TextPlugin);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------------------------------------------------------
   1. LENIS SMOOTH SCROLL  — starts 0.3s after the site loads
--------------------------------------------------------------- */
let lenis;
function startLenis() {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    lerp: 0.09,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links use Lenis for buttery jumps
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    });
  });
}

/* ---------------------------------------------------------------
   2. HERO — typing title, then fade everything else in
--------------------------------------------------------------- */
function playHero() {
  const titleEl = document.getElementById("heroTitle");
  const fadeEls = document.querySelectorAll("[data-fade]");
  const phrase = HERO_TITLE[currentLang];

  if (reduceMotion) {
    titleEl.textContent = phrase;
    titleEl.classList.add("is-typed");
    gsap.set(fadeEls, { opacity: 1 });
    return;
  }

  const tl = gsap.timeline();

  // "type" the title in
  tl.to(titleEl, {
    duration: 1.7,
    text: { value: phrase, delimiter: "" },
    ease: "none",
  });

  // caret off once typed
  tl.add(() => titleEl.classList.add("is-typed"));

  // everything else (navbar, subtext, button) 0 -> 100 opacity
  tl.to(
    fadeEls,
    { opacity: 1, duration: 1.0, stagger: 0.12, ease: "power2.out" },
    "+=0.1"
  );
}

/* ---------------------------------------------------------------
   3. HERO MORPH — light fades/blurs into the dark version.
      No page scroll happens visually: the section is pinned and
      the crossfade is scrubbed by scroll. (Only this section.)
--------------------------------------------------------------- */
function heroMorph() {
  const light = document.querySelector('[data-hero="light"]');
  const dark = document.querySelector('[data-hero="dark"]');
  const nav = document.getElementById("nav");
  const navCta = document.getElementById("navCta");

  if (reduceMotion) return;

  const morph = gsap.timeline({
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "+=150%",
      pin: ".hero__pin",
      pinSpacing: true,
      scrub: 0.6,
      onUpdate: (self) => {
        // total duration is 4, animation is 1. Halfway through animation is 0.5 / 4 = 0.125
        const dark2 = self.progress > 0.125;
        nav.classList.toggle("nav--dark", dark2);
        navCta.classList.toggle("is-shown", dark2);
        dark.style.pointerEvents = dark2 ? "auto" : "none";
        light.style.pointerEvents = dark2 ? "none" : "auto";
      },
    },
  });

  morph
    .to(light, { opacity: 0, filter: "blur(14px)", duration: 1, ease: "power1.inOut" }, 0)
    .fromTo(
      dark,
      { opacity: 0, filter: "blur(14px)" },
      { opacity: 1, filter: "blur(0px)", duration: 1, ease: "power1.inOut" },
      0
    )
    .set({}, {}, "+=3"); // keep the dark section pinned for longer
}

/* ---------------------------------------------------------------
   4. HORIZONTAL SCROLL section
--------------------------------------------------------------- */
function horizontalScroll() {
  const track = document.getElementById("hTrack");
  if (!track || reduceMotion) return;

  const getScrollAmount = () => {
    const cards = track.querySelectorAll(".h-card");
    const lastCard = cards[cards.length - 1];
    const paddingRight = parseFloat(window.getComputedStyle(track).paddingRight) || 0;
    // Calculate scroll so the center of the last card lands exactly in the middle of the screen
    return track.scrollWidth - paddingRight - (lastCard.offsetWidth / 2) - (window.innerWidth / 2);
  };

  gsap.to(track, {
    x: () => -getScrollAmount(),
    ease: "none",
    scrollTrigger: {
      trigger: "#horizontal",
      start: "top top",
      end: () => "+=" + getScrollAmount(),
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });
}

/* ---------------------------------------------------------------
   5. SCROLL REVEALS — appear "the first time around"
--------------------------------------------------------------- */
function reveals() {
  if (reduceMotion) return;

  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });

  // stagger the three lines of the visibility headline
  const visLines = document.querySelectorAll(".visibility__title span");
  if (visLines.length) {
    gsap.from(visLines, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: { trigger: ".visibility__title", start: "top 80%", once: true },
    });
  }
}

/* ---------------------------------------------------------------
   6. MENU overlay
--------------------------------------------------------------- */
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
const menuOverlay = document.getElementById("menuOverlay");

function openMenu() {
  nav.classList.add("is-open");
  menuOverlay.classList.add("is-open");
  menuOverlay.setAttribute("aria-hidden", "false");
  menuBtn.setAttribute("aria-expanded", "true");
}
function closeMenu() {
  nav.classList.remove("is-open");
  menuOverlay.classList.remove("is-open");
  menuOverlay.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
}
menuBtn.addEventListener("click", () => {
  nav.classList.contains("is-open") ? closeMenu() : openMenu();
});
document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

/* ---------------------------------------------------------------
   7. TESTIMONIAL videos — reveal placeholder only if a clip exists,
      autoplay on hover
--------------------------------------------------------------- */
function wireVideos() {
  const section = document.getElementById("testimonials");
  let hasValidVideo = false;

  document.querySelectorAll(".tframe").forEach((frame) => {
    const video = frame.querySelector(".tframe__video");
    if (!video) return;

    const onVideoReady = () => {
      video.classList.add("is-loaded");
      if (section && !hasValidVideo) {
        hasValidVideo = true;
        section.style.display = ""; // remove inline display: none
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    };

    if (video.readyState >= 1) {
      onVideoReady();
    } else {
      video.addEventListener("loadeddata", onVideoReady);
    }

    frame.addEventListener("mouseenter", () => {
      if (video.readyState >= 2) video.play().catch(() => { });
    });
    frame.addEventListener("mouseleave", () => video.pause());
  });
}

/* ---------------------------------------------------------------
   BOOT
--------------------------------------------------------------- */
window.addEventListener("load", () => {
  initI18n();          // capture English + wire the "fr" button
  applyLang(currentLang); // restore persisted language (if any)
  playHero();          // typing starts immediately (in the active language)
  wireVideos();

  // Lenis begins 0.3s after load (per spec)
  setTimeout(startLenis, 300);

  // scroll-driven pieces
  heroMorph();
  horizontalScroll();
  reveals();
  navColorLogic();

  ScrollTrigger.refresh();
});

function navColorLogic() {
  const sections = document.querySelectorAll("[data-theme]");
  const nav = document.getElementById("nav");
  if (!nav) return;

  sections.forEach((sec) => {
    const theme = sec.getAttribute("data-theme");
    ScrollTrigger.create({
      trigger: sec,
      start: "top 84px",
      end: "bottom 84px",
      onEnter: () => {
        if (theme === "dark") nav.classList.add("nav--dark");
        else nav.classList.remove("nav--dark");
      },
      onEnterBack: () => {
        if (theme === "dark") nav.classList.add("nav--dark");
        else nav.classList.remove("nav--dark");
      }
    });
  });
}

/* ---------------------------------------------------------------
   8. I18N — English / French toggle on the "fr" button
   English is captured live from the DOM; French is defined below.
--------------------------------------------------------------- */
const HERO_TITLE = {
  en: "Be the name people think of first",
  fr: "Soyez le nom auquel les gens pensent en premier",
};

const I18N = [
  // buttons (three separate "Partner with LeapSphere")
  { sel: ".nav__cta", fr: "Devenez partenaire de LeapSphere" },
  { sel: ".hero__btn", fr: "Devenez partenaire de LeapSphere" },
  { sel: ".footer__form .btn", fr: "Devenez partenaire de LeapSphere" },

  // navigation / footer link lists
  { sel: ".menu-overlay__links .menu-link", fr: ["Accueil", "À propos", "Fonctionnalités", "Livres blancs", "FAQ"] },
  { sel: ".footer__links a", fr: ["Accueil", "À propos", "Fonctionnalités", "Livres blancs", "FAQ"] },

  // hero (light)
  { sel: ".hero__sub", fr: "Arrêtez de perdre des heures sur un marketing qui ne mène nulle part. Nous gérons votre contenu, de la stratégie à la publication. Vous restez concentré sur votre entreprise." },

  // hero (dark)
  { sel: ".hero__title--dark", fr: "Les bons produits et services méritent d’être vus" },
  { sel: ".hero__sub--dark", fr: "Confiez toute votre stratégie marketing à LeapSphere.<br>Oui, l’intégralité." },
  { sel: ".hero__actions .btn", fr: ["voir les cas d’usage", "voir les fonctionnalités"] },
  { sel: ".hero__care-label", fr: "Nous nous occupons de :" },
  { sel: ".hero__care-list li", fr: ["Gestion du SEO", "Rédaction d’articles et de blog", "Gestion des réseaux sociaux", "Aimants à prospects", "Gestion de Hubspot", "Veille concurrentielle", "Rapports et analyses"] },

  // horizontal
  { sel: ".h-panel__heading", fr: "Vous avez fait le saut pour vous concentrer sur votre expertise" },
  {
    sel: ".h-panel__lead", fr: [
      "Vous êtes excellent dans votre domaine.<br>Vos clients ont besoin de votre attention.",
      "Mais en ce moment, vous passez des heures non rémunérées à essayer de rester visible en ligne, et cela vous éloigne de votre vrai travail.",
    ]
  },
  { sel: ".h-card__title", fr: ["Le gouffre temporel", "Le silence", "La facture d’agence"] },
  {
    sel: ".h-card__body", fr: [
      "Vous passez vos soirées devant un écran vide, à rédiger des publications et à gérer des plateformes alors que vous devriez vous reposer ou servir vos clients.",
      "Vous fournissez de réels efforts pour publier, mais rien ne se passe. La visibilité reste faible car des publications aléatoires et dispersées ne bâtissent pas une autorité durable.",
      "Vous payez de lourds forfaits mensuels à des agences lentes, qui exigent des réunions interminables et donnent l’impression que quelqu’un d’autre a écrit vos textes.",
    ]
  },

  // visibility
  { sel: ".visibility__title span", fr: ["Plus de visibilité.", "Moins de coûts.", "Zéro temps perdu."] },
  { sel: ".visibility__body", fr: "Vous êtes excellent dans votre domaine. Assurons-nous maintenant que votre marché le sache.<br>Renforcez votre opération marketing dès aujourd’hui et récupérez votre temps." },

  // operation
  { sel: ".operation__title", fr: "Nous gérons toute l’opération pour que vous n’ayez pas à le faire." },
  { sel: ".op-row__name", fr: ["Visibilité locale<br>et recherche", "Création et<br>publication de contenu", "Veille du<br>marché"] },
  {
    sel: ".op-row__text", fr: [
      "<p>Lorsque des clients potentiels recherchent un expert dans votre région, ils vous trouvent.</p><p>Nous veillons à ce que votre nom apparaisse en premier, clairement et régulièrement.</p>",
      "<p>Votre marque reste active grâce à des publications soignées et bien rédigées qui vous ressemblent vraiment.</p><p>Nous rédigeons, révisons et publions sur vos canaux afin que votre audience voie une présence régulière chaque semaine.</p>",
      "<p>Nous surveillons votre marché et ajustons votre contenu pour que votre marque se démarque toujours comme le leader incontesté.</p><p>Ne vous souciez plus jamais de la concurrence.</p>",
    ]
  },
  { sel: ".op-btn", fr: "Voir toutes les fonctionnalités" },

  // comparison
  { sel: ".comparison__title", fr: "Meilleure alternative disponible" },
  { sel: ".compare-card__head", fr: ["Équipe interne", "Agence", "LeapSphere"] },
  {
    sel: ".compare-item", fr: [
      '<p class="compare-item__title">Délais variables :</p><p>Votre marketing tourne discrètement en arrière-plan pendant que vous vous concentrez sur vos clients</p>',
      '<p class="compare-item__title">Qualité inconstante :</p><p>LeapSphere voit ce que veut votre public et adapte la stratégie de manière adéquate</p>',
      '<p class="compare-item__title">Coûteux :</p><p>Vous bénéficiez de la portée d\'une équipe marketing complète pour une fraction du coût, sans les frais traditionnels.</p>',
      '<p class="compare-item__title">Zéro heure perdue :</p><p>Votre marketing tourne discrètement en arrière-plan pendant que vous vous concentrez sur vos clients</p>',
      '<p class="compare-item__title">L\'esthétique de la marque devient confuse :</p><p>Votre marque ne vous ressemble pas</p>',
      '<p class="compare-item__title">Coûteux :</p><p>Vous payez plus de 8 000 $ par mois uniquement en honoraires</p>',
      '<p class="compare-item__title">Zéro heure perdue :</p><p>Votre marketing tourne discrètement en arrière-plan pendant que vous vous concentrez sur vos clients</p>',
      '<p class="compare-item__title">Autorité durable :</p><p>Vous maintenez une présence quotidienne claire et régulière. Votre marché pense à vous en premier.</p>',
      '<p class="compare-item__title">Un coût juste :</p><p>Vous bénéficiez de la portée d\'une équipe marketing complète pour une fraction du coût, sans les frais traditionnels.</p>',
    ]
  },

  // testimonials
  { sel: ".testimonials__title", fr: "Témoignages d’autres experts" },
  { sel: ".tframe__placeholder", fr: ["Développeur<br>front-end", "Développeur<br>d’entreprise", "Expert"] },

  // modal
  { sel: ".popup-modal__title", fr: "Devenez partenaire de LeapSphere" },
  { sel: ".popup-modal__submit", fr: "Envoyer" },

  // footer / CTA
  { sel: ".footer__title", fr: "Prêt à devenir le premier nom auquel les gens pensent ?" },
  { sel: ".footer__sub", fr: "Vous êtes excellent dans votre domaine. Assurons-nous maintenant que votre marché le sache.<br>Renforcez votre opération marketing dès aujourd’hui et récupérez votre temps." },
  { sel: ".footer__legal a", fr: ["Confidentialité", "Gérer les cookies", "Conditions"] },
];

let currentLang = localStorage.getItem("ls-lang") === "fr" ? "fr" : "en";

function initI18n() {
  // capture the English content that's already in the DOM
  I18N.forEach((entry) => {
    const els = document.querySelectorAll(entry.sel);
    entry._en = Array.isArray(entry.fr)
      ? Array.from(els).map((el) => el.innerHTML)
      : els.length
        ? els[0].innerHTML
        : null;
  });

  const email = document.querySelector(".footer__input");
  if (email) email.dataset.enPlaceholder = email.getAttribute("placeholder") || "";

  const emailModal = document.querySelector(".popup-modal__input");
  if (emailModal) emailModal.dataset.enPlaceholder = emailModal.getAttribute("placeholder") || "";

  const langBtn = document.querySelector(".nav__lang");
  if (langBtn) {
    langBtn.addEventListener("click", () =>
      applyLang(currentLang === "fr" ? "en" : "fr")
    );
  }
}

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  I18N.forEach((entry) => {
    const els = document.querySelectorAll(entry.sel);
    els.forEach((el, i) => {
      const val =
        lang === "fr"
          ? Array.isArray(entry.fr)
            ? entry.fr[i]
            : entry.fr
          : Array.isArray(entry._en)
            ? entry._en[i]
            : entry._en;
      if (val != null) el.innerHTML = val;
    });
  });

  // email placeholder (attribute, not content)
  const email = document.querySelector(".footer__input");
  if (email) {
    email.placeholder =
      lang === "fr" ? "entrez votre e-mail" : email.dataset.enPlaceholder || "";
  }

  const emailModal = document.querySelector(".popup-modal__input");
  if (emailModal) {
    emailModal.placeholder =
      lang === "fr" ? "entrez votre e-mail" : emailModal.dataset.enPlaceholder || "";
  }

  // hero title: only overwrite once it has finished typing (avoids clobbering the animation)
  const titleEl = document.getElementById("heroTitle");
  if (titleEl && titleEl.classList.contains("is-typed")) {
    titleEl.textContent = HERO_TITLE[lang];
  }

  // toggle the button label to the language you can switch TO
  const langBtn = document.querySelector(".nav__lang");
  if (langBtn) langBtn.textContent = lang === "fr" ? "en" : "fr";

  localStorage.setItem("ls-lang", lang);
  if (window.ScrollTrigger) ScrollTrigger.refresh();
}

/* ---------------------------------------------------------------
   9. POPUP MODAL
--------------------------------------------------------------- */
const contactModal = document.getElementById("contactModal");
const contactModalOverlay = document.getElementById("contactModalOverlay");
const contactModalClose = document.getElementById("contactModalClose");
const modalBtns = document.querySelectorAll(".js-modal-btn");

function openModal(e) {
  if (e) e.preventDefault();
  contactModal.classList.add("is-open");
  contactModal.setAttribute("aria-hidden", "false");
}
function closeModal() {
  contactModal.classList.remove("is-open");
  contactModal.setAttribute("aria-hidden", "true");
}

if (contactModal) {
  modalBtns.forEach(btn => btn.addEventListener("click", openModal));
  contactModalClose.addEventListener("click", closeModal);
  contactModalOverlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && contactModal.classList.contains("is-open")) {
      closeModal();
    }
  });
}
