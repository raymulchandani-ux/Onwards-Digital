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
  var LS = "onwards-builder-v2";

  /* ── State ─────────────────────────────────────────────── */
  var state;
  try { state = JSON.parse(localStorage.getItem(LS) || "null"); } catch (e) { state = null; }
  if (!state || !state.theme || !state.img) state = G.defaults("restaurant");
  (function fillMissing(o, d) { Object.keys(d).forEach(function (k) { if (o[k] === undefined) o[k] = JSON.parse(JSON.stringify(d[k])); else if (d[k] && typeof d[k] === "object" && !Array.isArray(d[k]) && o[k] && typeof o[k] === "object") fillMissing(o[k], d[k]); }); })(state, G.defaults(state.preset || "restaurant"));
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
    Object.keys(G.SECTIONS).forEach(function (k) { state[k].v = rnd(G.SECTIONS[k].length); });
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
    var list = G.SECTIONS[sec], frames = [];
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
  function lookBlock(sec, withSize) {
    return [
      group("Design", [layouts(sec)]),
      group("Section colour", [tones(sec)]),
      withSize ? group("Heading size", [seg(sec + ".hs", [["s", "Small"], ["m", "Medium"], ["l", "Large"]])]) : null
    ];
  }
  function secColors(k) { var o = state[k]; return (o && (o.custom || (o.pal != null && G.PALETTES[o.pal]))) || G.colors(state); }
  function secPalettes(sec) {
    var o = state[sec], box = h("div", { class: "pals" });
    function mark(x) { [].forEach.call(box.children, function (c) { c.classList.toggle("on", c === x); }); }
    var same = h("button", { type: "button", class: "pal same" + (o.pal == null && !o.custom ? " on" : ""), title: "Same as the rest of the site", "aria-label": "Same as the rest of the site", text: "Site" });
    same.addEventListener("click", function () { o.pal = null; o.custom = null; mark(same); changed(true); });
    box.appendChild(same);
    G.PALETTES.forEach(function (p, i) {
      var b = h("button", { type: "button", class: "pal" + (o.pal === i && !o.custom ? " on" : ""), title: p.n, "aria-label": p.n, style: "background:" + p.bg }, [h("i", { style: "background:" + p.fg }), h("i", { style: "background:" + p.ac })]);
      b.addEventListener("click", function () { o.pal = i; o.custom = null; mark(b); changed(true); });
      box.appendChild(b);
    });
    return box;
  }
  function secSize(sec) {
    var o = state[sec], val = function () { return o.size != null ? o.size : state.theme.size; };
    var out = h("output", { text: val() + "%" }), inp = h("input", { type: "range", min: 85, max: 120, step: 5, value: val(), "aria-label": "Text size for this section" });
    var reset = h("button", { type: "button", class: "btn-text cap rs", text: "Reset", hidden: o.size == null });
    inp.addEventListener("input", function () { o.size = +inp.value; out.textContent = inp.value + "%"; reset.hidden = false; changed(); });
    reset.addEventListener("click", function () { o.size = null; inp.value = val(); out.textContent = val() + "%"; reset.hidden = true; changed(true); });
    return h("div", { class: "rng" }, [h("span", { class: "fl-l", text: "Text size" }), inp, out, reset]);
  }
  function styleBlock(sec, withSize) {
    return [
      h("p", { class: "hint", text: "These change this section only. To change the whole site at once, use Colours & fonts." }),
      group("Background", [tones(sec)]),
      group("Sizes", [secSize(sec), withSize ? h("div", { class: "fl" }, [h("span", { class: "fl-l", text: "Heading size" }), seg(sec + ".hs", [["s", "Small"], ["m", "Medium"], ["l", "Large"]])]) : null]),
      group("Colours", [secPalettes(sec)]),
      group("Fonts", [h("div", { class: "cols2" }, [fontPick("Headings", "hf", state[sec]), fontPick("Text", "bf", state[sec])])])
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
    function nameOf(i) { return i == null ? "Same as site" : list[i][0]; }
    function paint() {
      var i = obj[which]; btn.innerHTML = "";
      btn.appendChild(h("span", { class: "fp-l", text: label }));
      btn.appendChild(h("span", { class: "fp-v", text: nameOf(i), style: i == null ? null : "font-family:'" + list[i][0] + "',serif" }));
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
    if (allowSame) pop.appendChild(h("button", { type: "button", role: "option", class: "fp-o same", "data-i": "", text: "Same as the rest of the site", onclick: function () { choose(null); } }));
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
  var PANELS = [
    { id: "start", title: function () { return "Your business"; }, sum: function () { var n = G.ctx(state).pages.length; return state.name + " · " + n + (state.onePage ? " sections on one page" : " pages"); }, page: "home",
      build: function () {
        var types = h("div", { class: "chips" });
        Object.keys(G.PRESETS).forEach(function (k) {
          types.appendChild(h("button", { type: "button", class: "chipb" + (state.preset === k ? " on" : ""), text: G.PRESETS[k].label, onclick: function () {
            if (state.preset === k) return;
            G.applyPreset(state, k, true); blobs = {}; rebuildPanels("start"); changed(true);
          } }));
        });
        var pages = h("div", { class: "sws" }, [
          toggle("About", "pages.about", pageToggled("about")), toggle(state.services.label || "Services", "pages.services", pageToggled("services")),
          toggle("Gallery", "pages.gallery", pageToggled("gallery")), toggle("Booking system", "pages.booking", pageToggled("booking")), toggle("Contact", "pages.contact", pageToggled("contact")), toggle("Terms of service", "pages.terms", pageToggled("terms"))
        ]);
        return [
          group("Kind of business", [types, h("p", { class: "hint", text: "Fills in example words and photos. Your design stays as it is." })]),
          h("div", { class: "cols2" }, [text("Business name", "name", { max: 40 }), text("One-line description", "tagline", { max: 90 })]),
          group("What’s on your site", [pages]),
          group("Layout", [seg("onePage", [[true, "One long page"], [false, "Separate pages"]])])
        ];
      } },
    { id: "theme", title: function () { return "Colours & fonts"; }, sum: function () { var t = state.theme; return (t.custom ? "Your own colours" : G.PALETTES[t.pal].n) + " · " + G.HEAD_FONTS[t.hf][0]; },
      build: function () {
        return { tabs: [
          ["Colours", function () { return [palettes(), h("p", { class: "hint", text: "Or choose your own:" }), customColours()]; }],
          ["Fonts", function () { return [group("Headings", [fontList("hf")]), group("Text", [fontList("bf")])]; }],
          ["Sizes & shapes", function () { return [range("Text size", "theme.size", 90, 115, 5, "%"), range("Heading size", "theme.hscale", 80, 125, 5, "%"), group("Corners", [seg("theme.radius", [["square", "Square"], ["soft", "Soft"], ["round", "Round"]])]), group("Buttons", [seg("theme.btn", [["solid", "Solid"], ["outline", "Outline"], ["text", "Underline"]])])]; }]
        ] };
      } },
    { id: "header", title: function () { return "Header"; }, sum: function () { return G.SECTIONS.header[state.header.v].n; }, page: "home",
      build: function () { return { tabs: lookTabs("header", false) }; } },
    { id: "hero", title: function () { return "Homepage"; }, sum: function () { return G.SECTIONS.hero[state.hero.v].n + " design"; }, page: "home",
      build: function () {
        return { tabs: lookTabs("hero", true).concat([
          ["Words", function () { return [text("Small line above", "hero.kick", { max: 60 }), text("Headline", "hero.title", { area: true, rows: 2, max: 90 }), text("Paragraph", "hero.text", { area: true, rows: 3, max: 240 }),
            h("div", { class: "cols2" }, [text("Main button", "hero.cta", { max: 28 }), text("Second button", "hero.cta2", { max: 28 })]),
            group("Three highlights", [toggle("Show highlights", "hero.hlOn"), hlFields()])]; }],
          ["Photos", function () { return [photo("Main photo", "hero"), photo("Extra photo 1", "x1", "Used by some designs"), photo("Extra photo 2", "x2", "Used by some designs")]; }]
        ]) };
      } },
    { id: "about", need: "about", title: function () { return "About"; }, sum: function () { return G.SECTIONS.about[state.about.v].n + " design"; }, page: "about",
      build: function () {
        return { tabs: lookTabs("about", true).concat([
          ["Words", function () { return [text("Heading", "about.title", { area: true, rows: 2, max: 90 }), text("Your story", "about.text", { area: true, rows: 6, max: 1200 }), h("p", { class: "hint", text: "Leave a blank line to start a new paragraph." }), group("Key facts", [h("p", { class: "hint", text: "Three short facts shown as big numbers with a label, e.g. “12 — dishes on the menu”. Some About designs show them. Clear all three to hide them." }), factFields()])]; }],
          ["Photos", function () { return [photo("Main photo", "about"), photo("Second photo", "x1", "Used by some designs")]; }]
        ]) };
      } },
    { id: "services", need: "services", title: function () { return state.services.label || "Services"; }, sum: function () { return G.SECTIONS.services[state.services.v].n + " · " + state.services.items.length + " items"; }, page: "services",
      build: function () {
        return { tabs: lookTabs("services", true, [photo("Side photo", "x1", "Used by the With photo design")]).concat([
          ["Words", function () { return [h("div", { class: "cols2" }, [text("Name in menu", "services.label", { max: 16 }), text("Heading", "services.title", { max: 60 })]), text("Intro", "services.intro", { area: true, rows: 2, max: 200 })]; }],
          ["Items & prices", function () { return [itemsEditor()]; }]
        ]) };
      } },
    { id: "gallery", need: "gallery", title: function () { return "Gallery"; }, sum: function () { return G.SECTIONS.gallery[state.gallery.v].n + " design"; }, page: "gallery",
      build: function () {
        return { tabs: lookTabs("gallery", true).concat([
          ["Photos", function () { return [h("div", { class: "cols2" }, [text("Name in menu", "gallery.label", { max: 16 }), text("Heading", "gallery.title", { max: 60 })]), photoGrid(), h("p", { class: "hint", text: "Tap any photo to replace it with your own." })]; }]
        ]) };
      } },
    { id: "booking", need: "booking", title: function () { return "Booking system"; }, sum: function () { return G.SECTIONS.booking[state.booking.v].n + " · " + { table: "tables", appointment: "appointments", enquiry: "enquiries" }[state.booking.kind]; }, page: "booking",
      build: function () {
        return { tabs: lookTabs("booking", true, [photo("Photo", "x1", "Used by the Photo split design")]).concat([
          ["Words & options", function () { return [group("What people book", [seg("booking.kind", [["table", "A table"], ["appointment", "Appointment"], ["enquiry", "Enquiry"]])]),
            h("div", { class: "cols2" }, [text("Name in menu", "booking.label", { max: 16 }), text("Button", "booking.button", { max: 28 })]), text("Heading", "booking.title", { max: 60 }), text("Intro", "booking.intro", { area: true, rows: 2, max: 200 }),
            text("Choices, separated by commas", "booking.options", { max: 200 }), h("p", { class: "hint", text: "Shown as buttons, e.g. the service or occasion." }),
            text("Times people can pick, separated by commas", "booking.times", { max: 300, ph: state.booking.kind === "table" ? "5:30pm, 6:00pm, 6:30pm…" : "9:00am, 10:00am, 11:00am…" }), h("p", { class: "hint", text: "Leave empty to use our usual times. Every design has a full calendar, so people can pick any future date." })]; }],
          ["Requests", function () { return destBlock(); }]
        ]) };
      } },
    { id: "contact", title: function () { return "Contact & footer"; }, sum: function () { return (state.pages.contact ? G.SECTIONS.contact[state.contact.v].n + " · " : "") + G.SECTIONS.footer[state.footer.v].n + " footer"; }, page: "contact",
      build: function () {
        var tabs = [];
        if (state.pages.contact) { tabs.push(["Design", function () { return [layouts("contact")]; }]); tabs.push(["Style", function () { return styleBlock("contact", true); }]); }
        tabs.push(["Your details", function () { return [text("Address", "contact.address", { area: true, rows: 2, max: 160 }), text("Opening hours", "contact.hours", { area: true, rows: 4, max: 300 }), h("p", { class: "hint", text: "One line per day or group of days." }),
          h("div", { class: "cols2" }, [text("Phone", "contact.phone", { max: 30 }), text("Email shown on your site", "contact.email", { max: 80, type: "email" })]),
          state.pages.contact ? text("Heading", "contact.title", { max: 60 }) : null, text("A short note", "contact.note", { area: true, rows: 2, max: 200 }),
          state.pages.contact ? photo("Photo", "x2", "Used by the With photo design") : null]; }]);
        tabs.push(["Footer", function () { return [layouts("footer"), toggle("Show “Site by Onwards Digital”", "credit")]; }]);
        tabs.push(["Footer style", function () { return styleBlock("footer", false); }]);
        return { tabs: tabs };
      } },
    { id: "terms", need: "terms", title: function () { return "Terms of service"; }, sum: function () { return G.SECTIONS.terms[state.terms.v].n + " design"; }, page: "terms",
      build: function () {
        return { tabs: lookTabs("terms", true).concat([
          ["Words", function () { return [h("div", { class: "cols2" }, [text("Heading", "terms.title", { max: 60 }), text("Name in footer", "terms.label", { max: 20 })]), text("Date line", "terms.updated", { max: 60 }),
            text("Your terms", "terms.text", { area: true, rows: 16, max: 8000 }),
            h("p", { class: "hint", text: "Start each part with a short heading on its own line and the text underneath. Leave a blank line between parts." }),
            h("p", { class: "hint note", text: "This is a starting point, not legal advice. Change it to match how your business works." })]; }]
        ]) };
      } }
  ];
  function destBlock() {
    var mail = h("div", { class: "grp" }, [text("Send requests to this email", "contact.email", { max: 80, type: "email" }),
      h("p", { class: "hint", text: "Your site’s forms use FormSubmit, a free form service, to email each request straight to you. The first one asks you to confirm the address." })]);
    var mine = h("p", { class: "hint", text: "The forms stay on your site but won’t send anything until you connect your own booking tool or form service." });
    function paint() { var own = state.booking.dest === "own"; mail.hidden = own; mine.hidden = !own; }
    paint();
    return [group("Where should booking requests go?", [seg("booking.dest", [["email", "To my email"], ["own", "I’ll set this up myself"]], paint)]), mail, mine,
      h("p", { class: "hint note", text: "Onwards Digital never receives, stores or sends your bookings, and doesn’t put your site online for you. You own and run it." })];
  }
  /* A page switched on scrolls the preview to it, so the change is visible straight away */
  function pageToggled(id) { return function (on) { syncList(); if (on) setTimeout(function () { goPage(id); }, 120); }; }
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
  function factFields() {
    var box = h("div", { class: "facts3" });
    state.about.facts.forEach(function (x, i) {
      var v = h("input", { class: "fi", "data-path": "about.facts." + i + ".0", value: x[0], maxlength: 10, "aria-label": "Number " + (i + 1) });
      var l = h("input", { class: "fi", "data-path": "about.facts." + i + ".1", value: x[1], maxlength: 30, "aria-label": "Label " + (i + 1) });
      v.addEventListener("input", function () { state.about.facts[i][0] = v.value; changed(); });
      l.addEventListener("input", function () { state.about.facts[i][1] = l.value; changed(); });
      v.setAttribute("placeholder", "12"); l.setAttribute("placeholder", "dishes on the menu");
      box.appendChild(h("div", { class: "fact-row" }, [v, l]));
    });
    return box;
  }
  function itemsEditor() {
    var box = h("div", { class: "items" });
    function draw() {
      box.innerHTML = "";
      state.services.items.forEach(function (x, i) {
        var n = h("input", { class: "fi", "data-path": "services.items." + i + ".n", value: x.n, placeholder: "Name", maxlength: 50, "aria-label": "Item name" });
        var p = h("input", { class: "fi", "data-path": "services.items." + i + ".p", value: x.p, placeholder: "Price", maxlength: 14, "aria-label": "Price" });
        var d = h("input", { class: "fi", "data-path": "services.items." + i + ".d", value: x.d, placeholder: "Short description", maxlength: 120, "aria-label": "Description" });
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
  function visible() { return PANELS.filter(function (p) { return !p.need || state.pages[p.need]; }); }
  function number() { visible().forEach(function (p, i) { if (nodes[p.id]) $(".pn-no", nodes[p.id].head).textContent = i + 1; }); }
  function buildList() {
    list.innerHTML = ""; nodes = {};
    visible().forEach(function (p) { nodes[p.id] = makeNode(p); list.appendChild(nodes[p.id].node); });
    number();
  }
  /* Pages switched on or off: panels slide in or out, the rest stay put */
  function syncList() {
    var prev = null;
    PANELS.forEach(function (p) {
      var need = !p.need || state.pages[p.need], n = nodes[p.id];
      if (need && !n) {
        n = nodes[p.id] = makeNode(p);
        list.insertBefore(n.node, prev ? prev.nextSibling : list.firstChild);
        var hh = n.node.offsetHeight;
        if (n.node.animate) n.node.animate([{ height: "0px", opacity: 0 }, { height: hh + "px", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
      } else if (!need && n) {
        if (open === p.id) open = null;
        delete nodes[p.id];
        var el = n.node, h0 = el.offsetHeight;
        if (el.animate) el.animate([{ height: h0 + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 260, easing: "ease-in" }).onfinish = function () { el.remove(); };
        else el.remove();
        n = null;
      }
      if (n) prev = n.node;
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
    if (n.p.page) goPage(state.pages[n.p.page] || n.p.page === "home" ? n.p.page : "home", id === "contact" && !state.pages.contact ? "bottom" : null);
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
    own.checked = state.booking.dest === "own";
    paintOwn();
    showModal(modal, "#buy-name");
    if (window.__paintSubmit) window.__paintSubmit();
  }
  function closeBuy() { hideModal(modal); }
  root.querySelectorAll("[data-buy]").forEach(function (b) { b.addEventListener("click", openBuy); });
  root.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeBuy); });
  modal.addEventListener("click", function (e) { if (e.target === modal) closeBuy(); });
  document.addEventListener("keydown", function (e) { if (e.key !== "Escape") return; if (!modal.hidden) closeBuy(); if (!resetModal.hidden) hideModal(resetModal); });

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
    var name = $("#buy-name", root), email = $("#buy-email", root), owner = ownerIn, err = $("#buy-err", root);
    var re = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i, bad = null, msg = "";
    var del = mForm.querySelector('input[name="delivery"]:checked'), selfSetup = own.checked;
    [name, email, owner].forEach(function (x) { x.closest(".field").classList.remove("invalid"); });
    if (!name.value.trim()) { bad = name; msg = "Please enter your name."; }
    else if (!re.test(email.value.trim())) { bad = email; msg = "Please enter a valid email address, like name@gmail.com"; }
    else if (!selfSetup && !re.test(owner.value.trim())) { bad = owner; msg = "Enter the email for bookings, or choose “I want to set this up on my own”."; }
    if (bad) { bad.closest(".field").classList.add("invalid"); err.textContent = msg; bad.focus(); return; }
    err.textContent = "";
    state.booking.dest = selfSetup ? "own" : "email";
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
