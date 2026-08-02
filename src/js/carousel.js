function initCoverflow(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cards = Array.from(container.children);
  const maxBlur = options.maxBlur ?? 6; // px
  const minScale = options.minScale ?? 0.88;
  const minOpacity = options.minOpacity ?? 0.45;

  function centerPadding() {
    if (!cards.length) return;
    const cardWidth = cards[0].offsetWidth;
    const pad = Math.max((container.clientWidth - cardWidth) / 2, 0);
    container.style.paddingLeft = pad + "px";
    container.style.paddingRight = pad + "px";
    container.style.scrollPaddingLeft = pad + "px";
    container.style.scrollPaddingRight = pad + "px";
  }

  function updateCards() {
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      // normalize: 0 = perfectly centered, 1 = one full card-width away
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
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateCards();
      ticking = false;
    });
  }

  centerPadding();
  updateCards();

  container.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    centerPadding();
    updateCards();
  });

  // scroll the first card into center on load
  requestAnimationFrame(() => {
    cards[0]?.scrollIntoView({ inline: "center", block: "nearest" });
    updateCards();
  });
}
