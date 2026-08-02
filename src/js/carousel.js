/**
 * Coverflow-style horizontal carousel — mobile only. On screens md (768px)
 * and wider, this does nothing: the container switches to a plain CSS
 * grid via Tailwind classes and all cards are reset to their natural
 * state (no blur/scale/opacity).
 *
 * Usage:
 *   <div id="my-carousel" class="flex md:grid ...">
 *     <div class="carousel-card shrink-0 snap-center md:w-auto">...</div>
 *     ...
 *   </div>
 *   <script src="./js/carousel.js"></script>
 *   <script>initCoverflow('my-carousel');</script>
 */
function initCoverflow(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cards = Array.from(container.children);
  const maxBlur = options.maxBlur ?? 6; // px
  const minScale = options.minScale ?? 0.88;
  const minOpacity = options.minOpacity ?? 0.45;
  const breakpoint = options.breakpoint ?? "(min-width: 768px)"; // Tailwind's md:
  const mq = window.matchMedia(breakpoint);

  function resetCards() {
    cards.forEach((card) => {
      card.style.filter = "";
      card.style.transform = "";
      card.style.opacity = "";
    });
    container.style.paddingLeft = "";
    container.style.paddingRight = "";
    container.style.scrollPaddingLeft = "";
    container.style.scrollPaddingRight = "";
  }

  function centerPadding() {
    if (mq.matches || !cards.length) return;
    const cardWidth = cards[0].offsetWidth;
    const pad = Math.max((container.clientWidth - cardWidth) / 2, 0);
    container.style.paddingLeft = pad + "px";
    container.style.paddingRight = pad + "px";
    container.style.scrollPaddingLeft = pad + "px";
    container.style.scrollPaddingRight = pad + "px";
  }

  function updateCards() {
    if (mq.matches) return; // desktop/tablet grid — leave cards alone

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      const norm = Math.min(distance / (rect.width * 0.9), 1);

      const blur = norm * maxBlur;
      const scale = 1 - norm * (1 - minScale);
      const opacity = 1 - norm * (1 - minOpacity);

      card.style.filter = `blur(${blur.toFixed(2)}px)`;
      card.style.transform = `scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(2);
    });
  }

  let ticking = false;
  function onScroll() {
    if (mq.matches) return;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateCards();
      ticking = false;
    });
  }

  function refresh() {
    if (mq.matches) {
      resetCards();
    } else {
      centerPadding();
      updateCards();
    }
  }

  refresh();
  container.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", refresh);
  mq.addEventListener("change", refresh);

  // center the first card on load, mobile only
  requestAnimationFrame(() => {
    if (!mq.matches) {
      cards[0]?.scrollIntoView({ inline: "center", block: "nearest" });
      updateCards();
    }
  });
}
