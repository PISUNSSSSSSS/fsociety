/* ============================================================
   fsociety MOTION — анимации, терминальная заставка, полоска сети,
   вибрация, пасхалка. Ничего не меняет в данных и логике сайта:
   только добавляет классы и временные элементы.
   Отключить: удалить из index.html строки fsociety-motion.css/.js.
   ============================================================ */
(function () {
  "use strict";
  var D = document, B = D.body;
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function calm() { return reduce || B.classList.contains("fx-noanim"); }
  function $(id) { return D.getElementById(id); }
  function el(tag, cls, txt) { var n = D.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function buzz(p) { if (calm()) return; if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function replay(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }
  function once(node, cls) { node.addEventListener("animationend", function h(e) { if (e.target !== node) return; node.classList.remove(cls); node.style.removeProperty("--i"); node.removeEventListener("animationend", h); }); }
  var ru = true; try { ru = lang !== "en"; } catch (e) {}

  /* ---------- 1. Заставка: терминал перед логотипом ---------- */
  (function boot() {
    var intro = $("intro"), itext = $("itext");
    if (!intro || !itext) return;
    itext.setAttribute("data-text", itext.textContent);
    if (calm() || ss("fs_booted")) return; // полная загрузка — один раз за сессию
    ss("fs_booted", "1");
    window.fsIntroHold = true;
    intro.classList.add("boot");
    var box = el("pre"); box.id = "fsboot"; intro.appendChild(box);
    var lines = [
      ["> fsociety://boot", ""],
      ["  linking node ........ ", "ok"],
      ["  decrypting session .. ", "ok"],
      ["  ecorp firewall ...... ", "bypassed"],
      ["> " + (ru ? "привет, друг." : "hello, friend."), ""]
    ];
    var li = 0, ci = 0, txt = "", cur = el("span", "cur"), done = false;
    function paint(tail) {
      box.textContent = txt;
      if (tail) { var s = el("span", tail === "bypassed" ? "warn" : "ok", tail); box.appendChild(s); }
      box.appendChild(cur);
    }
    function finish() {
      if (done) return; done = true;
      box.classList.add("out");
      setTimeout(function () {
        if (box.parentNode) box.remove();
        intro.classList.add("booted"); intro.classList.remove("boot");
        // запасной выход, если animationend не придёт (fsIntroHold держит запасной таймер index.html)
        setTimeout(function () { window.fsIntroHold = false; if ($("intro") && typeof endIntro === "function") endIntro(); }, 3400);
      }, 220);
    }
    function step() {
      if (done || !D.contains(intro)) return;
      var l = lines[li];
      if (!l) { setTimeout(finish, 320); return; }
      if (ci < l[0].length) { txt += l[0][ci++]; paint(); setTimeout(step, l[0].charAt(ci - 1) === "." ? 4 : 13); return; }
      if (l[1]) txt += l[1];
      txt += "\n"; li++; ci = 0; paint();
      setTimeout(step, l[1] ? 90 : 60);
    }
    intro.addEventListener("click", finish, { once: true });
    setTimeout(step, 120);
  })();

  /* ---------- 2. Смена раздела ---------- */
  var scan = el("div"); scan.id = "fsscan"; B.appendChild(scan);
  function glitchTitle(h) {
    if (!h || calm()) return;
    h.classList.add("fs-glitch");
    h.setAttribute("data-text", h.textContent);
    replay(h, "go");
  }
  function cascade(nodes, max) {
    if (calm()) return;
    var n = 0;
    for (var i = 0; i < nodes.length && n < (max || 14); i++) {
      var c = nodes[i];
      if (c.nodeType !== 1 || c.offsetParent === null) continue;
      c.style.setProperty("--i", n++);
      replay(c, "fs-in"); once(c, "fs-in");
    }
  }
  function enterView(v) {
    if (calm()) return;
    replay(scan, "run");
    var box = v.querySelector(".box") || v;
    cascade(box.children, 10);
    glitchTitle(box.querySelector("h2"));
  }
  D.querySelectorAll(".view").forEach(function (v) {
    new MutationObserver(function () {
      var on = v.classList.contains("active");
      if (on && !v._fsOn) enterView(v);
      v._fsOn = on;
    }).observe(v, { attributes: true, attributeFilter: ["class"] });
    v._fsOn = v.classList.contains("active");
  });

  /* ---------- 3. Списки появляются каскадом, сообщения — с нужной стороны ---------- */
  var LIST = ".ulist,.dmcontacts,.grouplist,.fx-list,.rooms,.fxex-season-grid,.fx2-list";
  var seen = new Set(), lastPendingAt = 0;
  function onAdded(muts) {
    if (calm()) return;
    var msgs = [], lists = new Map();
    muts.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.classList.contains("msg")) { msgs.push(n); return; }
        var p = n.parentElement;
        if (p && p.matches && p.matches(LIST)) {
          if (!lists.has(p)) lists.set(p, []);
          lists.get(p).push(n);
        }
      });
    });
    var fresh = msgs.filter(function (n) {
      var key = (n.dataset.kind || "") + ":" + (n.dataset.id || "");
      if (!n.dataset.id) return true;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    if (fresh.length) {
      var now = Date.now();
      fresh = fresh.filter(function (n) {
        if (n.classList.contains("pending")) { lastPendingAt = now; return true; }
        // своё сообщение заменяет «отправляется» — второй раз не прыгает
        return !(n.classList.contains("mine") && now - lastPendingAt < 5000);
      });
      fresh.slice(-10).forEach(function (n, i, arr) {
        n.style.setProperty("--i", arr.length > 1 ? i : 0);
        n.classList.add("fs-msg-in"); once(n, "fs-msg-in");
      });
    }
    lists.forEach(function (arr) { if (arr.length > 1) cascade(arr, 12); });
  }
  new MutationObserver(onAdded).observe($("app") || B, { childList: true, subtree: true });

  /* ---------- 4. Нажатия: волна + лёгкая вибрация ---------- */
  var TAP = ".btn,.fx-btn,.mini,.fx-tile,.room,.seg button,.fx2-subtab,.fx-tabs button,.wopt,.fx-daily,#dock button";
  D.addEventListener("pointerdown", function (e) {
    var t = e.target.closest && e.target.closest(TAP);
    if (!t || t.disabled) return;
    buzz(8);
    if (calm() || t.closest("#dock")) return;
    if (getComputedStyle(t).position === "static") t.style.position = "relative";
    var r = t.getBoundingClientRect(), s = Math.max(r.width, r.height);
    var wrap = el("span"); wrap.setAttribute("aria-hidden", "true");
    wrap.style.cssText = "position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none";
    var rip = el("span", "fs-ripple");
    rip.style.width = rip.style.height = s + "px";
    rip.style.left = (e.clientX - r.left - s / 2) + "px";
    rip.style.top = (e.clientY - r.top - s / 2) + "px";
    wrap.appendChild(rip); t.appendChild(wrap);
    setTimeout(function () { wrap.remove(); }, 600);
  }, { passive: true });

  /* ---------- 5. Уведомления: колокол звенит, счётчики подпрыгивают ---------- */
  function watchCount(id, onUp) {
    var n = $(id); if (!n) return;
    var last = parseInt(n.textContent, 10) || 0;
    new MutationObserver(function () {
      var v = parseInt(n.textContent, 10) || 0;
      if (v > last && !calm()) { replay(n, "fs-bump"); if (onUp) onUp(); }
      last = v;
    }).observe(n, { childList: true, characterData: true, subtree: true });
  }
  watchCount("nbadge", function () { var b = $("bell"); if (b) { replay(b, "fs-ring"); buzz([12, 40, 12]); } });
  watchCount("dmbadge");
  watchCount("fx2-gem-badge");

  /* ---------- 6. Полоска активности сети ---------- */
  (function net() {
    var bar = el("div"); bar.id = "fsnet"; B.appendChild(bar);
    var live = 0, timer = 0;
    function up() { if (live++ === 0) { clearTimeout(timer); timer = setTimeout(function () { bar.classList.add("on"); }, 250); } }
    function down() { if (--live <= 0) { live = 0; clearTimeout(timer); bar.classList.remove("on"); } }
    var client = null;
    try { client = sb; } catch (e) {}
    if (!client || typeof client.rpc !== "function") return;
    var probe; try { probe = client.rpc("__fs_probe__"); } catch (e) { return; } // ленивый, запрос не уходит
    var proto = Object.getPrototypeOf(probe);
    while (proto && !Object.prototype.hasOwnProperty.call(proto, "then")) proto = Object.getPrototypeOf(proto);
    if (!proto || proto.__fsWrapped) return;
    var orig = proto.then;
    proto.__fsWrapped = true;
    proto.then = function (a, b) {
      up();
      var fin = false;
      function end() { if (!fin) { fin = true; down(); } }
      return orig.call(this,
        function (v) { end(); return a ? a(v) : v; },
        function (err) { end(); if (b) return b(err); throw err; });
    };
  })();

  /* ---------- 7. Главная: строка терминала ---------- */
  (function homeLine() {
    var tag = D.querySelector("#home .tag");
    if (!tag) return;
    var quotes = ru
      ? ["привет, друг.", "мы — fsociety.", "контроль — это иллюзия.", "ты единица или ноль?", "никто не смотрит. наверное."]
      : ["hello, friend.", "we are fsociety.", "control is an illusion.", "are you a one or a zero?", "nobody is watching. probably."];
    var seq = [], busy = false, qi = 0, timer = 0;
    function render(s, caret) {
      busy = true;
      tag.textContent = "";
      tag.appendChild(el("span", "p", ">"));
      tag.appendChild(D.createTextNode(s));
      if (caret) tag.appendChild(el("span", "cur"));
      busy = false;
    }
    function type(s, then) {
      clearTimeout(timer);
      if (calm()) { render(s, false); if (then) timer = setTimeout(then, 5200); return; }
      var i = 0;
      (function tick() {
        render(s.slice(0, i), true);
        if (i++ < s.length) timer = setTimeout(tick, 34 + Math.random() * 40);
        else if (then) timer = setTimeout(then, 4200);
      })();
    }
    function erase(then) {
      var s = tag.textContent.replace(/^>/, "");
      (function tick() {
        render(s, true);
        if (s.length) { s = s.slice(0, -1); timer = setTimeout(tick, 16); } else then();
      })();
    }
    function loop() {
      if (!D.querySelector("#home.view.active") || D.hidden) { timer = setTimeout(loop, 1500); return; }
      var next = seq[qi]; qi = (qi + 1) % seq.length;
      erase(function () { type(next, loop); });
    }
    function start() {
      var base = (tag.textContent || "fsociety").replace(/^>/, "").trim();
      seq = [base].concat(quotes);
      tag.classList.add("fs-term"); tag.classList.remove("glass");
      qi = 1; type(base, loop);
    }
    // язык меняет textContent — подхватываем новый текст
    new MutationObserver(function () { if (!busy && tag.firstChild && !tag.querySelector(".p")) start(); })
      .observe(tag, { childList: true });
    setTimeout(start, 300);
  })();

  /* ---------- 8. Пасхалка: «fsociety» на клавиатуре или 5 тапов по баннеру ---------- */
  function egg() {
    if ($("fsegg")) return;
    buzz([30, 50, 30, 50, 60]);
    var o = el("div"); o.id = "fsegg";
    var big = el("div", "fs-glitch go", "fsociety");
    big.setAttribute("data-text", "fsociety");
    big.style.cssText = "font-family:var(--fs-display);font-weight:800;font-size:clamp(2.2rem,12vw,4.4rem);color:#fff;letter-spacing:.04em";
    var line = el("b");
    o.appendChild(big); o.appendChild(line); B.appendChild(o);
    var msg = ru ? "привет, друг." : "hello, friend.", i = 0;
    (function tick() {
      line.textContent = msg.slice(0, i);
      if (i === msg.length) { var c = el("i", "", "_"); line.appendChild(c); }
      if (i++ < msg.length) setTimeout(tick, 70);
    })();
    var iv = setInterval(function () { replay(big, "go"); }, 600);
    setTimeout(function () { clearInterval(iv); o.remove(); }, calm() ? 1600 : 2500);
  }
  var typed = "";
  D.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!e.key || e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-8);
    if (typed === "fsociety") { typed = ""; egg(); }
  });
  var taps = [];
  var banner = D.querySelector("#home .banner");
  if (banner) banner.addEventListener("click", function () {
    var now = Date.now();
    taps = taps.filter(function (x) { return now - x < 2000; }); taps.push(now);
    if (!calm()) replay(banner, "fs-glitchimg");
    if (taps.length >= 5) { taps = []; egg(); }
  });

  /* ---------- 9. Вкладка в фоне ---------- */
  var title = D.title;
  D.addEventListener("visibilitychange", function () {
    if (D.hidden) { title = D.title; D.title = ru ? "> мы видим тебя_" : "> we see you_"; }
    else D.title = title;
  });

  window.fsMotion = { egg: egg, version: 1 };
})();
