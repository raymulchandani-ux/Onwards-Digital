/* ─────────────────────────────────────────────────────────────
   Onwards Digital — ready-made site builder (ready-made.html)
   Left: the live site. Right: one dropdown per part of the site.
   Everything the customer picks lives in `state`; SITEGEN turns
   it into the preview, the thumbnails and the finished file.
   ───────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  var G = window.SITEGEN, root = document.getElementById("builder");
  if (!G || !root) return;
  var LS = "onwards-builder-v1";

  /* ── State ─────────────────────────────────────────────── */
  var state;
  try { state = JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { state = null; }
  if (!state || !state.theme || !state.img) state = G.defaults("restaurant");
  var blobs = {};            // blob: URL -> Blob, for photos the customer uploads
  var page = "home", device = window.innerWidth < 760 ? "phone" : "laptop";

  function save() {
    try {
      var c = JSON.parse(JSON.stringify(state)), p = G.PRESETS[c.preset] || G.PRESETS.restaurant;
      ["hero", "x1", "x2", "about"].forEach(function (k) { if (/^blob:/.test(c.img[k])) c.img[k] = p.img[k]; });
      c.img.g = c.img.g.map(function (u, i) { return /^blob:/.test(u) ? p.img.g[i] : u; });
      localStorage.setItem(LS, JSON.stringify(c));
    } catch (e) {}
  }

  /* ── Tiny DOM helpers ──────────────────────────────────── */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === "class") el.className = v; else if (k === "html") el.innerHTML = v; else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v); else if (v != null && v !== false) el.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (k) { if (k) el.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
    return el;
  }
  function get(path) { return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, state); }
  function set(path, v) { var ks = path.split("."), o = state; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ── Preview ───────────────────────────────────────────── */
  var frame = $("#pv", root), wrap = $(".pv-wrap", root), stage = $(".pv-stage", root), ready = false;
  frame.addEventListener("load", function () { ready = true; apply(); fit(); });
  frame.srcdoc = G.doc(state, { preview: true });

  function apply() {
    if (!ready) return;
    var w = frame.contentWindow, d = frame.contentDocument; if (!d || !w.__site) return;
    var y = w.scrollY;
    d.getElementById("css").textContent = G.css(state);
    var f = d.getElementById("fonts"), href = G.fontsHref(state); if (f.getAttribute("href") !== href) f.setAttribute("href", href);
    d.body.className = G.bodyClass(state);
    d.getElementById("root").innerHTML = G.body(state);
    w.__site.fill(); w.__site.show(page, false); w.scrollTo(0, y);
    paintTabs();
  }
  function fit() {
    var W = stage.clientWidth, H = stage.clientHeight, vw, sc, fh;
    root.classList.toggle("is-phone", device === "phone");
    if (device === "laptop") { vw = 1280; sc = W / vw; fh = H / sc; wrap.style.width = W + "px"; wrap.style.height = H + "px"; }
    else { vw = 390; sc = Math.min(1, (W - (W < 500 ? 0 : 24)) / vw); fh = Math.min(844, (H - (W < 500 ? 0 : 32)) / sc); wrap.style.width = Math.round(vw * sc) + "px"; wrap.style.height = Math.round(fh * sc) + "px"; }
    frame.style.width = vw + "px"; frame.style.height = fh + "px"; frame.style.transform = "scale(" + sc + ")";
  }
  window.addEventListener("resize", debounce(function () { fit(); sizeThumbs(); }, 120));

  var update = debounce(function () { apply(); save(); refreshThumbs(); paintSummaries(); }, 90);
  function changed(now) { if (now) { apply(); save(); refreshThumbs(); paintSummaries(); } else update(); }

  /* Page tabs above the preview */
  var tabs = $(".pv-tabs", root);
  function paintTabs() {
    var pages = G.ctx(state).pages;
    if (!pages.some(function (p) { return p.id === page; })) page = "home";
    tabs.innerHTML = "";
    pages.forEach(function (p) {
      tabs.appendChild(h("button", { type: "button", class: p.id === page ? "on" : "", text: p.label, onclick: function () { goPage(p.id); } }));
    });
  }
  function goPage(id, where) {
    page = id; paintTabs();
    var w = frame.contentWindow; if (!w || !w.__site) return;
    w.__site.show(id, true);
    if (where === "bottom") setTimeout(function () { w.scrollTo({ top: w.document.body.scrollHeight, behavior: "smooth" }); }, 60);
  }
  window.addEventListener("message", function (e) { if (e.source === frame.contentWindow && e.data && e.data.sitePage) { page = e.data.sitePage; paintTabs(); } });

  /* Device + shuffle */
  root.querySelectorAll("[data-device]").forEach(function (b) {
    b.addEventListener("click", function () { device = b.getAttribute("data-device"); root.querySelectorAll("[data-device]").forEach(function (x) { x.classList.toggle("on", x === b); }); fit(); });
    b.classList.toggle("on", b.getAttribute("data-device") === device);
  });
  function rnd(n) { return Math.floor(Math.random() * n); }
  function any(a) { return a[rnd(a.length)]; }
  $("[data-shuffle]", root).addEventListener("click", function () {
    var t = state.theme;
    t.pal = rnd(G.PALETTES.length); t.custom = null; t.hf = rnd(G.HEAD_FONTS.length); t.bf = rnd(G.BODY_FONTS.length);
    t.radius = any(["square", "soft", "round"]); t.btn = any(["solid", "solid", "outline", "text"]);
    Object.keys(G.SECTIONS).forEach(function (k) { state[k].v = rnd(G.SECTIONS[k].length); });
    state.header.tone = any(["base", "base", "soft", "ink"]); state.hero.tone = any(["base", "soft", "ink"]);
    state.about.tone = any(["soft", "base", "accent"]); state.services.tone = any(["base", "soft"]);
    state.gallery.tone = any(["base", "soft", "ink"]); state.booking.tone = any(["ink", "soft", "accent", "base"]);
    state.contact.tone = any(["base", "soft"]); state.footer.tone = any(["ink", "base", "accent"]);
    rebuildPanels(); changed(true);
  });
  $("[data-reset]", root).addEventListener("click", function () {
    if (!confirm("Start again from the beginning? Your changes here will be cleared.")) return;
    state = G.defaults(state.preset); blobs = {}; rebuildPanels(); changed(true);
  });

  /* ── Controls ──────────────────────────────────────────── */
  function group(label, kids, cls) { return h("div", { class: "grp" + (cls ? " " + cls : "") }, [label ? h("span", { class: "cap muted", text: label }) : null].concat(kids)); }
  function text(label, path, o) {
    o = o || {};
    var inp = h(o.area ? "textarea" : "input", { class: "fi", value: o.area ? null : get(path), rows: o.area ? (o.rows || 4) : null, maxlength: o.max || null, placeholder: o.ph || null, type: o.type || null });
    if (o.area) inp.value = get(path) || "";
    inp.addEventListener("input", function () { set(path, inp.value); changed(); });
    return h("label", { class: "fl" }, [h("span", { class: "fl-l", text: label }), inp]);
  }
  function seg(path, options, onDone) {
    var box = h("div", { class: "seg", role: "radiogroup" });
    options.forEach(function (o) {
      var b = h("button", { type: "button", class: get(path) === o[0] ? "on" : "", text: o[1], role: "radio", "aria-checked": get(path) === o[0] ? "true" : "false" });
      b.addEventListener("click", function () { set(path, o[0]); [].forEach.call(box.children, function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); }); if (onDone) onDone(); changed(true); });
      box.appendChild(b);
    });
    return box;
  }
  function toggle(label, path, onDone) {
    var b = h("button", { type: "button", class: "tg" + (get(path) ? " on" : ""), role: "switch", "aria-checked": get(path) ? "true" : "false", "aria-label": label }, [h("i")]);
    b.addEventListener("click", function () { set(path, !get(path)); b.classList.toggle("on", !!get(path)); b.setAttribute("aria-checked", !!get(path)); if (onDone) onDone(); changed(true); });
    return h("div", { class: "sw" }, [h("span", { text: label }), b]);
  }
  function tones(key) {
    var names = [["base", "Page"], ["soft", "Soft"], ["ink", "Dark"], ["accent", "Accent"]];
    var box = h("div", { class: "tones" });
    function paint() {
      var c = G.colors(state), soft = G.mix(c.bg, c.fg, .06);
      var map = { base: [c.bg, c.fg], soft: [soft, c.fg], ink: [c.fg, c.bg], accent: [c.ac, G.onColor(c.ac)] };
      [].forEach.call(box.children, function (b) { var t = b.getAttribute("data-t"); b.classList.toggle("on", state[key].tone === t); var i = b.querySelector("i"); i.style.background = map[t][0]; i.style.color = map[t][1]; });
    }
    names.forEach(function (n) {
      box.appendChild(h("button", { type: "button", class: "tone", "data-t": n[0], onclick: function () { state[key].tone = n[0]; paint(); changed(true); } }, [h("i", { text: "Aa" }), h("span", { text: n[1] })]));
    });
    box._paint = paint; paint(); painters.push(paint);
    return box;
  }

  /* Photos: downsized in the browser so the finished site stays light */
  function shrink(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var max = 1800, w = img.naturalWidth, hh = img.naturalHeight, k = Math.min(1, max / Math.max(w, hh));
        var cv = document.createElement("canvas"); cv.width = Math.round(w * k); cv.height = Math.round(hh * k);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
        cv.toBlob(function (b) { b ? res(b) : rej(); }, "image/jpeg", 0.84);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(); };
      img.src = url;
    });
  }
  function imgGet(key) { return key.charAt(0) === "g" ? state.img.g[+key.slice(1)] : state.img[key]; }
  function imgSet(key, v) { if (key.charAt(0) === "g") state.img.g[+key.slice(1)] = v; else state.img[key] = v; }
  function photoInput(key, onDone) {
    var inp = h("input", { type: "file", accept: "image/*", class: "sr" });
    inp.addEventListener("change", function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      shrink(f).then(function (b) { var u = URL.createObjectURL(b); blobs[u] = b; imgSet(key, u); onDone(u); changed(true); }, function () { alert("That file couldn't be read as a photo. Try a JPG or PNG."); });
      inp.value = "";
    });
    return inp;
  }
  function photo(label, key, note) {
    var im = h("img", { src: imgGet(key), alt: "" });
    var inp = photoInput(key, function (u) { im.src = u; });
    return h("div", { class: "photo" }, [h("span", { class: "photo-i" }, [im]), h("span", { class: "photo-t" }, [h("span", { text: label }), note ? h("small", { class: "muted", text: note }) : null]), h("label", { class: "btn-text cap" }, ["Change", inp])]);
  }
  function photoGrid() {
    var box = h("div", { class: "photos" });
    for (var i = 0; i < 6; i++) (function (i) {
      var im = h("img", { src: state.img.g[i], alt: "" });
      box.appendChild(h("label", { class: "ptile" }, [im, h("span", { text: "Change" }), photoInput("g" + i, function (u) { im.src = u; })]));
    })(i);
    return box;
  }

  /* Palette + fonts (the whole site) */
  var fontsLoaded = false;
  function loadFonts() { if (fontsLoaded) return; fontsLoaded = true; document.head.appendChild(h("link", { rel: "stylesheet", href: G.allFontsHref() })); }
  function palettes() {
    var box = h("div", { class: "pals" });
    G.PALETTES.forEach(function (p, i) {
      box.appendChild(h("button", { type: "button", class: "pal" + (!state.theme.custom && state.theme.pal === i ? " on" : ""), title: p.n, "aria-label": p.n, style: "background:" + p.bg,
        onclick: function (e) { state.theme.pal = i; state.theme.custom = null; [].forEach.call(document.querySelectorAll(".pal"), function (x) { x.classList.toggle("on", +x.getAttribute("data-i") === i); }); syncCustom(); changed(true); }, "data-i": i },
        [h("i", { style: "background:" + p.fg }), h("i", { style: "background:" + p.ac })]));
    });
    return box;
  }
  var customInputs = [];
  function syncCustom() { var c = G.colors(state); customInputs.forEach(function (inp) { inp.value = c[inp.getAttribute("data-k")]; }); }
  function customColours() {
    var c = G.colors(state), box = h("div", { class: "cols3" });
    [["bg", "Background"], ["fg", "Text"], ["ac", "Accent"]].forEach(function (k) {
      var inp = h("input", { type: "color", value: c[k[0]], "data-k": k[0], "aria-label": k[1] });
      inp.addEventListener("input", function () {
        var cc = state.theme.custom || JSON.parse(JSON.stringify(G.colors(state)));
        cc[k[0]] = inp.value; state.theme.custom = cc;
        [].forEach.call(document.querySelectorAll(".pal"), function (x) { x.classList.remove("on"); });
        changed();
      });
      customInputs.push(inp);
      box.appendChild(h("label", { class: "colr" }, [inp, h("span", { text: k[1] })]));
    });
    return box;
  }
  function fontList(which) {
    loadFonts();
    var list = which === "hf" ? G.HEAD_FONTS : G.BODY_FONTS, box = h("div", { class: "fonts" });
    list.forEach(function (f, i) {
      box.appendChild(h("button", { type: "button", class: "fnt" + (state.theme[which] === i ? " on" : ""), "data-w": which, "data-i": i,
        onclick: function () { state.theme[which] = i; [].forEach.call(document.querySelectorAll('.fnt[data-w="' + which + '"]'), function (x) { x.classList.toggle("on", +x.getAttribute("data-i") === i); }); changed(true); } },
        [h("b", { text: "Aa", style: "font-family:'" + f[0] + "',serif" }), h("span", { text: f[0] })]));
    });
    return box;
  }
  function range(label, path, min, max, step, unit) {
    var out = h("output", { text: get(path) + unit });
    var inp = h("input", { type: "range", min: min, max: max, step: step, value: get(path), "aria-label": label });
    inp.addEventListener("input", function () { set(path, +inp.value); out.textContent = inp.value + unit; changed(); });
    return h("div", { class: "rng" }, [h("span", { class: "fl-l", text: label }), inp, out]);
  }

  /* Design thumbnails: every design drawn live, in the customer's colours and words */
  var thumbSets = [];     // { sec, frames[] } for panels that are open
  var painters = [];
  function layouts(sec) {
    var list = G.SECTIONS[sec], box = h("div", { class: "lays" }), frames = [];
    list.forEach(function (t, i) {
      var fr = h("iframe", { tabindex: "-1", "aria-hidden": "true", title: t.n, loading: "lazy" });
      var b = h("button", { type: "button", class: "lay" + (state[sec].v === i ? " on" : ""), "aria-label": t.n + " design", "aria-pressed": state[sec].v === i ? "true" : "false" }, [h("span", { class: "lay-box" }, [fr]), h("span", { class: "lay-n", text: t.n })]);
      b.addEventListener("click", function () { state[sec].v = i; [].forEach.call(box.children, function (x, j) { x.classList.toggle("on", j === i); x.setAttribute("aria-pressed", j === i); }); changed(true); });
      box.appendChild(b); frames.push(fr);
    });
    var ts = { sec: sec, frames: frames, box: box };
    thumbSets.push(ts);
    requestAnimationFrame(function () { sizeThumbs(); drawThumbs(ts); });
    return box;
  }
  function drawThumbs(set) {
    var base = JSON.stringify(state);
    set.frames.forEach(function (fr, i) {
      var s = JSON.parse(base); s[set.sec].v = i;
      if (set.sec === "header") s.hero.v = 0;
      fr.srcdoc = G.doc(s, { thumb: true, only: set.sec });
    });
  }
  function sizeThumbs() {
    document.querySelectorAll(".lay-box").forEach(function (b) { var w = b.clientWidth; if (w) b.style.setProperty("--ts", (w / 1200).toFixed(4)); });
  }
  var refreshThumbs = debounce(function () {
    thumbSets = thumbSets.filter(function (t) { return document.body.contains(t.box); });
    thumbSets.forEach(drawThumbs);
    painters.forEach(function (p) { p(); });
  }, 450);

  /* ── Panels ────────────────────────────────────────────── */
  function lookBlock(sec, withSize) {
    return [
      group("Design", [layouts(sec)]),
      group("Section colour", [tones(sec)]),
      withSize ? group("Heading size", [seg(sec + ".hs", [["s", "Small"], ["m", "Medium"], ["l", "Large"]])]) : null
    ];
  }
  var PANELS = [
    { id: "start", title: function () { return "Your business"; }, sum: function () { return state.name + " · " + G.ctx(state).pages.length + " pages"; }, page: "home",
      build: function () {
        var types = h("div", { class: "chips" });
        Object.keys(G.PRESETS).forEach(function (k) {
          types.appendChild(h("button", { type: "button", class: "chipb" + (state.preset === k ? " on" : ""), text: G.PRESETS[k].label, onclick: function () {
            if (state.preset === k) return;
            G.applyPreset(state, k, true); blobs = {}; rebuildPanels("start"); changed(true);
          } }));
        });
        var pages = h("div", { class: "sws" }, [
          toggle("About page", "pages.about", pagesChanged), toggle((state.services.label || "Services") + " page", "pages.services", pagesChanged),
          toggle("Gallery page", "pages.gallery", pagesChanged), toggle("Booking system", "pages.booking", pagesChanged), toggle("Contact page", "pages.contact", pagesChanged)
        ]);
        return [
          group("Kind of business", [types, h("p", { class: "hint", text: "Fills in example words and photos for that kind of business. Your design choices stay as they are." })]),
          text("Business name", "name", { max: 40 }), text("One-line description", "tagline", { max: 90 }),
          group("Pages", [h("p", { class: "hint", text: "The homepage is always included." }), pages]),
          group("How the pages open", [seg("onePage", [[false, "Separate pages"], [true, "One long page"]])])
        ];
      } },
    { id: "theme", title: function () { return "Colours & fonts"; }, sum: function () { var t = state.theme; return (t.custom ? "Your own colours" : G.PALETTES[t.pal].n) + " · " + G.HEAD_FONTS[t.hf][0]; },
      build: function () {
        return [
          group("Colours", [palettes(), h("p", { class: "hint", text: "Or choose your own:" }), customColours()]),
          group("Heading font", [fontList("hf")]),
          group("Text font", [fontList("bf")]),
          group("Sizes", [range("Text size", "theme.size", 90, 115, 5, "%"), range("Heading size", "theme.hscale", 80, 125, 5, "%")]),
          group("Corners", [seg("theme.radius", [["square", "Square"], ["soft", "Soft"], ["round", "Round"]])]),
          group("Buttons", [seg("theme.btn", [["solid", "Solid"], ["outline", "Outline"], ["text", "Underline"]])])
        ];
      } },
    { id: "header", title: function () { return "Header"; }, sum: function () { return G.SECTIONS.header[state.header.v].n; }, page: "home",
      build: function () { return lookBlock("header", false); } },
    { id: "hero", title: function () { return "Homepage"; }, sum: function () { return G.SECTIONS.hero[state.hero.v].n + " design"; }, page: "home",
      build: function () {
        return lookBlock("hero", true).concat([
          group("Site colours & font", [palettes(), h("div", { class: "fonts-sel" }, [fontSelect()]), range("Text size", "theme.size", 90, 115, 5, "%")], "sub"),
          group("Words", [text("Small line above", "hero.kick", { max: 60 }), text("Headline", "hero.title", { area: true, rows: 2, max: 90 }), text("Paragraph", "hero.text", { area: true, rows: 3, max: 240 }),
            h("div", { class: "cols2" }, [text("Main button", "hero.cta", { max: 28 }), text("Second button", "hero.cta2", { max: 28 })])]),
          group("Photos", [photo("Main photo", "hero"), photo("Extra photo 1", "x1", "Used by some designs"), photo("Extra photo 2", "x2", "Used by some designs")]),
          group("Three highlights under the photo", [toggle("Show highlights", "hero.hlOn"), hlFields()])
        ]);
      } },
    { id: "about", need: "about", title: function () { return "About page"; }, sum: function () { return G.SECTIONS.about[state.about.v].n + " design"; }, page: "about",
      build: function () {
        return lookBlock("about", true).concat([
          group("Words", [text("Heading", "about.title", { area: true, rows: 2, max: 90 }), text("Your story", "about.text", { area: true, rows: 6, max: 1200 }), h("p", { class: "hint", text: "Leave a blank line to start a new paragraph." })]),
          group("Three numbers", [factFields()]),
          group("Photos", [photo("Main photo", "about"), photo("Second photo", "x1", "Used by some designs")])
        ]);
      } },
    { id: "services", need: "services", title: function () { return (state.services.label || "Services") + " page"; }, sum: function () { return G.SECTIONS.services[state.services.v].n + " · " + state.services.items.length + " items"; }, page: "services",
      build: function () {
        return lookBlock("services", true).concat([
          group("Words", [h("div", { class: "cols2" }, [text("Page name in menu", "services.label", { max: 16 }), text("Heading", "services.title", { max: 60 })]), text("Intro", "services.intro", { area: true, rows: 2, max: 200 })]),
          group("Items and prices", [itemsEditor()]),
          group("Photo", [photo("Side photo", "x1", "Used by the With photo design")])
        ]);
      } },
    { id: "gallery", need: "gallery", title: function () { return "Gallery page"; }, sum: function () { return G.SECTIONS.gallery[state.gallery.v].n + " design"; }, page: "gallery",
      build: function () {
        return lookBlock("gallery", true).concat([
          group("Words", [h("div", { class: "cols2" }, [text("Page name in menu", "gallery.label", { max: 16 }), text("Heading", "gallery.title", { max: 60 })])]),
          group("Six photos", [photoGrid(), h("p", { class: "hint", text: "Tap any photo to replace it with your own." })])
        ]);
      } },
    { id: "booking", need: "booking", title: function () { return "Booking page"; }, sum: function () { return G.SECTIONS.booking[state.booking.v].n + " · " + { table: "tables", appointment: "appointments", enquiry: "enquiries" }[state.booking.kind]; }, page: "booking",
      build: function () {
        return lookBlock("booking", true).concat([
          group("What people book", [seg("booking.kind", [["table", "A table"], ["appointment", "Appointment"], ["enquiry", "Enquiry"]])]),
          group("Words", [h("div", { class: "cols2" }, [text("Page name in menu", "booking.label", { max: 16 }), text("Button", "booking.button", { max: 28 })]), text("Heading", "booking.title", { max: 60 }), text("Intro", "booking.intro", { area: true, rows: 2, max: 200 }),
            text("Choices, separated by commas", "booking.options", { max: 200 }), h("p", { class: "hint", text: "Shown as buttons, e.g. the service or occasion." })]),
          group("Photo", [photo("Photo", "x1", "Used by the Photo split design")]),
          h("p", { class: "hint", text: "Requests are emailed to the address on the Contact dropdown." })
        ]);
      } },
    { id: "contact", title: function () { return "Contact & footer"; }, sum: function () { return (state.pages.contact ? G.SECTIONS.contact[state.contact.v].n + " · " : "") + G.SECTIONS.footer[state.footer.v].n + " footer"; }, page: "contact",
      build: function () {
        var parts = [];
        if (state.pages.contact) parts = parts.concat(lookBlock("contact", true));
        parts = parts.concat([
          group("Your details", [text("Address", "contact.address", { area: true, rows: 2, max: 160 }), text("Opening hours", "contact.hours", { area: true, rows: 4, max: 300 }), h("p", { class: "hint", text: "One line per day or group of days." }),
            h("div", { class: "cols2" }, [text("Phone", "contact.phone", { max: 30 }), text("Email", "contact.email", { max: 80, type: "email" })]),
            h("p", { class: "hint", text: "Bookings and messages from your site are sent to this email." }),
            state.pages.contact ? text("Heading", "contact.title", { max: 60 }) : null, text("A short note", "contact.note", { area: true, rows: 2, max: 200 }),
            state.pages.contact ? photo("Photo", "x2", "Used by the With photo design") : null]),
          group("Footer design", [layouts("footer")]),
          group("Footer colour", [tones("footer")]),
          toggle("Show “Site by Onwards Digital”", "credit")
        ]);
        return parts;
      } }
  ];
  function pagesChanged() { rebuildPanels("start"); }
  function fontSelect() {
    var sel = h("select", { class: "fi", "aria-label": "Heading font" });
    G.HEAD_FONTS.forEach(function (f, i) { sel.appendChild(h("option", { value: i, text: "Headings: " + f[0], selected: state.theme.hf === i })); });
    sel.addEventListener("change", function () { state.theme.hf = +sel.value; changed(true); });
    return sel;
  }
  function hlFields() {
    var box = h("div", { class: "hls" });
    state.hl.forEach(function (x, i) {
      var t = h("input", { class: "fi", value: x[0], maxlength: 40, "aria-label": "Highlight " + (i + 1) + " title" });
      var d = h("textarea", { class: "fi", rows: 2, maxlength: 140, "aria-label": "Highlight " + (i + 1) + " text" }); d.value = x[1];
      t.addEventListener("input", function () { state.hl[i][0] = t.value; changed(); });
      d.addEventListener("input", function () { state.hl[i][1] = d.value; changed(); });
      box.appendChild(h("div", { class: "hl-row" }, [t, d]));
    });
    return box;
  }
  function factFields() {
    var box = h("div", { class: "facts3" });
    state.about.facts.forEach(function (x, i) {
      var v = h("input", { class: "fi", value: x[0], maxlength: 10, "aria-label": "Number " + (i + 1) });
      var l = h("input", { class: "fi", value: x[1], maxlength: 30, "aria-label": "Label " + (i + 1) });
      v.addEventListener("input", function () { state.about.facts[i][0] = v.value; changed(); });
      l.addEventListener("input", function () { state.about.facts[i][1] = l.value; changed(); });
      box.appendChild(h("div", {}, [v, l]));
    });
    return box;
  }
  function itemsEditor() {
    var box = h("div", { class: "items" });
    function draw() {
      box.innerHTML = "";
      state.services.items.forEach(function (x, i) {
        var n = h("input", { class: "fi", value: x.n, placeholder: "Name", maxlength: 50, "aria-label": "Item name" });
        var p = h("input", { class: "fi", value: x.p, placeholder: "Price", maxlength: 14, "aria-label": "Price" });
        var d = h("input", { class: "fi", value: x.d, placeholder: "Short description", maxlength: 120, "aria-label": "Description" });
        n.addEventListener("input", function () { x.n = n.value; changed(); });
        p.addEventListener("input", function () { x.p = p.value; changed(); });
        d.addEventListener("input", function () { x.d = d.value; changed(); });
        var rm = h("button", { type: "button", class: "x", "aria-label": "Remove " + (x.n || "item"), html: "&times;", onclick: function () { state.services.items.splice(i, 1); draw(); changed(true); } });
        box.appendChild(h("div", { class: "item" }, [n, p, rm, d]));
      });
      if (state.services.items.length < 12) box.appendChild(h("button", { type: "button", class: "btn-text cap add", text: "Add an item", onclick: function () { state.services.items.push({ n: "", p: "", d: "" }); draw(); changed(true); var f = box.querySelectorAll(".item"); if (f.length) f[f.length - 1].querySelector("input").focus(); } }));
    }
    draw();
    return box;
  }

  var list = $(".bl-panels", root), open = null, nodes = {};
  function buildList() {
    list.innerHTML = ""; nodes = {};
    PANELS.forEach(function (p) {
      if (p.need && !state.pages[p.need]) return;
      var body = h("div", { class: "pn-b", id: "pn-" + p.id, hidden: true });
      var head = h("button", { type: "button", class: "pn-h", "aria-expanded": "false", "aria-controls": "pn-" + p.id }, [
        h("span", { class: "pn-t" }, [h("span", { class: "pn-n", text: p.title() }), h("span", { class: "pn-s muted", text: p.sum() })]), h("span", { class: "pn-i", "aria-hidden": "true" })
      ]);
      head.addEventListener("click", function () { toggleP(p.id); });
      var node = h("div", { class: "pn" }, [head, body]);
      nodes[p.id] = { p: p, node: node, head: head, body: body };
      list.appendChild(node);
    });
  }
  function toggleP(id, keepScroll) {
    var n = nodes[id]; if (!n) return;
    var willOpen = open !== id;
    Object.keys(nodes).forEach(function (k) { var o = nodes[k]; o.body.hidden = true; o.body.innerHTML = ""; o.head.setAttribute("aria-expanded", "false"); o.node.classList.remove("open"); });
    painters = []; customInputs = [];
    open = null;
    if (!willOpen) return;
    open = id;
    n.body.hidden = false; n.head.setAttribute("aria-expanded", "true"); n.node.classList.add("open");
    n.p.build().forEach(function (k) { if (k) n.body.appendChild(k); });
    if (n.p.page) goPage(state.pages[n.p.page] || n.p.page === "home" ? n.p.page : "home", id === "contact" && !state.pages.contact ? "bottom" : null);
    if (!keepScroll) requestAnimationFrame(function () {
      var top = n.node.offsetTop;
      if (list.scrollHeight > list.clientHeight + 4) list.scrollTo({ top: top, behavior: "smooth" });
      else { var r = n.head.getBoundingClientRect(), pv = root.querySelector(".bl-view").getBoundingClientRect(); if (r.top < pv.bottom || r.top > window.innerHeight - 80) window.scrollBy({ top: r.top - pv.bottom - 8, behavior: "smooth" }); }
    });
  }
  function rebuildPanels(keep) {
    var was = keep || open;
    buildList(); open = null;
    if (was && nodes[was]) toggleP(was, true);
  }
  function paintSummaries() { Object.keys(nodes).forEach(function (k) { var n = nodes[k]; $(".pn-n", n.head).textContent = n.p.title(); $(".pn-s", n.head).textContent = n.p.sum(); }); }

  buildList();
  toggleP("hero", true);
  fit();

  /* ── Buying ────────────────────────────────────────────── */
  var modal = $(".bl-modal", root), mForm = $("#buy-form", root);
  function openBuy() {
    var em = $("#buy-owner", root); var ce = (state.contact.email || "").trim();
    em.value = /example\.com$/i.test(ce) ? "" : ce;
    modal.hidden = false; document.documentElement.classList.add("modal-open");
    setTimeout(function () { $("#buy-name", root).focus(); }, 30);
    if (window.__paintSubmit) window.__paintSubmit();
  }
  function closeBuy() { modal.hidden = true; document.documentElement.classList.remove("modal-open"); }
  root.querySelectorAll("[data-buy]").forEach(function (b) { b.addEventListener("click", openBuy); });
  root.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeBuy); });
  modal.addEventListener("click", function (e) { if (e.target === modal) closeBuy(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeBuy(); });

  function toDataURL(blob) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { res(""); }; r.readAsDataURL(blob); }); }
  function finishedSite() {
    var s = JSON.parse(JSON.stringify(state)), jobs = [];
    function swap(get, put) { var u = get(); if (blobs[u]) jobs.push(toDataURL(blobs[u]).then(put)); }
    ["hero", "x1", "x2", "about"].forEach(function (k) { swap(function () { return s.img[k]; }, function (d) { s.img[k] = d; }); });
    s.img.g.forEach(function (u, i) { swap(function () { return u; }, function (d) { s.img.g[i] = d; }); });
    return Promise.all(jobs).then(function () { return G.doc(s); });
  }
  function summary() {
    var t = state.theme, c = G.ctx(state);
    return [
      "Pages: " + c.pages.map(function (p) { return p.label; }).join(", ") + (state.onePage ? " (one long page)" : ""),
      "Colours: " + (t.custom ? "custom " + t.custom.bg + " / " + t.custom.fg + " / " + t.custom.ac : G.PALETTES[t.pal].n),
      "Fonts: " + G.HEAD_FONTS[t.hf][0] + " + " + G.BODY_FONTS[t.bf][0] + ", text " + t.size + "%, headings " + t.hscale + "%",
      "Corners: " + t.radius + ", buttons: " + t.btn,
      "Designs: " + Object.keys(G.SECTIONS).map(function (k) { return k + " " + G.SECTIONS[k][state[k].v].n; }).join(" · ")
    ].join("\n");
  }
  mForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#buy-name", root), email = $("#buy-email", root), owner = $("#buy-owner", root), err = $("#buy-err", root);
    var re = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, bad = null;
    [name, email, owner].forEach(function (x) { x.closest(".field").classList.remove("invalid"); });
    if (!name.value.trim()) bad = name; else if (!re.test(email.value.trim())) bad = email; else if (!re.test(owner.value.trim())) bad = owner;
    if (bad) { bad.closest(".field").classList.add("invalid"); err.textContent = bad === name ? "Please enter your name." : "Please enter a valid email address, like name@gmail.com"; bad.focus(); return; }
    err.textContent = "";
    state.contact.email = owner.value.trim(); save(); apply();
    var btn = $("#submit-btn", root); btn.disabled = true; btn.textContent = "Preparing your site…";
    finishedSite().then(function (html) {
      var slug = (state.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "website";
      var file; try { file = new File([html], slug + "-website.html", { type: "text/html" }); } catch (x) { file = new Blob([html], { type: "text/html" }); file.name = slug + "-website.html"; }
      var fields = [
        ["name", name.value.trim()], ["email", email.value.trim()], ["business_name", state.name], ["booking_email", state.contact.email],
        ["plan", "Ready-made site"], ["_subject", "New ready-made site order — " + state.name], ["_template", "table"],
        ["design", summary()], ["site_file", file]
      ];
      return window.ONWARDS_PENDING.save({ label: "Ready-made site", fields: fields, savedAt: Date.now() });
    }).then(function () {
      location.href = "payment.html?plan=" + encodeURIComponent("Ready-made site") + "&price=" + ((window.ONWARDS || {}).prices || {}).readyMade.USD;
    }, function () {
      btn.disabled = false; if (window.__paintSubmit) window.__paintSubmit();
      err.textContent = "Something went wrong saving your design. Please try again.";
    });
  });

  /* Combination count, written out for the page copy */
  var n = G.count();
  var words = n >= 1e12 ? (n / 1e12).toFixed(1).replace(/\.0$/, "") + " trillion" : Math.floor(n / 1e9) + " billion";
  document.querySelectorAll("[data-combos]").forEach(function (el) { el.textContent = words; });
})();
