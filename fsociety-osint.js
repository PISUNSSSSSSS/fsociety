/* ============================================================
   fsociety OSINT — декоративная «разведка» на главной.
   ЭТО СИМУЛЯЦИЯ: все данные выдуманы и генерируются случайно.
   IP — из документационных диапазонов TEST-NET (RFC 5737),
   AS — из документационного диапазона (RFC 5398),
   домены — .test / .invalid / .example (RFC 2606), почта замаскирована.
   Никаких запросов наружу модуль не делает.
   ============================================================ */
(function () {
  "use strict";
  var D = document;
  var home = D.getElementById("home");
  var box = home && home.querySelector(".box");
  if (!box) return;

  function L(ru, en) { try { return lang === "en" ? en : ru; } catch (e) { return ru; } }
  function calm() {
    try { if (window.fsUI && fsUI.calm) return fsUI.calm(); } catch (e) {}
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function el(tag, cls, text) { var n = D.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function hex(n) { var s = ""; while (s.length < n) s += Math.floor(Math.random() * 16).toString(16); return s; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function count(node, v, ms, suf) { try { if (window.fsUI) return fsUI.count(node, v, ms, suf); } catch (e) {} node.textContent = v + (suf || ""); }

  /* ---------- выдуманные данные ---------- */
  var HANDLES = ["mr_robot", "darlene.exe", "whiterose", "tyrell_w", "d0lores", "r00tkit", "ghost_404", "0xdeadbeef", "n1ghtcrawl", "phreak.x", "cipher_v", "l0rdbyte", "elliot.a", "angela_m"];
  var PLATFORMS = ["github", "reddit", "steam", "telegram", "discord", "twitch", "gitlab", "keybase", "hackerone", "mastodon", "pastebin", "spotify", "chess", "codeberg"];
  var CITIES = [
    ["Амстердам", "Amsterdam", "NL", 52.37, 4.9], ["Рейкьявик", "Reykjavik", "IS", 64.15, -21.94],
    ["Таллин", "Tallinn", "EE", 59.44, 24.75], ["Сеул", "Seoul", "KR", 37.57, 126.98],
    ["Сан-Паулу", "Sao Paulo", "BR", -23.55, -46.63], ["Торонто", "Toronto", "CA", 43.65, -79.38],
    ["Новосибирск", "Novosibirsk", "RU", 55.03, 82.92], ["Кейптаун", "Cape Town", "ZA", -33.92, 18.42],
    ["Сингапур", "Singapore", "SG", 1.35, 103.82], ["Хельсинки", "Helsinki", "FI", 60.17, 24.94],
    ["Нью-Йорк", "New York", "US", 40.71, -74], ["Токио", "Tokyo", "JP", 35.68, 139.69],
    ["Берлин", "Berlin", "DE", 52.52, 13.4], ["Сидней", "Sydney", "AU", -33.87, 151.21]
  ];
  var NETS = ["203.0.113.", "198.51.100.", "192.0.2."];
  var ASNS = [["AS64500", "EXAMPLE-NET"], ["AS64502", "TESTNET-TRANSIT"], ["AS64507", "DOC-ANYCAST"], ["AS64511", "NULL-ROUTE"]];
  var DOMAINS = ["ecorp.test", "allsafe.test", "darkarmy.invalid", "fsociety.example", "steelmountain.test", "evilcorp.invalid"];
  var PORTS = [[22, "ssh"], [25, "smtp"], [53, "dns"], [80, "http"], [443, "https"], [993, "imaps"], [3306, "mysql"], [6667, "irc"], [8080, "http-alt"], [9050, "tor"]];
  var MODS = [["user", "USERNAME"], ["mail", "EMAIL"], ["dns", "DNS"], ["geo", "GEO-IP"], ["port", "PORTS"], ["leak", "LEAKS"]];

  function fakeIp() { return pick(NETS) + ri(2, 254); }
  function maskMail(h, dom) {
    var name = String(h).replace(/[^a-z0-9]/gi, "").toLowerCase() || "user";
    return name.charAt(0) + "•••••" + name.charAt(name.length - 1) + "@" + dom;
  }
  function myNick() { try { return user && user.nick ? String(user.nick) : null; } catch (e) { return null; } }

  /* ---------- 1. камера: HUD поверх видео ---------- */
  var video = box.querySelector("video.banner");
  var cam = null, clockEl = null, lockEl = null, lockLbl = null;
  if (video) {
    cam = el("div", "ui-cam");
    video.parentNode.insertBefore(cam, video);
    cam.appendChild(video);
    var hud = el("div", "hud");
    ["c-tl", "c-tr", "c-bl", "c-br"].forEach(function (c) { hud.appendChild(el("i", c)); });
    hud.appendChild(el("div", "scanl"));
    hud.appendChild(el("span", "rec", "REC · CAM-03"));
    clockEl = el("span", "clock", "--:--:--");
    hud.appendChild(clockEl);
    lockEl = el("div", "lock");
    lockLbl = el("b", "", "ID-0x00 · 00%");
    lockEl.appendChild(lockLbl);
    hud.appendChild(lockEl);
    var tk = el("div", "ticker");
    var tkIn = el("div");
    var bits = ["● LIVE", "NODES 1 204", "PACKETS 88 412", "TOR EXITS 3", "SIGNAL −61 dBm", "UPLINK 940 Mb/s", "<em>SIMULATION</em>", "HANDSHAKE OK", "ENTROPY 7.91"];
    tkIn.innerHTML = bits.concat(bits).map(function (b) { return "<span>" + b + "</span>"; }).join("");
    tk.appendChild(tkIn);
    hud.appendChild(tk);
    cam.appendChild(hud);
  }

  /* ---------- 2. консоль ---------- */
  var os = el("section", "osint ui-beam ui-beam-slow");
  os.setAttribute("aria-label", "OSINT simulation");
  var head = el("header", "os-head");
  head.appendChild(el("span", "os-led"));
  head.appendChild(el("b", "", "OSINT://recon"));
  var simEl = el("span", "os-sim");
  head.appendChild(simEl);
  var osClock = el("span", "os-clock", "00:00");
  head.appendChild(osClock);
  os.appendChild(head);

  var tgt = el("div", "os-target");
  var tgtK = el("span", "k", "target ›");
  var tgtV = el("span", "v", "");
  var tgtCaret = el("span", "caret");
  var tgtSt = el("span", "st ui-shimmer", "");
  tgt.appendChild(tgtK); tgt.appendChild(tgtV); tgt.appendChild(tgtCaret); tgt.appendChild(tgtSt);
  os.appendChild(tgt);

  var main = el("div", "os-main");
  var gWrap = el("div", "os-globe");
  var canvas = el("canvas");
  gWrap.appendChild(canvas);
  var gLbl = el("span", "lbl", "geo-trace");
  var gCoord = el("span", "coord", "00.00°N 00.00°E");
  var gHit = el("span", "hit", "MATCH");
  gWrap.appendChild(gLbl); gWrap.appendChild(gCoord); gWrap.appendChild(gHit);
  main.appendChild(gWrap);
  var modList = el("ul", "os-mods");
  var modEls = {};
  MODS.forEach(function (m) {
    var li = el("li");
    li.setAttribute("data-s", "wait");
    li.appendChild(el("i"));
    li.appendChild(el("span", "", m[1]));
    var pct = el("em", "", "—");
    li.appendChild(pct);
    var bar = el("span", "bar"); var fill = el("s"); bar.appendChild(fill); li.appendChild(bar);
    modList.appendChild(li);
    modEls[m[0]] = { li: li, pct: pct, fill: fill };
  });
  main.appendChild(modList);
  os.appendChild(main);

  var log = el("div", "os-log");
  log.setAttribute("aria-hidden", "true");
  os.appendChild(log);

  var stats = el("div", "os-stats");
  var stEls = [];
  for (var si = 0; si < 3; si++) {
    var cell = el("div"); var b = el("b", "", "0"); var sm = el("small");
    cell.appendChild(b); cell.appendChild(sm); stats.appendChild(cell);
    stEls.push({ b: b, s: sm });
  }
  os.appendChild(stats);

  var tagEl = box.querySelector(".tag");
  if (tagEl && tagEl.parentNode === box) box.insertBefore(os, tagEl.nextSibling);
  else box.appendChild(os);

  function labels() {
    simEl.textContent = L("симуляция", "simulation");
    stEls[0].s.textContent = L("узлов", "nodes");
    stEls[1].s.textContent = L("утечек", "leaks");
    stEls[2].s.textContent = L("совпадение", "match");
    gLbl.textContent = L("геотрек", "geo-trace");
  }
  labels();
  new MutationObserver(labels).observe(D.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* ---------- 3. глобус ---------- */
  var G = {
    ctx: canvas.getContext && canvas.getContext("2d"),
    pts: [], rot: 0.6, want: null, tilt: 0.38, w: 0, h: 0, dpr: 1,
    pings: [], arcs: []
  };
  (function makeDots() {
    var n = 560, gold = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = gold * i;
      G.pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
  })();
  function ll(lat, lon) {
    var a = lat * Math.PI / 180, o = lon * Math.PI / 180, c = Math.cos(a);
    return [c * Math.sin(o), Math.sin(a), c * Math.cos(o)];
  }
  function size() {
    var w = gWrap.clientWidth, h = gWrap.clientHeight;
    if (!w || !h) return false;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w !== G.w || h !== G.h || dpr !== G.dpr) {
      G.w = w; G.h = h; G.dpr = dpr;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    return true;
  }
  function proj(p, R, cx, cy) {
    var cr = Math.cos(G.rot), sr = Math.sin(G.rot), ct = Math.cos(G.tilt), st = Math.sin(G.tilt);
    var x1 = p[0] * cr + p[2] * sr, z1 = -p[0] * sr + p[2] * cr;
    var y2 = p[1] * ct - z1 * st, z2 = p[1] * st + z1 * ct;
    return [cx + x1 * R, cy - y2 * R, z2];
  }
  function slerp(a, b, t) {
    var dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    var om = Math.acos(dot);
    if (om < 1e-4) return a.slice();
    var s = Math.sin(om), k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }
  function draw(now) {
    var c = G.ctx;
    if (!c || !size()) return;
    var w = G.w, h = G.h, R = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2 + 4;
    c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    // ореол
    var halo = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.35);
    halo.addColorStop(0, "rgba(255,43,58,0.10)"); halo.addColorStop(1, "rgba(255,43,58,0)");
    c.fillStyle = halo; c.beginPath(); c.arc(cx, cy, R * 1.35, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.08)"; c.lineWidth = 1;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    // точки
    for (var i = 0; i < G.pts.length; i++) {
      var q = proj(G.pts[i], R, cx, cy);
      if (q[2] < -0.05) continue;
      var a = 0.12 + 0.62 * Math.max(0, q[2]);
      c.fillStyle = "rgba(244,244,245," + a.toFixed(3) + ")";
      var s = 0.8 + q[2] * 0.9;
      c.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
    }
    // дуги
    G.arcs = G.arcs.filter(function (ar) { return now - ar.t0 < 9000; });
    G.arcs.forEach(function (ar) {
      if (now < ar.t0) return;
      var k = Math.min(1, (now - ar.t0) / 1300), fade = Math.max(0, 1 - Math.max(0, now - ar.t0 - 5000) / 4000);
      var steps = 32, last = null;
      c.lineWidth = 1.4;
      for (var j = 0; j <= steps * k; j++) {
        var t = j / steps, p = slerp(ar.a, ar.b, t), lift = 1 + Math.sin(Math.PI * t) * 0.22;
        var q = proj([p[0] * lift, p[1] * lift, p[2] * lift], R, cx, cy);
        if (last && q[2] > -0.1 && last[2] > -0.1) {
          c.strokeStyle = "rgba(255," + Math.round(43 + 120 * t) + "," + Math.round(58 + 40 * t) + "," + (0.85 * fade).toFixed(3) + ")";
          c.beginPath(); c.moveTo(last[0], last[1]); c.lineTo(q[0], q[1]); c.stroke();
        }
        last = q;
      }
    });
    // пинги
    G.pings = G.pings.filter(function (pg) { return now - pg.t0 < 14000; });
    G.pings.forEach(function (pg) {
      if (now < pg.t0) return;
      var q = proj(pg.p, R, cx, cy);
      if (q[2] < 0) return;
      var age = (now - pg.t0) % 1800 / 1800;
      var main = pg.main;
      c.fillStyle = main ? "#ff2b3a" : "rgba(255,255,255,0.85)";
      c.beginPath(); c.arc(q[0], q[1], main ? 2.6 : 1.8, 0, Math.PI * 2); c.fill();
      c.strokeStyle = (main ? "rgba(255,43,58," : "rgba(255,255,255,") + (0.7 * (1 - age)).toFixed(3) + ")";
      c.lineWidth = 1;
      c.beginPath(); c.arc(q[0], q[1], 3 + age * (main ? 16 : 9), 0, Math.PI * 2); c.stroke();
    });
  }
  function shortest(a, b) { var d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

  /* ---------- 4. цикл анимации (только когда видно) ---------- */
  var visible = true, inView = true, raf = 0, last = 0;
  function active() { return visible && inView && home.classList.contains("active"); }
  function loop(now) {
    raf = 0;
    if (!active()) return;
    var dt = Math.min(64, now - (last || now)); last = now;
    if (G.want !== null) {
      var d = shortest(G.rot, G.want);
      G.rot += d * Math.min(1, dt / 420);
      if (Math.abs(d) < 0.003) G.want = null;
    } else G.rot += dt * 0.00018;
    draw(now);
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && !calm() && active()) { last = 0; raf = requestAnimationFrame(loop); } }
  D.addEventListener("visibilitychange", function () { visible = D.visibilityState !== "hidden"; kick(); });
  new MutationObserver(kick).observe(home, { attributes: true, attributeFilter: ["class"] });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; kick(); }).observe(gWrap);
  }
  window.addEventListener("resize", function () { if (calm()) draw(performance.now()); });

  /* ---------- 5. журнал ---------- */
  function now2() { var d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }
  function line(html, noise) {
    var p = el("p", noise ? "n" : "");
    p.innerHTML = '<span class="t">' + now2() + "</span>" + html;
    log.appendChild(p);
    while (log.children.length > 14) log.removeChild(log.firstChild);
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function noise(ip) {
    var opts = [
      "GET /v1/lookup?q=" + hex(6) + " · 200 · " + ri(40, 380) + "ms",
      "tcp syn → " + (ip || fakeIp()) + ":" + pick(PORTS)[0],
      "tor circuit rebuilt · " + ri(3, 4) + " hops",
      "hash " + hex(8) + "…" + hex(4) + " → queued",
      "dns ptr " + fakeIp() + " → nx",
      "cache hit · shard-" + ri(1, 12) + " · " + hex(6)
    ];
    line(esc(pick(opts)), true);
  }

  /* ---------- 6. текст «расшифровывается» ---------- */
  function scramble(node, text, ms) {
    if (calm()) { node.textContent = text; return Promise.resolve(); }
    var CH = "!<>-_\\/[]{}—=+*^?#01ABCDEFXZ", t0 = performance.now();
    return new Promise(function (res) {
      (function tick(now) {
        var k = Math.min(1, (now - t0) / ms), n = Math.floor(text.length * k), out = text.slice(0, n);
        for (var i = n; i < text.length; i++) out += text[i] === " " ? " " : CH[Math.floor(Math.random() * CH.length)];
        node.textContent = out;
        if (k < 1) requestAnimationFrame(tick); else res();
      })(t0);
    });
  }

  /* ---------- 7. сценарий разведки ---------- */
  var stopped = false;
  function wait(ms) {
    return new Promise(function (res) {
      var left = ms, tick = 120;
      (function step() {
        if (stopped) return;
        if (active()) left -= tick;
        if (left <= 0) res(); else setTimeout(step, tick);
      })();
    });
  }
  function setMod(id, state, p) {
    var m = modEls[id]; if (!m) return;
    m.li.setAttribute("data-s", state);
    m.fill.style.setProperty("--p", String(p));
    m.pct.textContent = state === "wait" ? "—" : Math.round(p) + "%";
  }
  async function runMod(id, ms) {
    setMod(id, "run", 0);
    var t = 0, stepMs = 90;
    while (t < ms) {
      await wait(stepMs); t += stepMs;
      setMod(id, "run", Math.min(99, (t / ms) * 100 * rnd(0.9, 1.05)));
      if (Math.random() < 0.05) noise();
    }
    setMod(id, "done", 100);
  }
  function makeCase(first) {
    var nick = first ? myNick() : null;
    var handle = nick ? nick : pick(HANDLES) + (Math.random() < 0.4 ? ri(1, 99) : "");
    var dom = pick(DOMAINS), city = pick(CITIES), from = pick(CITIES.filter(function (c) { return c !== city; }));
    var plats = shuffle(PLATFORMS).slice(0, ri(4, 9));
    var ports = shuffle(PORTS).slice(0, ri(2, 4)).sort(function (a, b) { return a[0] - b[0]; });
    var years = shuffle([2014, 2016, 2017, 2019, 2021, 2023, 2024]).slice(0, ri(1, 3)).sort();
    var asn = pick(ASNS);
    return {
      handle: handle, dom: dom, ip: fakeIp(), asn: asn, city: city, from: from, plats: plats,
      accounts: plats.length + ri(2, 9), ports: ports, years: years, links: ri(18, 64), clusters: ri(2, 6),
      lat: city[3] + rnd(-0.4, 0.4), lon: city[4] + rnd(-0.4, 0.4), match: ri(71, 98), nodes: ri(900, 4800)
    };
  }
  function fmtCoord(lat, lon) {
    return Math.abs(lat).toFixed(2) + "°" + (lat >= 0 ? "N" : "S") + " " + Math.abs(lon).toFixed(2) + "°" + (lon >= 0 ? "E" : "W");
  }
  function moveLock(label) {
    if (!lockEl) return;
    var s = ri(56, 86);
    lockEl.style.setProperty("--lx", rnd(8, 72) + "%");
    lockEl.style.setProperty("--ly", rnd(14, 52) + "%");
    lockEl.style.width = s + "px"; lockEl.style.height = s + "px";
    if (label) lockLbl.textContent = label;
  }
  var totals = { nodes: 0, leaks: 0 };

  async function scan(first) {
    var c = makeCase(first);
    os.setAttribute("data-phase", "run");
    MODS.forEach(function (m) { setMod(m[0], "wait", 0); });
    tgtSt.textContent = L("поиск…", "scanning…");
    tgtSt.className = "st ui-shimmer";
    await scramble(tgtV, "@" + c.handle, 700);
    line('<span class="inf">[*]</span> ' + L("цель", "target") + ": <b>@" + esc(c.handle) + "</b> · " + L("запуск модулей", "starting modules"));
    moveLock("ID-0x" + hex(2).toUpperCase() + " · " + ri(20, 60) + "%");
    count(stEls[2].b, 0, 0, "%");

    await runMod("user", rnd(900, 1500));
    line('<span class="ok">[+]</span> @' + esc(c.handle) + " " + L("найден на", "found on") + " <b>" + c.accounts + "</b> " + L("сайтах", "sites") + ": " + esc(c.plats.slice(0, 4).join(", ")) + "…");
    totals.nodes += ri(40, 140); count(stEls[0].b, totals.nodes, 900);

    await runMod("mail", rnd(700, 1200));
    line('<span class="ok">[+]</span> ' + L("почта", "email") + ": <b>" + esc(maskMail(c.handle, c.dom)) + "</b> · " + L("подтверждена", "verified"));

    await runMod("dns", rnd(600, 1100));
    line('<span class="ok">[+]</span> mail.' + esc(c.dom) + " → <b>" + c.ip + "</b>");
    noise(c.ip);

    await runMod("geo", rnd(900, 1500));
    var cityName = L(c.city[0], c.city[1]);
    line('<span class="ok">[+]</span> ' + c.ip + " · " + c.asn[0] + " " + c.asn[1] + " · <b>" + esc(cityName) + ", " + c.city[2] + "</b>");
    gCoord.textContent = fmtCoord(c.lat, c.lon);
    var tp = ll(c.lat, c.lon), fp = ll(c.from[3], c.from[4]), t0 = performance.now();
    G.want = -c.lon * Math.PI / 180;
    G.pings.push({ p: fp, t0: t0, main: false });
    G.arcs.push({ a: fp, b: tp, t0: t0 + 300 });
    G.pings.push({ p: tp, t0: t0 + 1500, main: true });
    if (calm()) draw(performance.now());
    moveLock("ID-0x" + hex(2).toUpperCase() + " · " + ri(55, 80) + "%");

    await runMod("port", rnd(800, 1400));
    line('<span class="ok">[+]</span> ' + L("открыто", "open") + ": " + c.ports.map(function (p) { return p[0] + "/" + p[1]; }).join("  "));
    totals.nodes += ri(10, 60); count(stEls[0].b, totals.nodes, 700);

    await runMod("leak", rnd(900, 1500));
    var leaks = c.years.length;
    line('<span class="warn">[!]</span> ' + L("утечки", "breaches") + ": <b>" + leaks + "</b> (" + c.years.join(", ") + ") · " + L("пароли скрыты", "passwords redacted"));
    totals.leaks += leaks; count(stEls[1].b, totals.leaks, 700);

    line('<span class="inf">[*]</span> ' + L("граф связей", "social graph") + ": " + c.links + " " + L("связей", "links") + " · " + c.clusters + " " + L("кластера", "clusters"));
    count(stEls[2].b, c.match, 1100, "%");
    line('<span class="ok">[✓]</span> ' + L("отчёт готов", "report ready") + " · " + L("уверенность", "confidence") + " <b>" + c.match + "%</b>");
    os.setAttribute("data-phase", "hold");
    gHit.textContent = "MATCH " + c.match + "%";
    tgtSt.textContent = L("найдено", "found");
    tgtSt.className = "st";
    moveLock("MATCH · " + c.match + "%");
    await wait(3400);
    line(esc(L("— сброс сессии —", "— session reset —")), true);
    await wait(600);
  }

  async function run() {
    if (calm()) { await staticReport(); return; }
    var first = true;
    // дождаться загрузки профиля, чтобы первой целью стал сам пользователь
    await wait(900);
    while (!stopped) { await scan(first); first = false; }
  }

  // без анимаций: сразу готовый отчёт
  async function staticReport() {
    var c = makeCase(true);
    tgtV.textContent = "@" + c.handle;
    tgtSt.textContent = L("найдено", "found");
    MODS.forEach(function (m) { setMod(m[0], "done", 100); });
    [
      '<span class="ok">[+]</span> @' + esc(c.handle) + " · " + c.accounts + " " + L("сайтов", "sites"),
      '<span class="ok">[+]</span> ' + esc(maskMail(c.handle, c.dom)),
      '<span class="ok">[+]</span> mail.' + esc(c.dom) + " → " + c.ip,
      '<span class="ok">[+]</span> ' + c.ip + " · " + c.asn[0] + " · " + esc(L(c.city[0], c.city[1])),
      '<span class="warn">[!]</span> ' + L("утечки", "breaches") + ": " + c.years.length,
      '<span class="ok">[✓]</span> ' + L("отчёт готов", "report ready") + " · " + c.match + "%"
    ].forEach(function (h) { line(h); });
    stEls[0].b.textContent = String(c.nodes); stEls[1].b.textContent = String(c.years.length); stEls[2].b.textContent = c.match + "%";
    os.setAttribute("data-phase", "hold");
    gHit.textContent = "MATCH " + c.match + "%";
    gCoord.textContent = fmtCoord(c.lat, c.lon);
    moveLock("MATCH · " + c.match + "%");
    G.rot = -c.lon * Math.PI / 180;
    G.pings.push({ p: ll(c.lat, c.lon), t0: performance.now(), main: true });
    setTimeout(function () { draw(performance.now()); }, 60);
  }

  /* ---------- 8. часы ---------- */
  var tStart = Date.now();
  setInterval(function () {
    if (!active()) return;
    if (clockEl) clockEl.textContent = now2();
    var s = Math.floor((Date.now() - tStart) / 1000);
    osClock.textContent = pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
  }, 1000);
  if (clockEl) clockEl.textContent = now2();
  if (!calm() && lockEl) setInterval(function () { if (active() && os.getAttribute("data-phase") !== "hold") moveLock(); }, 2600);

  kick();
  run();
  window.fsOsint = { stop: function () { stopped = true; } };
})();
