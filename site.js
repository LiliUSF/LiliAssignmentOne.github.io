(() => {
  if (!window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const glyphs = ["✦", "✧", "⋆"];
  const maxSparkles = 24;
  let lastSparkleAt = 0;
  let liveSparkles = 0;

  document.addEventListener("pointermove", (event) => {
    const now = performance.now();
    if (now - lastSparkleAt < 55 || liveSparkles >= maxSparkles) return;
    lastSparkleAt = now;
    liveSparkles += 1;

    const sparkle = document.createElement("span");
    sparkle.className = "sparkle-trail";
    sparkle.setAttribute("aria-hidden", "true");
    sparkle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;
    sparkle.addEventListener("animationend", () => {
      sparkle.remove();
      liveSparkles -= 1;
    }, { once: true });
    document.body.append(sparkle);
  }, { passive: true });
})();
