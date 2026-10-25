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
  var LS = "onwards-builder-v3";

  /* ── State ─────────────────────────────────────────────── */
  var state;
  try { state = JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { state = null; }
  if (!state || !state.theme || !state.img) state = G.defaults("restaurant");
  G.migrate(state);
  (function fillMissing(o, d) { Object.keys(d).forEach(function (k) { if (o[k] === undefined) o[k] = JSON.parse(JSON.stringify(d[k])); else if (d[k] && typeof d[k] === "object" && !Array.isArray(d[k]) && o[k] && typeof o[k] === "object") fillMissing(o[k], d[k]); }); })(state, G.defaults(state.preset || "restaurant"));
  var blobs = {};            // blob: URL -> Blob, for photos the customer uploads
  var page = "home", device = window.innerWidth < 760 ? "phone" : "laptop";

  function save() {
    try {
      var c = JSON.parse(JSON.stringify(state)), p = G.PRESETS[c.preset] || G.PRESETS.restaurant;
      imgSets(c).forEach(function (im) {
        ["hero", "x1", "x2", "about"].forEach(function (k) { if (/^blob:/.test(im[k])) im[k] = p.img[k]; });
        im.g = (im.g || []).map(function (u, i) { return /^blob:/.test(u) ? p.img.g[i] : u; });
      });
      (c.layout || []).forEach(function (e) { var o = c[e.k]; if (o && o.items && G.typeOf(c, e.k) === "shop") o.items.forEach(function (x, i) { if (/^blob:/.test(x.img)) x.img = PROD_FALLBACK[i % PROD_FALLBACK.length] || ""; }); });
      localStorage.setItem(LS, JSON.stringify(c));
    } catch (e) {}
  }

  /* Every photo set in a design: the site's, plus one per added section */
  function imgSets(s) { var out = [s.img]; (s.layout || []).forEach(function (e) { if (s[e.k] && s[e.k].img) out.push(s[e.k].img); }); return out; }

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

  /* Patch a live DOM tree to match fresh HTML, touching only what changed */
  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.parentNode.replaceChild(a.ownerDocument.importNode(b, true), a); return; }
    if (a.nodeType === 3 || a.nodeType === 8) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    if (a.nodeType !== 1) return;
    var i;
    if (a.hasAttribute("data-days") || a.hasAttribute("data-cal")) {           // the site's own pickers keep their month and selection
      for (i = 0; i < b.attributes.length; i++) { var bt = b.attributes[i]; if (a.getAttribute(bt.name) !== bt.value && bt.name !== "data-cal" && bt.name !== "data-days") a.setAttribute(bt.name, bt.value); }
      return;
    }
    for (i = a.attributes.length - 1; i >= 0; i--) { var n = a.attributes[i].name; if (!b.hasAttribute(n) && n !== "contenteditable") a.removeAttribute(n); }
    for (i = 0; i < b.attributes.length; i++) { var at = b.attributes[i]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
    var bk = [].slice.call(b.childNodes);
    for (i = 0; i < bk.length; i++) { if (i < a.childNodes.length) morph(a.childNodes[i], bk[i]); else a.appendChild(a.ownerDocument.importNode(bk[i], true)); }
    while (a.childNodes.length > bk.length) a.removeChild(a.lastChild);
  }
  function patchDoc(d, s, only, edit) {
    var c = d.getElementById("css"), css = G.css(s, only); if (c.textContent !== css) c.textContent = css;
    var f = d.getElementById("fonts"), href = G.fontsHref(s); if (f.getAttribute("href") !== href) f.setAttribute("href", href);
    var cls = G.bodyClass(s); if (d.body.className !== cls) d.body.className = cls;
    var tpl = d.createElement("template"); tpl.innerHTML = G.body(s, only, edit);
    var holder = d.createElement("div"); holder.appendChild(tpl.content);
    morph(d.getElementById("root"), (function () { var r = d.createElement("div"); r.id = "root"; while (holder.firstChild) r.appendChild(holder.firstChild); return r; })());
  }
  var editing = false;
  function apply() {
    if (!ready) return;
    var w = frame.contentWindow, d = frame.contentDocument; if (!d || !w.__site) return;
    var y = w.scrollY;
    if (editing) return;
    patchDoc(d, state, null, true);
    w.__site.fill(); w.__site.show(page, false); w.scrollTo(0, y);
    paintTabs();
  }
  function fit() {
    var P = stage.clientWidth < 500 ? 10 : 28;          // breathing room around the site
    var W = stage.clientWidth - 2 * P, H = stage.clientHeight - 2 * P, vw, sc, fh;
    root.classList.toggle("is-phone", device === "phone");
    if (device === "laptop") { W = Math.min(W, H * 1.5); vw = 1280; sc = W / vw; var hh = Math.min(H, W / 1.5); fh = hh / sc; wrap.style.width = Math.round(W) + "px"; wrap.style.height = Math.round(hh) + "px"; }
    else { vw = 390; sc = Math.min(1, W / vw); fh = Math.min(844, H / sc); wrap.style.width = Math.round(vw * sc) + "px"; wrap.style.height = Math.round(fh * sc) + "px"; }
    frame.style.width = vw + "px"; frame.style.height = fh + "px"; frame.style.transform = "scale(" + sc + ")";
  }
  window.addEventListener("resize", debounce(function () { fit(); sizeThumbs(); }, 120));
  if (window.ResizeObserver) { var ro = new ResizeObserver(function () { fit(); sizeThumbs(); }); ro.observe(stage); ro.observe($(".bl-panels", root)); }
  var blEl = $(".bl", root), view = "split";
  try { view = localStorage.getItem("onwards-builder-view") || "split"; } catch (e) {}
  function setView(v) {
    view = v; blEl.classList.remove("m-preview", "m-split", "m-options"); blEl.classList.add("m-" + v);
    root.querySelectorAll("[data-view]").forEach(function (b) { var on = b.getAttribute("data-view") === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    try { localStorage.setItem("onwards-builder-view", v); } catch (e) {}
    var t0 = performance.now(); (function tick(now) { fit(); sizeThumbs(); if (now - t0 < 520) requestAnimationFrame(tick); })(t0);
  }
  root.querySelectorAll("[data-view]").forEach(function (b) { b.addEventListener("click", function () { setView(b.getAttribute("data-view")); }); });
  setView(view);

  var update = debounce(function () { apply(); save(); refreshThumbs(); paintSummaries(); }, 90);
  function changed(now) { if (now) { apply(); save(); refreshThumbs(); paintSummaries(); } else update(); }

  /* Page tabs above the preview */
  var tabs = $(".pv-tabs", root);
  function paintTabs() {
    var all = G.ctx(state).pages;
    if (!all.some(function (p) { return p.id === page; })) page = "home";
    var prods = all.filter(function (p) { return p.type === "product"; }), oneProd = prods.filter(function (p) { return p.id === page; })[0] || prods[0];
    var pages = all.filter(function (p) { if (p.type === "product") return p === oneProd; return !p.hidden || p.type === "cart" || p.type === "checkout"; })
      .map(function (p) { return p.type === "product" ? { id: p.id, label: "Product" } : p; });
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
  function syncInputs(path) { root.querySelectorAll('[data-path="' + path + '"]').forEach(function (inp) { if (inp !== document.activeElement) inp.value = get(path) || ""; }); }
  window.addEventListener("message", function (e) {
    if (e.source !== frame.contentWindow || !e.data) return;
    if (e.data.edit) { editing = true; set(e.data.edit, e.data.value); save(); syncInputs(e.data.edit); paintSummaries(); refreshThumbs(); return; }
    if (e.data.editDone) { editing = false; setTimeout(apply, 0); return; }
  });
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
    ["header", "hero", "footer", "product", "cart", "checkout"].concat(state.layout.map(function (e) { return e.k; })).forEach(function (k) { state[k].v = rnd(G.SECTIONS[G.typeOf(state, k)].length); });
    state.header.tone = any(["base", "base", "soft", "ink"]); state.hero.tone = any(["base", "soft", "ink"]);
    state.about.tone = any(["soft", "base", "accent"]); state.services.tone = any(["base", "soft"]);
    state.gallery.tone = any(["base", "soft", "ink"]); state.booking.tone = any(["ink", "soft", "accent", "base"]);
    state.contact.tone = any(["base", "soft"]); state.footer.tone = any(["ink", "base", "accent"]);
    rebuildPanels(); changed(true);
  });
  var resetModal = $("[data-reset-modal]", root);
  function showModal(m, focusSel) { m.hidden = false; document.documentElement.classList.add("modal-open"); setTimeout(function () { var f = $(focusSel, m); if (f) f.focus(); }, 30); }
  function hideModal(m) { m.hidden = true; if (!root.querySelector(".bl-modal:not([hidden])")) document.documentElement.classList.remove("modal-open"); }
  $("[data-reset]", root).addEventListener("click", function () { showModal(resetModal, "[data-keep]"); });
  $("[data-keep]", resetModal).addEventListener("click", function () { hideModal(resetModal); });
  $("[data-do-reset]", resetModal).addEventListener("click", function () {
    state = G.defaults(state.preset); blobs = {}; hideModal(resetModal); rebuildPanels(); changed(true);
  });
  resetModal.addEventListener("click", function (e) { if (e.target === resetModal) hideModal(resetModal); });

  /* ── Controls ──────────────────────────────────────────── */
  function group(label, kids, cls) { return h("div", { class: "grp" + (cls ? " " + cls : "") }, [label ? h("span", { class: "cap muted", text: label }) : null].concat(kids)); }
  function text(label, path, o) {
    o = o || {};
    var inp = h(o.area ? "textarea" : "input", { class: "fi", "data-path": path, value: o.area ? null : get(path), rows: o.area ? (o.rows || 4) : null, maxlength: o.max || null, placeholder: o.ph || null, type: o.type || null });
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
    b.addEventListener("click", function () { set(path, !get(path)); b.classList.toggle("on", !!get(path)); b.setAttribute("aria-checked", !!get(path)); changed(true); if (onDone) onDone(!!get(path)); });
    return h("div", { class: "sw" }, [h("span", { text: label }), b]);
  }
  function reveal(label, path, kids) {
    var box = h("div", { class: "rv" + (get(path) ? " open" : "") }, [h("div", { class: "rv-in" }, [h("div", { class: "rv-body" }, kids)])]);
    return h("div", { class: "grp rv-grp" }, [toggle(label, path, function (on) { box.classList.toggle("open", on); }), box]);
  }
  function factsBlock(key) {
    return reveal("Show key facts", key + ".factsOn", [h("p", { class: "hint", text: "Three short facts shown as big numbers with a label, e.g. “12 — dishes on the menu”." }), factFields(key)]);
  }
  function tones(key) {
    var names = [["base", "Page"], ["soft", "Soft"], ["ink", "Dark"], ["accent", "Accent"]];
    var box = h("div", { class: "tones" });
    function paint() {
      var c = secColors(key), soft = G.mix(c.bg, c.fg, .06);
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
  function imgBase(sk) { return (sk && state[sk] && state[sk].img) || state.img; }
  function imgGet(key, sk) { var b = imgBase(sk); return key.charAt(0) === "g" ? (b.g || [])[+key.slice(1)] : b[key]; }
  function imgSet(key, v, sk) { var b = imgBase(sk); if (key.charAt(0) === "g") b.g[+key.slice(1)] = v; else b[key] = v; }
  function photoInput(key, onDone, sk) {
    var inp = h("input", { type: "file", accept: "image/*", class: "sr" });
    inp.addEventListener("change", function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      shrink(f).then(function (b) { var u = URL.createObjectURL(b); blobs[u] = b; imgSet(key, u, sk); onDone(u); changed(true); }, function () { alert("That file couldn't be read as a photo. Try a JPG or PNG."); });
      inp.value = "";
    });
    return inp;
  }
  function photo(label, key, note, sk) {
    var im = h("img", { src: imgGet(key, sk), alt: "" });
    var inp = photoInput(key, function (u) { im.src = u; }, sk);
    return h("div", { class: "photo" }, [h("span", { class: "photo-i" }, [im]), h("span", { class: "photo-t" }, [h("span", { text: label }), note ? h("small", { class: "muted", text: note }) : null]), h("label", { class: "btn-text cap" }, ["Change", inp])]);
  }
  function photoGrid(sk) {
    var box = h("div", { class: "photos" });
    for (var i = 0; i < 6; i++) (function (i) {
      var im = h("img", { src: imgGet("g" + i, sk), alt: "" });
      box.appendChild(h("label", { class: "ptile" }, [im, h("span", { text: "Change" }), photoInput("g" + i, function (u) { im.src = u; }, sk)]));
    })(i);
    return box;
  }

  /* Palette + fonts (the whole site) */
  var fontsLoaded = false;
  function loadFonts() { if (fontsLoaded) return; fontsLoaded = true; document.head.appendChild(h("link", { rel: "stylesheet", href: G.allFontsHref() })); }
  function palettes() {
    var box = h("div", { class: "pals" });
    G.PALETTES.forEach(function (p, i) {
      box.appendChild(h("button", { type: "button", class: "pal" + (i >= PAL_SHORT ? " more" : "") + (!state.theme.custom && state.theme.pal === i ? " on" : ""), title: p.n, "aria-label": p.n, style: "background:" + p.bg,
        onclick: function (e) { state.theme.pal = i; state.theme.custom = null; [].forEach.call(document.querySelectorAll(".pal"), function (x) { x.classList.toggle("on", +x.getAttribute("data-i") === i); }); syncCustom(); changed(true); }, "data-i": i },
        [h("i", { style: "background:" + p.fg }), h("i", { style: "background:" + p.ac })]));
    });
    return morePals(box, !state.theme.custom && state.theme.pal >= PAL_SHORT);
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
    var list = G.SECTIONS[G.typeOf(state, sec)], frames = [];
    if (sec === "header") {
      var names = h("div", { class: "names" });
      list.forEach(function (t, i) {
        var b = h("button", { type: "button", class: "nm" + (state.header.v === i ? " on" : ""), "aria-pressed": state.header.v === i ? "true" : "false" }, [h("b", { text: t.n }), h("span", { text: t.d || "" })]);
        b.addEventListener("click", function () { state.header.v = i; [].forEach.call(names.children, function (x, j) { x.classList.toggle("on", j === i); x.setAttribute("aria-pressed", j === i); }); changed(true); goPage("home"); });
        names.appendChild(b);
      });
      return names;
    }
    var box = h("div", { class: "lays" });
    list.forEach(function (t, i) {
      var fr = h("iframe", { tabindex: "-1", "aria-hidden": "true", title: t.n, loading: "lazy" });
      var b = h("button", { type: "button", class: "lay" + (state[sec].v === i ? " on" : ""), "aria-label": t.n + " design", "aria-pressed": state[sec].v === i ? "true" : "false" }, [h("span", { class: "lay-box" }, [fr]), h("span", { class: "lay-n", text: t.n }), t.d ? h("span", { class: "lay-d", text: t.d }) : null]);
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
      var key = JSON.stringify([G.css(s, set.sec), G.body(s, set.sec), G.bodyClass(s), G.fontsHref(s)]);
      if (fr._key === key) return;                       // nothing about this design changed
      var d = fr._ready && fr.contentDocument;
      if (d && d.getElementById("root")) patchDoc(d, s, set.sec, false);
      else { fr.onload = function () { fr._ready = true; }; fr.srcdoc = G.doc(s, { thumb: true, only: set.sec }); }
      fr._key = key;
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
  function secColors(k) { var o = state[k]; return (o && (o.custom || (o.pal != null && G.PALETTES[o.pal]))) || G.colors(state); }
  /* A palette grid that starts short: the first two rows, and "Show all colours" for the rest */
  var PAL_SHORT = 15;
  function morePals(box, startOpen) {
    var btn = h("button", { type: "button", class: "btn-text cap more-pals", text: "Show all " + G.PALETTES.length + " colours" });
    if (startOpen) box.classList.add("all");
    btn.hidden = startOpen;
    btn.addEventListener("click", function () { box.classList.add("all"); btn.hidden = true; });
    return h("div", { class: "palwrap" }, [box, btn]);
  }
  function secPalettes(sec) {
    var o = state[sec], box = h("div", { class: "pals" });
    function mark(x) { [].forEach.call(box.children, function (c) { c.classList.toggle("on", c === x); }); }
    var same = h("button", { type: "button", class: "pal same" + (o.pal == null && !o.custom ? " on" : ""), title: "Same as the rest of the site", "aria-label": "Same as the rest of the site", text: "Site" });
    same.addEventListener("click", function () { o.pal = null; o.custom = null; mark(same); changed(true); });
    box.appendChild(same);
    G.PALETTES.forEach(function (p, i) {
      var b = h("button", { type: "button", class: "pal" + (i >= PAL_SHORT ? " more" : "") + (o.pal === i && !o.custom ? " on" : ""), title: p.n, "aria-label": p.n, style: "background:" + p.bg }, [h("i", { style: "background:" + p.fg }), h("i", { style: "background:" + p.ac })]);
      b.addEventListener("click", function () { o.pal = i; o.custom = null; mark(b); changed(true); });
      box.appendChild(b);
    });
    return morePals(box, o.pal != null && o.pal >= PAL_SHORT);
  }
  function secSize(sec) {
    var o = state[sec], val = function () { return o.size != null ? o.size : state.theme.size; };
    var out = h("output", { text: val() + "%" }), inp = h("input", { type: "range", min: 85, max: 120, step: 5, value: val(), "aria-label": "Text size for this section" });
    var reset = h("button", { type: "button", class: "btn-text cap rs", text: "Reset", hidden: o.size == null });
    inp.addEventListener("input", function () { o.size = +inp.value; out.textContent = inp.value + "%"; reset.hidden = false; changed(); });
    reset.addEventListener("click", function () { o.size = null; inp.value = val(); out.textContent = val() + "%"; reset.hidden = true; changed(true); });
    return h("div", { class: "rng" }, [h("span", { class: "fl-l", text: "Text size" }), inp, out, reset]);
  }
  /* Rows that show their current value and open one at a time, so only one set of choices is on screen */
  function optRows(rows) {
    var box = h("div", { class: "orows" });
    rows.forEach(function (r) {
      if (!r) return;
      var val = h("span", { class: "or-v" }), sw = r.swatch ? h("i", { class: "or-sw", "aria-hidden": "true" }) : null;
      var head = h("button", { type: "button", class: "or-h", "aria-expanded": "false" }, [h("span", { class: "or-l", text: r.label }), h("span", { class: "or-r" }, [sw, val]), h("i", { class: "or-c", "aria-hidden": "true" })]);
      var inner = h("div", { class: "rv-body or-b" }), body = h("div", { class: "rv" }, [h("div", { class: "rv-in" }, [inner])]);
      var row = h("div", { class: "or" }, [head, body]), built = false, t;
      function paint() { val.textContent = r.value(); if (sw) sw.style.background = r.swatch(); }
      function close(x) { x.classList.remove("open", "done"); x.querySelector(".rv").classList.remove("open"); x.firstChild.setAttribute("aria-expanded", "false"); }
      head.addEventListener("click", function () {
        var willOpen = !row.classList.contains("open");
        [].forEach.call(box.children, close);
        if (!willOpen) return;
        if (!built) { r.body().forEach(function (n) { if (n) inner.appendChild(n); }); built = true; requestAnimationFrame(sizeThumbs); }
        row.classList.add("open"); body.classList.add("open"); head.setAttribute("aria-expanded", "true");
        clearTimeout(t); t = setTimeout(function () { if (row.classList.contains("open")) row.classList.add("done"); }, 400);
      });
      ["click", "input"].forEach(function (ev) { inner.addEventListener(ev, function () { setTimeout(paint, 0); }); });
      paint(); painters.push(paint);
      box.appendChild(row);
    });
    return box;
  }
  var TONE_NAME = { base: "Page", soft: "Soft", ink: "Dark", accent: "Accent" };
  function toneBg(k) { var c = secColors(k), t = state[k].tone || "base"; return { base: c.bg, soft: G.mix(c.bg, c.fg, .06), ink: c.fg, accent: c.ac }[t]; }
  function fontName(which, i) { var list = which === "hf" ? G.HEAD_FONTS : G.BODY_FONTS; return list[i == null ? state.theme[which] : i][0]; }
  function styleBlock(sec, withSize) {
    var o = state[sec];
    return [
      h("p", { class: "hint", text: "Changes this section only." }),
      optRows([
        { label: "Background", value: function () { return TONE_NAME[o.tone || "base"]; }, swatch: function () { return toneBg(sec); }, body: function () { return [tones(sec)]; } },
        { label: "Colours", value: function () { return o.custom ? "Your own" : o.pal != null ? G.PALETTES[o.pal].n : "Same as site"; }, swatch: function () { return secColors(sec).ac; }, body: function () { return [secPalettes(sec)]; } },
        { label: "Fonts", value: function () { return fontName("hf", o.hf) + " · " + fontName("bf", o.bf); }, body: function () { return [h("div", { class: "cols2" }, [fontPick("Headings", "hf", o), fontPick("Text", "bf", o)])]; } },
        { label: "Sizes", value: function () { return (o.size != null ? o.size : state.theme.size) + "%" + (withSize ? " · " + { s: "Small", m: "Medium", l: "Large" }[o.hs || "m"] + " headings" : ""); },
          body: function () { return [secSize(sec), withSize ? h("div", { class: "fl" }, [h("span", { class: "fl-l", text: "Heading size" }), seg(sec + ".hs", [["s", "Small"], ["m", "Medium"], ["l", "Large"]])]) : null]; } }
      ])
    ];
  }
  function lookTabs(sec, withSize, extra) {
    return [["Design", function () { return [layouts(sec)]; }],
      ["Style", function () { return styleBlock(sec, withSize).concat(extra || []); }]];
  }

  /* Font dropdown: our own list, each name shown in its font */
  function fontPick(label, which, obj) {
    var list = which === "hf" ? G.HEAD_FONTS : G.BODY_FONTS, allowSame = obj !== state.theme;
    var wrap = h("div", { class: "fp" }), btn = h("button", { type: "button", class: "fp-btn", "aria-haspopup": "listbox", "aria-expanded": "false" });
    var pop = h("div", { class: "fp-list", role: "listbox", "aria-label": label + " font", hidden: true });
    function nameOf(i) { return list[i == null ? state.theme[which] : i][0]; }
    function paint() {
      var i = obj[which]; btn.innerHTML = "";
      btn.appendChild(h("span", { class: "fp-l", text: label }));
      btn.appendChild(h("span", { class: "fp-v", text: nameOf(i), style: "font-family:'" + nameOf(i) + "',serif" }));
      btn.appendChild(h("i", { class: "fp-c", "aria-hidden": "true" }));
      [].forEach.call(pop.children, function (o) { var on = String(o.getAttribute("data-i")) === String(i == null ? "" : i); o.classList.toggle("on", on); o.setAttribute("aria-selected", on); });
    }
    function close() { pop.hidden = true; wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    function openIt() {
      loadFonts(); document.querySelectorAll(".fp.open").forEach(function (x) { if (x !== wrap && x._close) x._close(); });
      pop.hidden = false; wrap.classList.add("open"); btn.setAttribute("aria-expanded", "true");
      var sel = pop.querySelector(".on") || pop.firstChild; pop.scrollTop = Math.max(0, sel.offsetTop - 60); sel.focus({ preventScroll: true });
      requestAnimationFrame(function () {                       // bring the whole list into view inside the options column
        var L = wrap.closest(".bl-panels"), r = pop.getBoundingClientRect();
        if (L && L.scrollHeight > L.clientHeight + 4) { var lr = L.getBoundingClientRect(); if (r.bottom > lr.bottom) L.scrollBy({ top: r.bottom - lr.bottom + 16, behavior: "smooth" }); }
        else if (r.bottom > window.innerHeight) window.scrollBy({ top: r.bottom - window.innerHeight + 90, behavior: "smooth" });
      });
    }
    function choose(i) { obj[which] = i; paint(); close(); btn.focus(); changed(true); }
    if (allowSame) pop.appendChild(h("button", { type: "button", role: "option", class: "fp-o same", "data-i": "", onclick: function () { choose(null); } }, [h("span", { text: list[state.theme[which]][0], style: "font-family:'" + list[state.theme[which]][0] + "',serif" }), h("small", { text: "Same as the rest of the site" })]));
    list.forEach(function (f, i) { pop.appendChild(h("button", { type: "button", role: "option", class: "fp-o", "data-i": i, text: f[0], style: "font-family:'" + f[0] + "',serif", onclick: function () { choose(i); } })); });
    btn.addEventListener("click", function () { pop.hidden ? openIt() : close(); });
    pop.addEventListener("keydown", function (e) {
      var items = [].slice.call(pop.children), k = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (items[k + 1] || items[k]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (items[k - 1] || items[k]).focus(); }
      else if (e.key === "Escape") { e.preventDefault(); close(); btn.focus(); }
    });
    wrap._close = close;
    wrap.appendChild(btn); wrap.appendChild(pop); paint();
    return wrap;
  }
  document.addEventListener("click", function (e) { document.querySelectorAll(".fp.open").forEach(function (x) { if (!x.contains(e.target) && x._close) x._close(); }); });

  /* A dropdown in our own style for choosing from a list (button destinations) */
  function choice(label, optsFn, getV, setV) {
    var wrap = h("div", { class: "fp ch" }), btn = h("button", { type: "button", class: "fp-btn", "aria-haspopup": "listbox", "aria-expanded": "false" });
    var pop = h("div", { class: "fp-list", role: "listbox", "aria-label": label, hidden: true });
    function now() { var v = getV(), o = optsFn(); for (var i = 0; i < o.length; i++) if (o[i].v === v) return o[i]; return o[0]; }
    function paint() { var c = now(); btn.innerHTML = ""; btn.appendChild(h("span", { class: "fp-l", text: label })); btn.appendChild(h("span", { class: "fp-v", text: c.label + (c.sub ? " · " + c.sub : "") })); btn.appendChild(h("i", { class: "fp-c", "aria-hidden": "true" })); }
    function close() { pop.hidden = true; wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    function openIt() {
      document.querySelectorAll(".fp.open").forEach(function (x) { if (x !== wrap && x._close) x._close(); });
      pop.innerHTML = ""; var cv = getV();
      optsFn().forEach(function (o) {
        pop.appendChild(h("button", { type: "button", role: "option", class: "fp-o" + (o.v === cv ? " on" : ""), "aria-selected": o.v === cv ? "true" : "false", onclick: function () { setV(o.v); paint(); close(); btn.focus(); } },
          [h("span", { text: o.label }), o.sub ? h("small", { text: o.sub }) : null]));
      });
      pop.hidden = false; wrap.classList.add("open"); btn.setAttribute("aria-expanded", "true");
      var sel = pop.querySelector(".on") || pop.firstChild; sel.focus({ preventScroll: true });
      requestAnimationFrame(function () {
        var L = wrap.closest(".bl-panels"), r = pop.getBoundingClientRect();
        if (L && L.scrollHeight > L.clientHeight + 4) { var lr = L.getBoundingClientRect(); if (r.bottom > lr.bottom) L.scrollBy({ top: r.bottom - lr.bottom + 16, behavior: "smooth" }); }
        else if (r.bottom > window.innerHeight) window.scrollBy({ top: r.bottom - window.innerHeight + 90, behavior: "smooth" });
      });
    }
    btn.addEventListener("click", function () { pop.hidden ? openIt() : close(); });
    pop.addEventListener("keydown", function (e) {
      var items = [].slice.call(pop.children), k = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (items[k + 1] || items[k]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); (items[k - 1] || items[k]).focus(); }
      else if (e.key === "Escape") { e.preventDefault(); close(); btn.focus(); }
    });
    wrap._close = close; wrap._paint = paint; painters.push(paint);
    wrap.appendChild(btn); wrap.appendChild(pop); paint();
    return wrap;
  }
  /* A homepage button: its words, and where it goes (any page, the bag, or a web address) */
  function buttonLink(which, label) {
    var hero = state.hero;
    function pageName(id) { var p = G.ctx(state).pages.filter(function (x) { return x.id === id; })[0]; return p ? (p.type === "cart" ? (state.cart.label || "Bag") : p.label) : ""; }
    function autoTo() { var c = G.ctx(state); return which === "cta" ? c.target : (c.first("services") || c.first("shop") || c.first("gallery") || c.first("about")); }
    function opts() {
      var c = G.ctx(state), o = [{ v: null, label: "Automatic", sub: autoTo() ? pageName(autoTo()) : "hidden" }];
      c.pages.forEach(function (p) { if (!p.hidden || p.type === "cart" || p.type === "checkout") o.push({ v: p.id, label: p.type === "cart" ? (state.cart.label || "Bag") : p.label }); });
      o.push({ v: "url", label: "A web address", sub: "Instagram, an app, anything" });
      return o;
    }
    var urlBox = h("div", { class: "rv" + (hero[which + "To"] === "url" ? " open" : "") }, [h("div", { class: "rv-in" }, [h("div", { class: "rv-body" }, [text("Web address", "hero." + which + "Url", { max: 300, ph: "e.g. instagram.com/yourbrand" }), h("p", { class: "hint", text: "Opens in a new tab on your finished site." })])])]);
    var pick = choice("Goes to", opts, function () { return hero[which + "To"] || null; }, function (v) { hero[which + "To"] = v; urlBox.classList.toggle("open", v === "url"); changed(true); });
    return h("div", { class: "btnlink" }, [text(label, "hero." + which, { max: 28 }), pick, urlBox]);
  }

  /* Products: photo, name and price on one line; description and sizes fold away */
  var PROD_FALLBACK = (G.PRESETS.store.shop.items || []).map(function (x) { return x[4]; });
  function productsEditor(k) {
    var box = h("div", { class: "prods" }), o = state[k];
    function nextId() { var n = 0; o.items.forEach(function (x) { var m = /^p(\d+)$/.exec(x.id || ""); if (m) n = Math.max(n, +m[1]); }); return "p" + (n + 1); }
    function draw() {
      box.innerHTML = "";
      o.items.forEach(function (x, i) {
        if (!x.id) x.id = nextId();
        var im = h("img", { src: x.img || "", alt: "" }), file = h("input", { type: "file", accept: "image/*", class: "sr" });
        file.addEventListener("change", function () {
          var f = file.files && file.files[0]; if (!f) return;
          shrink(f).then(function (b) { var u = URL.createObjectURL(b); blobs[u] = b; x.img = u; im.src = u; changed(true); }, function () { alert("That file couldn't be read as a photo. Try a JPG or PNG."); });
          file.value = "";
        });
        var n = h("input", { class: "fi", "data-path": k + ".items." + i + ".n", value: x.n, placeholder: "Product name", maxlength: 60, "aria-label": "Product name" });
        var pr = h("input", { class: "fi", "data-path": k + ".items." + i + ".p", value: x.p, placeholder: "0", maxlength: 12, inputmode: "decimal", "aria-label": "Price" });
        n.addEventListener("input", function () { x.n = n.value; changed(); });
        pr.addEventListener("input", function () { x.p = pr.value; changed(); });
        var det = h("div", { class: "rv" }, [h("div", { class: "rv-in" }, [h("div", { class: "rv-body" }, [
          text("Description", k + ".items." + i + ".d", { area: true, rows: 3, max: 400 }),
          text("Sizes or options, separated by commas", k + ".items." + i + ".sizes", { max: 120, ph: "S, M, L, XL" }),
          h("p", { class: "hint", text: "Leave sizes empty if there's only one." })])])]);
        var more = h("button", { type: "button", class: "btn-text cap pr-more", text: "Details", "aria-expanded": "false" });
        more.addEventListener("click", function () { var op = !det.classList.contains("open"); det.classList.toggle("open", op); more.setAttribute("aria-expanded", op); });
        var rm = h("button", { type: "button", class: "x", "aria-label": "Remove " + (x.n || "product"), html: "&times;", onclick: function () { o.items.splice(i, 1); draw(); changed(true); } });
        box.appendChild(h("div", { class: "pr" }, [
          h("label", { class: "pr-img", title: "Change photo" }, [im, h("span", { text: "Change" }), file]),
          h("div", { class: "pr-f" }, [n, h("div", { class: "pr-row" }, [h("label", { class: "pr-pr" }, [h("span", { class: "pr-cur", text: state.store.cur || "$" }), pr]), more])]),
          rm, det]));
      });
      var lim = +((/\d+/.exec(G.SECTIONS.shop[o.v | 0].d || "") || [])[0] || 99), shown = o.items.filter(function (x) { return x.n; }).length;
      if (shown > lim) box.appendChild(h("p", { class: "hint note pr-lim", text: "Your “" + G.SECTIONS.shop[o.v | 0].n + "” design shows the first " + lim + ". To show all " + shown + ", pick “Many small” under Design, or add a second Shop section." }));
      if (o.items.length < 24) box.appendChild(h("button", { type: "button", class: "btn-text cap add", text: "Add a product", onclick: function () {
        o.items.push({ id: nextId(), n: "New product", p: "40", d: "", sizes: "", img: PROD_FALLBACK[o.items.length % PROD_FALLBACK.length] || "" });
        draw(); changed(true); var f = box.querySelectorAll(".pr"); if (f.length) { var inp = f[f.length - 1].querySelector(".pr-f input"); inp.focus(); inp.select(); }
      } }));
    }
    draw();
    return box;
  }
  function payBlock() {
    var linksHint = h("p", { class: "hint", text: "Switch on the ways you take payment and paste the link from your own account. Customers are sent to that link to pay; PayPal.me links get the order total filled in." });
    var listEl = h("div", { class: "grp paylist" }, G.PAY_METHODS.map(function (m) {
      var path = "store.pay." + m[0];
      var field = m[3] === "url" ? [text("Payment link", path + ".url", { max: 300, ph: m[4] })]
        : m[3] === "text" ? [text("Bank details shown after ordering", path + ".text", { area: true, rows: 3, max: 400, ph: m[4] })]
        : [h("p", { class: "hint", text: "Customers place the order and pay when it arrives." })];
      return reveal(m[1], path + ".on", field);
    }));
    var ownNote = h("p", { class: "hint", text: "Your checkout page stays on your site with a “Place order” button. Add your own payment methods to it later, or take payment after each order comes in." });
    function paint() { var own = state.store.payMode === "own"; listEl.hidden = own; linksHint.hidden = own; ownNote.hidden = !own; }
    paint();
    return [group("How customers pay", [seg("store.payMode", [["buttons", "Payment buttons"], ["own", "I’ll add my own"]], paint)]), linksHint, listEl, ownNote,
      h("p", { class: "hint note", text: "Onwards Digital never handles your payments or orders. Money goes straight to your own accounts." })];
  }
  function ordersBlock() {
    var mail = h("div", { class: "grp" }, [text("Send each order to this email", "contact.email", { max: 80, type: "email" }), h("p", { class: "hint", text: "Orders are emailed to you through FormSubmit, a free form service. The first one asks you to confirm the address." })]);
    var mine = h("p", { class: "hint", text: "Orders won't be emailed anywhere until you connect your own order system." });
    function paint() { var own = state.store.orders === "own"; mail.hidden = own; mine.hidden = !own; }
    paint();
    return [group("Where should orders go?", [seg("store.orders", [["email", "To my email"], ["own", "I’ll set this up myself"]], paint)]), mail, mine,
      h("div", { class: "cols2" }, [text("Currency symbol", "store.cur", { max: 4 }), text("Shipping note", "store.ship", { max: 160 })])];
  }

  /* Names used for sections in the list and on the dropdowns */
  function rowName(k) {
    var ty = G.typeOf(state, k);
    if (k !== ty) return state[k].label || G.DEF_LABEL[ty];
    return { about: "About", services: state.services.label || "Services", shop: state.shop.label || "Shop", gallery: "Gallery", booking: "Booking system", contact: "Contact", terms: "Terms of service" }[ty];
  }
  var ADD_NAME = { about: "Text & photo", services: function () { return state.services.label || "Services"; }, shop: "Shop (products)", gallery: "Gallery", booking: "Booking system" };
  var GRIP = '<svg viewBox="0 0 10 16" width="10" height="16" aria-hidden="true"><circle cx="2" cy="3" r="1.3"/><circle cx="8" cy="3" r="1.3"/><circle cx="2" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="2" cy="13" r="1.3"/><circle cx="8" cy="13" r="1.3"/></svg>';

  /* "What's on your site": drag to reorder, switch on or off, + to add another */
  function sectionList() {
    var wrapEl = h("div", { class: "sl" }), box = h("div", { class: "sl-rows", role: "list" });
    function sw(on, label, fn) {
      var b = h("button", { type: "button", class: "tg" + (on ? " on" : ""), role: "switch", "aria-checked": on ? "true" : "false", "aria-label": label }, [h("i")]);
      b.addEventListener("click", function () { var v = !b.classList.contains("on"); b.classList.toggle("on", v); b.setAttribute("aria-checked", v); fn(v); });
      return b;
    }
    function moved(k) { draw(); var r = box.querySelector('[data-k="' + k + '"]'); if (r) { r.classList.add("moved"); setTimeout(function () { r.classList.remove("moved"); }, 700); } syncList(); changed(true); }
    function makeRow(e) {
      var k = e.k, extra = k !== G.typeOf(state, k);
      var grip = h("button", { type: "button", class: "grip", "aria-label": "Move " + rowName(k) + ". Drag, or use the up and down arrow keys.", html: GRIP });
      var row = h("div", { class: "slr" + (e.on ? "" : " off"), role: "listitem", "data-k": k }, [
        grip, h("span", { class: "slr-n", text: rowName(k) }),
        extra ? h("button", { type: "button", class: "slr-x", "aria-label": "Remove " + rowName(k), title: "Remove", html: "&times;", onclick: function () { removeRow(row, k); } }) : null,
        sw(e.on, rowName(k), function (v) { e.on = v; row.classList.toggle("off", !v); syncList(); changed(true); if (v) setTimeout(function () { goPage(k); }, 140); })
      ]);
      dragify(row, grip, k);
      return row;
    }
    function draw() {
      box.innerHTML = "";
      state.layout.forEach(function (e) { box.appendChild(makeRow(e)); });
    }
    function removeRow(row, k) {
      var hh = row.offsetHeight;
      var done = function () { G.removeSection(state, k); delete panelCache[k]; delete tabOf[k]; draw(); syncList(); changed(true); };
      if (row.animate) row.animate([{ height: hh + "px", opacity: 1 }, { height: "0px", opacity: 0, paddingTop: "0px", paddingBottom: "0px" }], { duration: 240, easing: "ease-in" }).onfinish = done; else done();
    }
    function dragify(row, grip, k) {
      grip.addEventListener("pointerdown", function (ev) {
        if (ev.button !== 0) return;
        ev.preventDefault();
        var rows = [].slice.call(box.querySelectorAll(".slr")), from = rows.indexOf(row), to = from;
        var rects = rows.map(function (r) { return r.getBoundingClientRect(); });
        var step = rows.length > 1 ? rects[1].top - rects[0].top : rects[0].height, y0 = ev.clientY;
        row.classList.add("dragging"); box.classList.add("is-dragging");
        try { grip.setPointerCapture(ev.pointerId); } catch (x) {}
        function move(e) {
          var dy = Math.max(-from * step - 8, Math.min((rows.length - 1 - from) * step + 8, e.clientY - y0));
          row.style.transform = "translateY(" + dy + "px)";
          var mid = rects[from].top + rects[from].height / 2 + dy; to = 0;
          rows.forEach(function (r, i) { if (i !== from && rects[i].top + rects[i].height / 2 < mid) to++; });
          rows.forEach(function (r, i) {
            if (i === from) return;
            var s = (from < to && i > from && i <= to) ? -step : (from > to && i < from && i >= to) ? step : 0;
            r.style.transform = s ? "translateY(" + s + "px)" : "";
          });
        }
        function up() {
          grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", up);
          box.classList.remove("is-dragging"); row.classList.remove("dragging");
          rows.forEach(function (r) { r.style.transform = ""; });
          if (to !== from) { var en = state.layout.splice(from, 1)[0]; state.layout.splice(to, 0, en); moved(en.k); setTimeout(function () { goPage(en.k); }, 140); }
        }
        grip.addEventListener("pointermove", move); grip.addEventListener("pointerup", up); grip.addEventListener("pointercancel", up);
      });
      grip.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        var i = state.layout.findIndex(function (x) { return x.k === k; }), j = i + (e.key === "ArrowUp" ? -1 : 1);
        if (j < 0 || j >= state.layout.length) return;
        var en = state.layout.splice(i, 1)[0]; state.layout.splice(j, 0, en);
        moved(k); var g = box.querySelector('[data-k="' + k + '"] .grip'); if (g) g.focus();
      });
    }
    draw();

    var footRow = h("div", { class: "slr fixed" + (state.footerOn ? "" : " off") }, [h("span", { class: "grip-ph", "aria-hidden": "true" }), h("span", { class: "slr-n", text: "Footer" }),
      sw(state.footerOn, "Footer", function (v) { state.footerOn = v; footRow.classList.toggle("off", !v); syncList(); changed(true); if (v) setTimeout(function () { goPage("home", "bottom"); }, 140); })]);

    var menu = h("div", { class: "sl-add-menu" }), menuWrap = h("div", { class: "rv" }, [h("div", { class: "rv-in" }, [h("div", { class: "rv-body" }, [h("p", { class: "hint", text: "Add another section. It starts as a copy you can change." }), menu])])]);
    G.ADDABLE.forEach(function (ty) {
      var nm = typeof ADD_NAME[ty] === "function" ? ADD_NAME[ty]() : ADD_NAME[ty];
      menu.appendChild(h("button", { type: "button", class: "chipb", text: "+ " + nm, onclick: function () {
        var k = G.addSection(state, ty); menuWrap.classList.remove("open"); addBtn.setAttribute("aria-expanded", "false");
        draw(); var r = box.querySelector('[data-k="' + k + '"]');
        if (r && r.animate) { var hh = r.offsetHeight; r.animate([{ height: "0px", opacity: 0 }, { height: hh + "px", opacity: 1 }], { duration: 300, easing: "cubic-bezier(.2,.7,.2,1)" }); r.classList.add("moved"); setTimeout(function () { r.classList.remove("moved"); }, 900); }
        syncList(); changed(true); setTimeout(function () { goPage(k); }, 160);
      } }));
    });
    var addBtn = h("button", { type: "button", class: "sl-add", "aria-expanded": "false" }, [h("span", { class: "plus", "aria-hidden": "true", text: "+" }), "Add a section"]);
    addBtn.addEventListener("click", function () { var o = !menuWrap.classList.contains("open"); menuWrap.classList.toggle("open", o); addBtn.setAttribute("aria-expanded", o); });

    wrapEl.appendChild(box); wrapEl.appendChild(footRow); wrapEl.appendChild(addBtn); wrapEl.appendChild(menuWrap);
    return wrapEl;
  }

  /* Every part of the site has a dropdown. Sections in the list get one each, in the list's order. */
  var STATIC = {
    start: { id: "start", title: function () { return "Your business"; }, sum: function () { var n = G.ctx(state).pages.filter(function (x) { return !x.hidden; }).length; return state.name + " · " + n + (state.onePage ? " sections on one page" : " pages"); }, page: "home",
      build: function () {
        var types = h("div", { class: "chips" });
        Object.keys(G.PRESETS).forEach(function (k) {
          types.appendChild(h("button", { type: "button", class: "chipb" + (state.preset === k ? " on" : ""), text: G.PRESETS[k].label, onclick: function () {
            if (state.preset === k) return;
            G.applyPreset(state, k, true); blobs = {}; rebuildPanels("start"); changed(true);
          } }));
        });
        return [
          group("Kind of business", [types, h("p", { class: "hint", text: "Fills in example words and photos. Your design stays as it is." })]),
          h("div", { class: "cols2" }, [text("Business name", "name", { max: 40 }), text("One-line description", "tagline", { max: 90 })]),
          group("What’s on your site", [h("p", { class: "hint", text: "Drag to change the order. Switch any part off." }), sectionList()]),
          group("Layout", [seg("onePage", [[true, "One long page"], [false, "Separate pages"]])])
        ];
      } },
    theme: { id: "theme", title: function () { return "Colours & fonts"; }, sum: function () { var t = state.theme; return (t.custom ? "Your own colours" : G.PALETTES[t.pal].n) + " · " + G.HEAD_FONTS[t.hf][0]; },
      build: function () {
        return { tabs: [
          ["Colours", function () {
            var own = h("div", { class: "rv" + (state.theme.custom ? " open" : "") }, [h("div", { class: "rv-in" }, [h("div", { class: "rv-body" }, [customColours()])])]);
            var ob = h("button", { type: "button", class: "btn-text cap", text: "Choose your own colours", "aria-expanded": state.theme.custom ? "true" : "false" });
            ob.addEventListener("click", function () { var o = !own.classList.contains("open"); own.classList.toggle("open", o); ob.setAttribute("aria-expanded", o); });
            return [h("p", { class: "hint", text: "Changes the whole site. Each section can also have its own, under its Style tab." }), palettes(), h("div", { class: "grp" }, [ob, own])];
          }],
          ["Fonts", function () { return [h("p", { class: "hint", text: "Changes the whole site." }), h("div", { class: "cols2" }, [fontPick("Headings", "hf", state.theme), fontPick("Text", "bf", state.theme)])]; }],
          ["Sizes & shapes", function () { return [range("Text size", "theme.size", 90, 115, 5, "%"), range("Heading size", "theme.hscale", 80, 125, 5, "%"), group("Corners", [seg("theme.radius", [["square", "Square"], ["soft", "Soft"], ["round", "Round"]])]), group("Buttons", [seg("theme.btn", [["solid", "Solid"], ["outline", "Outline"], ["text", "Underline"]])])]; }]
        ] };
      } },
    header: { id: "header", title: function () { return "Header"; }, sum: function () { return G.SECTIONS.header[state.header.v].n; }, page: "home",
      build: function () { return { tabs: lookTabs("header", false) }; } },
    hero: { id: "hero", title: function () { return "Homepage"; }, sum: function () { return G.SECTIONS.hero[state.hero.v].n + " design"; }, page: "home",
      build: function () {
        return { tabs: lookTabs("hero", true).concat([
          ["Words", function () { return [text("Small line above", "hero.kick", { max: 60 }), text("Headline", "hero.title", { area: true, rows: 2, max: 90 }), text("Paragraph", "hero.text", { area: true, rows: 3, max: 240 }),
            group("Buttons", [buttonLink("cta", "Main button"), buttonLink("cta2", "Second button"), h("p", { class: "hint", text: "Leave a button's words empty to hide it." })]),
            reveal("Show three highlights under the top section", "hero.hlOn", [hlFields()]), factsBlock("hero")]; }],
          ["Photos", function () { return [photo("Main photo", "hero"), photo("Extra photo 1", "x1", "Used by some designs"), photo("Extra photo 2", "x2", "Used by some designs")]; }]
        ]) };
      } },
    product: { id: "product", title: function () { return "Product page"; }, sum: function () { return G.SECTIONS.product[state.product.v].n + " design"; }, page: "@product",
      build: function () { return { tabs: [["Design", function () { return [layouts("product"), h("p", { class: "hint", text: "Every product uses this page, filled with its own photo, name, price and sizes." })]; }], ["Style", function () { return styleBlock("product", true); }],
        ["Words", function () { return [h("div", { class: "cols2" }, [text("Button", "product.add", { max: 28 }), text("Size label", "product.sizeLabel", { max: 20 })]), h("div", { class: "cols2" }, [text("Message after adding", "product.added", { max: 80 }), text("Link to the bag", "product.view", { max: 24 })]), text("Small print under the button", "product.note", { area: true, rows: 2, max: 200 })]; }]] }; } },
    cart: { id: "cart", title: function () { return state.cart.label || "Bag"; }, sum: function () { return G.SECTIONS.cart[state.cart.v].n + " design"; }, page: "cart",
      build: function () { return { tabs: [["Design", function () { return [layouts("cart")]; }], ["Style", function () { return styleBlock("cart", true); }],
        ["Words", function () { return [h("div", { class: "cols2" }, [text("Name in header", "cart.label", { max: 16 }), text("Heading", "cart.title", { max: 40 })]), text("When it's empty", "cart.empty", { max: 80 }), h("div", { class: "cols2" }, [text("Keep shopping button", "cart.cont", { max: 28 }), text("Checkout button", "cart.go", { max: 28 })])]; }]] }; } },
    checkout: { id: "checkout", title: function () { return "Checkout & payments"; }, sum: function () { var on = G.PAY_METHODS.filter(function (m) { return (state.store.pay[m[0]] || {}).on; }).length; return G.SECTIONS.checkout[state.checkout.v].n + " · " + (state.store.payMode === "own" ? "your own payments" : on + " payment option" + (on === 1 ? "" : "s")); }, page: "checkout",
      build: function () { return { tabs: [["Design", function () { return [layouts("checkout")]; }], ["Payments", function () { return payBlock(); }], ["Orders", function () { return ordersBlock(); }], ["Style", function () { return styleBlock("checkout", true); }],
        ["Words", function () { return [text("Heading", "checkout.title", { max: 40 }), h("div", { class: "cols2" }, [text("Details heading", "checkout.detailsTitle", { max: 30 }), text("Order heading", "checkout.sumTitle", { max: 30 })]), h("div", { class: "cols2" }, [text("Payment heading", "checkout.payTitle", { max: 30 }), text("Place order button", "checkout.place", { max: 28 })]),
          text("Thank-you message", "checkout.done", { area: true, rows: 2, max: 200 }), text("Thank-you message when you take payment yourself", "checkout.ownDone", { area: true, rows: 2, max: 200 }), text("Text above “Place order”", "checkout.ownText", { area: true, rows: 2, max: 200 })]; }]] }; } },
    footer: { id: "footer", title: function () { return "Footer"; }, sum: function () { return G.SECTIONS.footer[state.footer.v].n + " design"; }, page: "home", where: "bottom",
      build: function () { return { tabs: [["Design", function () { return [layouts("footer"), h("p", { class: "hint", text: "Click any words in the footer on the left to change them." })]; }], ["Style", function () { return styleBlock("footer", false); }]] }; } }
  };
  /* What each kind of section offers. `k` is the section's own key: "gallery", "gallery2"… */
  var TYPE_TABS = {
    about: function (k) {
      return lookTabs(k, true).concat([
        ["Words", function () { return [h("div", { class: "cols2" }, [text("Name in menu", k + ".label", { max: 16 }), text("Heading", k + ".title", { max: 90 })]), text("Your story", k + ".text", { area: true, rows: 6, max: 1200 }), h("p", { class: "hint", text: "Leave a blank line to start a new paragraph." }), factsBlock(k)]; }],
        ["Photos", function () { return [photo("Main photo", "about", null, k), photo("Second photo", "x1", "Used by some designs", k)]; }]
      ]);
    },
    services: function (k) {
      return lookTabs(k, true, [photo("Side photo", "x1", "Used by the With photo design", k)]).concat([
        ["Words", function () { return [h("div", { class: "cols2" }, [text("Name in menu", k + ".label", { max: 16 }), text("Heading", k + ".title", { max: 60 })]), text("Intro", k + ".intro", { area: true, rows: 2, max: 200 }), factsBlock(k)]; }],
        ["Items & prices", function () { return [itemsEditor(k)]; }]
      ]);
    },
    shop: function (k) {
      return lookTabs(k, true).concat([
        ["Products", function () { return [h("p", { class: "hint", text: "Name, price and photo for each product. Click a product on your site to see its own page." }), productsEditor(k)]; }],
        ["Words", function () { return [h("div", { class: "cols2" }, [text("Name in menu", k + ".label", { max: 16 }), text("Heading", k + ".title", { max: 60 })]), text("Intro", k + ".intro", { area: true, rows: 2, max: 200 }), factsBlock(k)]; }]
      ]);
    },
    gallery: function (k) {
      return lookTabs(k, true).concat([
        ["Photos", function () { return [h("div", { class: "cols2" }, [text("Name in menu", k + ".label", { max: 16 }), text("Heading", k + ".title", { max: 60 })]), photoGrid(k), h("p", { class: "hint", text: "Tap any photo to replace it with your own." }), factsBlock(k)]; }]
      ]);
    },
    booking: function (k) {
      return lookTabs(k, true, [photo("Photo", "x1", "Used by the Photo split design", k)]).concat([
        ["Words & options", function () { return [group("What people book", [seg(k + ".kind", [["table", "A table"], ["appointment", "Appointment"], ["enquiry", "Enquiry"]])]),
          h("div", { class: "cols2" }, [text("Name in menu", k + ".label", { max: 16 }), text("Button", k + ".button", { max: 28 })]), text("Heading", k + ".title", { max: 60 }), text("Intro", k + ".intro", { area: true, rows: 2, max: 200 }),
          text("Choices, separated by commas", k + ".options", { max: 200 }), h("p", { class: "hint", text: "Shown as buttons, e.g. the service or occasion." }),
          text("Times people can pick, separated by commas", k + ".times", { max: 300, ph: state[k].kind === "table" ? "5:30pm, 6:00pm, 6:30pm…" : "9:00am, 10:00am, 11:00am…" }), h("p", { class: "hint", text: "Leave empty to use our usual times. Every design has a full calendar, so people can pick any future date." }), factsBlock(k)]; }],
        ["Requests", function () { return destBlock(k); }]
      ]);
    },
    contact: function (k) {
      var tabs = [], on = G.isOn(state, "contact");
      if (on) { tabs.push(["Design", function () { return [layouts("contact")]; }]); tabs.push(["Style", function () { return styleBlock("contact", true); }]); }
      tabs.push(["Your details", function () { return [text("Address", "contact.address", { area: true, rows: 2, max: 160 }), text("Opening hours", "contact.hours", { area: true, rows: 4, max: 300 }), h("p", { class: "hint", text: "One line per day or group of days." }),
        h("div", { class: "cols2" }, [text("Phone", "contact.phone", { max: 30 }), text("Email shown on your site", "contact.email", { max: 80, type: "email" })]),
        on ? h("div", { class: "cols2" }, [text("Name in menu", "contact.label", { max: 16 }), text("Heading", "contact.title", { max: 60 })]) : null, text("A short note", "contact.note", { area: true, rows: 2, max: 200 }),
        on ? photo("Photo", "x2", "Used by the With photo design") : null, on ? factsBlock("contact") : null]; }]);
      return tabs;
    },
    terms: function (k) {
      return lookTabs(k, true).concat([
        ["Words", function () { return [group("Where it goes", [seg("terms.place", [["footer", "Link in the footer"], ["section", "Its own section"]], function () { setTimeout(function () { goPage("terms"); }, 60); }),
            h("p", { class: "hint", text: "“Link in the footer” keeps it off your main pages: clicking the link opens the terms on a page of their own." })]),
          h("div", { class: "cols2" }, [text("Heading", "terms.title", { max: 60 }), text("Name in menu and footer", "terms.label", { max: 20 })]), text("Date line", "terms.updated", { max: 60 }),
          text("Your terms", "terms.text", { area: true, rows: 16, max: 8000 }),
          h("p", { class: "hint", text: "Start each part with a short heading on its own line and the text underneath. Leave a blank line between parts." }),
          h("p", { class: "hint note", text: "This is a starting point, not legal advice. Change it to match how your business works." })]; }]
      ]);
    }
  };
  function secSum(k) {
    var ty = G.typeOf(state, k), o = state[k], d = G.SECTIONS[ty][o.v | 0].n;
    if (ty === "services") return d + " · " + (o.items || []).length + " items";
    if (ty === "shop") return d + " · " + (o.items || []).filter(function (x) { return x.n; }).length + " products";
    if (ty === "booking") return d + " · " + { table: "tables", appointment: "appointments", enquiry: "enquiries" }[o.kind];
    if (ty === "contact") return G.isOn(state, "contact") ? d + " design" : "Address, hours, phone and email";
    return d + " design";
  }
  var panelCache = {};
  function panelFor(k) {
    if (STATIC[k]) return STATIC[k];
    if (panelCache[k]) return panelCache[k];
    return (panelCache[k] = { id: k, title: function () { return k === "contact" && !G.isOn(state, "contact") ? "Contact details" : rowName(k); }, sum: function () { return secSum(k); }, page: k,
      build: function () { return { tabs: TYPE_TABS[G.typeOf(state, k)](k) }; } });
  }
  function destBlock(k) {
    var mail = h("div", { class: "grp" }, [text("Send requests to this email", "contact.email", { max: 80, type: "email" }),
      h("p", { class: "hint", text: "Your site’s forms use FormSubmit, a free form service, to email each request straight to you. The first one asks you to confirm the address." })]);
    var mine = h("p", { class: "hint", text: "The forms stay on your site but won’t send anything until you connect your own booking tool or form service." });
    function paint() { var own = state[k].dest === "own"; mail.hidden = own; mine.hidden = !own; }
    paint();
    return [group("Where should booking requests go?", [seg(k + ".dest", [["email", "To my email"], ["own", "I’ll set this up myself"]], paint)]), mail, mine,
      h("p", { class: "hint note", text: "Onwards Digital never receives, stores or sends your bookings, and doesn’t put your site online for you. You own and run it." })];
  }
  function hlFields() {
    var box = h("div", { class: "hls" });
    state.hl.forEach(function (x, i) {
      var t = h("input", { class: "fi", "data-path": "hl." + i + ".0", value: x[0], maxlength: 40, "aria-label": "Highlight " + (i + 1) + " title" });
      var d = h("textarea", { class: "fi", "data-path": "hl." + i + ".1", rows: 2, maxlength: 140, "aria-label": "Highlight " + (i + 1) + " text" }); d.value = x[1];
      t.addEventListener("input", function () { state.hl[i][0] = t.value; changed(); });
      d.addEventListener("input", function () { state.hl[i][1] = d.value; changed(); });
      box.appendChild(h("div", { class: "hl-row" }, [t, d]));
    });
    return box;
  }
  function factFields(key) {
    var box = h("div", { class: "facts3" });
    state[key].facts.forEach(function (x, i) {
      var v = h("input", { class: "fi", "data-path": key + ".facts." + i + ".0", value: x[0], maxlength: 10, placeholder: "12", "aria-label": "Fact " + (i + 1) + " number" });
      var l = h("input", { class: "fi", "data-path": key + ".facts." + i + ".1", value: x[1], maxlength: 30, placeholder: "dishes on the menu", "aria-label": "Fact " + (i + 1) + " label" });
      v.addEventListener("input", function () { state[key].facts[i][0] = v.value; changed(); });
      l.addEventListener("input", function () { state[key].facts[i][1] = l.value; changed(); });
      box.appendChild(h("div", { class: "fact-row" }, [v, l]));
    });
    return box;
  }
  function itemsEditor(k) {
    var box = h("div", { class: "items" }), o = state[k];
    function draw() {
      box.innerHTML = "";
      o.items.forEach(function (x, i) {
        var n = h("input", { class: "fi", "data-path": k + ".items." + i + ".n", value: x.n, placeholder: "Name", maxlength: 50, "aria-label": "Item name" });
        var p = h("input", { class: "fi", "data-path": k + ".items." + i + ".p", value: x.p, placeholder: "Price", maxlength: 14, "aria-label": "Price" });
        var d = h("input", { class: "fi", "data-path": k + ".items." + i + ".d", value: x.d, placeholder: "Short description", maxlength: 120, "aria-label": "Description" });
        n.addEventListener("input", function () { x.n = n.value; changed(); });
        p.addEventListener("input", function () { x.p = p.value; changed(); });
        d.addEventListener("input", function () { x.d = d.value; changed(); });
        var rm = h("button", { type: "button", class: "x", "aria-label": "Remove " + (x.n || "item"), html: "&times;", onclick: function () { o.items.splice(i, 1); draw(); changed(true); } });
        box.appendChild(h("div", { class: "item" }, [n, p, rm, d]));
      });
      if (o.items.length < 12) box.appendChild(h("button", { type: "button", class: "btn-text cap add", text: "Add an item", onclick: function () { o.items.push({ n: "", p: "", d: "" }); draw(); changed(true); var f = box.querySelectorAll(".item"); if (f.length) f[f.length - 1].querySelector("input").focus(); } }));
    }
    draw();
    return box;
  }

  var list = $(".bl-panels", root), open = null, nodes = {}, tabOf = {};
  function makeNode(p) {
    var inner = h("div", { class: "pn-in" });
    var body = h("div", { class: "pn-c", id: "pn-" + p.id, role: "region" }, [h("div", { class: "pn-b" }, [inner])]);
    var head = h("button", { type: "button", class: "pn-h", "aria-expanded": "false", "aria-controls": "pn-" + p.id }, [
      h("span", { class: "pn-no" }), h("span", { class: "pn-t" }, [h("span", { class: "pn-n", text: p.title() }), h("span", { class: "pn-s muted", text: p.sum() })]), h("span", { class: "pn-i", "aria-hidden": "true" })
    ]);
    head.addEventListener("click", function () { toggleP(p.id); });
    return { p: p, node: h("div", { class: "pn" }, [head, body]), head: head, body: body, inner: inner };
  }
  function visible() {
    var ids = ["start", "theme", "header", "hero"];
    var lastShop = -1;
    state.layout.forEach(function (e) { if (e.on && state[e.k]) { ids.push(e.k); if (G.typeOf(state, e.k) === "shop") lastShop = ids.length; } });
    if (lastShop > 0) ids.splice(lastShop, 0, "product", "cart", "checkout");
    if (!G.isOn(state, "contact")) ids.push("contact");
    if (state.footerOn) ids.push("footer");
    return ids.map(panelFor);
  }
  function number() { visible().forEach(function (p, i) { if (nodes[p.id]) $(".pn-no", nodes[p.id].head).textContent = i + 1; }); }
  function buildList() { list.innerHTML = ""; nodes = {}; syncList(true); }
  /* Sections switched on, off, added, removed or moved: dropdowns slide in or out and follow the new order */
  function syncList(quiet) {
    var want = visible(), ids = want.map(function (p) { return p.id; });
    Object.keys(nodes).forEach(function (id) {
      if (ids.indexOf(id) >= 0) return;
      var n = nodes[id]; if (open === id) open = null; delete nodes[id];
      var el = n.node, h0 = el.offsetHeight;
      if (el.animate) el.animate([{ height: h0 + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 260, easing: "ease-in" }).onfinish = function () { el.remove(); };
      else el.remove();
    });
    var prev = null;
    want.forEach(function (p) {
      var n = nodes[p.id], fresh = !n;
      if (fresh) n = nodes[p.id] = makeNode(p);
      var after = prev ? prev.nextSibling : list.firstChild;
      if (n.node !== after) list.insertBefore(n.node, after);
      if (fresh && !quiet && n.node.animate) { var hh = n.node.offsetHeight; n.node.animate([{ height: "0px", opacity: 0 }, { height: hh + "px", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" }); }
      prev = n.node;
    });
    number(); paintSummaries();
  }
  function fill(n) {
    clearTimeout(n.t); painters = []; customInputs = [];
    var r = n.p.build(), inner = n.inner; inner.innerHTML = "";
    function add(k) { if (k) inner.appendChild(k); }
    if (Array.isArray(r)) r.forEach(add);
    else {
      var bar = h("div", { class: "ptabs", role: "tablist" }), area = h("div", { class: "ptab-area" });
      var show = function (i) {
        painters = []; customInputs = [];
        [].forEach.call(bar.children, function (x, j) { x.classList.toggle("on", j === i); x.setAttribute("aria-selected", j === i); });
        area.innerHTML = ""; area.classList.remove("in"); void area.offsetWidth; area.classList.add("in");
        r.tabs[i][1]().forEach(function (k) { if (k) area.appendChild(k); });
        tabOf[n.p.id] = i; requestAnimationFrame(sizeThumbs);
      };
      r.tabs.forEach(function (t, i) { bar.appendChild(h("button", { type: "button", role: "tab", text: t[0], onclick: function () { show(i); } })); });
      add(bar); add(area);
      show(Math.min(tabOf[n.p.id] || 0, r.tabs.length - 1));
    }
    var ids = visible().map(function (p) { return p.id; }), next = ids[ids.indexOf(n.p.id) + 1];
    add(h("div", { class: "pn-next" }, [next
      ? h("button", { type: "button", class: "btn-line", text: "Next: " + nodes[next].p.title(), onclick: function () { toggleP(next); } })
      : h("button", { type: "button", class: "btn", text: "I’m happy with it — buy this site", onclick: openBuy })]));
  }
  function toggleP(id, instant) {
    var n = nodes[id]; if (!n) return;
    var willOpen = open !== id;
    if (open && nodes[open]) {
      var o = nodes[open]; o.node.classList.remove("open", "settled"); o.head.setAttribute("aria-expanded", "false");
      o.t = setTimeout(function () { if (!o.node.classList.contains("open")) o.inner.innerHTML = ""; }, 420);
    }
    open = null;
    if (!willOpen) return;
    open = id;
    fill(n); n.head.setAttribute("aria-expanded", "true");
    if (instant) { n.node.classList.add("noanim", "open"); requestAnimationFrame(function () { n.node.classList.remove("noanim"); }); }
    else requestAnimationFrame(function () { n.node.classList.add("open"); });
    clearTimeout(n.st); n.st = setTimeout(function () { if (open === id) n.node.classList.add("settled"); }, instant ? 0 : 400);
    if (n.p.page) { var cx = G.ctx(state), pg = n.p.page === "@product" ? ((cx.pages.filter(function (x) { return x.type === "product"; })[0] || {}).id || "home") : n.p.page; if (pg !== "home" && !cx.has(pg)) pg = "home"; goPage(pg, n.p.where || (pg === "home" && n.p.page !== "home" ? "bottom" : null)); }
    if (!instant) setTimeout(function () {
      if (open !== id) return;
      if (list.scrollHeight > list.clientHeight + 4) list.scrollTo({ top: n.node.offsetTop, behavior: "smooth" });
      else if (window.innerWidth <= 860) { var r = n.head.getBoundingClientRect(), pv = root.querySelector(".bl-view").getBoundingClientRect(); if (r.top < pv.bottom || r.top > window.innerHeight - 80) window.scrollBy({ top: r.top - pv.bottom - 8, behavior: "smooth" }); }
    }, 380);
  }
  function rebuildPanels(keep) {
    var was = keep || open;
    buildList(); open = null;
    if (was && nodes[was]) toggleP(was, true);
  }
  function paintSummaries() { Object.keys(nodes).forEach(function (k) { var n = nodes[k]; $(".pn-n", n.head).textContent = n.p.title(); $(".pn-s", n.head).textContent = n.p.sum(); }); }

  buildList();
  toggleP("start", true);
  fit();

  /* ── Buying ────────────────────────────────────────────── */
  var modal = $("[data-buy-modal]", root), mForm = $("#buy-form", root);
  var own = $("#buy-own", root), ownerIn = $("#buy-owner", root);
  function paintOwn() { var on = own.checked; ownerIn.disabled = on; ownerIn.closest(".field").classList.toggle("off", on); if (on) ownerIn.closest(".field").classList.remove("invalid"); }
  own.addEventListener("change", paintOwn);

  function openBuy() {
    var ce = (state.contact.email || "").trim();
    if (!ownerIn.value) ownerIn.value = /example\.com$/i.test(ce) ? "" : ce;
    own.checked = bookingKeys().every(function (k) { return state[k].dest === "own"; });
    paintOwn();
    showModal(modal, "#buy-name");
    if (window.__paintSubmit) window.__paintSubmit();
  }
  function closeBuy() { hideModal(modal); }
  function bookingKeys() { var ks = state.layout.filter(function (e) { return G.typeOf(state, e.k) === "booking"; }).map(function (e) { return e.k; }); return ks.length ? ks : ["booking"]; }
  root.querySelectorAll("[data-buy]").forEach(function (b) { b.addEventListener("click", openBuy); });
  root.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeBuy); });
  modal.addEventListener("click", function (e) { if (e.target === modal) closeBuy(); });
  document.addEventListener("keydown", function (e) { if (e.key !== "Escape") return; if (!modal.hidden) closeBuy(); if (!resetModal.hidden) hideModal(resetModal); });

  function toDataURL(blob) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { res(""); }; r.readAsDataURL(blob); }); }
  function finishedSite() {
    var s = JSON.parse(JSON.stringify(state)), jobs = [];
    function swap(get, put) { var u = get(); if (blobs[u]) jobs.push(toDataURL(blobs[u]).then(put)); }
    imgSets(s).forEach(function (im) {
      ["hero", "x1", "x2", "about"].forEach(function (k) { swap(function () { return im[k]; }, function (d) { im[k] = d; }); });
      (im.g || []).forEach(function (u, i) { swap(function () { return u; }, function (d) { im.g[i] = d; }); });
    });
    (s.layout || []).forEach(function (e) { var o = s[e.k]; if (o && o.items && G.typeOf(s, e.k) === "shop") o.items.forEach(function (x) { swap(function () { return x.img; }, function (d) { x.img = d; }); }); });
    return Promise.all(jobs).then(function () { return G.doc(s); });
  }
  function summary() {
    var t = state.theme, c = G.ctx(state);
    return [
      "Pages: " + c.pages.map(function (p) { return p.label; }).join(", ") + (state.onePage ? " (one long page)" : ""),
      "Colours: " + (t.custom ? "custom " + t.custom.bg + " / " + t.custom.fg + " / " + t.custom.ac : G.PALETTES[t.pal].n),
      "Fonts: " + G.HEAD_FONTS[t.hf][0] + " + " + G.BODY_FONTS[t.bf][0] + ", text " + t.size + "%, headings " + t.hscale + "%",
      "Corners: " + t.radius + ", buttons: " + t.btn,
      G.ctx(state).has("cart") ? "Store: " + state.layout.filter(function (e) { return e.on && G.typeOf(state, e.k) === "shop"; }).map(function (e) { return state[e.k].items.length + " products"; }).join(" + ") + "; payments: " + (state.store.payMode === "own" ? "customer adds their own" : G.PAY_METHODS.filter(function (m) { return (state.store.pay[m[0]] || {}).on; }).map(function (m) { return m[1] + ((state.store.pay[m[0]].url || state.store.pay[m[0]].text) ? "" : " (no link yet)"); }).join(", ")) + "; orders " + (state.store.orders === "own" ? "set up by customer" : "to " + state.contact.email) : "Store: none",
      "Designs: " + ["header", "hero"].concat(state.layout.filter(function (e) { return e.on; }).map(function (e) { return e.k; }), state.footerOn ? ["footer"] : []).map(function (k) { return k + " " + G.SECTIONS[G.typeOf(state, k)][state[k].v].n; }).join(" · ") + (state.footerOn ? "" : " · no footer")
    ].join("\n");
  }
  mForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#buy-name", root), email = $("#buy-email", root), owner = ownerIn, err = $("#buy-err", root);
    var re = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, bad = null, msg = "";
    var del = mForm.querySelector('input[name="delivery"]:checked'), selfSetup = own.checked;
    [name, email, owner].forEach(function (x) { x.closest(".field").classList.remove("invalid"); });
    if (!name.value.trim()) { bad = name; msg = "Please enter your name."; }
    else if (!re.test(email.value.trim())) { bad = email; msg = "Please enter a valid email address, like name@gmail.com"; }
    else if (!selfSetup && !re.test(owner.value.trim())) { bad = owner; msg = "Enter the email for bookings, or choose “I want to set this up on my own”."; }
    if (bad) { bad.closest(".field").classList.add("invalid"); err.textContent = msg; bad.focus(); return; }
    err.textContent = "";
    bookingKeys().forEach(function (k) { state[k].dest = selfSetup ? "own" : "email"; });
    if (!selfSetup) state.contact.email = owner.value.trim();
    save(); apply();
    var btn = $("#submit-btn", root); btn.disabled = true; btn.textContent = "Preparing your site…";
    finishedSite().then(function (html) {
      var slug = (state.name || "website").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "website";
      var file; try { file = new File([html], slug + "-website.html", { type: "text/html" }); } catch (x) { file = new Blob([html], { type: "text/html" }); file.name = slug + "-website.html"; }
      var fields = [
        ["name", name.value.trim()], ["email", email.value.trim()], ["business_name", state.name],
        ["booking_email", selfSetup ? "Customer will set this up on their own" : state.contact.email],
        ["delivery", del.getAttribute("data-label")],
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
