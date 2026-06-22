/* ================================================================
   BIRTHDAY WEBSITE — app.js
   6 Slides: Hero → Swipe Cards → Envelope → Parallax → Scatter → Closing
   ================================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ============================================================
     1. MUSIC BOX — Web Audio API (A Song for Mama melody)
     ============================================================ */
  class MusicBox {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.isPlaying = false;
      this.isMuted = false;
      this.timeoutIds = [];
      this.tempo = 82; // BPM (A Song for Mama slow ballad)

      // A Song for Mama by Boyz II Men (Chorus Melody)
      this.melody = [
        ["F4", 1.0], ["F4", 1.0], ["G4", 1.0], ["F4", 1.0],
        ["G4", 0.5], ["A4", 0.5], ["Bb4", 1.0], ["A4", 0.5], ["G4", 0.5], ["F4", 2.0],
        ["F4", 1.0], ["G4", 1.0], ["A4", 1.0], ["G4", 0.5], ["F4", 0.5], ["D4", 1.0], ["C4", 1.0], ["C4", 2.0],
        ["C4", 1.0], ["F4", 1.0], ["G4", 1.0], ["A4", 0.5], ["G4", 0.5], ["F4", 1.0], ["G4", 1.0], ["G4", 2.0],
        ["F4", 1.0], ["G4", 1.0], ["A4", 1.0], ["Bb4", 0.5], ["A4", 0.5], ["G4", 1.0], ["F4", 0.5], ["G4", 0.5], ["F4", 3.0]
      ];

      this.freq = {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16,
        C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
      };

      // HTML5 Audio fallbacks
      this.audio = document.getElementById("bg-audio");
      this.useMP3 = false;
    }

    _initSynth() {
      if (this.ctx) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.07;
      this.masterGain.connect(this.ctx.destination);
    }

    start() {
      if (this.isPlaying) return;

      // Synchronously initialize and resume AudioContext during user gesture
      // to guarantee AudioContext is unlocked for any future async fallbacks
      this._initSynth();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      
      this.isPlaying = true;

      // Try playing the MP3 source if it is available
      if (this.audio) {
        this.audio.volume = this.isMuted ? 0 : 0.25;
        this.audio.play()
          .then(() => {
            this.useMP3 = true;
          })
          .catch((err) => {
            console.log("Audio file play failed, using Web Audio synth fallback:", err);
            this.useMP3 = false;
            this._startSynth();
          });
      } else {
        this._startSynth();
      }
    }

    _startSynth() {
      this._initSynth();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this._schedule();
    }

    _playNote(freq, startTime, dur) {
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "triangle";
      osc2.type = "sine";
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 2;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, startTime);
      g.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.06, startTime + 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc1.connect(g); osc2.connect(g); g.connect(this.masterGain);
      osc1.start(startTime); osc1.stop(startTime + dur);
      osc2.start(startTime); osc2.stop(startTime + dur);
    }

    _schedule() {
      const beatSec = 60 / this.tempo;
      let t = 0.15;

      this.melody.forEach(([note, beats]) => {
        const absTime = this.ctx.currentTime + t;
        const dur = beats * beatSec;
        const id = setTimeout(() => {
          if (this.isPlaying && this.freq[note] && !this.useMP3) {
            this._playNote(this.freq[note], absTime, dur * 0.93);
          }
        }, t * 1000);
        this.timeoutIds.push(id);
        t += dur;
      });

      // Loop after total duration
      const loopId = setTimeout(() => {
        if (this.isPlaying && !this.useMP3) this._schedule();
      }, t * 1000);
      this.timeoutIds.push(loopId);
    }

    setMute(muted) {
      this.isMuted = muted;
      if (this.useMP3 && this.audio) {
        this.audio.volume = muted ? 0 : 0.25;
      } else if (this.masterGain && this.ctx) {
        this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.07, this.ctx.currentTime + 0.2);
      }
    }

    playChime() {
      if (!this.ctx) {
        try {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
          return;
        }
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      
      const chimes = [[523.25,0],[659.25,0.09],[783.99,0.18],[1046.5,0.27]];
      chimes.forEach(([freq, delay]) => {
        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.12, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        osc.connect(g); 
        g.connect(this.masterGain || this.ctx.destination);
        osc.start(now); 
        osc.stop(now + 0.75);
      });
    }
  }

  const music = new MusicBox();

  // Mute button
  const muteBtn   = document.getElementById("mute-btn");
  const iconOn    = muteBtn.querySelector(".icon-unmuted");
  const iconOff   = muteBtn.querySelector(".icon-muted");

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    music.start(); // init if first press
    music.setMute(!music.isMuted);
    if (music.isMuted) {
      iconOn.style.display = "none";
      iconOff.style.display = "block";
    } else {
      iconOn.style.display = "block";
      iconOff.style.display = "none";
    }
  });


  /* ============================================================
     2. SLIDE ENGINE
     ============================================================ */
  const sections = Array.from(document.querySelectorAll(".section"));
  const TOTAL    = sections.length; // 6
  let current    = 0;

  const navControls = document.getElementById("nav-controls");
  const btnPrev     = document.getElementById("btn-prev");
  const btnNext     = document.getElementById("btn-next");
  const dotsContainer = document.getElementById("nav-dots");

  // Build dots
  sections.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "nav-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Halaman ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function updateDots(idx) {
    document.querySelectorAll(".nav-dot").forEach((d, i) => {
      d.classList.toggle("active", i === idx);
    });
  }

  function goTo(idx) {
    if (idx < 0 || idx >= TOTAL || idx === current) return;
    const prev = current;
    current = idx;

    // Fade out old
    sections[prev].classList.remove("active");

    // Fade in new
    sections[current].classList.add("active");

    updateDots(current);
    updateNav();
    onSlideEnter(current);
  }

  function updateNav() {
    // Hide nav on hero, show otherwise
    if (current === 0) {
      navControls.classList.remove("visible");
    } else {
      navControls.classList.add("visible");
    }

    // Prev button disabled on first non-hero slide
    btnPrev.style.opacity = current <= 1 ? "0.45" : "1";
    btnPrev.style.pointerEvents = current <= 1 ? "none" : "auto";

    // Next button label changes on last slide
    btnNext.textContent = current === TOTAL - 1 ? "Ulangi ♥" : "Lanjut ♥";
  }

  btnNext.addEventListener("click", () => {
    if (current === TOTAL - 1) { goTo(0); }
    else { goTo(current + 1); }
  });

  btnPrev.addEventListener("click", () => goTo(current - 1));

  // Hero click → advance to slide 1
  sections[0].addEventListener("click", (e) => {
    if (!e.target.closest("#mute-btn")) goTo(1);
  });

  // Initialise first slide
  sections[0].classList.add("active");
  updateNav();


  /* ============================================================
     3. LOADER & GIFT BOX OPENING SCREEN
     ============================================================ */
  const loader = document.getElementById("loader");
  const openingScreen = document.getElementById("gift-opening-screen");
  const mainGiftBox = document.getElementById("main-gift-box");

  // Create ambient background sparkles on opening screen
  function createOpeningSparkles() {
    const container = document.getElementById("opening-sparkles");
    if (!container) return;
    for (let i = 0; i < 40; i++) {
      const sp = document.createElement("span");
      sp.style.position = "absolute";
      sp.style.width = `${Math.random() * 4 + 2}px`;
      sp.style.height = sp.style.width;
      sp.style.background = Math.random() > 0.5 ? "#D4AF37" : "#FFFFFF";
      sp.style.borderRadius = "50%";
      sp.style.left = `${Math.random() * 100}%`;
      sp.style.top = `${Math.random() * 100}%`;
      sp.style.opacity = Math.random() * 0.6 + 0.1;
      
      gsap.to(sp, {
        opacity: Math.random() * 0.9 + 0.1,
        duration: 1 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      container.appendChild(sp);
    }
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      loader.classList.add("hidden");
      createOpeningSparkles();
      
      // Floating animation for the gift box
      gsap.to(".gift-box-wrapper", {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }, 1000);
  });

  let boxOpened = false;
  if (mainGiftBox) {
    mainGiftBox.addEventListener("click", () => {
      if (boxOpened) return;
      boxOpened = true;
      
      // Start background music and play opening chime synchronously inside user gesture
      music.start();
      music.playChime();
      
      // Confetti splash from center
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#D4AF37", "#4A1521", "#FAF6F0", "#e2583e"]
      });

      // Box lid flies off
      gsap.to(".gift-box-lid", {
        y: -240,
        rotation: 40,
        scale: 0.8,
        opacity: 0,
        duration: 1.1,
        ease: "power2.out"
      });
      
      // Bow loops split
      gsap.to(".bow-loop", {
        scale: 0,
        opacity: 0,
        duration: 0.6
      });

      // Box body expands and fades
      gsap.to(".gift-box-body", {
        scale: 2.2,
        opacity: 0,
        duration: 0.9,
        delay: 0.15,
        ease: "power2.inOut"
      });

      // Fade out opening screen, then start hero page
      gsap.to(openingScreen, {
        opacity: 0,
        duration: 0.8,
        delay: 0.45,
        onComplete: () => {
          openingScreen.style.display = "none";
          
          // Trigger Hero intro animations
          gsap.fromTo(".reveal-line", 
            { y: 45, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, stagger: 0.28, ease: "power3.out" }
          );
          gsap.fromTo(".hero-scroll-hint", 
            { opacity: 0, y: -12 },
            { opacity: 1, y: 0, duration: 0.8, delay: 1.2 }
          );
          
          // Start music context & playback
          tryStartMusic();
        }
      });
    });
  }


  /* ============================================================
     4. SLIDE-SPECIFIC ANIMATIONS
     ============================================================ */
  function onSlideEnter(idx) {
    if (idx === 3) {
      // Parallax: slow Ken Burns
      gsap.fromTo("#parallax-bg",
        { scale: 1.12, yPercent: 0 },
        { scale: 1.02, yPercent: 4, duration: 8, ease: "power1.out" }
      );
      gsap.fromTo(".parallax-quote",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.1, delay: 0.25 }
      );
    }
    if (idx === 4) {
      scatterDrop();
    }
    if (idx === 5) {
      startHearts();
    }
  }


  /* ============================================================
     5. SWIPER — Slide 1
     ============================================================ */
  const cardSwiper = new Swiper("#card-swiper", {
    effect: "cards",
    grabCursor: true,
    perSlideOffset: 8,
    perSlideRotate: 3,
    slideShadows: true,
    on: {
      slideChange() {
        confetti({
          particleCount: 18,
          spread: 50,
          origin: { y: 0.65 },
          colors: ["#D4AF37","#4A1521","#FAF6F0"]
        });
      }
    }
  });


  /* ============================================================
     6. ENVELOPE — Slide 2
     ============================================================ */
  const envelope  = document.getElementById("gift-envelope");
  let envOpened   = false;

  envelope.addEventListener("click", () => {
    if (envOpened) return;
    envOpened = true;
    envelope.classList.add("open");

    // Confetti rain
    const end = Date.now() + 2400;
    const iv = setInterval(() => {
      if (Date.now() > end) return clearInterval(iv);
      const p = Math.round(35 * ((end - Date.now()) / 2400));
      confetti({ particleCount: p, startVelocity: 28, spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.1 },
        colors: ["#D4AF37","#E2583E","#FAF6F0","#6A2B39"]
      });
    }, 220);
  });

  // Zoom Letter modal logic
  const letterModal = document.getElementById("letter-overlay-modal");
  const letterClose = document.getElementById("letter-close");
  const giftLetter  = document.getElementById("gift-letter");

  if (giftLetter) {
    giftLetter.addEventListener("click", (e) => {
      if (!envOpened) return; // Only allow when envelope is opened
      e.stopPropagation();
      
      // Open the letter modal
      letterModal.classList.add("active");
      letterModal.setAttribute("aria-hidden", "false");
      
      // Play a lovely chime
      music.playChime();
    });
  }

  if (letterClose) {
    letterClose.addEventListener("click", (e) => {
      e.stopPropagation();
      letterModal.classList.remove("active");
      letterModal.setAttribute("aria-hidden", "true");
    });
  }

  if (letterModal) {
    letterModal.addEventListener("click", (e) => {
      if (e.target === letterModal) {
        letterModal.classList.remove("active");
        letterModal.setAttribute("aria-hidden", "true");
      }
    });
  }


  /* ============================================================
     7. POLAROID SCATTER — Slide 4
     ============================================================ */
  const scatterData = [
    { src:"img/mamabahagia.png", label:"Mama bahagia" },
    { src:"img/hangatcinta.png", label:"Hangatnya cinta" },
    { src:"img/candatawa.png", label:"Canda tawa kami" },
    { src:"img/langkahbersama.png", label:"Langkah bersama" },
    { src:"img/selaludihati.png", label:"Selalu di hati" }
  ];

  const stage = document.getElementById("scatter-container");
  const scatterItems = [];

  // Layout positions (% of 480px stage width, absolute)
  const positions = [
    { l:2,   rot:-18 },
    { l:20,  rot: 12 },
    { l:38,  rot:-8  },
    { l:56,  rot: 15 },
    { l:38,  rot:-20 }
  ];

  scatterData.forEach((d, i) => {
    const el = document.createElement("div");
    el.className = "scatter-item";
    el.style.left  = `${positions[i].l}%`;
    el.style.top   = "-200px";
    el.style.zIndex = i + 10;
    el.innerHTML = `
      <div class="scatter-img-wrap">
        <img src="${d.src}" alt="${d.label}" loading="lazy">
      </div>
      <p class="scatter-caption">${d.label}</p>
    `;
    stage.appendChild(el);
    scatterItems.push({ el, rot: positions[i].rot });
    makeDraggable(el);
  });

  let scatterDropped = false;

  function scatterDrop() {
    if (scatterDropped) return;
    scatterDropped = true;

    const tops = [30, 60, 100, 50, 190];

    scatterItems.forEach(({ el, rot }, i) => {
      gsap.to(el, {
        top: tops[i],
        rotation: rot,
        duration: 1.3 + i * 0.18,
        delay: i * 0.08,
        ease: "bounce.out"
      });
    });
  }

  function makeDraggable(el) {
    let dragging = false, ox = 0, oy = 0, ix = 0, iy = 0;

    const getXY = (e) => e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];

    const start = (e) => {
      dragging = true;
      el.style.zIndex = 500;
      [ox, oy] = getXY(e);

      // Read current GSAP translate
      const mtx = new DOMMatrix(window.getComputedStyle(el).transform);
      ix = mtx.m41; iy = mtx.m42;

      document.addEventListener("mousemove", move);
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("mouseup", end);
      document.addEventListener("touchend", end);
    };

    const move = (e) => {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      const [cx, cy] = getXY(e);
      const mtx = new DOMMatrix(window.getComputedStyle(el).transform);
      const rot = Math.round(Math.atan2(mtx.b, mtx.a) * 180 / Math.PI);
      el.style.transform = `translate(${ix + cx - ox}px, ${iy + cy - oy}px) rotate(${rot}deg)`;
    };

    const end = () => {
      dragging = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("mouseup", end);
      document.removeEventListener("touchend", end);
    };

    el.addEventListener("mousedown", start);
    el.addEventListener("touchstart", start, { passive: true });
  }


  /* ============================================================
     8. CLOSING HEARTS — Slide 5
     ============================================================ */
  const heartsContainer = document.getElementById("hearts-container");
  const heartSymbols = ["♥","💖","💕","🌸","🌹"];
  let heartInterval = null;

  function startHearts() {
    if (heartInterval) return;
    heartInterval = setInterval(() => {
      if (current !== 5) return;
      const el = document.createElement("span");
      el.className = "rising-heart";
      el.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
      const dur = 4 + Math.random() * 5;
      el.style.cssText = `
        left: ${Math.random() * 100}%;
        bottom: -24px;
        font-size: ${0.6 + Math.random() * 1.4}rem;
        opacity: ${0.3 + Math.random() * 0.6};
        animation-duration: ${dur}s;
      `;
      heartsContainer.appendChild(el);
      setTimeout(() => el.remove(), dur * 1000);
    }, 650);
  }


  /* ============================================================
     9. EASTER EGG — Candle + Surprise
     ============================================================ */
  const easterBtn     = document.getElementById("easter-egg-trigger");
  const modal         = document.getElementById("easter-egg-modal");
  const modalClose    = document.getElementById("modal-close");
  const flame         = document.getElementById("candle-flame");
  const glowRing      = document.querySelector(".candle-glow-ring");
  const candleHint    = document.getElementById("candle-hint");
  const candleView    = document.getElementById("modal-candle-view");
  const wishView      = document.getElementById("modal-wish-view");
  const starrySky     = document.getElementById("modal-starry-sky");
  const lampionsBox   = document.getElementById("modal-lampions");
  const smokeBox      = document.getElementById("smoke-container");

  // CANVAS PARTICLE SYSTEM
  const canvas = document.getElementById("magic-particles-canvas");
  let ctx = null;
  if (canvas) ctx = canvas.getContext("2d");
  let particles = [];
  let animId = null;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class Sparkle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 4 + 2;
      this.vx = (Math.random() - 0.5) * 6;
      this.vy = -Math.random() * 7 - 3;
      this.alpha = 1;
      this.decay = Math.random() * 0.015 + 0.006;
      const colors = ["#D4AF37", "#FFFFFF", "#E8728C", "#FFD700", "#FFD2D7"];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.04; // gravity curve
      this.alpha -= this.decay;
    }
    draw() {
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnStardust(x, y, count) {
    for (let i = 0; i < count; i++) {
      particles.push(new Sparkle(x, y));
    }
    if (!animId) animate();
  }

  function animate() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.alpha <= 0) particles.splice(i, 1);
    }
    if (particles.length > 0) {
      animId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // CSS Smoke Generator
  function spawnSmoke() {
    if (!smokeBox) return;
    smokeBox.innerHTML = "";
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        if (!candleBlown) return;
        const p = document.createElement("div");
        p.className = "smoke-particle";
        const wind = (Math.random() - 0.5) * 32;
        p.style.setProperty("--wind", `${wind}px`);
        p.style.left = `${38 + Math.random() * 24}%`;
        p.style.animationDelay = `${i * 0.08}s`;
        smokeBox.appendChild(p);
        setTimeout(() => p.remove(), 1600);
      }, i * 65);
    }
  }

  // Floating Lampions Generator
  let lampionInterval = null;
  function startLampions() {
    if (!lampionsBox) return;
    lampionsBox.innerHTML = "";
    if (lampionInterval) clearInterval(lampionInterval);
    
    lampionInterval = setInterval(() => {
      if (!modal.classList.contains("active")) {
        clearInterval(lampionInterval);
        return;
      }
      const lamp = document.createElement("div");
      lamp.className = "lampion";
      lamp.style.left = `${Math.random() * 88 + 6}%`;
      lamp.style.animationDuration = `${6 + Math.random() * 5}s`;
      const scale = 0.55 + Math.random() * 0.6;
      lamp.style.transform = `scale(${scale})`;
      lampionsBox.appendChild(lamp);
      setTimeout(() => lamp.remove(), 11000);
    }, 750);
  }

  let candleBlown = false;

  function openModal() {
    candleBlown = false;
    resizeCanvas();
    if (flame)       flame.classList.remove("blown");
    if (glowRing)    glowRing.style.opacity = "1";
    if (candleHint)  candleHint.textContent = "Ketuk api lilin untuk meniupnya & buat permohonan... 🎂";
    if (candleView)  { candleView.style.display = "flex"; gsap.set(candleView, { opacity: 1 }); }
    if (wishView)    wishView.classList.remove("visible");
    if (starrySky)   starrySky.classList.remove("active");
    if (lampionsBox) lampionsBox.innerHTML = "";
    if (smokeBox)    smokeBox.innerHTML = "";
    particles = [];
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);

    modal.setAttribute("aria-hidden","false");
    modal.classList.add("active");

    confetti({ particleCount: 35, spread: 55, origin: { y: 0.75 }, colors: ["#D4AF37","#4A1521","#FAF6F0"] });
  }

  function blowCandle() {
    if (candleBlown) return;
    candleBlown = true;

    // Visual blowout
    if (flame) flame.classList.add("blown");
    if (glowRing) glowRing.style.opacity = "0";
    if (candleHint) candleHint.textContent = "Permohonan Mama sedang dikirim... 💖";

    // Play chime sound
    music.playChime();

    // Trigger shake on modal box
    const modalBox = document.querySelector(".modal-box");
    if (modalBox) {
      modalBox.classList.add("shake");
      setTimeout(() => modalBox.classList.remove("shake"), 600);
    }

    // Spawn Smoke Particles
    spawnSmoke();

    // Spawn magical canvas stardust from flame position
    if (flame) {
      const rect = flame.getBoundingClientRect();
      const fx = rect.left + rect.width / 2;
      const fy = rect.top + rect.height / 2;
      spawnStardust(fx, fy, 100);
    }

    // Activate dark starry sky
    if (starrySky) starrySky.classList.add("active");

    // Float lampions upwards
    startLampions();

    // Staggered fireworks confetti
    const endTime = Date.now() + 3500;
    const fwIv = setInterval(() => {
      if (Date.now() > endTime) return clearInterval(fwIv);
      confetti({
        particleCount: 8,
        startVelocity: 32,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.15 },
        colors: ["#D4AF37","#E2583E","#FAF6F0","#6A2B39"]
      });
    }, 160);

    // Transition to final wish view card
    setTimeout(() => {
      gsap.to(candleView, {
        opacity: 0, 
        duration: 0.45,
        onComplete: () => {
          candleView.style.display = "none";
          wishView.classList.add("visible");
          
          // Animate wish view components in smoothly
          gsap.fromTo(wishView, 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" }
          );
          
          // Confetti blast on final reveal
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.65 },
            colors: ["#D4AF37","#E8728C","#FFFFFF"]
          });
        }
      });
    }, 1500);
  }

  easterBtn.addEventListener("click", openModal);
  if (flame) flame.addEventListener("click", blowCandle);

  // Allow tapping the whole candle area as fallback
  const candleScene = document.querySelector(".candle-scene");
  if (candleScene) candleScene.addEventListener("click", blowCandle);

  function closeModal() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden","true");
    if (lampionInterval) clearInterval(lampionInterval);
    if (animId) cancelAnimationFrame(animId);
  }

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

}); // end DOMContentLoaded
