/**
 * ============================================================================
 * MAISON DE BLOOM — PURE FULL-SCREEN CINEMATIC SCROLL ENGINE
 * 100% Focused on the Floral Palace Walkthrough
 * ============================================================================
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 430;
  const FRAME_PATH = (i) => `frames/frame_${String(i).padStart(4, '0')}.jpg`;

  const images = new Array(TOTAL_FRAMES + 1);
  const isLoaded = new Array(TOTAL_FRAMES + 1).fill(false);
  let loadedCount = 0;
  let lastRenderedImg = null;

  let currentFrameFloat = 1;
  let targetFrameFloat = 1;
  let scrollProgress = 0;

  // DOM Elements
  const preloader = document.getElementById('preloader');
  const progressFill = document.getElementById('progress-fill');
  const loadPercentage = document.getElementById('load-percentage');

  const canvas = document.getElementById('scroll-canvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const steps = [
    { el: document.getElementById('step-0'), min: 0, max: 0.14 },
    { el: document.getElementById('step-1'), min: 0.18, max: 0.38 },
    { el: document.getElementById('step-2'), min: 0.42, max: 0.62 },
    { el: document.getElementById('step-3'), min: 0.66, max: 0.84 },
    { el: document.getElementById('step-4'), min: 0.88, max: 1.0 }
  ];

  const toastContainer = document.getElementById('toastContainer');

  /**
   * ==========================================================================
   * 1. CONCURRENT FRAME PRELOADER
   * ==========================================================================
   */
  function initPreloader() {
    loadSingleFrame(1, () => {
      resizeCanvas();
      renderFrame(1);
    });

    const BATCH_CONCURRENCY = 24;
    let nextIndex = 1;

    function loadNext() {
      if (nextIndex > TOTAL_FRAMES) return;
      const idx = nextIndex++;
      loadSingleFrame(idx, () => {
        const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (loadPercentage) loadPercentage.textContent = `Loading Sanctuary... ${pct}%`;

        if (loadedCount >= 15 && preloader && !preloader.classList.contains('fade-out')) {
          preloader.classList.add('fade-out');
        }

        loadNext();
      });
    }

    for (let i = 0; i < BATCH_CONCURRENCY; i++) {
      loadNext();
    }
  }

  function loadSingleFrame(index, callback) {
    if (images[index] && isLoaded[index]) {
      if (callback) callback();
      return;
    }

    const img = new Image();
    img.src = FRAME_PATH(index);
    img.onload = () => {
      images[index] = img;
      isLoaded[index] = true;
      loadedCount++;
      if (callback) callback();
    };
    img.onerror = () => {
      isLoaded[index] = false;
      if (callback) callback();
    };
  }

  /**
   * ==========================================================================
   * 2. CANVAS RENDERING ENGINE (ZERO-BLACK-FRAME RETENTION)
   * ==========================================================================
   */
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    renderFrame(Math.round(currentFrameFloat));
  }

  function renderFrame(frameNum) {
    if (!canvas || !ctx) return;
    const targetIdx = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frameNum)));

    let img = images[targetIdx];

    if (!img || !img.complete || img.naturalWidth === 0) {
      let closestDist = Infinity;
      let closestImg = null;

      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        if (images[i] && images[i].complete && images[i].naturalWidth > 0) {
          const dist = Math.abs(i - targetIdx);
          if (dist < closestDist) {
            closestDist = dist;
            closestImg = images[i];
          }
        }
      }

      img = closestImg || lastRenderedImg;
    }

    if (!img || !img.complete || img.naturalWidth === 0) {
      if (lastRenderedImg) {
        img = lastRenderedImg;
      } else {
        return;
      }
    }

    lastRenderedImg = img;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth || 1280;
    const ih = img.naturalHeight || 720;

    const imgRatio = iw / ih;
    const canvasRatio = cw / ch;
    let dw, dh, ox, oy;

    if (canvasRatio > imgRatio) {
      dw = cw;
      dh = cw / imgRatio;
      ox = 0;
      oy = (ch - dh) / 2;
    } else {
      dh = ch;
      dw = ch * imgRatio;
      ox = (cw - dw) / 2;
      oy = 0;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, ox, oy, dw, dh);
  }

  /**
   * ==========================================================================
   * 3. DIRECT PHYSICAL SCROLL CALCULATOR & LERP
   * ==========================================================================
   */
  function onScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    let progress = scrollY / maxScroll;
    progress = Math.max(0, Math.min(1, progress));
    scrollProgress = progress;

    targetFrameFloat = 1 + progress * (TOTAL_FRAMES - 1);
  }

  function renderLoop() {
    try {
      const lerp = 0.18;
      const diff = targetFrameFloat - currentFrameFloat;

      if (Math.abs(diff) > 0.001) {
        currentFrameFloat += diff * lerp;
        renderFrame(currentFrameFloat);
        updateCaptions();
      }
    } catch (err) {
      console.error('Error in renderLoop:', err);
    }

    requestAnimationFrame(renderLoop);
  }

  function updateCaptions() {
    steps.forEach(({ el, min, max }) => {
      if (!el) return;
      const isActive = scrollProgress >= min && scrollProgress <= max;
      el.classList.toggle('active', isActive);
    });
  }

  /**
   * ==========================================================================
   * 4. FLOATING ROSE PETALS
   * ==========================================================================
   */
  function initPetals() {
    const pCanvas = document.getElementById('particles-canvas');
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    let w = (pCanvas.width = window.innerWidth);
    let h = (pCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      w = pCanvas.width = window.innerWidth;
      h = pCanvas.height = window.innerHeight;
    });

    const petals = [];
    for (let i = 0; i < 28; i++) {
      petals.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 7 + Math.random() * 9,
        vy: 0.5 + Math.random() * 1.0,
        vx: (Math.random() - 0.5) * 0.6,
        angle: Math.random() * 360,
        spin: (Math.random() - 0.5) * 1.2,
        opacity: 0.2 + Math.random() * 0.4,
        color: Math.random() > 0.5 ? '#fcd5ce' : '#f7d6e0'
      });
    }

    function draw() {
      pCtx.clearRect(0, 0, w, h);
      petals.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.angle += p.spin;

        if (p.y > h + 15) { p.y = -15; p.x = Math.random() * w; }
        if (p.x > w + 15) p.x = -15;
        if (p.x < -15) p.x = w + 15;

        pCtx.save();
        pCtx.translate(p.x, p.y);
        pCtx.rotate((p.angle * Math.PI) / 180);
        pCtx.globalAlpha = p.opacity;
        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.moveTo(0, 0);
        pCtx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size / 2, -p.size, 0, -p.size * 1.1);
        pCtx.bezierCurveTo(p.size / 2, -p.size, p.size / 2, -p.size / 2, 0, 0);
        pCtx.fill();
        pCtx.restore();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  // --- Initialize ---
  window.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initPetals();
    resizeCanvas();
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      resizeCanvas();
      onScroll();
    });

    requestAnimationFrame(renderLoop);
  });

})();
