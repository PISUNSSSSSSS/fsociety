/* ============================================================
   fsociety UI — интерактив нового дизайна:
   фон, свечение карточек за курсором, свет за мышью,
   увеличение иконок в доке, появление заголовков, счётчики.
   Ничего не меняет в данных сайта.
   ============================================================ */
(function () {
  "use strict";
  var D = document, B = D.body;
  var mq = function (q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  var finePointer = mq("(hover: hover) and (pointer: fine)");
  function calm() { return reduce || B.classList.contains("fx-noanim"); }
  function el(tag, cls) { var n = D.createElement(tag); if (cls) n.className = cls; return n; }

  /* ---------- 1. фон ---------- */
  var bg = el("div"); bg.id = "uibg"; bg.setAttribute("aria-hidden", "true");
  ["ui-aur a1", "ui-aur a2", "ui-aur a3", "ui-dots", "ui-noise", "ui-glow"].forEach(function (c) { bg.appendChild(el("div", c)); });
  B.insertBefore(bg, B.firstChild);
  var glow = bg.querySelector(".ui-glow");

  /* ---------- 2. свечение карточек за курсором + свет за мышью ---------- */
  var SPOT = ".flink,.tr,.tpost,.fsh-tile,.fsh-th,.pickrow,.ucard,.srvcard,.grouprow,.frrow,.dmrow,.clan-card,.clan-lrow,.nitem,.witem,.fitem,.fxed-card,.fxed-wall";
  var spotEl = null, px = 0, py = 0, raf = 0;
  function frame() {
    raf = 0;
    if (spotEl) {
      var r = spotEl.getBoundingClientRect();
      spotEl.style.setProperty("--mx", (px - r.left) + "px");
      spotEl.style.setProperty("--my", (py - r.top) + "px");
    }
    if (finePointer && glow) {
      glow.style.setProperty("--gx", px + "px");
      glow.style.setProperty("--gy", py + "px");
    }
  }
  function resetSpot(n) { if (n) { n.style.removeProperty("--mx"); n.style.removeProperty("--my"); } }
  D.addEventListener("pointermove", function (e) {
    px = e.clientX; py = e.clientY;
    var t = e.target && e.target.closest ? e.target.closest(SPOT) : null;
    if (t !== spotEl) { resetSpot(spotEl); spotEl = t; }
    if (finePointer && e.pointerType === "mouse") bg.classList.add("ui-has-glow");
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  D.addEventListener("pointerdown", function (e) {
    // на телефоне подсветка вспыхивает там, куда нажали
    if (e.pointerType === "mouse") return;
    px = e.clientX; py = e.clientY;
    var t = e.target && e.target.closest ? e.target.closest(SPOT) : null;
    if (t !== spotEl) resetSpot(spotEl);
    spotEl = t;
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  D.addEventListener("pointerleave", function () { bg.classList.remove("ui-has-glow"); resetSpot(spotEl); spotEl = null; });
  D.documentElement.addEventListener("mouseleave", function () { bg.classList.remove("ui-has-glow"); });

  /* ---------- 3. док: иконки увеличиваются под мышью ---------- */
  (function dock() {
    var d = D.getElementById("dock");
    if (!d || !finePointer || calm()) return;
    var btns = Array.prototype.slice.call(d.querySelectorAll("button"));
    var mx = null, rq = 0;
    function paint() {
      rq = 0;
      btns.forEach(function (b) {
        var m = 1;
        if (mx !== null) {
          var r = b.getBoundingClientRect();
          var dist = Math.abs(mx - (r.left + r.width / 2));
          m = 1 + 0.34 * Math.max(0, 1 - dist / 120);
        }
        b.style.setProperty("--ui-mag", m.toFixed(3));
      });
    }
    d.addEventListener("mousemove", function (e) { mx = e.clientX; if (!rq) rq = requestAnimationFrame(paint); });
    d.addEventListener("mouseleave", function () { mx = null; if (!rq) rq = requestAnimationFrame(paint); });
  })();

  /* ---------- 4. заголовки разделов появляются из размытия ---------- */
  function blurIn(h) {
    if (!h || calm()) return;
    if (h.children.length && !h.querySelector(".ui-w")) return; // не трогаем заголовки с разметкой
    var text = h.textContent;
    if (!text || !text.trim()) return;
    h.textContent = "";
    text.split(/(\s+)/).forEach(function (part, i) {
      if (!part) return;
      if (/^\s+$/.test(part)) { h.appendChild(D.createTextNode(part)); return; }
      var s = el("span", "ui-w"); s.textContent = part; s.style.setProperty("--d", String(i / 2)); h.appendChild(s);
    });
  }
  Array.prototype.forEach.call(D.querySelectorAll(".view"), function (v) {
    var on = v.classList.contains("active");
    new MutationObserver(function () {
      var now = v.classList.contains("active");
      if (now && !on) blurIn(v.querySelector(".box > h2") || v.querySelector("h2"));
      on = now;
    }).observe(v, { attributes: true, attributeFilter: ["class"] });
  });

  /* ---------- 5. счётчик (number ticker) ---------- */
  function fmt(n) {
    var en = false;
    try { en = lang === "en"; } catch (e) {}
    try { return Math.round(n).toLocaleString(en ? "en-US" : "ru-RU"); } catch (e) { return String(Math.round(n)); }
  }
  function count(node, to, ms, suffix) {
    if (!node) return;
    suffix = suffix || "";
    var from = Number(node.getAttribute("data-v")) || 0;
    node.setAttribute("data-v", String(to));
    if (calm() || !ms) { node.textContent = fmt(to) + suffix; return; }
    var t0 = performance.now();
    (function tick(now) {
      var k = Math.min(1, (now - t0) / ms);
      var e = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(from + (to - from) * e) + suffix;
      if (k < 1 && D.contains(node)) requestAnimationFrame(tick);
    })(t0);
  }

  window.fsUI = { count: count, blurIn: blurIn, calm: calm };
})();
