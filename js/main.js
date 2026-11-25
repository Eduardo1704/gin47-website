/* Gin 47 — site behaviour.
   Every feature here has a job (see docs/ for the justification table):
   1 preloader (brand moment, once per visit)      7 menu filters (find a drink/dish fast)
   2 smooth scroll + reveals (exhibition pacing)    8 G&T anatomy scene (explain the 5 elements)
   3 header state + chapter progress (wayfinding)   9 gallery lightbox (see photos large)
   4 chapter index dialog (navigation)             10 open-now status (real hours, Mérida time)
   5 halftone dot hero (Of/Horse-style texture)    11 reservation form (validation + WhatsApp)
   The site is fully usable without JS: content, links, menu and video are plain HTML. */

/* ---------- Pure helpers (also tested in _src/tests.mjs with Node) ---------- */
const G47 = {
  // weekday 0=Sun..6=Sat, minutes since midnight in Mérida time
  openState(day, minutes) {
    const OPEN = 17 * 60;
    const closeAfterMidnight = (d) => (d >= 4 ? 120 : 30); // Thu–Sat until 2:00, Sun–Wed until 0:30
    if (minutes >= OPEN) return { open: true, until: closeAfterMidnight(day) };
    const prev = (day + 6) % 7;
    if (minutes < closeAfterMidnight(prev)) return { open: true, until: closeAfterMidnight(prev) };
    return { open: false, until: null };
  },

  // returns { field: message } for invalid fields; today = "YYYY-MM-DD" in Mérida, nowMin = minutes now
  validateReservation(v, today, nowMin) {
    const e = {};
    const name = (v.name || "").trim();
    if (name.length < 3) e.name = "Write your full name (at least 3 letters).";
    else if (!/^[\p{L}\s.'-]+$/u.test(name)) e.name = "Use letters only in your name.";

    const digits = (v.phone || "").replace(/\D/g, "");
    const okPhone = digits.length === 10 || (digits.length === 12 && digits.startsWith("52")) || (digits.length === 13 && digits.startsWith("521"));
    if (!digits) e.phone = "Write a phone number so the team can confirm.";
    else if (!okPhone) e.phone = "Use a 10-digit number, for example 999 123 4567.";

    const email = (v.email || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = "This email looks incomplete, for example name@mail.com.";

    if (!v.date) e.date = "Choose the date of your visit.";
    else if (v.date < today) e.date = "This date has already passed. Choose today or later.";
    else if (G47.daysBetween(today, v.date) > 60) e.date = "We take requests up to 60 days ahead.";

    if (!v.time) e.time = "Choose a time.";
    else if (v.date === today && G47.timeToMin(v.time) <= nowMin + 30) e.time = "That time is too soon today. Choose one at least 30 minutes from now.";

    const g = Number(v.guests);
    if (!Number.isInteger(g) || g < 1) e.guests = "Write how many people are coming (1 to 12).";
    else if (g > 12) e.guests = "For more than 12 people, please call +52 999 241 5334.";

    if (!v.age) e.age = "Please confirm the age statement.";
    return e;
  },

  timeToMin(label) { // "8:30 pm" -> 1230 ; "12:00 am" -> 1440 (end of the same night)
    const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(label.trim());
    if (!m) return NaN;
    let h = Number(m[1]) % 12;
    if (m[3].toLowerCase() === "pm") h += 12;
    else h += 24; // after-midnight slots belong to the same night
    return h * 60 + Number(m[2]);
  },

  daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 864e5); },

  fmtClose(min) { return min === 30 ? "12:30 am" : "2:00 am"; },
};
if (typeof module !== "undefined") module.exports = G47;

/* ---------- Browser behaviour ---------- */
if (typeof document !== "undefined") (() => {
  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  let lenis = null;

  /* Mérida clock (America/Merida, no DST) */
  function meridaNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Merida", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short",
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { date: `${parts.year}-${parts.month}-${parts.day}`, day: days[parts.weekday], minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
  }

  /* 1 — Preloader: "Opening the bar", once per browser session */
  const pre = $(".preloader");
  if (pre) {
    let seen = false;
    try { seen = sessionStorage.getItem("g47-opened") === "1"; } catch (_) { /* private mode */ }
    if (seen || reduce) pre.remove();
    else {
      const out = $("[data-count]", pre);
      const t0 = performance.now(), dur = 1500;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        out.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
        if (p < 1) requestAnimationFrame(tick);
        else { pre.classList.add("is-done"); setTimeout(() => pre.remove(), 900); }
      };
      requestAnimationFrame(tick);
      try { sessionStorage.setItem("g47-opened", "1"); } catch (_) { /* ignore */ }
    }
  }

  /* 2 — Smooth scroll (Lenis) synced with GSAP, and reveal-on-scroll */
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, anchors: { offset: -80 } });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const revealables = $$("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) revealables.forEach((el) => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    revealables.forEach((el) => io.observe(el));
  }
  // hero photo drifts slower than the page (depth), only with motion allowed
  if (hasGsap && !reduce) {
    $$(".hero").forEach((hero) => {
      gsap.to($(".hero__media", hero), { yPercent: 12, scale: 1.06, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      gsap.to($(".hero__content", hero), { opacity: 0, y: -40, ease: "none", scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true } });
    });
  }

  /* 3 — Header background + chapter progress line */
  const header = $(".site-header");
  const fill = $(".chapter-bar__fill");
  const onScroll = () => {
    const y = window.scrollY;
    header && header.classList.toggle("is-scrolled", y > 40);
    const max = root.scrollHeight - innerHeight;
    fill && fill.style.setProperty("--progress", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // header words roll letter by letter on hover (CSS); here: split them and bring them in on load
  $$("[data-roll]").forEach((el) => {
    const word = el.textContent.trim();
    const sr = d.createElement("span");
    sr.className = "visually-hidden";
    sr.textContent = word;
    const vis = d.createElement("span");
    vis.className = "roll";
    vis.setAttribute("aria-hidden", "true");
    [...word].forEach((ch, i) => {
      const c = d.createElement("span");
      c.className = "roll__ch";
      c.textContent = ch;
      c.dataset.ch = ch;
      c.style.setProperty("--i", i);
      vis.append(c);
    });
    el.replaceChildren(sr, vis);
  });
  if (hasGsap && !reduce) {
    gsap.from(".site-header .roll__ch", { yPercent: 110, duration: 0.8, ease: "power3.out", stagger: 0.035, delay: $(".preloader") ? 1.7 : 0.2, clearProps: "transform" });
  }
  // chapter number in the header rolls up when it changes
  const chapterNo = $("[data-chapter-no]");
  const setChapterNo = (label) => {
    if (!chapterNo || chapterNo.textContent === label) return;
    chapterNo.textContent = label;
    if (hasGsap && !reduce) gsap.fromTo(chapterNo, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out", overwrite: true });
  };

  /* 4 — Chapter index (native <dialog>: focus trap + Esc for free) */
  const idx = $("#chapter-index");
  const idxBtn = $('.menu-btn[aria-controls="chapter-index"]');
  if (idx && idxBtn && idx.showModal) {
    idxBtn.addEventListener("click", () => {
      idx.showModal();
      lenis && lenis.stop();
      if (hasGsap && !reduce) gsap.from($$(".index-list li", idx), { y: 24, opacity: 0, stagger: 0.05, duration: 0.6, ease: "power3.out" });
    });
    $("[data-close]", idx).addEventListener("click", () => idx.close());
    idx.addEventListener("close", () => lenis && lenis.start());
  }

  /* 5 — Halftone dot hero. The photo is masked through a grid of dots that
        swell under the pointer, like the dotted horse in the Of/Horse exhibition.
        No pixels are read, so it also works when the site is opened from file://. */
  const makeDots = (host, place, getImg) => {
    const canvas = d.createElement("canvas");
    canvas.className = "dots";
    canvas.setAttribute("aria-hidden", "true");
    place.after(canvas);
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1, gap = 9, px = -999, py = -999, tx = -999, ty = -999, visible = true, raf = 0;

    const size = () => {
      const r = host.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = canvas.width = Math.round(r.width * dpr);
      H = canvas.height = Math.round(r.height * dpr);
      gap = Math.max(8, r.width / 150) * dpr;
      draw(performance.now());
    };
    const draw = (t) => {
      const img = getImg();
      if (!img || !img.complete || !img.naturalWidth || !W) return;
      const ir = img.naturalWidth / img.naturalHeight, cr = W / H;
      let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
      if (ir > cr) { sw = sh * cr; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / cr; sy = (img.naturalHeight - sh) / 2; }
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      const base = gap * 0.32, lens = 180 * dpr, wave = reduce ? 0 : t / 1400;
      for (let y = gap / 2; y < H; y += gap) {
        for (let x = gap / 2; x < W; x += gap) {
          let r = base * (0.8 + 0.2 * Math.sin(wave + x * 0.004 + y * 0.006));
          const dx = x - px, dy = y - py, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < lens) r += (1 - dist / lens) * gap * 0.3;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      ctx.globalCompositeOperation = "source-atop"; // warm the dots toward the brand gold
      ctx.fillStyle = "rgba(201, 164, 92, 0.14)";
      ctx.fillRect(0, 0, W, H);
    };
    const loop = (t) => {
      px += (tx - px) * 0.12; py += (ty - py) * 0.12;
      if (canvas.style.opacity !== "0") draw(t); // skip frames while a timeline keeps it hidden
      raf = visible && !reduce && canvas.isConnected ? requestAnimationFrame(loop) : 0;
    };
    host.addEventListener("pointermove", (e) => {
      const r = host.getBoundingClientRect();
      tx = (e.clientX - r.left) * dpr; ty = (e.clientY - r.top) * dpr;
      if (px < -900) { px = tx; py = ty; }
    });
    host.addEventListener("pointerleave", () => { tx = ty = -999 * dpr; });
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf && !reduce && canvas.isConnected) raf = requestAnimationFrame(loop);
    }).observe(host);
    new ResizeObserver(size).observe(host);
    const first = getImg();
    (first && first.decode ? first.decode() : Promise.resolve()).catch(() => {}).then(size);
    return canvas;
  };
  $$(".has-dots [data-dots]").forEach((media) => {
    const img = $("img", media);
    makeDots(media.closest(".hero"), media, () => img);
  });

  /* 6 — Opening (index), after the Of/Horse exhibition: the bar room. Scrolling
        walks into the painting of the drinks, shows the presentation, keeps
        going into one glass, which becomes an anatomy plate (dots + labelled
        parts); then the seven chapters unfold one screen at a time. Without JS
        or with reduced motion the same markup reads as stacked static sections. */
  const expo = $("[data-expo]");
  if (expo && hasGsap) {
    gsap.matchMedia().add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 1000px)" }, (mq) => {
      if (!mq.conditions.motion) return;
      const wide = mq.conditions.wide;
      const room = $(".room", expo), frame = $(".room__frame", expo), pic = $("img", frame);
      const bar = $(".room__bar", expo), copy = $(".expo__copy", expo), lamps = $$(".room__lamp", expo);
      const veil = $(".expo__veil", expo), intro = $(".expo__intro", expo);
      const plate = $(".spec", expo), box = $(".spec__box", plate), plateMedia = $(".spec__media", plate), plateImg = $("img", plateMedia);
      const marks = $$(".mark", plate), parts = $$(".part", plate), lines = $$(".part__line", plate);
      const chapWrap = $(".expo__chapters", expo);
      const chaps = $$(".chap", expo);
      const media = chaps.map((c) => $(".chap__media", c));
      const bodies = chaps.map((c) => $(".chap__body", c));
      const imgs = media.map((m) => $("img", m));
      // the glass on the plate is this crop of the painting (source px); same numbers as _src/prep_images.py
      const SRC_W = 1536, GLASS = [950, 150, 1270, 870];
      const WALL = 4.7, START = 5.2, STEP = 1.8; // timeline units: room, presentation and plate end at WALL; chapter i starts at T(i)
      const T = (i) => START + i * STEP;
      const clampIdx = (i) => Math.max(0, Math.min(chaps.length - 1, i));
      let active = -1;
      expo.classList.add("is-live");
      [plateImg, ...imgs].forEach((im) => { im.loading = "eager"; });

      // cameras (transform-origin 0 0). offset* are layout sizes, so they ignore the transform already applied.
      const camFrame = () => {
        const W = room.offsetWidth, H = room.offsetHeight;
        const fx = frame.offsetLeft + frame.offsetWidth / 2, fy = frame.offsetTop + frame.offsetHeight / 2;
        const s = Math.max(W / pic.offsetWidth, H / pic.offsetHeight) * 1.01; // offset* are rounded, keep a margin
        return { x: W / 2 - s * fx, y: H / 2 - s * fy, s };
      };
      const glassScale = () => box.offsetHeight / ((GLASS[3] - GLASS[1]) * (pic.offsetWidth / SRC_W));
      // put the painted glass where the plate's glass sits, close enough that the painting still covers the
      // whole screen (the glass is right of centre, so at plate size its frame edge would show); f = how much
      // bigger than the plate that is, the plate starts at f and settles to 1
      const camGlass = () => {
        const W = room.offsetWidth, H = room.offsetHeight, pw = pic.offsetWidth, ph = pic.offsetHeight, k = pw / SRC_W;
        const fx = ((GLASS[0] + GLASS[2]) / 2) * k / pw, fy = ((GLASS[1] + GLASS[3]) / 2) * k / ph;
        const er = expo.getBoundingClientRect(), br = box.getBoundingClientRect(); // box scales from its centre
        const bx = br.left - er.left + br.width / 2, by = br.top - er.top + br.height / 2;
        const g = glassScale();
        const s = Math.max(g, bx / (fx * pw), (W - bx) / ((1 - fx) * pw), by / (fy * ph), (H - by) / ((1 - fy) * ph)) * 1.01;
        const gx = frame.offsetLeft + pic.offsetLeft + fx * pw, gy = frame.offsetTop + pic.offsetTop + fy * ph;
        return { x: bx - s * gx, y: by - s * gy, s, f: s / g };
      };
      gsap.set(room, { transformOrigin: "0 0" });

      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      // 1. into the painting
      tl.to(copy, { opacity: 0, y: -40, duration: 0.3 }, 0)
        .to(lamps, { opacity: 0, duration: 0.4 }, 0.1)
        .to(bar, { yPercent: 70, duration: 0.7, ease: "power1.in" }, 0)
        .fromTo(room, { x: 0, y: 0, scale: 1 },
          { x: () => camFrame().x, y: () => camFrame().y, scale: () => camFrame().s, duration: 1, ease: "power2.inOut", immediateRender: false }, 0)
      // 2. the presentation, over the dimmed painting
        .to(veil, { opacity: 0.74, duration: 0.3 }, 1)
        .fromTo(intro, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, immediateRender: false }, 1.1)
        .to(intro, { opacity: 0, y: -30, duration: 0.25 }, 1.8)
      // 3. closer, into one glass, which turns into the plate
        .to(veil, { opacity: 0, duration: 0.5 }, 2)
        .fromTo(room, { x: () => camFrame().x, y: () => camFrame().y, scale: () => camFrame().s },
          { x: () => camGlass().x, y: () => camGlass().y, scale: () => camGlass().s, duration: 0.7, ease: "power2.inOut", immediateRender: false }, 2)
        .set(box, { scale: () => camGlass().f }, 2.65)
        .to(plate, { opacity: 1, duration: 0.2 }, 2.7)
        .set(room, { opacity: 0 }, 2.9)
        .to(box, { scale: 1, duration: 0.25, ease: "power2.inOut" }, 2.9)
        .fromTo(plateImg, { opacity: 1 }, { opacity: 0.32, duration: 0.3, immediateRender: false }, 2.95)
        .fromTo($(".spec__head", plate), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25, immediateRender: false }, 2.95);
      const plateDots = makeDots(plateMedia, plateImg, () => plateImg);
      gsap.set(plateDots, { opacity: 0 });
      tl.to(plateDots, { opacity: 1, duration: 0.3 }, 3);
      // 4. the parts, one by one
      parts.forEach((p, j) => {
        const t = 3.15 + j * 0.25;
        tl.fromTo(marks[j], { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.15, immediateRender: false }, t)
          .fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, t + 0.05);
        if (wide) tl.fromTo(lines[j], { scaleX: 0 }, { scaleX: 1, duration: 0.2, immediateRender: false }, t);
        else if (j > 0) tl.to(parts[j - 1], { opacity: 0, duration: 0.1 }, t); // narrow: one caption at a time
      });
      // 5. the chapters hang in a gallery: step back from a painting, walk the wall, step into the next one
      const wall = d.createElement("div");
      wall.className = "wall";
      wall.setAttribute("aria-hidden", "true");
      const track = d.createElement("div");
      track.className = "wall__track";
      const paintings = chaps.map((c, i) => {
        const ex = d.createElement("div");
        ex.className = "exhibit";
        const fr = d.createElement("div");
        fr.className = "exhibit__frame gilt";
        const im = imgs[i].cloneNode();
        im.alt = "";
        im.removeAttribute("loading");
        fr.append(im);
        const label = d.createElement("p");
        label.className = "exhibit__label";
        label.textContent = `${String(i + 1).padStart(2, "0")} · ${$(".chap__head .eyebrow", c).textContent}`;
        ex.append(fr, label);
        track.append(ex);
        return im;
      });
      wall.append(track);
      const shade = d.createElement("div");
      shade.className = "wall__shade";
      chapWrap.prepend(wall, shade);

      // living wall: slow pools of warm light and tonic bubbles rising behind the paintings.
      // Bubbles drift with the camera (bigger ones faster), so the wall reads as depth, not a flat colour.
      const amb = d.createElement("canvas");
      amb.className = "wall__ambient";
      wall.prepend(amb);
      const actx = amb.getContext("2d");
      const bubbles = Array.from({ length: 70 }, () => ({
        x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 2.8, v: 0.012 + Math.random() * 0.03, a: 0.12 + Math.random() * 0.33, ph: Math.random() * 6.28,
      }));
      const POOLS = [[0.25, 0.35, 0.55, "rgba(201, 164, 92, 0.11)", 0.07], [0.75, 0.6, 0.6, "rgba(64, 120, 86, 0.17)", 0.05], [0.5, 0.2, 0.45, "rgba(240, 196, 120, 0.08)", 0.09]];
      let aw = 0, ah = 0, araf = 0, inView = true;
      const sizeAmb = () => { aw = amb.width = wall.offsetWidth; ah = amb.height = wall.offsetHeight; };
      const ambient = (now) => {
        araf = requestAnimationFrame(ambient);
        if (!inView || !(parseFloat(wall.style.opacity) > 0)) return;
        const s = now / 1000, cam = gsap.getProperty(track, "x");
        actx.clearRect(0, 0, aw, ah);
        POOLS.forEach(([bx, by, br, col, sp], k) => {
          const x = (bx + 0.12 * Math.sin(s * sp + k * 2)) * aw, y = (by + 0.1 * Math.cos(s * sp * 1.3 + k)) * ah, r = br * Math.max(aw, ah);
          const g = actx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, col);
          g.addColorStop(1, "rgba(0, 0, 0, 0)");
          actx.fillStyle = g;
          actx.fillRect(0, 0, aw, ah);
        });
        actx.lineWidth = 1;
        for (const b of bubbles) {
          const y = (((b.y - s * b.v) % 1) + 1) % 1 * ah;
          const x = ((((b.x * aw + cam * 0.06 * b.r + Math.sin(s * 0.8 + b.ph) * 6) % aw) + aw) % aw);
          actx.beginPath();
          actx.arc(x, y, b.r, 0, 6.283);
          actx.strokeStyle = `rgba(240, 214, 160, ${b.a})`;
          actx.stroke();
        }
      };
      const ambRO = new ResizeObserver(sizeAmb);
      ambRO.observe(wall);
      const ambIO = new IntersectionObserver(([en]) => { inView = en.isIntersecting; });
      ambIO.observe(expo);
      araf = requestAnimationFrame(ambient);

      // camera on painting i: close = in front of it, otherwise standing back so the neighbours show
      const at = (i, close) => {
        const im = paintings[i], fr = im.parentNode, ex = fr.parentNode;
        const W = wall.offsetWidth, H = wall.offsetHeight;
        const cx = ex.offsetLeft + fr.offsetLeft + im.offsetLeft + im.offsetWidth / 2;
        const cy = ex.offsetTop + fr.offsetTop + im.offsetTop + im.offsetHeight / 2;
        // close = the whole painting, frame included, as large as fits (no crop, no blow-up of the photo)
        const s = close ? Math.min((W * 0.9) / fr.offsetWidth, (H * 0.84) / fr.offsetHeight) : 0.72;
        return { x: W / 2 - s * cx - track.offsetLeft, y: H / 2 - s * cy - track.offsetTop, scale: s };
      };
      const cam = (i, close) => ({ x: () => at(i, close).x, y: () => at(i, close).y, scale: () => at(i, close).scale });
      const walk = (from, to, t, duration, ease) =>
        tl.fromTo(track, cam(...from), { ...cam(...to), duration, ease, immediateRender: false }, t);

      tl.to(plate, { opacity: 0, duration: 0.3 }, WALL)
        .set(track, cam(0, false), WALL)
        .to(wall, { opacity: 1, duration: 0.3 }, WALL + 0.05);
      chaps.forEach((c, i) => {
        const t = T(i);
        walk([i, false], [i, true], t, 0.45, "power2.inOut");
        tl.to(shade, { opacity: 1, duration: 0.2 }, t + 0.3)
          .fromTo(bodies[i], { opacity: 0 }, { opacity: 1, duration: 0.25, immediateRender: false }, t + 0.4);
        if (i === chaps.length - 1) return;
        tl.to(bodies[i], { opacity: 0, duration: 0.2 }, t + 1)
          .to(shade, { opacity: 0, duration: 0.2 }, t + 1);
        walk([i, true], [i, false], t + 1.15, 0.3, "power2.inOut");
        walk([i, false], [i + 1, false], t + 1.45, 0.35, "power1.inOut");
      });
      tl.to({}, { duration: 0.4 }); // hold on the last chapter before the page moves on

      const st = ScrollTrigger.create({
        trigger: expo, start: "top top", pin: true, scrub: 0.6, animation: tl, invalidateOnRefresh: true,
        end: () => "+=" + Math.round(tl.duration() * innerHeight * 0.65),
        onUpdate: (self) => {
          const time = self.progress * tl.duration();
          const cur = time < START + 0.3 ? -1 : clampIdx(Math.floor((time - START) / STEP));
          const rel = cur < 0 ? -1 : time - T(cur);
          const on = rel >= 0.4 && (rel <= 1.05 || cur === chaps.length - 1) ? cur : -1; // text is on screen
          if (on !== active) {
            active = on;
            chaps.forEach((c, k) => c.classList.toggle("is-active", k === on));
          }
          const label = cur < 0 ? "00" : String(cur + 1).padStart(2, "0");
          setChapterNo(label);
        },
        onLeave: () => setChapterNo("00"), // back in the opening chapter's own content
      });
      // keyboard: tabbing onto a chapter link jumps to that chapter so the focus is visible
      const onFocus = (e) => {
        const i = chaps.findIndex((c) => c.contains(e.target));
        if (i < 0 || active === i) return;
        const y = st.start + ((T(i) + 0.7) / tl.duration()) * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      };
      chapWrap.addEventListener("focusin", onFocus);
      // entrance, timed after the preloader
      const late = $(".preloader") ? 1.6 : 0.2;
      gsap.from([frame, ...$$(".room__arch", expo)], { opacity: 0, y: 24, duration: 1.4, ease: "power3.out", stagger: 0.12, delay: late });
      gsap.from(copy.children, { opacity: 0, y: 20, duration: 1, ease: "power3.out", stagger: 0.08, delay: late + 0.3 });

      return () => { // breakpoint or motion preference changed: gsap reverts the tweens, we undo the rest
        expo.classList.remove("is-live");
        chapWrap.removeEventListener("focusin", onFocus);
        chaps.forEach((c) => c.classList.remove("is-active"));
        [plateDots, wall, shade].forEach((el) => el.parentNode && el.parentNode.removeChild(el));
        setChapterNo("00");
        cancelAnimationFrame(araf);
        ambIO.disconnect();
        ambRO.disconnect();
      };
    });
  }

  /* 7 — Filters (cocktails by base, kitchen by course, gins by country) */
  const NOUN = { cocktails: "cocktails", kitchen: "items", library: "gins" };
  $$("[data-filter-group]").forEach((group) => {
    const name = group.dataset.filterGroup;
    const list = $(`[data-filter-list="${name}"]`);
    const status = $(`[data-filter-status="${name}"]`);
    const items = $$("[data-tags]", list);
    const chips = $$(".chip", group);
    group.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const f = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      let n = 0;
      const shown = [];
      items.forEach((it) => {
        const show = f === "all" || it.dataset.tags.split(" ").includes(f);
        it.hidden = !show;
        if (show) { n += Number(it.dataset.count || 1); shown.push(it); }
      });
      $$(".menu-block", list).forEach((b) => { b.hidden = !$$("[data-tags]", b).some((it) => !it.hidden); });
      status.textContent = f === "all" ? `Showing all ${n} ${NOUN[name]}.` : `Showing ${n} ${NOUN[name]}: ${chip.textContent.trim()}.`;
      if (hasGsap && !reduce) gsap.fromTo(shown, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.02, ease: "power2.out", clearProps: "all" });
      if (hasGsap) ScrollTrigger.refresh();
    });
  });

  /* 8 — Anatomy of a G&T: pinned scene on wide screens; plain list otherwise */
  const an = $("[data-anatomy]");
  if (an && hasGsap) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      const steps = $$(".anatomy__step", an);
      const rail = $$(".anatomy__rail button", an);
      const rings = $$(".anatomy__rings ellipse", an);
      const list = $(".anatomy__steps", an);
      an.classList.add("is-scene");
      list.setAttribute("aria-live", "polite");
      let cur = -1;
      const set = (i) => {
        if (i === cur) return;
        cur = i;
        steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
        rail.forEach((b, k) => (k === i ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current")));
        rings.forEach((r, k) => gsap.to(r, { opacity: k <= i ? 0.95 - k * 0.15 : 0, scale: k <= i ? 1 : 0.6, duration: 0.8, ease: "power3.out" }));
      };
      const st = ScrollTrigger.create({
        trigger: an, start: "top top", end: `+=${steps.length * 70}%`, pin: true,
        onUpdate: (self) => set(Math.min(steps.length - 1, Math.floor(self.progress * steps.length))),
      });
      set(0);
      const go = (i) => {
        const y = st.start + ((i + 0.5) / steps.length) * (st.end - st.start);
        lenis ? lenis.scrollTo(y) : window.scrollTo({ top: y });
      };
      rail.forEach((b, i) => b.addEventListener("click", () => go(i)));
      return () => { an.classList.remove("is-scene"); list.removeAttribute("aria-live"); steps.forEach((s) => s.classList.remove("is-active")); };
    });
  }

  /* 9 — Gallery lightbox */
  const lb = $("[data-lightbox]");
  const shots = $$("[data-gallery] .shot");
  if (lb && shots.length && lb.showModal) {
    const big = $("[data-lightbox-img]", lb);
    const cap = $("[data-lightbox-caption]", lb);
    let at = 0;
    const show = (i) => {
      at = (i + shots.length) % shots.length;
      const im = $("img", shots[at]);
      big.src = im.currentSrc || im.src;
      big.width = im.width; big.height = im.height;
      big.alt = im.alt;
      cap.textContent = `${at + 1} / ${shots.length} — ${$(".shot__cap", shots[at]).textContent}`;
    };
    shots.forEach((s, i) => s.addEventListener("click", () => { show(i); lb.showModal(); lenis && lenis.stop(); }));
    $("[data-lightbox-prev]", lb).addEventListener("click", () => show(at - 1));
    $("[data-lightbox-next]", lb).addEventListener("click", () => show(at + 1));
    $("[data-lightbox-close]", lb).addEventListener("click", () => lb.close());
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(at - 1);
      if (e.key === "ArrowRight") show(at + 1);
    });
    lb.addEventListener("close", () => lenis && lenis.start());
  }

  /* 10 — Open-now status and today's row in the hours table */
  const now = meridaNow();
  const state = G47.openState(now.day, now.minutes);
  $$("[data-open-status]").forEach((el) => {
    el.classList.toggle("is-open", state.open);
    el.textContent = state.open ? `Open now · until ${G47.fmtClose(state.until)}` : "Closed now · opens at 5:00 pm";
  });
  $$(`[data-hours] [data-days="${now.day}"]`).forEach((row) => {
    row.classList.add("is-today");
    $("dt", row).insertAdjacentHTML("beforeend", ' <span class="visually-hidden">(today)</span>');
  });

  /* 11 — Reservation form: validate, then hand off to WhatsApp */
  const form = $("[data-reserve-form]");
  if (form) {
    const WA = "529992415334";
    const summary = $("[data-form-summary]");
    const success = $("[data-form-success]");
    const dateIn = $("#f-date", form);
    dateIn.min = now.date;
    const max = new Date(Date.parse(now.date) + 60 * 864e5).toISOString().slice(0, 10);
    dateIn.max = max;
    let tried = false;

    const el = form.elements; // not form.name: that is the form's own name attribute
    const values = () => ({
      name: el.name.value, phone: el.phone.value, email: el.email.value, date: el.date.value,
      time: el.time.value, guests: el.guests.value, occasion: el.occasion.value, notes: el.notes.value, age: el.age.checked,
    });
    const LABELS = { name: "Full name", phone: "Mobile phone", email: "Email", date: "Date", time: "Time", guests: "Guests", age: "Age confirmation" };
    const paint = (errors) => {
      Object.keys(LABELS).forEach((k) => {
        const input = form.elements[k];
        const out = $(`#f-${k}-err`, form);
        if (errors[k]) { input.setAttribute("aria-invalid", "true"); out.textContent = errors[k]; }
        else { input.removeAttribute("aria-invalid"); out.textContent = ""; }
      });
    };
    const check = () => { const n = meridaNow(); return G47.validateReservation(values(), n.date, n.minutes); };

    form.addEventListener("input", () => { if (tried) paint(check()); });
    form.addEventListener("change", () => { if (tried) paint(check()); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      tried = true;
      const errors = check();
      paint(errors);
      const keys = Object.keys(errors);
      if (keys.length) {
        success.hidden = true;
        $("[data-error-count]", summary).textContent = keys.length === 1 ? "this field" : `these ${keys.length} fields`;
        $("[data-error-list]", summary).innerHTML = keys.map((k) => `<li><a href="#f-${k}">${LABELS[k]}: ${errors[k]}</a></li>`).join("");
        summary.hidden = false;
        summary.focus();
        return;
      }
      summary.hidden = true;
      const v = values();
      const nice = new Date(`${v.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const lines = [
        "Hello Gin 47! I would like to request a table.",
        `Name: ${v.name.trim()}`, `Date: ${nice}`, `Time: ${v.time}`, `Guests: ${v.guests}`,
        v.occasion && `Occasion: ${v.occasion}`, `Phone: ${v.phone.trim()}`, v.email.trim() && `Email: ${v.email.trim()}`,
        v.notes.trim() && `Notes: ${v.notes.trim()}`,
      ].filter(Boolean);
      const url = `https://wa.me/${WA}?text=${encodeURIComponent(lines.join("\n"))}`;
      $("[data-wa-fallback]", success).href = url;
      success.hidden = false;
      success.focus();
      window.open(url, "_blank", "noopener");
    });
  }

  if (hasGsap) addEventListener("load", () => ScrollTrigger.refresh());
})();
