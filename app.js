/**
 * ============================================================================
 * MAISON DE BLOOM — ULTRA-LITE SMOOTH CLOUDINARY VIDEO SCROLL ENGINE
 * 100% Focused on buttery 60-120 FPS video walkthrough experience
 * ============================================================================
 */

(function () {
  'use strict';

  // DOM Elements
  const video = document.getElementById('scroll-video');
  const preloader = document.getElementById('preloader');
  const progressFill = document.getElementById('progress-fill');
  const loadPercentage = document.getElementById('load-percentage');

  const steps = [
    { el: document.getElementById('step-0'), min: 0, max: 0.14 },
    { el: document.getElementById('step-1'), min: 0.18, max: 0.38 },
    { el: document.getElementById('step-2'), min: 0.42, max: 0.62 },
    { el: document.getElementById('step-3'), min: 0.66, max: 0.84 },
    { el: document.getElementById('step-4'), min: 0.88, max: 1.0 }
  ];

  let scrollProgress = 0;
  let targetTime = 0;
  let currentTime = 0;
  let isVideoReady = false;
  let isSeeking = false;

  /**
   * ==========================================================================
   * 1. VIDEO PRELOADER & INITIALIZATION
   * ==========================================================================
   */
  function initVideo() {
    if (!video) return;

    video.pause();
    video.muted = true;

    // Fast buffer tracking
    function updateBufferProgress() {
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const pct = Math.min(100, Math.round((bufferedEnd / video.duration) * 100));
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (loadPercentage) loadPercentage.textContent = `Loading Sanctuary... ${pct}%`;
      }
    }

    function onVideoReady() {
      if (isVideoReady) return;
      isVideoReady = true;
      if (progressFill) progressFill.style.width = '100%';
      if (loadPercentage) loadPercentage.textContent = 'Sanctuary Ready';
      if (preloader) {
        setTimeout(() => {
          preloader.classList.add('fade-out');
        }, 150);
      }
      onScroll();
    }

    video.addEventListener('progress', updateBufferProgress, { passive: true });
    video.addEventListener('loadeddata', () => {
      updateBufferProgress();
      onVideoReady();
    }, { once: true });
    video.addEventListener('canplay', onVideoReady, { once: true });
    video.addEventListener('canplaythrough', onVideoReady, { once: true });

    // Track seeking state for hardware decoder optimization
    video.addEventListener('seeking', () => { isSeeking = true; }, { passive: true });
    video.addEventListener('seeked', () => {
      isSeeking = false;
      // Immediately apply latest target if user moved significantly while seeking
      if (Math.abs(video.currentTime - currentTime) > 0.02) {
        video.currentTime = currentTime;
      }
    }, { passive: true });

    // Fallback: If video is already cached or ready
    if (video.readyState >= 2) {
      onVideoReady();
    } else {
      setTimeout(onVideoReady, 3000);
    }
  }

  /**
   * ==========================================================================
   * 2. SCROLL CALCULATOR
   * ==========================================================================
   */
  function onScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    let progress = scrollY / maxScroll;
    progress = Math.max(0, Math.min(1, progress));
    scrollProgress = progress;

    const duration = (video && video.duration && !isNaN(video.duration)) ? video.duration : 7.25;
    targetTime = progress * duration;
  }

  /**
   * ==========================================================================
   * 3. ULTRA-SMOOTH RAF RENDER LOOP (60-120 FPS ADAPTIVE LERP)
   * ==========================================================================
   */
  let lastTime = performance.now();
  function renderLoop(now) {
    try {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Exponential damping for silky smooth motion
      const lerpSpeed = 1 - Math.exp(-16 * dt);
      const diff = targetTime - currentTime;

      if (Math.abs(diff) > 0.0005) {
        currentTime += diff * lerpSpeed;
        if (video && video.readyState >= 1 && !isSeeking) {
          if ('fastSeek' in video) {
            video.fastSeek(currentTime);
          } else {
            video.currentTime = currentTime;
          }
        }
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
   * 4. AMBIENT ROSE PETAL PARTICLES
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
    }, { passive: true });

    const petals = [];
    for (let i = 0; i < 26; i++) {
      petals.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 7 + Math.random() * 8,
        vy: 0.5 + Math.random() * 0.9,
        vx: (Math.random() - 0.5) * 0.5,
        angle: Math.random() * 360,
        spin: (Math.random() - 0.5) * 1.0,
        opacity: 0.25 + Math.random() * 0.35,
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
    initVideo();
    initPetals();
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    requestAnimationFrame(renderLoop);
  });

})();
