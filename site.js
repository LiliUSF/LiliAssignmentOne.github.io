(() => {
  const skyStars = document.createElement("div");
  skyStars.className = "sky-stars";
  skyStars.setAttribute("aria-hidden", "true");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const starCount = window.matchMedia("(max-width: 620px)").matches ? 48 : 76;
  const starGlyphs = ["✦", "✧", "⋆", "★", "☆"];

  for (let index = 0; index < starCount; index += 1) {
    const star = document.createElement("span");
    star.className = `sky-star sky-star-${index % 3}`;
    star.textContent = starGlyphs[Math.floor(Math.random() * starGlyphs.length)];
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty("--star-size", `${8 + Math.random() * 12}px`);
    star.style.setProperty("--star-duration", `${1.4 + Math.random() * 2.2}s`);
    star.style.setProperty("--star-delay", reducedMotion ? "0s" : `${-Math.random() * 4}s`);
    skyStars.append(star);
  }

  document.body.prepend(skyStars);

  function twinkleStarsIn(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      const text = root.nodeValue || "";
      if (!/[✦✧⋆★☆]/u.test(text) || root.parentElement?.closest(".twinkle-star, .sky-stars, .site-goasty, script, style, textarea, noscript")) return;
      const fragment = document.createDocumentFragment();
      text.split(/([✦✧⋆★☆])/u).forEach((part) => {
        if (!part) return;
        if (/^[✦✧⋆★☆]$/u.test(part)) {
          const star = document.createElement("span");
          star.className = "twinkle-star";
          star.setAttribute("aria-hidden", "true");
          star.textContent = part;
          fragment.append(star);
        } else {
          fragment.append(document.createTextNode(part));
        }
      });
      root.replaceWith(fragment);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE || root.closest?.(".twinkle-star, .sky-stars, .site-goasty, script, style, textarea, noscript")) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(twinkleStarsIn);
  }

  twinkleStarsIn(document.body);
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach(twinkleStarsIn));
  }).observe(document.body, { childList: true, subtree: true });

  const goodNews = [
    "Good news: you don’t have to figure it all out today. One small step is enough.",
    "Good news: a little pause can help you notice what you need.",
    "Good news: you’re allowed to begin again, as many times as you need.",
    "Good news: small joys count, even when they’re just a cozy moment.",
    "Good news: progress can be quiet and still be real.",
    "Good news: you can make room for wonder in an ordinary day.",
    "Good news: asking for support is a lovely way to care for yourself.",
    "Good news: rest belongs in the plan, too.",
    "Good news: you can take things one kind choice at a time.",
    "Good news: there’s still something new to discover about yourself."
  ];
  const goasty = document.createElement("aside");
  goasty.className = "site-goasty";
  goasty.setAttribute("aria-label", "A little good news from Goasty");

  const greeting = document.createElement("p");
  greeting.className = "site-goasty-message";
  greeting.setAttribute("aria-live", "polite");
  greeting.textContent = "Hi, I’m Goasty! Good news: you made it here. Take a little moment for yourself.";

  const newNote = document.createElement("button");
  newNote.className = "site-goasty-ghost";
  newNote.type = "button";
  newNote.setAttribute("aria-label", "Hear a little good news from Goasty");
  newNote.title = "Hear a little good news from Goasty";
  newNote.innerHTML = '<span class="site-goasty-sparkle" aria-hidden="true">✦</span><span class="site-goasty-body" aria-hidden="true"><span class="site-goasty-eyes"></span><span class="site-goasty-mouth"></span></span>';

  const dismiss = document.createElement("button");
  dismiss.className = "site-goasty-dismiss";
  dismiss.type = "button";
  dismiss.setAttribute("aria-label", "Hide Goasty");
  dismiss.textContent = "×";

  let previousGoodNewsIndex = -1;
  let messageTimeout;
  newNote.addEventListener("click", () => {
    const choices = goodNews
      .map((message, index) => ({ message, index }))
      .filter(({ index }) => index !== previousGoodNewsIndex);
    const selected = choices[Math.floor(Math.random() * choices.length)];
    previousGoodNewsIndex = selected.index;
    greeting.textContent = selected.message;
    goasty.classList.add("is-speaking");
    window.clearTimeout(messageTimeout);
    messageTimeout = window.setTimeout(() => goasty.classList.remove("is-speaking"), 7000);
  });

  goasty.append(greeting, newNote, dismiss);
  document.body.append(goasty);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dustGlyphs = ["✦", "✧", "✦", "✧"];
  const movementDuration = 5200;
  let trailDirection = { x: 0, y: 0 };
  let wanderingTimer;
  let dustTimer;
  let speakingTimer;

  function addDust() {
    if (!goasty.isConnected) return;
    const bounds = goasty.getBoundingClientRect();
    const dust = document.createElement("span");
    dust.className = "goasty-dust";
    dust.setAttribute("aria-hidden", "true");
    dust.textContent = dustGlyphs[Math.floor(Math.random() * dustGlyphs.length)];
    dust.style.left = `${bounds.left + bounds.width / 2 - trailDirection.x * (18 + Math.random() * 10) + (Math.random() - 0.5) * 14}px`;
    dust.style.top = `${bounds.top + bounds.height / 2 - trailDirection.y * (14 + Math.random() * 8) + (Math.random() - 0.5) * 18}px`;
    dust.style.setProperty("--dust-drift-x", `${-trailDirection.x * (12 + Math.random() * 10) + (Math.random() - 0.5) * 18}px`);
    dust.style.setProperty("--dust-drift-y", `${-trailDirection.y * (12 + Math.random() * 10) - 8 - Math.random() * 12}px`);
    dust.style.setProperty("--dust-size", `${14 + Math.random() * 8}px`);
    document.body.append(dust);
    dust.addEventListener("animationend", () => dust.remove(), { once: true });
  }

  function wander() {
    if (document.hidden || !goasty.isConnected) return;
    const width = goasty.offsetWidth;
    const height = goasty.offsetHeight;
    const maxLeft = Math.max(10, window.innerWidth - width - 10);
    const maxTop = Math.max(90, window.innerHeight - height - 12);
    const leftEdge = 10;
    const rightEdge = maxLeft;
    const topEdge = Math.min(maxTop, Math.max(88, Math.round(window.innerHeight * 0.14)));
    const bottomEdge = maxTop;
    const middle = Math.round((topEdge + bottomEdge) / 2);
    const spots = [
      [leftEdge, topEdge], [rightEdge, topEdge],
      [leftEdge, middle], [rightEdge, middle],
      [leftEdge, bottomEdge], [rightEdge, bottomEdge]
    ];
    const currentLeft = Number.parseFloat(goasty.style.left);
    const currentTop = Number.parseFloat(goasty.style.top);
    const choices = spots.filter(([left, top]) =>
      Math.abs(left - currentLeft) + Math.abs(top - currentTop) > 100
    );
    const [left, top] = choices[Math.floor(Math.random() * choices.length)] || spots[0];
    trailDirection = {
      x: Math.sign(left - currentLeft),
      y: Math.sign(top - currentTop)
    };
    goasty.classList.toggle("is-left", left < window.innerWidth / 2);
    goasty.classList.add("is-moving");
    goasty.style.left = `${left}px`;
    goasty.style.top = `${top}px`;
    window.clearInterval(dustTimer);
    addDust();
    dustTimer = window.setInterval(addDust, 60);
    window.setTimeout(() => {
      goasty.classList.remove("is-moving");
      window.clearInterval(dustTimer);
    }, movementDuration);
  }

  function showGoodNews() {
    if (!goasty.isConnected) return;
    const choices = goodNews
      .map((message, index) => ({ message, index }))
      .filter(({ index }) => index !== previousGoodNewsIndex);
    const selected = choices[Math.floor(Math.random() * choices.length)];
    previousGoodNewsIndex = selected.index;
    greeting.textContent = selected.message;
    goasty.classList.add("is-speaking");
    window.clearTimeout(messageTimeout);
    messageTimeout = window.setTimeout(() => goasty.classList.remove("is-speaking"), 6000);
  }

  const initialLeft = Math.max(10, window.innerWidth - goasty.offsetWidth - 18);
  const initialTop = Math.max(90, window.innerHeight - goasty.offsetHeight - 18);
  goasty.style.left = `${initialLeft}px`;
  goasty.style.top = `${initialTop}px`;
  goasty.classList.toggle("is-left", initialLeft < window.innerWidth / 2);
  goasty.classList.add("is-speaking");
  messageTimeout = window.setTimeout(() => goasty.classList.remove("is-speaking"), 6500);
  dismiss.addEventListener("click", () => {
    window.clearTimeout(messageTimeout);
    window.clearInterval(wanderingTimer);
    window.clearInterval(dustTimer);
    window.clearInterval(speakingTimer);
    goasty.remove();
  });

  if (!reduceMotion) {
    window.setTimeout(wander, 2500);
    wanderingTimer = window.setInterval(wander, 10500);
    speakingTimer = window.setInterval(showGoodNews, 24000);
    window.addEventListener("resize", () => {
      const maxLeft = Math.max(10, window.innerWidth - goasty.offsetWidth - 10);
      const maxTop = Math.max(90, window.innerHeight - goasty.offsetHeight - 12);
      const currentLeft = Number.parseFloat(goasty.style.left);
      const currentTop = Number.parseFloat(goasty.style.top);
      goasty.style.left = `${Number.isFinite(currentLeft) ? Math.max(10, Math.min(currentLeft, maxLeft)) : Math.max(10, window.innerWidth - goasty.offsetWidth - 18)}px`;
      goasty.style.top = `${Number.isFinite(currentTop) ? Math.max(90, Math.min(currentTop, maxTop)) : Math.max(90, window.innerHeight - goasty.offsetHeight - 18)}px`;
      goasty.classList.toggle("is-left", Number.parseFloat(goasty.style.left) < window.innerWidth / 2);
    }, { passive: true });
  }

  if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    let lastSparkleAt = 0;
    let liveSparkles = 0;
    const maxSparkles = 24;

    document.addEventListener("pointermove", (event) => {
      const now = performance.now();
      if (now - lastSparkleAt < 55 || liveSparkles >= maxSparkles) return;
      lastSparkleAt = now;
      liveSparkles += 1;

      const sparkle = document.createElement("span");
      sparkle.className = "sparkle-trail";
      sparkle.setAttribute("aria-hidden", "true");
      sparkle.textContent = dustGlyphs[Math.floor(Math.random() * dustGlyphs.length)];
      sparkle.style.left = `${event.clientX}px`;
      sparkle.style.top = `${event.clientY}px`;
      sparkle.addEventListener("animationend", () => {
        sparkle.remove();
        liveSparkles -= 1;
      }, { once: true });
      document.body.append(sparkle);
    }, { passive: true });
  }
})();
