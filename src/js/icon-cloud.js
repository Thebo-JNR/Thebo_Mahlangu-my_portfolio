function initIconCloud(canvasId, imageUrls, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const settings = {
    radius: options.radius || Math.min(canvas.width, canvas.height) * 0.38,
    iconSize: options.iconSize || 42,
    autoRotateSpeed: options.autoRotateSpeed ?? 0.0035,
    ...options,
  };

  // ── Distribute points evenly on a sphere (Fibonacci sphere) ──
  const count = imageUrls.length;
  const points = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // -1 to 1
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push({
      x: Math.cos(theta) * r,
      y: y,
      z: Math.sin(theta) * r,
    });
  }

  // ── Preload images ──
  const icons = imageUrls.map((src, i) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    return { img, loaded: false, point: points[i] };
  });
  icons.forEach((icon) => {
    icon.img.onload = () => (icon.loaded = true);
  });

  // ── Rotation state ──
  let rotX = 0.3;
  let rotY = 0;
  let velX = 0;
  let velY = settings.autoRotateSpeed;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function rotatePoint(p, rx, ry) {
    // rotate around X axis
    let y = p.y * Math.cos(rx) - p.z * Math.sin(rx);
    let z = p.y * Math.sin(rx) + p.z * Math.cos(rx);
    // rotate around Y axis
    let x = p.x * Math.cos(ry) + z * Math.sin(ry);
    z = -p.x * Math.sin(ry) + z * Math.cos(ry);
    return { x, y, z };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const projected = icons
      .filter((icon) => icon.loaded)
      .map((icon) => {
        const r = rotatePoint(icon.point, rotX, rotY);
        const scale = (r.z + 2) / 3; // depth-based scale, 0.33–1.33
        const alpha = Math.max(0.25, (r.z + 1) / 2);
        return {
          icon,
          x: cx + r.x * settings.radius,
          y: cy + r.y * settings.radius,
          z: r.z,
          scale,
          alpha,
        };
      })
      .sort((a, b) => a.z - b.z); // painter's algorithm: back to front

    for (const p of projected) {
      const size = settings.iconSize * p.scale;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.drawImage(p.icon.img, p.x - size / 2, p.y - size / 2, size, size);
      ctx.restore();
    }

    // auto-rotate unless the user is actively dragging
    if (!dragging) {
      rotY += velY;
      rotX += velX;
      // gentle friction back toward pure auto-rotate speed
      velX *= 0.95;
      velY += (settings.autoRotateSpeed - velY) * 0.02;
    }

    requestAnimationFrame(draw);
  }

  // ── Drag-to-spin (mouse + touch) ──
  function onDown(x, y) {
    dragging = true;
    lastX = x;
    lastY = y;
    canvas.style.cursor = "grabbing";
  }
  function onMove(x, y) {
    if (!dragging) return;
    const dx = x - lastX;
    const dy = y - lastY;
    rotY += dx * 0.005;
    rotX += dy * 0.005;
    velY = dx * 0.0015;
    velX = dy * 0.0015;
    lastX = x;
    lastY = y;
  }
  function onUp() {
    dragging = false;
    canvas.style.cursor = "grab";
  }

  canvas.style.cursor = "grab";
  canvas.style.touchAction = "none";

  canvas.addEventListener("mousedown", (e) => onDown(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", onUp);

  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    onDown(t.clientX, t.clientY);
  });
  canvas.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
      e.preventDefault();
    },
    { passive: false },
  );
  canvas.addEventListener("touchend", onUp);

  draw();
}
