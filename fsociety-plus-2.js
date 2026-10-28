/* ============================================================
   fsociety PLUS 2 — кристаллы, привилегии, выдача валюты,
   опросы, закрепы, жалобы, анонсы, анонимка, dead drop,
   галерея, радио, CTF, квесты, теги форума и каталог серверов.
   Загружается после fsociety-plus.js и не переписывает index.html.
   ============================================================ */
(function () {
  "use strict";

  var VERSION = "plus2-1.0";
  var GEM = "💎";
  var COIN = "🪙";
  var LS_ANN = "fx2_ann_off";
  var STATIONS = [
    { name: "Groove Salad", genre: "ambient / downtempo", url: "https://ice1.somafm.com/groovesalad-128-mp3" },
    { name: "DEF CON Radio", genre: "hacker radio", url: "https://ice1.somafm.com/defcon-128-mp3" },
    { name: "Drone Zone", genre: "dark ambient", url: "https://ice1.somafm.com/dronezone-128-mp3" },
    { name: "Deep Space One", genre: "space music", url: "https://ice1.somafm.com/deepspaceone-128-mp3" }
  ];

  var WALL_ICONS = {
    none: "🚫", matrix: "🟩", stars: "✨", aurora: "🌌", ocean: "🌊", galaxy: "🌠",
    sakura: "🌸", rain: "🌧", neon: "🟣", embers: "🔥", fireworks: "🎆",
    rich: "💚", money: "💸", snow: "❄", hearts: "💖", thunder: "⚡", bubbles: "🫧", custom: "🖼"
  };
  var WALL_PRICES = {
    matrix: 40, stars: 35, aurora: 45, ocean: 45, galaxy: 55, sakura: 55, rain: 35,
    neon: 65, embers: 65, fireworks: 75, rich: 80, money: 90,
    snow: 70, hearts: 75, thunder: 85, bubbles: 70
  };
  var WALL_DESC = {
    none: "Чистый фон без анимации.",
    matrix: "Зелёный дождь символов.",
    stars: "Медленно падающие звёзды.",
    aurora: "Живое северное сияние.",
    ocean: "Волны и пузырьки.",
    galaxy: "Вращающаяся галактика.",
    sakura: "Лепестки сакуры.",
    rain: "Настоящий дождь с редкой молнией.",
    neon: "Неоновая сетка и перспектива.",
    embers: "Искры и угли снизу вверх.",
    fireworks: "Салюты в ночном небе.",
    rich: "Изумрудный туман и золотые частицы.",
    money: "Дождь из купюр.",
    snow: "Мягкий снегопад.",
    hearts: "Сердца, летящие вверх.",
    thunder: "Гроза с молниями.",
    bubbles: "Пузыри в глубокой воде.",
    custom: "Твоя загруженная картинка."
  };
  var FX_ICONS = {
    rain: "🌧", stars: "✨", bubbles: "🫧", snow: "❄", hearts: "💖",
    fire: "🔥", matrix: "🟩", money: "💸", confetti: "🎉", lightning: "⚡"
  };
  var EFFECT_DEFS = [
    { id: "fx_rain", value: "rain", title: "Дождь в нике", description: "Капли падают прямо в твоём нике.", cost_gems: 55, min_level: 1 },
    { id: "fx_stars", value: "stars", title: "Звёздный ник", description: "Звёзды и искры вокруг ника.", cost_gems: 60, min_level: 1 },
    { id: "fx_bubbles", value: "bubbles", title: "Пузырьки", description: "Лёгкие пузыри всплывают в нике.", cost_gems: 65, min_level: 1 },
    { id: "fx_snow", value: "snow", title: "Снегопад", description: "Снежинки медленно падают в нике.", cost_gems: 70, min_level: 1 },
    { id: "fx_hearts", value: "hearts", title: "Сердечки", description: "Сердца летят вверх в твоём нике.", cost_gems: 75, min_level: 2 },
    { id: "fx_fire", value: "fire", title: "Огонь", description: "Языки пламени и искры.", cost_gems: 80, min_level: 2 },
    { id: "fx_matrix", value: "matrix", title: "Матрица", description: "Цифры и символы падают в нике.", cost_gems: 85, min_level: 2 },
    { id: "fx_money", value: "money", title: "Дождь из денег", description: "Как «Богач»: купюры и монеты.", cost_gems: 90, min_level: 3 },
    { id: "fx_confetti", value: "confetti", title: "Конфетти", description: "Праздничное конфетти в нике.", cost_gems: 95, min_level: 3 },
    { id: "fx_lightning", value: "lightning", title: "Молнии", description: "Электрические разряды в нике.", cost_gems: 100, min_level: 4 }
  ];

  var state = {
    wallet: null,
    privileges: [],
    privilegeMap: new Map(),
    privilegeMapAt: 0,
    privCache: new Map(),
    privQueue: new Set(),
    privTimer: 0,
    privMissing: false,
    lastUid: "__boot__",
    lastPriv: 0,
    lastMsg: 0,
    lastWallet: 0,
    lastAnn: 0,
    lastReports: 0,
    reportCount: 0,
    polls: [],
    pollScope: null,
    inlineKey: "",
    inlineAt: 0,
    pinRows: [],
    reports: [],
    reportStatus: "open",
    ann: [],
    anonRows: [],
    galleryRows: [],
    galleryOffset: 0,
    galleryKeys: new Set(),
    radio: null,
    radioIdx: 0,
    radioPlaying: false,
    ctf: [],
    questTab: "quests",
    quests: [],
    achievements: [],
    achSolved: null,
    servers: [],
    myServers: [],
    serverQuery: "",
    serverTimer: 0,
    forumTags: [],
    forumFilter: null,
    threadTags: [],
    threadRows: [],
    threadAuthor: null,
    modTab: "reports",
    currentView: "main",
    wallSel: null,
    wallPreview: null,
    wallSynced: false,
    missing: {}
  };

  var FREE_WALLS = {
    none: 1, matrix: 1, stars: 1, aurora: 1, ocean: 1, galaxy: 1, sakura: 1, rain: 1, custom: 1
  };

  var FX_CONF = {
    rain:      { chars: ["|", "'", "•", "💧"], count: 9,  size: [6, 10], drift: 10, rot: 20,  colors: ["#93c5fd", "#60a5fa", "#bae6fd"] },
    stars:     { chars: ["✦", "✧", "★", "✨"], count: 9,  size: [6, 10], drift: 8,  rot: 30,  colors: ["#fde68a", "#fef3c7", "#facc15"] },
    bubbles:   { chars: ["○", "●", "◌", "🫧"], count: 8,  size: [6, 10], drift: 14, rot: 0,   colors: ["#67e8f9", "#a5f3fc", "#bae6fd"] },
    snow:      { chars: ["❄", "❅", "✻", "•"], count: 10, size: [6, 9],  drift: 12, rot: 40,  colors: ["#e0f2fe", "#bae6fd", "#f8fafc"] },
    hearts:    { chars: ["♥", "💖", "❤", "♡"], count: 8,  size: [7, 11], drift: 10, rot: 20,  colors: ["#f472b6", "#fb7185", "#fda4af"] },
    fire:      { chars: ["🔥", "✦", "▲", "·"], count: 9,  size: [6, 11], drift: 9,  rot: 15,  colors: ["#fb923c", "#facc15", "#ef4444"] },
    matrix:    { chars: ["0", "1", "$", "#", "%", "7"], count: 11, size: [6, 9], drift: 4, rot: 0, colors: ["#22c55e", "#4ade80", "#86efac"] },
    money:     { chars: ["$", "💵", "💸", "🪙"], count: 10, size: [7, 11], drift: 14, rot: 45, colors: ["#facc15", "#fde68a", "#f59e0b", "#22c55e"] },
    confetti:  { chars: ["■", "●", "▲", "◆", "✦"], count: 12, size: [5, 9], drift: 16, rot: 180, colors: ["#f87171", "#facc15", "#4ade80", "#38bdf8", "#a78bfa", "#f472b6"] },
    lightning: { chars: ["⚡", "ϟ", "⌁", "✦"], count: 7,  size: [7, 11], drift: 6,  rot: 10,  colors: ["#fde047", "#facc15", "#fef08a"] }
  };

  /* ---------------- helpers ---------------- */
  function q(id) { return document.getElementById(id); }
  function gsb() { try { return sb; } catch (e) { return null; } }
  function gu() { try { return user; } catch (e) { return null; } }
  function glang() { try { return lang; } catch (e) { return "ru"; } }
  function L(ru, en) { return glang() === "en" ? en : ru; }
  function curView() { try { return cur; } catch (e) { return ""; } }
  function threadId() { try { return forumThreadId; } catch (e) { return null; } }
  function chatRoomId() { try { return chatRoom; } catch (e) { return null; } }
  function dmUserId() { try { return dmWith && dmWith.id; } catch (e) { return null; } }
  function dmTabValue() { try { return dmTab; } catch (e) { return "dm"; } }
  function groupId() { try { return groupWith && groupWith.id; } catch (e) { return null; } }
  function serverId() { try { return srvCurrent && srvCurrent.id; } catch (e) { return null; } }
  function serverChannel() { try { return srvChannel; } catch (e) { return null; } }
  function userCtx() { try { return uCtx; } catch (e) { return null; } }
  function rank() { try { return myRank(); } catch (e) { return 0; } }
  function isStaff() { return rank() >= 2; }
  function canGrant() { return rank() >= 3; }
  function roleText() {
    var u = gu();
    if (!u) return L("Гость", "Guest");
    try { return roleLabel(u.role); } catch (e) { return String(u.role || "user").toUpperCase(); }
  }
  function grantRoot(el) {
    return el && el.closest ? el.closest(".fx2-form") : null;
  }
  function grantEl(root, id) {
    return root ? root.querySelector("#" + id) : q(id);
  }
  function escAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function uid() { var u = gu(); return u && u.id ? String(u.id) : null; }
  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function clear(n) { if (n) while (n.firstChild) n.removeChild(n.firstChild); }
  function initial(name) { return (name || "?").trim().slice(0, 1).toUpperCase() || "?"; }
  function nfmt(n) { return Number(n || 0).toLocaleString(glang() === "en" ? "en-US" : "ru-RU"); }
  function dateShort(iso) {
    try {
      return new Date(iso).toLocaleDateString(glang() === "en" ? "en-US" : "ru-RU", { day: "2-digit", month: "short" });
    } catch (e) { return ""; }
  }
  function dateTime(iso) {
    try {
      return new Date(iso).toLocaleString(glang() === "en" ? "en-US" : "ru-RU", { dateStyle: "short", timeStyle: "short" });
    } catch (e) { return ""; }
  }
  function timeLeft(iso) {
    try {
      var ms = new Date(iso).getTime() - Date.now();
      if (ms <= 0) return L("истёк", "expired");
      var h = Math.floor(ms / 3600000);
      if (h >= 24) return Math.floor(h / 24) + L(" дн.", " d");
      if (h >= 1) return h + L(" ч.", " h");
      return Math.max(1, Math.floor(ms / 60000)) + L(" мин.", " min");
    } catch (e) { return ""; }
  }
  function toast2(msg) {
    try { if (typeof toast === "function") { toast(msg); return; } } catch (e) {}
    var el = q("fx2toast");
    if (!el) { el = mk("div", "fx-toast"); el.id = "fx2toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }
  function isMissing(err) {
    var m = ((err && (err.message || err.details || err.hint || err.error_description)) || "").toLowerCase();
    return !!(err && err.code === "PGRST202") ||
      m.indexOf("could not find the function") > -1 ||
      m.indexOf("schema cache") > -1 ||
      (m.indexOf("function public.") > -1 && m.indexOf("does not exist") > -1);
  }
  function fail(err, feature) {
    if (isMissing(err)) {
      state.missing[feature] = true;
      toast2(L("Фича ещё не включена. Примени update-plus-2.sql.", "This feature is not enabled yet. Apply update-plus-2.sql."));
    } else {
      var m = ((err && (err.message || err.error_description)) || String(err || "?"));
      toast2(L("Ошибка: ", "Error: ") + m);
    }
  }
  async function rpc(name, args) {
    var s = gsb();
    if (!s) throw new Error("no-supabase");
    var r = await s.rpc(name, args || {});
    if (r.error) throw r.error;
    return r.data;
  }
  function reloadPlus() {
    try { if (window.fxPlus && typeof window.fxPlus.reload === "function") window.fxPlus.reload(); } catch (e) {}
  }
  function loginPrompt(box, text) {
    if (!box) return;
    clear(box);
    var d = mk("div", "fx-empty");
    d.appendChild(mk("div", "", text || L("Сначала войди в аккаунт.", "Sign in first.")));
    var b = mk("button", "fx-btn main", L("Войти", "Sign in"));
    b.type = "button";
    b.style.marginTop = "10px";
    b.onclick = function () { closePanel(); try { if (typeof go === "function") go("register"); } catch (e) {} };
    d.appendChild(b);
    box.appendChild(d);
  }
  function empty(box, text) {
    if (!box) return;
    clear(box);
    box.appendChild(mk("div", "fx-empty", text || L("Пока пусто.", "Empty for now.")));
  }

  /* ---------------- wallpaper / effect helpers ---------------- */
  function currentWallId() {
    try { return typeof wallId !== "undefined" ? wallId : "none"; } catch (e) { return "none"; }
  }
  function wallRow(id) {
    try {
      if (typeof WALLS === "undefined") return null;
      for (var i = 0; i < WALLS.length; i++) if (WALLS[i][0] === id) return WALLS[i];
    } catch (e) {}
    return null;
  }
  function wallName(id) {
    var row = wallRow(id);
    try { if (row && typeof t === "function") return t(row[1]); } catch (e) {}
    return id;
  }
  function wallColor(id) {
    try { if (typeof WALL_DOT !== "undefined" && WALL_DOT[id]) return WALL_DOT[id]; } catch (e) {}
    return "#8b5cf6";
  }
  function wallPrice(id) {
    return Number(WALL_PRICES[id] || 0);
  }
  function wallDesc(id) {
    return WALL_DESC[id] || L("Анимированные обои.", "Animated wallpaper.");
  }
  function walletPrivs() {
    var w = state.wallet;
    var list = (w && w.privileges) || [];
    return Array.isArray(list) ? list : [];
  }
  function wallUnlocked(id) {
    id = String(id || "");
    if (FREE_WALLS[id]) return true;
    var pid = "wall_" + id;
    if (walletPrivs().indexOf(pid) > -1) return true;
    var u = gu();
    if (u && Array.isArray(u.privileges) && u.privileges.indexOf(pid) > -1) return true;
    if (u) {
      var c = state.privCache.get(String(u.id));
      if (c && Array.isArray(c.list) && c.list.indexOf(pid) > -1) return true;
    }
    return false;
  }
  function canUseWall(id) {
    return !!FREE_WALLS[id] || wallUnlocked(id) || rank() >= 1;
  }

  function effectById(pid) {
    if (!pid) return null;
    var it = state.privilegeMap.get(pid);
    if (it && it.kind === "effect") return it;
    for (var i = 0; i < EFFECT_DEFS.length; i++) if (EFFECT_DEFS[i].id === pid) return EFFECT_DEFS[i];
    if (String(pid).indexOf("fx_") === 0) return { id: pid, value: String(pid).slice(3), kind: "effect" };
    return null;
  }
  function effectValue(pid) {
    var it = effectById(pid);
    return it ? (it.value || String(pid).replace(/^fx_/, "")) : "";
  }
  function effectOwned(pid) {
    if (!pid) return false;
    if (walletPrivs().indexOf(pid) > -1) return true;
    var u = gu();
    if (u && Array.isArray(u.privileges) && u.privileges.indexOf(pid) > -1) return true;
    if (u) {
      var c = state.privCache.get(String(u.id));
      if (c && Array.isArray(c.list) && c.list.indexOf(pid) > -1) return true;
    }
    return false;
  }
  function activeEffectId() {
    var u = gu();
    if (!u) return "";
    var w = state.wallet;
    if (w && (typeof w.active_effect === "string" || w.active_effect === null)) return w.active_effect || "";
    var c = state.privCache.get(String(u.id));
    if (c && (typeof c.active === "string" || c.active === null)) return c.active || "";
    var list = (c && c.list) || walletPrivs();
    for (var i = list.length - 1; i >= 0; i--) {
      if (effectById(list[i])) return list[i];
    }
    return "";
  }
  function activeEffectFor(id) {
    var u = gu();
    var pid = "";
    if (u && String(id) === String(u.id)) pid = activeEffectId();
    if (!pid) {
      var c = state.privCache.get(String(id));
      if (c && (typeof c.active === "string" || c.active === null)) {
        pid = c.active || "";
        if (!pid) return null;
      } else if (c && Array.isArray(c.list)) {
        for (var i = c.list.length - 1; i >= 0; i--) {
          if (effectById(c.list[i])) { pid = c.list[i]; break; }
        }
      }
    }
    if (!pid) return null;
    var val = effectValue(pid);
    return val ? { id: pid, value: val } : null;
  }
  function nickFxLayer(el) {
    if (!el) return null;
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i].classList && el.children[i].classList.contains("fx2-nfx")) return el.children[i];
    }
    return null;
  }
  function paintNickFx(el, value) {
    if (!el) return;
    value = String(value || "");
    var layer = nickFxLayer(el);
    var current = el.getAttribute("data-fx2-fx") || "";
    if (!value) {
      if (layer) layer.remove();
      el.classList.remove("fx2-nick-fx");
      el.removeAttribute("data-fx2-fx");
      return;
    }
    if (current === value && layer) return;
    if (layer) layer.remove();
    el.classList.add("fx2-nick-fx");
    el.setAttribute("data-fx2-fx", value);
    var conf = FX_CONF[value] || FX_CONF.stars;
    layer = mk("span", "fx2-nfx");
    layer.setAttribute("data-fx", value);
    layer.setAttribute("aria-hidden", "true");
    var count = conf.count || 9;
    for (var i = 0; i < count; i++) {
      var s = mk("i", "", conf.chars[i % conf.chars.length]);
      s.style.setProperty("--x", (3 + Math.random() * 92).toFixed(1) + "%");
      s.style.setProperty("--y", (14 + Math.random() * 68).toFixed(1) + "%");
      s.style.setProperty("--d", (-(Math.random() * 3.2)).toFixed(2) + "s");
      s.style.setProperty("--dur", (1.5 + Math.random() * 1.8).toFixed(2) + "s");
      s.style.setProperty("--s", (conf.size[0] + Math.random() * (conf.size[1] - conf.size[0])).toFixed(1) + "px");
      s.style.setProperty("--drift", ((Math.random() * 2 - 1) * conf.drift).toFixed(1) + "px");
      s.style.setProperty("--rot", ((Math.random() * 2 - 1) * conf.rot).toFixed(0) + "deg");
      if (conf.colors) s.style.setProperty("--c", conf.colors[i % conf.colors.length]);
      layer.appendChild(s);
    }
    el.appendChild(layer);
  }

  function ctx() {
    var v = curView();
    if (v === "thread" && threadId()) {
      return { scope: "forum", id: String(threadId()), label: L("Тема форума", "Forum thread"), kind: "thread" };
    }
    if (v === "chat" && chatRoomId()) {
      return { scope: "chat", id: String(chatRoomId()), label: L("Общий чат", "Chat"), kind: "chat" };
    }
    if (v === "dm" && dmTabValue() === "groups" && groupId()) {
      return { scope: "group", id: String(groupId()), label: L("Группа", "Group"), kind: "group" };
    }
    if (v === "dm" && dmUserId()) {
      return { scope: "dm", id: String(dmUserId()), label: L("Личные сообщения", "Direct messages"), kind: "dm" };
    }
    if (v === "servers" && serverId()) {
      return { scope: "server", id: String(serverId()), label: L("Сервер", "Server"), kind: "server" };
    }
    return { scope: "global", id: null, label: L("Глобальный", "Global"), kind: "global" };
  }

  /* ---------------- panel skeleton ---------------- */
  function view(id, title, body, action) {
    return '<div id="fx2-view-' + id + '" class="fx2-view fx-view">' +
      '<div class="fx2-head fx-head"><button type="button" class="fx2-back fx-back" data-fx2-back aria-label="Back">←</button>' +
      '<h3>' + title + '</h3>' + (action || '') + '</div>' + body + '</div>';
  }

  function injectUI() {
    if (q("fx2panel")) return;

    var btn = document.createElement("button");
    btn.id = "fx2btn";
    btn.type = "button";
    btn.className = "glass";
    btn.title = "fsociety PLUS 2";
    btn.setAttribute("aria-label", "fsociety PLUS 2");
    btn.innerHTML = '<span class="fx2-gem-ico">💎</span><span class="fx2-gem-badge" id="fx2-gem-badge">0</span><span class="fx2-report-dot" id="fx2-report-dot"></span>';
    btn.onclick = function () { openPanel("main"); };
    document.body.appendChild(btn);

    var tiles =
      '<button type="button" class="fx-tile" data-fx2-view="privileges"><span class="fx-ico">💎</span><span><b>Привилегии</b><small>за кристаллы</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="wallpapers"><span class="fx-ico">🌧</span><span><b>Обои</b><small>анимированные</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="effects"><span class="fx-ico">💫</span><span><b>Эффекты</b><small>деньги, звёзды, огонь</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="polls"><span class="fx-ico">📊</span><span><b>Опросы</b><small>чат, форум, сервер</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="pins"><span class="fx-ico">📌</span><span><b>Закрепы</b><small>важное под рукой</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="anon"><span class="fx-ico">🕶</span><span><b>Анонимка</b><small>без имён</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="drop"><span class="fx-ico">🕳</span><span><b>Dead drop</b><small>одноразовый код</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="gallery"><span class="fx-ico">🖼</span><span><b>Галерея</b><small>фото сайта</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="radio"><span class="fx-ico">📻</span><span><b>Радио</b><small>fsociety FM</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="ctf"><span class="fx-ico">🚩</span><span><b>CTF / ARG</b><small>флаги и очки</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="quests"><span class="fx-ico">⭐</span><span><b>Квесты</b><small>награды за день</small></span></button>' +
      '<button type="button" class="fx-tile" data-fx2-view="servers"><span class="fx-ico">🛰</span><span><b>Серверы</b><small>каталог</small></span></button>' +
      '<button type="button" class="fx-tile" id="fx2-tile-mod" data-fx2-view="mod"><span class="fx-ico">🛡</span><span><b>Мод-центр</b><small>жалобы и выдача</small><span class="fx2-tile-dot" id="fx2-mod-dot"></span></span></button>';

    var panel = document.createElement("div");
    panel.id = "fx2panel";
    panel.innerHTML =
      '<div class="fx-wrap"><div class="fx-inner">' +
        '<div class="fx-top fx2-top"><h2>fsociety <span class="fx2-title-grad">PLUS 2</span></h2><button type="button" class="fx-x fx2-x" id="fx2close" aria-label="Close">✕</button></div>' +

        '<div id="fx2-main" class="fx2-view fx-view on">' +
          '<div class="fx-card fx2-wallet" id="fx2-wallet"></div>' +
          '<div class="fx-tiles fx2-tiles">' + tiles + '</div>' +
          '<div id="fx2-main-ann"></div>' +
        '</div>' +

        view("privileges", "Привилегии",
          '<p class="fx2-hint" id="fx2-priv-hint">Кристаллы тратятся на косметику и статус. Привилегии остаются навсегда.</p>' +
          '<div id="fx2-priv-list" class="fx2-list"></div>') +

        view("wallpapers", "Анимированные обои",
          '<p class="fx2-hint">Название обоев = эффект. Выбери, посмотри вживую и купи за 💎.</p>' +
          '<div class="fx2-wall-preview" id="fx2-wall-preview">' +
            '<canvas id="fx2-wall-canvas"></canvas>' +
            '<div class="fx2-wall-overlay"><b id="fx2-wall-name">—</b><small id="fx2-wall-desc"></small></div>' +
          '</div>' +
          '<div class="fx2-form-row" id="fx2-wall-actions"></div>' +
          '<div class="fx2-wall-grid" id="fx2-wall-grid"></div>') +

        view("effects", "Эффекты ника",
          '<p class="fx2-hint">Купи эффект — он будет падать прямо в твоём нике. Как «Богач», только на выбор.</p>' +
          '<div class="fx2-form-row" id="fx2-effect-actions"></div>' +
          '<div id="fx2-effect-list" class="fx2-list"></div>') +

        view("polls", "Опросы",
          '<div class="fx2-scope" id="fx2-poll-scope"></div>' +
          '<div id="fx2-poll-list" class="fx2-list"></div>',
          '<button type="button" class="fx-btn main" id="fx2-poll-new">+ Опрос</button>') +

        view("pins", "Закрепы",
          '<p class="fx2-hint" id="fx2-pins-hint"></p>' +
          '<div id="fx2-pins-list" class="fx2-list"></div>') +

        view("anon", "Анонимная доска",
          '<div class="fx2-form"><textarea id="fx2-anon-body" class="fx2-textarea" maxlength="2000" placeholder="Напиши что угодно. Ник не покажется."></textarea>' +
          '<div class="fx2-form-row"><span class="fx2-hint">Анонимно · до 2000 символов</span><button type="button" class="fx-btn main" id="fx2-anon-send">Отправить</button></div></div>' +
          '<div id="fx2-anon-list" class="fx2-list"></div>') +

        view("drop", "Dead drop",
          '<div class="fx2-card fx2-form"><b>Оставить сообщение</b><small class="fx2-hint">Код показывается один раз. Сообщение удалится после прочтения или по таймеру.</small>' +
          '<textarea id="fx2-drop-body" class="fx2-textarea" maxlength="2000" placeholder="Текст, который должен исчезнуть…"></textarea>' +
          '<div class="fx2-form-row"><label>Часов <input id="fx2-drop-hours" type="number" min="1" max="168" value="24" class="fx2-num"></label>' +
          '<label>Просмотров <input id="fx2-drop-views" type="number" min="1" max="20" value="1" class="fx2-num"></label>' +
          '<button type="button" class="fx-btn main" id="fx2-drop-create">Создать</button></div>' +
          '<div id="fx2-drop-code" class="fx2-drop-code" style="display:none"></div></div>' +
          '<div class="fx2-card fx2-form"><b>Прочитать по коду</b><div class="fx2-form-row"><input id="fx2-drop-code-in" class="fx-input" maxlength="8" placeholder="XXXXXXXX" autocomplete="off"><button type="button" class="fx-btn main" id="fx2-drop-get">Открыть</button></div>' +
          '<div id="fx2-drop-out" class="fx2-drop-out"></div></div>' +
          '<div id="fx2-drop-mine" class="fx2-list"></div>') +

        view("gallery", "Галерея",
          '<div id="fx2-gallery" class="fx2-gallery"></div>' +
          '<button type="button" class="fx-btn" id="fx2-gallery-more" style="display:none">Ещё</button>') +

        view("radio", "fsociety FM",
          '<div id="fx2-radio" class="fx2-radio"></div>') +

        view("ctf", "CTF / ARG",
          '<p class="fx2-hint">Флаги дают монеты, кристаллы и XP. Подсказки спрятаны под спойлер.</p>' +
          '<div id="fx2-ctf-list" class="fx2-list"></div>') +

        view("quests", "Квесты и достижения",
          '<div class="fx-tabs" id="fx2-quest-tabs"><button type="button" class="on" data-qtab="quests">Квесты</button><button type="button" data-qtab="achievements">Достижения</button></div>' +
          '<div id="fx2-quest-list" class="fx2-list"></div>') +

        view("servers", "Каталог серверов",
          '<input id="fx2-srv-search" class="fx-input" type="search" autocomplete="off" placeholder="Поиск сервера…">' +
          '<div id="fx2-my-servers"></div>' +
          '<div id="fx2-srv-list" class="fx2-list"></div>') +

        view("mod", "Мод-центр",
          '<div class="fx-tabs" id="fx2-mod-tabs">' +
            '<button type="button" class="on" data-mtab="reports">Жалобы</button>' +
            '<button type="button" data-mtab="announcements">Анонсы</button>' +
            '<button type="button" data-mtab="grants" id="fx2-mtab-grants" style="display:none">Выдача</button>' +
            '<button type="button" data-mtab="history" id="fx2-mtab-history" style="display:none">История</button>' +
          '</div><div id="fx2-mod-body"></div>') +

      '</div></div>';
    document.body.appendChild(panel);

    var modal = document.createElement("div");
    modal.id = "fx2modal";
    modal.innerHTML = '<div class="fx2-mcard"><div class="fx2-mtop"><h3 id="fx2-modal-title"></h3><button type="button" class="fx2-x" id="fx2-modal-close" aria-label="Close">✕</button></div><div id="fx2-modal-body"></div></div>';
    document.body.appendChild(modal);

    bindUI();
  }

  function bindUI() {
    var panel = q("fx2panel");
    if (!panel) return;

    var close = q("fx2close");
    if (close) close.onclick = closePanel;

    panel.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t === panel) { closePanel(); return; }
      if (t.closest("[data-fx2-back]")) { showView("main"); return; }
      var tile = t.closest("[data-fx2-view]");
      if (tile) { showView(tile.getAttribute("data-fx2-view")); return; }
    });

    var modal = q("fx2modal");
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }
    var mclose = q("fx2-modal-close");
    if (mclose) mclose.onclick = closeModal;

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (q("fx2modal") && q("fx2modal").classList.contains("show")) { closeModal(); return; }
      if (q("fx2panel") && q("fx2panel").classList.contains("show")) closePanel();
    });

    var pollNew = q("fx2-poll-new");
    if (pollNew) pollNew.onclick = openPollCreate;

    var anonSend = q("fx2-anon-send");
    if (anonSend) anonSend.onclick = sendAnonPost;

    var dropCreate = q("fx2-drop-create");
    if (dropCreate) dropCreate.onclick = createDrop;
    var dropGet = q("fx2-drop-get");
    if (dropGet) dropGet.onclick = getDrop;
    var dropCodeIn = q("fx2-drop-code-in");
    if (dropCodeIn) dropCodeIn.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); getDrop(); }
    });

    var galMore = q("fx2-gallery-more");
    if (galMore) galMore.onclick = function () { loadGallery(false); };

    var qTabs = q("fx2-quest-tabs");
    if (qTabs) qTabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-qtab]");
      if (!b) return;
      state.questTab = b.getAttribute("data-qtab");
      Array.prototype.forEach.call(qTabs.children, function (x) { x.classList.toggle("on", x === b); });
      loadQuests();
    });

    var mTabs = q("fx2-mod-tabs");
    if (mTabs) mTabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-mtab]");
      if (!b) return;
      state.modTab = b.getAttribute("data-mtab");
      Array.prototype.forEach.call(mTabs.children, function (x) { x.classList.toggle("on", x === b); });
      loadMod();
    });

    var srvSearch = q("fx2-srv-search");
    if (srvSearch) srvSearch.addEventListener("input", function () {
      clearTimeout(state.serverTimer);
      state.serverQuery = srvSearch.value.trim();
      state.serverTimer = setTimeout(loadServers, 320);
    });

    window.addEventListener("resize", function () {
      if (state.currentView === "wallpapers" && q("fx2panel") && q("fx2panel").classList.contains("show")) {
        startWallPreview(state.wallSel || "rain");
      }
    });
  }

  function openPanel(name) {
    injectUI();
    var p = q("fx2panel");
    if (!p) return;
    p.classList.add("show");
    if (name === "polls") state.pollScope = null;
    showView(name || "main");
    loadWallet();
    loadAnnouncements();
    if (isStaff()) loadReportsCount();
  }
  function closePanel() {
    stopWallPreview();
    var p = q("fx2panel");
    if (p) p.classList.remove("show");
    closeModal();
  }
  function showView(name) {
    var panel = q("fx2panel");
    if (!panel) return;
    if (name === "mod" && !isStaff()) name = "main";
    if (state.currentView === "wallpapers" && name !== "wallpapers") stopWallPreview();
    state.currentView = name;
    Array.prototype.forEach.call(panel.querySelectorAll(".fx2-view"), function (v) {
      v.classList.toggle("on", v.id === "fx2-view-" + name || (name === "main" && v.id === "fx2-main"));
    });
    if (name === "main") { loadWallet(); loadAnnouncements(); }
    else if (name === "privileges") loadPrivileges();
    else if (name === "wallpapers") loadWallpapers();
    else if (name === "effects") loadEffects();
    else if (name === "polls") loadPolls();
    else if (name === "pins") loadPins();
    else if (name === "anon") loadAnon();
    else if (name === "drop") loadDrop();
    else if (name === "gallery") { state.galleryRows = []; state.galleryOffset = 0; state.galleryKeys = new Set(); loadGallery(true); }
    else if (name === "radio") loadRadio();
    else if (name === "ctf") loadCtf();
    else if (name === "quests") loadQuests();
    else if (name === "servers") loadServers();
    else if (name === "mod") loadMod();
  }

  function openModal(title, builder) {
    injectUI();
    var m = q("fx2modal");
    if (!m) return;
    var t = q("fx2-modal-title");
    if (t) t.textContent = title || "";
    var body = q("fx2-modal-body");
    if (body) { clear(body); builder(body); }
    m.classList.add("show");
  }
  function closeModal() {
    var m = q("fx2modal");
    if (m) m.classList.remove("show");
  }

  /* ---------------- wallet ---------------- */
  async function loadWallet() {
    var u = gu();
    if (!u) { renderGuestWallet(); return; }
    try {
      var rows = await rpc("wallet_get");
      state.wallet = (rows || [])[0] || null;
      if (state.wallet) {
        state.privCache.set(String(u.id), {
          at: Date.now(),
          list: state.wallet.privileges || [],
          active: state.wallet.active_effect
        });
      }
      renderWallet();
      if (!state.wallSynced) {
        state.wallSynced = true;
        applyOwnedWallpaper();
      }
      try {
        if (typeof buildWallGrid === "function" && q("emodal") && q("emodal").classList.contains("show")) buildWallGrid();
      } catch (e) {}
      decoratePrivileges(true);
    } catch (e) {
      if (isMissing(e)) state.missing.wallet = true;
      renderWalletFallback();
    }
  }

  function renderGuestWallet() {
    var w = q("fx2-wallet");
    if (!w) return;
    w.innerHTML =
      '<div class="fx2-wallet-top"><div class="fx2-w-ava" id="fx2-w-ava"><span>?</span></div>' +
      '<div class="fx2-w-main"><div class="fx2-w-nick">Гость</div><div class="fx2-w-sub">Войди, чтобы видеть кристаллы и привилегии</div></div></div>' +
      '<div class="fx2-w-actions"><button type="button" class="fx-btn main" id="fx2-w-login">Войти</button></div>';
    var b = q("fx2-w-login");
    if (b) b.onclick = function () { closePanel(); try { if (typeof go === "function") go("register"); } catch (e) {} };
    var badge = q("fx2-gem-badge"); if (badge) badge.textContent = "0";
    var line = q("fx2-wallet-line"); if (line) line.textContent = "💎 0";
    var tile = q("fx2-plus-tile-sub"); if (tile) tile.textContent = "войди в аккаунт";
  }

  function renderWalletFallback() {
    var u = gu();
    var w = q("fx2-wallet");
    if (!w) return;
    var nick = u ? u.nick : "?";
    w.innerHTML =
      '<div class="fx2-wallet-top"><div class="fx2-w-ava" id="fx2-w-ava"><span>' + initial(nick) + '</span></div>' +
      '<div class="fx2-w-main"><div class="fx2-w-nick">' + nick + '</div><div class="fx2-w-sub">Кошелёк недоступен. Примени update-plus-2.sql.</div></div></div>' +
      '<div class="fx2-w-actions"><button type="button" class="fx-btn" id="fx2-w-priv">Привилегии</button></div>';
    var p = q("fx2-w-priv");
    if (p) p.onclick = function () { showView("privileges"); };
  }

  function renderWallet() {
    var u = gu();
    var w = q("fx2-wallet");
    if (!w) return;
    if (!u) { renderGuestWallet(); return; }
    var st = state.wallet || {};
    var privs = st.privileges || [];
    var title = st.title ? '<span class="fx2-title">' + st.title + '</span>' : '';
    w.innerHTML =
      '<div class="fx2-wallet-top">' +
        '<div class="fx2-w-ava" id="fx2-w-ava"></div>' +
        '<div class="fx2-w-main"><div class="fx2-w-nick">' + (u.nick || "?") + title + '</div>' +
        '<div class="fx2-w-sub">LVL ' + (st.level || "—") + ' · ' + privs.length + L(" привилегий", " privileges") + '</div></div>' +
      '</div>' +
      '<div class="fx2-w-balance"><span class="fx2-chip gem">' + GEM + ' <b id="fx2-w-gems">' + nfmt(st.gems) + '</b></span>' +
      '<span class="fx2-chip coin">' + COIN + ' <b id="fx2-w-coins">' + nfmt(st.coins) + '</b></span></div>' +
      '<div class="fx2-w-actions"><button type="button" class="fx-btn main" id="fx2-w-priv">Привилегии</button>' +
      '<button type="button" class="fx-btn" id="fx2-w-grant" style="display:none">Выдать валюту</button></div>';
    fillAva(q("fx2-w-ava"), u);
    var wava = q("fx2-w-ava");
    if (wava) {
      wava.setAttribute("data-fx2-ava-uid", String(u.id));
      applyPrivToAvatar(wava, String(u.id));
    }
    var p = q("fx2-w-priv");
    if (p) p.onclick = function () { showView("privileges"); };
    var g = q("fx2-w-grant");
    if (g) {
      g.style.display = canGrant() ? "" : "none";
      g.onclick = function () { openGrant(null); };
    }
    var badge = q("fx2-gem-badge"); if (badge) badge.textContent = nfmt(st.gems);
    var line = q("fx2-wallet-line");
    if (line) line.innerHTML = GEM + " " + nfmt(st.gems) + " · " + COIN + " " + nfmt(st.coins);
    var tile = q("fx2-plus-tile-sub");
    if (tile) tile.textContent = GEM + " " + nfmt(st.gems) + " · привилегии";
    updateStaffButtons();
  }

  function fillAva(box, u) {
    if (!box) return;
    clear(box);
    if (u && u.avatar) {
      var im = document.createElement("img");
      im.src = u.avatar; im.alt = ""; box.appendChild(im);
    } else {
      box.appendChild(mk("span", "", initial(u && u.nick)));
    }
  }

  /* ---------------- privileges ---------------- */
  async function loadPrivileges() {
    var list = q("fx2-priv-list");
    if (!gu()) { loginPrompt(list); return; }
    if (list && !state.privileges.length) list.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…")));
    try {
      state.privileges = (await rpc("privilege_list")) || [];
      renderPrivileges();
    } catch (e) {
      if (list) empty(list, isMissing(e) ? L("Привилегии не включены. Примени update-plus-2.sql.", "Privileges are not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить привилегии.", "Could not load privileges."));
      if (!isMissing(e)) fail(e, "privileges");
    }
  }

  function privIcon(kind) {
    return kind === "badge" ? "🏅" : kind === "glow" ? "✨" : kind === "frame" ? "🖼" :
      kind === "title" ? "🏷" : kind === "banner" ? "🌈" :
      kind === "effect" ? "💫" : kind === "wallpaper" ? "🌧" : "💬";
  }

  function renderPrivileges() {
    var list = q("fx2-priv-list");
    if (!list) return;
    clear(list);
    var st = state.wallet || {};
    var lvl = st.level || 0;
    var hint = q("fx2-priv-hint");
    if (hint) hint.textContent = GEM + " " + nfmt(st.gems) + L(" на балансе. Привилегии покупаются навсегда.", " on balance. Privileges are permanent.");
    var items = state.privileges.filter(function (it) {
      return it.kind !== "effect" && it.kind !== "wallpaper";
    });
    if (!items.length) {
      list.appendChild(mk("div", "fx-empty", L("Пока нет привилегий.", "No privileges yet.")));
      return;
    }
    items.forEach(function (it) {
      var card = mk("div", "fx2-priv" + (it.owned ? " owned" : ""));
      var top = mk("div", "fx2-priv-top");
      top.appendChild(mk("span", "fx2-priv-ico", privIcon(it.kind)));
      var main = mk("div", "fx2-priv-main");
      main.appendChild(mk("b", "", it.title));
      main.appendChild(mk("small", "", it.description));
      top.appendChild(main);
      top.appendChild(mk("span", "fx2-priv-cost", GEM + " " + nfmt(it.cost_gems)));
      card.appendChild(top);
      var meta = mk("div", "fx2-priv-meta");
      meta.appendChild(mk("span", "", "LVL " + it.min_level + "+"));
      if (it.owned) meta.appendChild(mk("span", "fx2-ok", L("куплено", "owned")));
      card.appendChild(meta);
      var acts = mk("div", "fx2-form-row");
      if (!it.owned) {
        var buy = mk("button", "fx-btn main", lvl < it.min_level ? L("Нужен уровень", "Level required") : L("Купить", "Buy"));
        buy.type = "button";
        buy.disabled = lvl < it.min_level;
        buy.onclick = function () { buyPrivilege(it, buy); };
        acts.appendChild(buy);
      } else if (it.id === "custom_title") {
        var inp = document.createElement("input");
        inp.type = "text"; inp.maxLength = 24; inp.className = "fx-input";
        inp.placeholder = L("Свой титул, до 24 символов", "Custom title, up to 24 chars");
        inp.value = (state.wallet && state.wallet.title) || "";
        var save = mk("button", "fx-btn main", L("Сохранить", "Save"));
        save.type = "button";
        save.onclick = function () { saveCustomTitle(inp, save); };
        acts.appendChild(inp); acts.appendChild(save);
      } else {
        acts.appendChild(mk("span", "fx2-hint", L("Активно автоматически", "Active automatically")));
      }
      card.appendChild(acts);
      list.appendChild(card);
    });
  }

  async function buyPrivilege(it, btn) {
    if (!gu()) { toast2(L("Сначала войди.", "Sign in first.")); return; }
    btn.disabled = true;
    try {
      await rpc("privilege_buy", { p_id: it.id });
      toast2(L("Куплено: ", "Bought: ") + it.title);
      await loadWallet();
      await loadPrivileges();
      reloadPlus();
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("gems") > -1) toast2(L("Не хватает кристаллов.", "Not enough gems."));
      else if (m.indexOf("level") > -1) toast2(L("Слишком низкий уровень.", "Level too low."));
      else if (m.indexOf("owned") > -1) toast2(L("Уже куплено.", "Already owned."));
      else fail(e, "privileges");
    } finally {
      btn.disabled = false;
    }
  }

  async function saveCustomTitle(inp, btn) {
    btn.disabled = true;
    try {
      await rpc("privilege_set_title", { p_title: inp.value.trim() });
      toast2(L("Титул сохранён.", "Title saved."));
      await loadWallet();
      await loadPrivileges();
      reloadPlus();
    } catch (e) {
      fail(e, "title");
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------------- animated wallpapers ---------------- */
  function wallIds() {
    var out = [];
    try {
      if (typeof WALLS !== "undefined") {
        for (var i = 0; i < WALLS.length; i++) {
          if (WALLS[i][0] !== "custom") out.push(WALLS[i][0]);
        }
      }
    } catch (e) {}
    if (!out.length) out = Object.keys(WALL_ICONS);
    return out;
  }

  async function loadWallpapers() {
    var grid = q("fx2-wall-grid");
    if (!grid) return;
    if (gu() && !state.wallet) await loadWallet();
    if (!state.wallSel) state.wallSel = currentWallId();
    if (state.wallSel === "custom" || !WALL_ICONS[state.wallSel]) state.wallSel = "rain";
    renderWallGrid();
    renderWallActions();
    startWallPreview(state.wallSel);
  }

  function renderWallGrid() {
    var grid = q("fx2-wall-grid");
    if (!grid) return;
    clear(grid);
    var sel = state.wallSel || "rain";
    wallIds().forEach(function (id) {
      var usable = canUseWall(id);
      var free = !!FREE_WALLS[id];
      var card = mk("button", "fx2-wall-card" + (id === sel ? " on" : "") + (usable ? "" : " locked") + (currentWallId() === id ? " current" : ""));
      card.type = "button";
      card.style.setProperty("--wc", wallColor(id));
      card.appendChild(mk("span", "fx2-wall-glow"));
      card.appendChild(mk("span", "fx2-wall-ico", WALL_ICONS[id] || "🖼"));
      var main = mk("span", "fx2-wall-main");
      main.appendChild(mk("b", "", wallName(id)));
      main.appendChild(mk("small", "", free ? L("бесплатно", "free") : usable ? L("открыто", "unlocked") : GEM + " " + wallPrice(id)));
      card.appendChild(main);
      if (!usable) card.appendChild(mk("span", "fx2-wall-lock", "🔒"));
      card.onclick = function () {
        state.wallSel = id;
        renderWallGrid();
        renderWallActions();
        startWallPreview(id);
      };
      grid.appendChild(card);
    });
  }

  function renderWallActions() {
    var box = q("fx2-wall-actions");
    if (!box) return;
    clear(box);
    var id = state.wallSel || "rain";
    var nameEl = q("fx2-wall-name");
    var descEl = q("fx2-wall-desc");
    if (nameEl) nameEl.textContent = wallName(id);
    if (descEl) descEl.textContent = wallDesc(id);
    var usable = canUseWall(id);
    var current = currentWallId() === id;
    if (!gu()) {
      var login = mk("button", "fx-btn main", L("Войти", "Sign in"));
      login.type = "button";
      login.onclick = function () {
        closePanel();
        try { if (typeof go === "function") go("register"); } catch (e) {}
      };
      box.appendChild(login);
      box.appendChild(mk("span", "fx2-hint", usable
        ? L("Превью можно смотреть без аккаунта, а применить обои — после входа.", "You can preview without an account; sign in to apply.")
        : L("Войди, чтобы купить эти обои за кристаллы.", "Sign in to buy this wallpaper with gems.")));
      return;
    }
    if (usable) {
      var apply = mk("button", "fx-btn main", current ? L("Уже стоит", "Already applied") : L("Применить", "Apply"));
      apply.type = "button";
      apply.disabled = current;
      apply.onclick = function () { applyWallpaper(id, apply); };
      box.appendChild(apply);
    } else {
      var buy = mk("button", "fx-btn main", L("Купить за ", "Buy for ") + GEM + " " + wallPrice(id));
      buy.type = "button";
      buy.onclick = function () { buyWallpaper(id, buy); };
      box.appendChild(buy);
      box.appendChild(mk("span", "fx2-hint", L("Цена навсегда. После покупки обои включатся сразу.", "One-time price. Applied right after purchase.")));
    }
  }

  function startWallPreview(id) {
    stopWallPreview();
    var cv = q("fx2-wall-canvas");
    if (!cv) return;
    var box = cv.parentElement;
    if (!box) return;
    var w = Math.max(140, Math.round(box.clientWidth || 320));
    var h = Math.max(110, Math.round(box.clientHeight || 190));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    var ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (id === "none" || typeof DRAW === "undefined" || !DRAW[id]) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    var st = null;
    var oldW = 0, oldH = 0;
    try {
      oldW = ww; oldH = wh;
      ww = w; wh = h;
      st = INIT[id] ? INIT[id]() : {};
    } catch (e) {
      st = {};
    } finally {
      try { ww = oldW; wh = oldH; } catch (e2) {}
    }
    if (!st) st = {};
    var obj = { id: id, raf: 0, w: w, h: h, st: st, ctx: ctx };
    state.wallPreview = obj;
    var last = 0;
    function frame(ts) {
      if (!state.wallPreview || state.wallPreview !== obj) return;
      obj.raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (ts - last < 50) return;
      last = ts;
      try { DRAW[id](ctx, w, h, ts, st); } catch (e) {}
    }
    obj.raf = requestAnimationFrame(frame);
  }

  function stopWallPreview() {
    var obj = state.wallPreview;
    state.wallPreview = null;
    if (obj && obj.raf) cancelAnimationFrame(obj.raf);
    var cv = q("fx2-wall-canvas");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    }
  }

  async function applyWallpaper(id, btn) {
    var u = gu();
    if (!u) { toast2(L("Сначала войди в аккаунт.", "Sign in first.")); return; }
    if (!canUseWall(id)) { toast2(L("Эти обои ещё не куплены.", "This wallpaper is not unlocked yet.")); return; }
    if (btn) btn.disabled = true;
    try {
      try { if (typeof setWall === "function") setWall(id); } catch (e) {}
      u.wallpaper = id;
      var s = gsb();
      if (s) {
        var r = await s.from("profiles").update({ wallpaper: id }).eq("id", u.id);
        if (r.error) throw r.error;
      }
      toast2(L("Обои применены.", "Wallpaper applied."));
      renderWallGrid();
      renderWallActions();
    } catch (e) {
      toast2(L("Обои включены, но не сохранились в профиле.", "Wallpaper applied, but could not be saved."));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function buyWallpaper(id, btn) {
    if (!gu()) { toast2(L("Сначала войди в аккаунт.", "Sign in first.")); return; }
    if (btn) btn.disabled = true;
    try {
      await rpc("privilege_buy", { p_id: "wall_" + id });
      toast2(L("Куплено: ", "Bought: ") + wallName(id));
      await loadWallet();
      await loadPrivileges();
      renderWallGrid();
      renderWallActions();
      await applyWallpaper(id, null);
      decoratePrivileges(true);
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("gems") > -1) toast2(L("Не хватает кристаллов.", "Not enough gems."));
      else if (m.indexOf("level") > -1) toast2(L("Слишком низкий уровень.", "Level too low."));
      else if (m.indexOf("owned") > -1) { await loadWallet(); renderWallGrid(); renderWallActions(); }
      else fail(e, "wallpapers");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function applyOwnedWallpaper() {
    var u = gu();
    if (!u || !u.wallpaper) return;
    var id = String(u.wallpaper);
    if (id === "custom") return;
    if (currentWallId() === id) return;
    if (wallUnlocked(id) || rank() >= 1) {
      try { if (typeof setWall === "function") setWall(id); } catch (e) {}
    }
  }

  /* ---------------- nickname effects ---------------- */
  function effectDefs() {
    var map = new Map();
    EFFECT_DEFS.forEach(function (d) {
      map.set(d.id, {
        id: d.id, title: d.title, description: d.description,
        cost_gems: d.cost_gems, min_level: d.min_level, value: d.value, kind: "effect"
      });
    });
    state.privileges.forEach(function (it) {
      if (it.kind !== "effect") return;
      var cur = map.get(it.id) || {};
      map.set(it.id, Object.assign(cur, it));
    });
    return Array.from(map.values()).sort(function (a, b) {
      return (Number(a.cost_gems) || 0) - (Number(b.cost_gems) || 0);
    });
  }

  async function loadEffects() {
    var list = q("fx2-effect-list");
    if (!list) return;
    if (gu() && !state.wallet) await loadWallet();
    if (gu() && !state.privileges.length) {
      try { state.privileges = (await rpc("privilege_list")) || []; }
      catch (e) { if (isMissing(e)) state.missing.privileges = true; }
    }
    renderEffects();
  }

  function renderEffects() {
    var list = q("fx2-effect-list");
    if (!list) return;
    clear(list);
    var actions = q("fx2-effect-actions");
    if (actions) clear(actions);
    var activeId = activeEffectId();
    if (actions && activeId) {
      var off = mk("button", "fx-btn", L("Снять эффект", "Turn effect off"));
      off.type = "button";
      off.onclick = function () { setEffect("", off); };
      actions.appendChild(off);
      actions.appendChild(mk("span", "fx2-hint", L("Эффект можно включить снова бесплатно.", "You can turn it back on for free.")));
    }
    if (!gu()) {
      loginPrompt(list);
      return;
    }
    var defs = effectDefs();
    if (!defs.length) {
      empty(list, L("Эффекты не включены. Примени update-plus-2.sql.", "Effects are not enabled. Apply update-plus-2.sql."));
      return;
    }
    defs.forEach(function (it) {
      var owned = effectOwned(it.id);
      var active = activeId === it.id;
      var card = mk("div", "fx2-effect" + (owned ? " owned" : "") + (active ? " active" : ""));
      var top = mk("div", "fx2-effect-top");
      top.appendChild(mk("span", "fx2-effect-ico", FX_ICONS[it.value] || "💫"));
      var main = mk("div", "fx2-effect-main");
      main.appendChild(mk("b", "", it.title));
      main.appendChild(mk("small", "", it.description));
      top.appendChild(main);
      top.appendChild(mk("span", "fx2-effect-cost", GEM + " " + nfmt(it.cost_gems)));
      card.appendChild(top);
      var demo = mk("div", "fx2-effect-demo");
      var nick = mk("span", "fx2-effect-nick");
      nick.appendChild(mk("span", "rnm", L("Твой ник", "Your nick")));
      paintNickFx(nick, it.value);
      demo.appendChild(nick);
      card.appendChild(demo);
      var meta = mk("div", "fx2-effect-meta");
      meta.appendChild(mk("span", "", "LVL " + it.min_level + "+"));
      if (active) meta.appendChild(mk("span", "fx2-ok", L("включён", "active")));
      else if (owned) meta.appendChild(mk("span", "fx2-ok", L("куплено", "owned")));
      card.appendChild(meta);
      var acts = mk("div", "fx2-form-row");
      if (!owned) {
        var buy = mk("button", "fx-btn main", L("Купить", "Buy"));
        buy.type = "button";
        buy.onclick = function () { buyEffect(it, buy); };
        acts.appendChild(buy);
      } else if (!active) {
        var on = mk("button", "fx-btn main", L("Включить", "Enable"));
        on.type = "button";
        on.onclick = function () { setEffect(it.id, on); };
        acts.appendChild(on);
      } else {
        acts.appendChild(mk("span", "fx2-hint", L("Эффект уже работает.", "This effect is active.")));
      }
      card.appendChild(acts);
      list.appendChild(card);
    });
  }

  async function buyEffect(it, btn) {
    if (!gu()) { toast2(L("Сначала войди в аккаунт.", "Sign in first.")); return; }
    if (btn) btn.disabled = true;
    try {
      await rpc("privilege_buy", { p_id: it.id });
      toast2(L("Куплено: ", "Bought: ") + it.title);
      await loadWallet();
      await loadPrivileges();
      renderEffects();
      decoratePrivileges(true);
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("gems") > -1) toast2(L("Не хватает кристаллов.", "Not enough gems."));
      else if (m.indexOf("level") > -1) toast2(L("Слишком низкий уровень.", "Level too low."));
      else if (m.indexOf("owned") > -1) { await loadWallet(); renderEffects(); }
      else fail(e, "effects");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function setEffect(pid, btn) {
    if (!gu()) { toast2(L("Сначала войди в аккаунт.", "Sign in first.")); return; }
    if (btn) btn.disabled = true;
    try {
      await rpc("effect_set", { p_id: pid || "" });
      toast2(pid ? L("Эффект включён.", "Effect enabled.") : L("Эффект снят.", "Effect removed."));
      await loadWallet();
      await loadPrivileges();
      renderEffects();
      decoratePrivileges(true);
    } catch (e) {
      fail(e, "effects");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  /* ---------------- polls ---------------- */
  function pollResults(p) {
    var res = p && p.results;
    if (typeof res === "string") { try { res = JSON.parse(res); } catch (e) { res = null; } }
    if (Array.isArray(res) && res.length) return res;
    var opts = p && p.options;
    if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch (e) { opts = []; } }
    return (opts || []).map(function (text, i) { return { i: i, text: text, votes: 0 }; });
  }
  function pollMyVotes(p) {
    var v = p && p.my_votes;
    if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) { v = []; } }
    return Array.isArray(v) ? v.map(Number) : [];
  }
  function pollClosed(p) {
    try { return new Date(p.closes_at).getTime() <= Date.now(); } catch (e) { return false; }
  }

  function renderPollScope(active) {
    var box = q("fx2-poll-scope");
    if (!box) return;
    clear(box);
    var c = ctx();
    var g = mk("button", "fx2-scope-btn" + (active.scope === "global" ? " on" : ""), L("Глобальный", "Global"));
    g.type = "button";
    g.onclick = function () { state.pollScope = { scope: "global", id: null, label: L("Глобальный", "Global") }; loadPolls(); };
    box.appendChild(g);
    if (c.scope !== "global") {
      var b = mk("button", "fx2-scope-btn" + (active.scope === c.scope && String(active.id) === String(c.id) ? " on" : ""), c.label);
      b.type = "button";
      b.onclick = function () { state.pollScope = c; loadPolls(); };
      box.appendChild(b);
    }
    var hint = mk("span", "fx2-scope-label", active.label || "");
    box.appendChild(hint);
  }

  async function loadPolls() {
    var list = q("fx2-poll-list");
    if (!gu()) { loginPrompt(list); return; }
    var sc = state.pollScope || ctx();
    if (sc.scope === "global") sc = { scope: "global", id: null, label: L("Глобальный", "Global") };
    renderPollScope(sc);
    if (list) { clear(list); list.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…"))); }
    try {
      state.polls = (await rpc("polls_list", { p_scope: sc.scope, p_scope_id: sc.id })) || [];
      renderPolls();
    } catch (e) {
      if (list) empty(list, isMissing(e) ? L("Опросы не включены. Примени update-plus-2.sql.", "Polls are not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить опросы.", "Could not load polls."));
      if (!isMissing(e)) fail(e, "polls");
    }
  }

  function renderPolls() {
    var list = q("fx2-poll-list");
    if (!list) return;
    clear(list);
    if (!state.polls.length) {
      var d = mk("div", "fx-empty", L("Опросов пока нет. Создай первый.", "No polls yet. Create the first one."));
      list.appendChild(d);
      return;
    }
    state.polls.forEach(function (p) { list.appendChild(pollCard(p, false)); });
  }

  function pollCard(p, compact) {
    var card = mk("div", "fx2-poll" + (compact ? " compact" : ""));
    var top = mk("div", "fx2-poll-top");
    var qq = mk("div", "fx2-poll-q", p.question);
    top.appendChild(qq);
    card.appendChild(top);
    var meta = mk("div", "fx2-poll-meta");
    meta.appendChild(mk("span", "", (p.nick || "?") + " · " + dateShort(p.created_at)));
    if (p.multiple) meta.appendChild(mk("span", "", L("мультивыбор", "multiple")));
    if (pollClosed(p)) meta.appendChild(mk("span", "fx2-closed", L("закрыт", "closed")));
    else meta.appendChild(mk("span", "", L("до ", "until ") + dateShort(p.closes_at)));
    card.appendChild(meta);

    var results = pollResults(p);
    var total = Number(p.total_votes) || 0;
    if (!total) total = results.reduce(function (s, x) { return s + (Number(x.votes) || 0); }, 0);
    var mine = pollMyVotes(p);
    var closed = pollClosed(p);
    var opts = mk("div", "fx2-poll-opts");
    results.forEach(function (o) {
      var votes = Number(o.votes) || 0;
      var pct = total ? Math.round(votes / total * 100) : 0;
      var b = mk("button", "fx2-poll-opt" + (mine.indexOf(Number(o.i)) > -1 ? " mine" : ""));
      b.type = "button";
      b.disabled = closed;
      var bar = mk("span", "fx2-poll-bar");
      bar.style.width = pct + "%";
      b.appendChild(bar);
      var txt = mk("span", "fx2-poll-txt");
      txt.appendChild(mk("b", "", String(o.text)));
      txt.appendChild(mk("small", "", votes + L(" гол.", " votes") + " · " + pct + "%"));
      b.appendChild(txt);
      b.onclick = function () { votePoll(p.id, o.i); };
      opts.appendChild(b);
    });
    card.appendChild(opts);

    var foot = mk("div", "fx2-poll-foot");
    foot.appendChild(mk("span", "", total + L(" голосов", " votes")));
    if (p.author === uid() || isStaff()) {
      var del = mk("button", "fx2-link danger", L("Удалить", "Delete"));
      del.type = "button";
      del.onclick = function () { deletePoll(p); };
      foot.appendChild(del);
    }
    card.appendChild(foot);
    return card;
  }

  async function votePoll(id, opt) {
    if (!gu()) { toast2(L("Сначала войди.", "Sign in first.")); return; }
    try {
      await rpc("poll_vote", { p_id: Number(id), p_option: Number(opt) });
      if (q("fx2-view-polls") && q("fx2-view-polls").classList.contains("on")) await loadPolls();
      refreshInlinePolls(true);
      reloadPlus();
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("closed") > -1) toast2(L("Опрос уже закрыт.", "This poll is closed."));
      else fail(e, "polls");
    }
  }

  function deletePoll(p) {
    var doDel = async function () {
      try {
        await rpc("poll_delete", { p_id: Number(p.id) });
        toast2(L("Опрос удалён.", "Poll deleted."));
        await loadPolls();
        refreshInlinePolls(true);
      } catch (e) { fail(e, "polls"); }
    };
    try { if (typeof askConfirm === "function") askConfirm(L("Удалить опрос?", "Delete this poll?"), doDel); else if (window.confirm(L("Удалить опрос?", "Delete this poll?"))) doDel(); }
    catch (e) { doDel(); }
  }

  function openPollCreate() {
    if (!gu()) { toast2(L("Сначала войди.", "SIGN IN")); return; }
    var c = ctx();
    var sc = state.pollScope || c;
    var currentLabel = c.scope === "global" ? L("Глобальный", "Global") : c.label;
    openModal(L("Новый опрос", "New poll"), function (body) {
      body.innerHTML =
        '<div class="fx2-form">' +
          '<input id="fx2-poll-q" class="fx-input" maxlength="200" placeholder="Вопрос (3–200 символов)">' +
          '<textarea id="fx2-poll-opts" class="fx2-textarea" maxlength="900" placeholder="Варианты, по одному на строку (2–10)"></textarea>' +
          '<div class="fx2-form-row"><label>Куда <select id="fx2-poll-scope" class="fx2-select">' +
            '<option value="global">' + L("Глобальный", "Global") + '</option>' +
            (c.scope !== "global" ? '<option value="current" selected>' + currentLabel + '</option>' : '') +
          '</select></label>' +
          '<label>Часов <input id="fx2-poll-hours" class="fx2-num" type="number" min="1" max="720" value="168"></label>' +
          '<label class="fx2-check"><input id="fx2-poll-multi" type="checkbox"> ' + L("Мультивыбор", "Multiple") + '</label></div>' +
          '<div id="fx2-poll-err" class="fx2-err"></div>' +
          '<div class="fx2-form-row"><button type="button" class="fx-btn main" id="fx2-poll-create">' + L("Создать", "Create") + '</button></div>' +
        '</div>';
      var qEl = q("fx2-poll-q");
      if (qEl) qEl.focus();
      var btn = q("fx2-poll-create");
      if (!btn) return;
      btn.onclick = async function () {
        var question = (q("fx2-poll-q").value || "").trim();
        var lines = (q("fx2-poll-opts").value || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
        var err = q("fx2-poll-err");
        if (question.length < 3 || question.length > 200) { if (err) err.textContent = L("Вопрос: от 3 до 200 символов.", "Question: 3–200 chars."); return; }
        if (lines.length < 2 || lines.length > 10) { if (err) err.textContent = L("Нужно от 2 до 10 вариантов.", "Need 2–10 options."); return; }
        if (lines.some(function (x) { return x.length > 80; })) { if (err) err.textContent = L("Вариант слишком длинный (до 80).", "Option too long (max 80)."); return; }
        var scopeVal = q("fx2-poll-scope").value;
        var target = scopeVal === "current" ? c : { scope: "global", id: null };
        var hours = parseInt(q("fx2-poll-hours").value, 10) || 168;
        btn.disabled = true;
        try {
          await rpc("poll_create", {
            p_scope: target.scope,
            p_scope_id: target.id,
            p_question: question,
            p_options: lines,
            p_multiple: !!q("fx2-poll-multi").checked,
            p_hours: hours
          });
          state.pollScope = target;
          closeModal();
          toast2(L("Опрос создан.", "Poll created."));
          await loadPolls();
          refreshInlinePolls(true);
          reloadPlus();
        } catch (e) {
          if (err) err.textContent = ((e && e.message) || L("Ошибка.", "Error."));
          if (!isMissing(e)) fail(e, "polls");
        } finally { btn.disabled = false; }
      };
    });
  }

  function injectPollSlots() {
    function add(id, before) {
      if (!before || !before.parentNode || q(id)) return;
      var d = mk("div", "fx2-pollbar");
      d.id = id;
      before.parentNode.insertBefore(d, before);
    }
    add("fx2-poll-chat", q("msgs"));
    add("fx2-poll-dm", q("dmmsgs"));
    add("fx2-poll-group", q("groupmsgs"));
    add("fx2-poll-srv", q("srvmsgs"));
    add("fx2-poll-thread", q("th_replies"));
  }

  function hidePollSlots() {
    ["fx2-poll-chat", "fx2-poll-dm", "fx2-poll-group", "fx2-poll-srv", "fx2-poll-thread"].forEach(function (id) {
      var el = q(id);
      if (el) { el.style.display = "none"; clear(el); }
    });
  }

  async function refreshInlinePolls(force) {
    if (!gu()) { hidePollSlots(); return; }
    var c = ctx();
    var key = c.scope + ":" + (c.id || "");
    if (!force && key === state.inlineKey && Date.now() - state.inlineAt < 15000) return;
    state.inlineKey = key;
    state.inlineAt = Date.now();
    hidePollSlots();
    var slot = null;
    if (c.scope === "chat") slot = q("fx2-poll-chat");
    else if (c.scope === "dm") slot = q("fx2-poll-dm");
    else if (c.scope === "group") slot = q("fx2-poll-group");
    else if (c.scope === "server") slot = q("fx2-poll-srv");
    else if (c.scope === "forum") slot = q("fx2-poll-thread");
    if (!slot) return;
    try {
      var rows = (await rpc("polls_list", { p_scope: c.scope, p_scope_id: c.id })) || [];
      var active = rows.filter(function (p) { return !pollClosed(p); })[0] || null;
      if (!active) return;
      renderInlinePoll(slot, active);
    } catch (e) { /* тихо: опросы могут быть ещё не включены */ }
  }

  function renderInlinePoll(slot, p) {
    clear(slot);
    slot.style.display = "block";
    var head = mk("div", "fx2-pollbar-head");
    head.appendChild(mk("span", "fx2-pollbar-ico", "📊"));
    head.appendChild(mk("b", "", p.question));
    var all = mk("button", "fx2-link", L("все", "all"));
    all.type = "button";
    all.onclick = function () { openPanel("polls"); };
    head.appendChild(all);
    slot.appendChild(head);

    var results = pollResults(p);
    var total = Number(p.total_votes) || results.reduce(function (s, x) { return s + (Number(x.votes) || 0); }, 0);
    var mine = pollMyVotes(p);
    var opts = mk("div", "fx2-pollbar-opts");
    results.slice(0, 10).forEach(function (o) {
      var votes = Number(o.votes) || 0;
      var pct = total ? Math.round(votes / total * 100) : 0;
      var b = mk("button", "fx2-pollbar-opt" + (mine.indexOf(Number(o.i)) > -1 ? " mine" : ""));
      b.type = "button";
      var bar = mk("span", "fx2-pollbar-fill");
      bar.style.width = pct + "%";
      b.appendChild(bar);
      var t = mk("span", "fx2-pollbar-txt");
      t.appendChild(mk("span", "", String(o.text)));
      t.appendChild(mk("small", "", votes + " · " + pct + "%"));
      b.appendChild(t);
      b.onclick = function () { votePoll(p.id, o.i); };
      opts.appendChild(b);
    });
    slot.appendChild(opts);
  }

  /* ---------------- pins ---------------- */
  function pinJobs() {
    var c = ctx();
    if (c.kind === "thread") return [{ kind: "thread", scope: c.id, label: L("Тема", "Thread") }, { kind: "reply", scope: c.id, label: L("Ответы", "Replies") }];
    if (c.kind === "chat") return [{ kind: "chat", scope: c.id, label: L("Чат", "Chat") }];
    if (c.kind === "dm") return [{ kind: "dm", scope: c.id, label: L("ЛС", "DM") }];
    if (c.kind === "group") return [{ kind: "group", scope: c.id, label: L("Группа", "Group") }];
    if (c.kind === "server") return [{ kind: "server", scope: serverChannel() ? String(serverChannel()) : null, label: L("Сервер", "Server") }];
    return [{ kind: "thread", scope: null, label: L("Темы форума", "Forum threads") }, { kind: "chat", scope: null, label: L("Чат", "Chat") }];
  }

  async function loadPins() {
    var list = q("fx2-pins-list");
    var hint = q("fx2-pins-hint");
    if (!gu()) { loginPrompt(list); return; }
    var jobs = pinJobs();
    if (hint) hint.textContent = L("Закрепы: ", "Pinned: ") + jobs.map(function (j) { return j.label; }).join(", ");
    if (list) { clear(list); list.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…"))); }
    var rows = [];
    for (var i = 0; i < jobs.length; i++) {
      try {
        var part = (await rpc("pins_list", { p_kind: jobs[i].kind, p_scope: jobs[i].scope })) || [];
        part.forEach(function (r) { rows.push({ kind: jobs[i].kind, label: jobs[i].label, scope: jobs[i].scope, row: r }); });
      } catch (e) { if (isMissing(e)) state.missing.pins = true; }
    }
    state.pinRows = rows;
    renderPins();
  }

  function renderPins() {
    var list = q("fx2-pins-list");
    if (!list) return;
    clear(list);
    if (!state.pinRows.length) {
      list.appendChild(mk("div", "fx-empty", L("Здесь пока нет закреплённых сообщений.", "No pinned messages here yet.")));
      return;
    }
    state.pinRows.forEach(function (x) {
      var r = x.row;
      var row = mk("button", "fx2-pin");
      row.type = "button";
      var top = mk("div", "fx2-pin-top");
      top.appendChild(mk("span", "fx2-pin-kind", x.label));
      top.appendChild(mk("span", "fx2-pin-nick", r.nick || "?"));
      top.appendChild(mk("span", "fx2-pin-date", dateShort(r.created_at)));
      row.appendChild(top);
      row.appendChild(mk("div", "fx2-pin-text", r.preview || "—"));
      row.onclick = function () { jumpPin(x.kind, r.target_id, x.scope); };
      list.appendChild(row);
    });
  }

  function jumpPin(kind, target, scope) {
    closePanel();
    if (kind === "thread") {
      if (typeof window.openThread === "function") window.openThread(Number(target));
      return;
    }
    if (kind === "reply") {
      var th = threadId();
      if (th && typeof window.openThread === "function") window.openThread(Number(th));
      setTimeout(function () {
        var el = document.querySelector('#th_replies .tr[data-id="' + target + '"]');
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 700);
      return;
    }
    if (kind === "chat") {
      try { if (typeof go === "function") go("chat"); } catch (e) {}
      setTimeout(function () {
        var el = document.querySelector('#msgs .msg[data-id="' + target + '"]');
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 700);
      return;
    }
    if (kind === "dm") {
      try { if (typeof go === "function") go("dm"); } catch (e) {}
      if (scope && typeof window.openDm === "function") {
        setTimeout(function () {
          try { window.openDm({ id: scope, nick: "?" }); } catch (e) {}
          setTimeout(function () {
            var el = document.querySelector('#dmmsgs .msg[data-id="' + target + '"]');
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 700);
        }, 250);
      }
      return;
    }
    if (kind === "group") {
      try { if (typeof go === "function") go("dm"); } catch (e) {}
      if (scope && typeof window.openGroupById === "function") {
        setTimeout(function () {
          try { window.openGroupById(Number(scope)); } catch (e) {}
          setTimeout(function () {
            var el = document.querySelector('#groupmsgs .msg[data-id="' + target + '"]');
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 700);
        }, 250);
      }
      return;
    }
    if (kind === "server") { try { if (typeof go === "function") go("servers"); } catch (e) {} return; }
  }

  async function togglePin(kind, target, scope) {
    if (!gu()) { toast2(L("Сначала войди.", "Sign in first.")); return; }
    try {
      var pinned = await rpc("pin_toggle", {
        p_kind: kind,
        p_target: Number(target),
        p_scope: scope === null || scope === undefined || scope === "" ? null : String(scope)
      });
      toast2(pinned ? L("Закреплено.", "Pinned.") : L("Закреп снят.", "Unpinned."));
      if (state.currentView === "pins" && q("fx2panel") && q("fx2panel").classList.contains("show")) loadPins();
    } catch (e) { fail(e, "pins"); }
  }

  /* ---------------- reports ---------------- */
  function reportKindLabel(k) {
    return k === "chat" ? L("Чат", "Chat") : k === "dm" ? L("ЛС", "DM") : k === "group" ? L("Группа", "Group") :
      k === "server" ? L("Сервер", "Server") : k === "thread" ? L("Тема", "Thread") :
      k === "reply" ? L("Ответ", "Reply") : k === "anon" ? L("Анонимка", "Anonymous") : k;
  }

  async function loadReportsCount() {
    if (!isStaff()) { state.reportCount = 0; updateStaffButtons(); return; }
    try {
      state.reportCount = Number(await rpc("reports_count")) || 0;
      updateStaffButtons();
    } catch (e) { /* тихо */ }
  }

  async function loadReports() {
    var box = q("fx2-mod-body");
    if (!box || !isStaff()) return;
    if (state.modTab !== "reports") return;
    box.innerHTML = '<div class="fx-empty">' + L("Загрузка…", "Loading…") + '</div>';
    try {
      state.reports = (await rpc("reports_list", { p_status: state.reportStatus })) || [];
      renderModReports();
    } catch (e) {
      if (isMissing(e)) box.innerHTML = '<div class="fx-empty">' + L("Жалобы не включены. Примени update-plus-2.sql.", "Reports are not enabled. Apply update-plus-2.sql.") + '</div>';
      else { box.innerHTML = ""; box.appendChild(mk("div", "fx-empty", L("Не удалось загрузить жалобы.", "Could not load reports."))); fail(e, "reports"); }
    }
  }

  function renderModReports() {
    var box = q("fx2-mod-body");
    if (!box) return;
    clear(box);
    var tabs = mk("div", "fx2-subtabs");
    [["open", L("Открытые", "Open")], ["resolved", L("Решённые", "Resolved")], ["dismissed", L("Отклонённые", "Dismissed")]].forEach(function (x) {
      var b = mk("button", "fx2-subtab" + (state.reportStatus === x[0] ? " on" : ""), x[1]);
      b.type = "button";
      b.onclick = function () { state.reportStatus = x[0]; loadReports(); };
      tabs.appendChild(b);
    });
    box.appendChild(tabs);
    if (!state.reports.length) { box.appendChild(mk("div", "fx-empty", L("Жалоб нет.", "No reports."))); return; }
    state.reports.forEach(function (r) {
      var card = mk("div", "fx2-report");
      var top = mk("div", "fx2-report-top");
      top.appendChild(mk("span", "fx2-report-kind", reportKindLabel(r.kind)));
      top.appendChild(mk("span", "fx2-report-nick", r.reporter_nick || "?"));
      top.appendChild(mk("span", "fx2-report-date", dateTime(r.created_at)));
      top.appendChild(mk("span", "fx2-report-status " + r.status, r.status));
      card.appendChild(top);
      card.appendChild(mk("div", "fx2-report-reason", r.reason || ""));
      card.appendChild(mk("div", "fx2-report-preview", r.preview || L("[приватно]", "[private]")));
      var foot = mk("div", "fx2-report-foot");
      foot.appendChild(mk("span", "fx2-hint", "#" + r.id + " · target " + r.target_id));
      if (r.status === "open") {
        var ok = mk("button", "fx-btn main", L("Решено", "Resolve"));
        ok.type = "button"; ok.onclick = function () { resolveReport(r.id, "resolved"); };
        var no = mk("button", "fx-btn", L("Отклонить", "Dismiss"));
        no.type = "button"; no.onclick = function () { resolveReport(r.id, "dismissed"); };
        foot.appendChild(ok); foot.appendChild(no);
      }
      card.appendChild(foot);
      box.appendChild(card);
    });
  }

  async function resolveReport(id, status) {
    try {
      await rpc("report_resolve", { p_id: Number(id), p_status: status });
      toast2(status === "resolved" ? L("Жалоба решена.", "Report resolved.") : L("Жалоба отклонена.", "Report dismissed."));
      await loadReports();
      loadReportsCount();
    } catch (e) { fail(e, "reports"); }
  }

  function openReport(kind, target, label) {
    if (!gu()) { toast2(L("Сначала войди.", "Sign in first.")); return; }
    openModal(L("Жалоба", "Report"), function (body) {
      body.innerHTML =
        '<div class="fx2-form"><p class="fx2-hint">' + reportKindLabel(kind) + ' · #' + target + '</p>' +
        (label ? '<p class="fx2-report-preview">' + String(label).slice(0, 180) + '</p>' : '') +
        '<textarea id="fx2-report-reason" class="fx2-textarea" maxlength="300" placeholder="Что не так? (3–300 символов)"></textarea>' +
        '<div id="fx2-report-err" class="fx2-err"></div>' +
        '<div class="fx2-form-row"><button type="button" class="fx-btn main" id="fx2-report-send">' + L("Отправить", "Send") + '</button></div></div>';
      var btn = q("fx2-report-send");
      if (!btn) return;
      btn.onclick = async function () {
        var reason = (q("fx2-report-reason").value || "").trim();
        var err = q("fx2-report-err");
        if (reason.length < 3 || reason.length > 300) { if (err) err.textContent = L("Причина: от 3 до 300 символов.", "Reason: 3–300 chars."); return; }
        btn.disabled = true;
        try {
          await rpc("report_add", { p_kind: kind, p_target: Number(target), p_reason: reason });
          closeModal();
          toast2(L("Жалоба отправлена. Спасибо.", "Report sent. Thanks."));
          loadReportsCount();
        } catch (e) {
          var m = ((e && e.message) || "").toLowerCase();
          if (m.indexOf("already") > -1) { if (err) err.textContent = L("Ты уже жаловался на это.", "You already reported this."); }
          else if (err) err.textContent = ((e && e.message) || L("Ошибка.", "Error."));
          if (!isMissing(e) && m.indexOf("already") < 0) fail(e, "reports");
        } finally { btn.disabled = false; }
      };
    });
  }

  /* ---------------- announcements ---------------- */
  async function loadAnnouncements() {
    if (!gu()) { state.ann = []; renderHomeAnnouncement(); return; }
    try {
      state.ann = (await rpc("announcement_list")) || [];
      renderHomeAnnouncement();
      if (state.currentView === "mod" && state.modTab === "announcements") renderModAnnouncements();
      renderMainAnnouncement();
    } catch (e) { if (isMissing(e)) state.missing.ann = true; }
  }

  function renderHomeAnnouncement() {
    var home = q("home");
    var box = home ? home.querySelector(".box") : null;
    if (!box) return;
    var old = q("fx2-ann");
    var a = state.ann[0];
    if (!a) { if (old) old.remove(); return; }
    var off = "";
    try { off = localStorage.getItem(LS_ANN) || ""; } catch (e) {}
    if (String(a.id) === off) { if (old) old.remove(); return; }
    var el = old;
    if (!el) {
      el = mk("div", "fx2-ann glass");
      el.id = "fx2-ann";
      var tag = box.querySelector(".tag");
      if (tag) tag.insertAdjacentElement("afterend", el);
      else box.appendChild(el);
    }
    clear(el);
    var top = mk("div", "fx2-ann-top");
    top.appendChild(mk("span", "fx2-ann-pin", a.pinned ? "📌" : "📣"));
    top.appendChild(mk("b", "", a.title));
    var x = mk("button", "fx2-ann-x", "✕");
    x.type = "button";
    x.title = L("Скрыть", "Hide");
    x.onclick = function () {
      try { localStorage.setItem(LS_ANN, String(a.id)); } catch (e) {}
      el.remove();
    };
    top.appendChild(x);
    el.appendChild(top);
    el.appendChild(mk("div", "fx2-ann-body", a.body));
    var meta = mk("div", "fx2-ann-meta");
    meta.appendChild(mk("span", "", (a.nick || "?") + " · " + dateShort(a.created_at)));
    if (isStaff()) {
      var m = mk("button", "fx2-link", L("управлять", "manage"));
      m.type = "button";
      m.onclick = function () { state.modTab = "announcements"; openPanel("mod"); };
      meta.appendChild(m);
    }
    el.appendChild(meta);
  }

  function renderMainAnnouncement() {
    var box = q("fx2-main-ann");
    if (!box) return;
    clear(box);
    if (!state.ann.length) return;
    var a = state.ann[0];
    var card = mk("div", "fx2-card fx2-main-ann");
    card.appendChild(mk("b", "", a.title));
    card.appendChild(mk("div", "fx2-ann-body", a.body));
    card.appendChild(mk("small", "fx2-hint", (a.nick || "?") + " · " + dateShort(a.created_at)));
    box.appendChild(card);
  }

  function renderModAnnouncements() {
    var box = q("fx2-mod-body");
    if (!box) return;
    clear(box);
    var form = mk("div", "fx2-form");
    form.innerHTML =
      '<input id="fx2-ann-title" class="fx-input" maxlength="100" placeholder="Заголовок (3–100)">' +
      '<textarea id="fx2-ann-text" class="fx2-textarea" maxlength="2000" placeholder="Текст анонса"></textarea>' +
      '<label class="fx2-check"><input id="fx2-ann-pinned" type="checkbox"> ' + L("Закрепить", "Pin") + '</label>' +
      '<div id="fx2-ann-err" class="fx2-err"></div>' +
      '<div class="fx2-form-row"><button type="button" class="fx-btn main" id="fx2-ann-add">' + L("Опубликовать", "Publish") + '</button></div>';
    box.appendChild(form);
    var add = q("fx2-ann-add");
    if (add) add.onclick = addAnnouncement;
    var list = mk("div", "fx2-list");
    if (!state.ann.length) list.appendChild(mk("div", "fx-empty", L("Анонсов пока нет.", "No announcements yet.")));
    state.ann.forEach(function (a) {
      var card = mk("div", "fx2-report");
      var top = mk("div", "fx2-report-top");
      top.appendChild(mk("span", "fx2-report-kind", a.pinned ? "📌" : "📣"));
      top.appendChild(mk("b", "", a.title));
      top.appendChild(mk("span", "fx2-report-date", dateShort(a.created_at)));
      card.appendChild(top);
      card.appendChild(mk("div", "fx2-report-preview", a.body));
      var foot = mk("div", "fx2-report-foot");
      foot.appendChild(mk("span", "fx2-hint", a.nick || "?"));
      var del = mk("button", "fx-btn", L("Удалить", "Delete"));
      del.type = "button";
      del.onclick = function () { deleteAnnouncement(a); };
      foot.appendChild(del);
      card.appendChild(foot);
      list.appendChild(card);
    });
    box.appendChild(list);
  }

  async function addAnnouncement() {
    var title = (q("fx2-ann-title").value || "").trim();
    var text = (q("fx2-ann-text").value || "").trim();
    var err = q("fx2-ann-err");
    if (title.length < 3 || title.length > 100) { if (err) err.textContent = L("Заголовок: 3–100.", "Title: 3–100."); return; }
    if (!text || text.length > 2000) { if (err) err.textContent = L("Текст: до 2000.", "Text: up to 2000."); return; }
    try {
      await rpc("announcement_add", { p_title: title, p_body: text, p_pinned: !!q("fx2-ann-pinned").checked });
      toast2(L("Анонс опубликован.", "Announcement published."));
      await loadAnnouncements();
      renderModAnnouncements();
    } catch (e) { if (err) err.textContent = ((e && e.message) || L("Ошибка.", "Error.")); fail(e, "ann"); }
  }

  function deleteAnnouncement(a) {
    var doDel = async function () {
      try {
        await rpc("announcement_delete", { p_id: Number(a.id) });
        toast2(L("Анонс удалён.", "Announcement deleted."));
        await loadAnnouncements();
        renderModAnnouncements();
      } catch (e) { fail(e, "ann"); }
    };
    try { if (typeof askConfirm === "function") askConfirm(L("Удалить анонс?", "Delete announcement?"), doDel); else if (window.confirm(L("Удалить анонс?", "Delete announcement?"))) doDel(); }
    catch (e) { doDel(); }
  }

  /* ---------------- anonymous board ---------------- */
  async function loadAnon() {
    var list = q("fx2-anon-list");
    if (!gu()) { loginPrompt(list); return; }
    if (list) { clear(list); list.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…"))); }
    try {
      state.anonRows = (await rpc("anon_posts_list", { p_parent: null })) || [];
      renderAnon();
    } catch (e) {
      if (list) empty(list, isMissing(e) ? L("Анонимка не включена. Примени update-plus-2.sql.", "Anonymous board is not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить анонимку.", "Could not load the board."));
      if (!isMissing(e)) fail(e, "anon");
    }
  }

  function renderAnon() {
    var list = q("fx2-anon-list");
    if (!list) return;
    clear(list);
    if (!state.anonRows.length) { list.appendChild(mk("div", "fx-empty", L("Пока никто не написал. Будь первым.", "Nobody has posted yet. Be the first."))); return; }
    state.anonRows.forEach(function (p) {
      var card = mk("div", "fx2-anon");
      var top = mk("div", "fx2-anon-top");
      top.appendChild(mk("span", "fx2-anon-id", p.anon_id || "anon"));
      top.appendChild(mk("span", "fx2-anon-date", dateTime(p.created_at)));
      card.appendChild(top);
      card.appendChild(mk("div", "fx2-anon-body", p.body));
      var foot = mk("div", "fx2-anon-foot");
      var cm = mk("button", "fx2-link", "💬 " + (Number(p.comments) || 0) + L(" ответов", " replies"));
      cm.type = "button"; cm.onclick = function () { openAnonComments(p.id, p.body); };
      foot.appendChild(cm);
      var rep = mk("button", "fx2-link", "⚑");
      rep.type = "button"; rep.title = L("Пожаловаться", "Report"); rep.onclick = function () { reportAnon(p.id, p.body); };
      foot.appendChild(rep);
      if (p.can_delete) {
        var del = mk("button", "fx2-link danger", "🗑");
        del.type = "button"; del.title = L("Удалить", "Delete"); del.onclick = function () { deleteAnon(p.id); };
        foot.appendChild(del);
      }
      card.appendChild(foot);
      list.appendChild(card);
    });
  }

  async function sendAnonPost() {
    if (!gu()) { toast2(L("Сначала войди.", "Sign in first.")); return; }
    var ta = q("fx2-anon-body");
    if (!ta) return;
    var body = (ta.value || "").trim();
    if (!body || body.length > 2000) { toast2(L("Текст: от 1 до 2000 символов.", "Text: 1–2000 chars.")); return; }
    var btn = q("fx2-anon-send");
    if (btn) btn.disabled = true;
    try {
      await rpc("anon_post_add", { p_body: body, p_parent: null });
      ta.value = "";
      toast2(L("Опубликовано анонимно.", "Posted anonymously."));
      await loadAnon();
      reloadPlus();
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("slow") > -1) toast2(L("Слишком часто. Подожди немного.", "Too fast. Wait a bit."));
      else fail(e, "anon");
    } finally { if (btn) btn.disabled = false; }
  }

  function openAnonComments(id, postBody) {
    openModal(L("Анонимка · ответы", "Anonymous · replies"), function (body) {
      body.innerHTML =
        '<div class="fx2-form"><div class="fx2-anon-body">' + String(postBody || "") + '</div>' +
        '<div id="fx2-anon-comments" class="fx2-list"><div class="fx-empty">' + L("Загрузка…", "Loading…") + '</div></div>' +
        '<textarea id="fx2-anon-reply" class="fx2-textarea" maxlength="2000" placeholder="Ответить анонимно…"></textarea>' +
        '<div id="fx2-anon-err" class="fx2-err"></div>' +
        '<div class="fx2-form-row"><button type="button" class="fx-btn main" id="fx2-anon-reply-send">' + L("Ответить", "Reply") + '</button></div></div>';
      var send = q("fx2-anon-reply-send");
      if (send) send.onclick = async function () {
        var text = (q("fx2-anon-reply").value || "").trim();
        var err = q("fx2-anon-err");
        if (!text || text.length > 2000) { if (err) err.textContent = L("Текст: от 1 до 2000.", "Text: 1–2000."); return; }
        send.disabled = true;
        try {
          await rpc("anon_post_add", { p_body: text, p_parent: Number(id) });
          q("fx2-anon-reply").value = "";
          await loadAnonComments(id);
          await loadAnon();
          reloadPlus();
        } catch (e) {
          if (err) err.textContent = ((e && e.message) || L("Ошибка.", "Error."));
          if (!isMissing(e)) fail(e, "anon");
        } finally { send.disabled = false; }
      };
      loadAnonComments(id);
    });
  }

  async function loadAnonComments(id) {
    var box = q("fx2-anon-comments");
    if (!box) return;
    try {
      var rows = (await rpc("anon_posts_list", { p_parent: Number(id) })) || [];
      clear(box);
      if (!rows.length) { box.appendChild(mk("div", "fx-empty", L("Ответов пока нет.", "No replies yet."))); return; }
      rows.slice().reverse().forEach(function (p) {
        var card = mk("div", "fx2-anon-comment");
        var top = mk("div", "fx2-anon-top");
        top.appendChild(mk("span", "fx2-anon-id", p.anon_id || "anon"));
        top.appendChild(mk("span", "fx2-anon-date", dateTime(p.created_at)));
        card.appendChild(top);
        card.appendChild(mk("div", "fx2-anon-body", p.body));
        var foot = mk("div", "fx2-anon-foot");
        var rep = mk("button", "fx2-link", "⚑");
        rep.type = "button"; rep.onclick = function () { reportAnon(p.id, p.body); };
        foot.appendChild(rep);
        if (p.can_delete) {
          var del = mk("button", "fx2-link danger", "🗑");
          del.type = "button"; del.onclick = function () { deleteAnon(p.id, id); };
          foot.appendChild(del);
        }
        card.appendChild(foot);
        box.appendChild(card);
      });
    } catch (e) { if (box) empty(box, L("Не удалось загрузить ответы.", "Could not load replies.")); }
  }

  function reportAnon(id, body) {
    openReport("anon", id, String(body || "").slice(0, 160));
  }

  function deleteAnon(id, parent) {
    var doDel = async function () {
      try {
        await rpc("anon_delete", { p_id: Number(id) });
        toast2(L("Удалено.", "Deleted."));
        await loadAnon();
        if (parent) await loadAnonComments(parent);
      } catch (e) { fail(e, "anon"); }
    };
    try { if (typeof askConfirm === "function") askConfirm(L("Удалить пост?", "Delete this post?"), doDel); else if (window.confirm(L("Удалить пост?", "Delete this post?"))) doDel(); }
    catch (e) { doDel(); }
  }

  /* ---------------- dead drop ---------------- */
  async function loadDrop() {
    var box = q("fx2-drop-mine");
    if (!gu()) { loginPrompt(box); return; }
    if (box) { clear(box); box.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…"))); }
    try {
      var rows = (await rpc("dead_drop_mine")) || [];
      clear(box);
      if (!rows.length) { box.appendChild(mk("div", "fx-empty", L("Активных сообщений нет.", "No active drops."))); return; }
      rows.forEach(function (d) {
        var card = mk("div", "fx2-drop-row");
        var top = mk("div", "fx2-drop-top");
        top.appendChild(mk("b", "fx2-drop-code-small", d.code));
        top.appendChild(mk("span", "fx2-hint", (Number(d.views) || 0) + "/" + (Number(d.max_views) || 1) + L(" прочтений", " reads")));
        top.appendChild(mk("span", "fx2-hint", timeLeft(d.expires_at)));
        card.appendChild(top);
        card.appendChild(mk("div", "fx2-hint", d.preview || ""));
        box.appendChild(card);
      });
    } catch (e) {
      if (box) empty(box, isMissing(e) ? L("Dead drop не включён. Примени update-plus-2.sql.", "Dead drop is not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить.", "Could not load."));
      if (!isMissing(e)) fail(e, "drop");
    }
  }

  async function createDrop() {
    if (!gu()) { toast2(L("Сначала войди.", "Sign in first.")); return; }
    var body = (q("fx2-drop-body").value || "").trim();
    var hours = parseInt(q("fx2-drop-hours").value, 10) || 24;
    var views = parseInt(q("fx2-drop-views").value, 10) || 1;
    if (!body || body.length > 2000) { toast2(L("Текст: от 1 до 2000.", "Text: 1–2000.")); return; }
    var btn = q("fx2-drop-create");
    if (btn) btn.disabled = true;
    try {
      var code = await rpc("dead_drop_add", { p_body: body, p_hours: hours, p_max_views: views });
      var out = q("fx2-drop-code");
      if (out) {
        clear(out);
        out.style.display = "block";
        out.appendChild(mk("small", "", L("Код (сохрани его):", "Code (save it):")));
        var row = mk("div", "fx2-drop-code-row");
        row.appendChild(mk("b", "", String(code)));
        var copy = mk("button", "fx-btn", L("Копировать", "Copy"));
        copy.type = "button"; copy.onclick = function () { copyText(String(code)); };
        row.appendChild(copy);
        out.appendChild(row);
      }
      q("fx2-drop-body").value = "";
      toast2(L("Dead drop создан.", "Dead drop created."));
      await loadDrop();
      reloadPlus();
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("slow") > -1) toast2(L("Слишком часто. Подожди.", "Too fast. Wait."));
      else fail(e, "drop");
    } finally { if (btn) btn.disabled = false; }
  }

  async function getDrop() {
    if (!gu()) { toast2(L("Сначала войди.", "Sign in first.")); return; }
    var code = (q("fx2-drop-code-in").value || "").trim().toUpperCase();
    var out = q("fx2-drop-out");
    if (!code) { toast2(L("Введи код.", "Enter the code.")); return; }
    if (out) { clear(out); out.textContent = L("Открываю…", "Opening…"); }
    try {
      var rows = (await rpc("dead_drop_get", { p_code: code })) || [];
      var d = rows[0];
      if (!d) { if (out) out.textContent = L("Сообщение не найдено или уже прочитано.", "Not found or already read."); return; }
      if (out) {
        clear(out);
        out.appendChild(mk("div", "fx2-drop-body", d.body));
        out.appendChild(mk("small", "fx2-hint", L("Прочтений: ", "Reads: ") + d.views + "/" + d.max_views + " · " + L("до ", "until ") + dateTime(d.expires_at)));
      }
      q("fx2-drop-code-in").value = "";
      await loadDrop();
      reloadPlus();
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("not found") > -1) { if (out) out.textContent = L("Сообщение не найдено или уже прочитано.", "Not found or already read."); }
      else fail(e, "drop");
    }
  }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast2(L("Скопировано.", "Copied.")); }).catch(function () { window.prompt(L("Скопируй код:", "Copy the code:"), text); });
      } else window.prompt(L("Скопируй код:", "Copy the code:"), text);
    } catch (e) { try { window.prompt(L("Скопируй код:", "Copy the code:"), text); } catch (err) {} }
  }

  /* ---------------- gallery ---------------- */
  async function loadGallery(reset) {
    var grid = q("fx2-gallery");
    if (!gu()) { loginPrompt(grid); return; }
    if (reset) { state.galleryRows = []; state.galleryOffset = 0; state.galleryKeys = new Set(); if (grid) clear(grid); }
    try {
      var rows = (await rpc("gallery_list", { p_limit: 60, p_offset: state.galleryOffset })) || [];
      rows.forEach(function (r) {
        var key = (r.kind || "") + "|" + (r.url || r.path || "");
        if (!key || state.galleryKeys.has(key)) return;
        state.galleryKeys.add(key);
        state.galleryRows.push(r);
      });
      state.galleryOffset += rows.length;
      renderGallery();
      var more = q("fx2-gallery-more");
      if (more) more.style.display = rows.length >= 60 ? "" : "none";
    } catch (e) {
      if (grid) empty(grid, isMissing(e) ? L("Галерея не включена. Примени update-plus-2.sql.", "Gallery is not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить галерею.", "Could not load the gallery."));
      if (!isMissing(e)) fail(e, "gallery");
    }
  }

  function galleryUrl(r) {
    if (r.url) return r.url;
    if (r.path && typeof window.mediaUrl === "function") return window.mediaUrl(r.path, "media");
    return "";
  }

  function renderGallery() {
    var grid = q("fx2-gallery");
    if (!grid) return;
    clear(grid);
    if (!state.galleryRows.length) { grid.appendChild(mk("div", "fx-empty", L("Пока нет картинок.", "No images yet."))); return; }
    state.galleryRows.forEach(function (r) {
      var url = galleryUrl(r);
      if (!url) return;
      var fig = mk("button", "fx2-gal");
      fig.type = "button";
      var im = document.createElement("img");
      im.src = url; im.loading = "lazy"; im.alt = r.name || "";
      im.onerror = function () { fig.style.display = "none"; };
      fig.appendChild(im);
      var cap = mk("span", "fx2-gal-cap");
      cap.appendChild(mk("b", "", r.kind === "story" ? L("История", "Story") : r.kind === "forum" ? L("Форум", "Forum") : L("Чат", "Chat")));
      cap.appendChild(mk("small", "", (r.nick || "?") + " · " + dateShort(r.created_at)));
      fig.appendChild(cap);
      fig.onclick = function () { try { window.open(url, "_blank", "noopener"); } catch (e) {} };
      grid.appendChild(fig);
    });
  }

  /* ---------------- radio ---------------- */
  function loadRadio() {
    var box = q("fx2-radio");
    if (!box) return;
    if (!state.radio || !q("fx2-radio-audio")) {
      clear(box);
      var stations = mk("div", "fx2-radio-stations");
      STATIONS.forEach(function (s, i) {
        var b = mk("button", "fx2-station" + (i === 0 ? " on" : ""));
        b.type = "button";
        b.appendChild(mk("b", "", s.name));
        b.appendChild(mk("small", "", s.genre));
        b.onclick = function () { playStation(i); };
        stations.appendChild(b);
      });
      box.appendChild(stations);
      var player = mk("div", "fx2-radio-player");
      player.innerHTML =
        '<div class="fx2-eq" id="fx2-eq"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="fx2-radio-now" id="fx2-radio-now">' + STATIONS[0].name + '</div>' +
        '<button type="button" class="fx2-radio-toggle" id="fx2-radio-toggle">▶</button>' +
        '<input type="range" id="fx2-radio-vol" min="0" max="100" value="80" class="fx2-vol">';
      box.appendChild(player);
      var audio = document.createElement("audio");
      audio.id = "fx2-radio-audio";
      audio.preload = "none";
      audio.volume = 0.8;
      box.appendChild(audio);
      var custom = mk("div", "fx2-form-row");
      custom.innerHTML = '<input id="fx2-radio-custom" class="fx-input" type="url" placeholder="Своя ссылка на поток (https://…)"><button type="button" class="fx-btn" id="fx2-radio-custom-play">Играть</button>';
      box.appendChild(custom);
      state.radio = { audio: audio, idx: 0, playing: false };
      var toggle = q("fx2-radio-toggle");
      if (toggle) toggle.onclick = toggleRadio;
      var vol = q("fx2-radio-vol");
      if (vol) vol.oninput = function () { if (state.radio) state.radio.audio.volume = Number(vol.value) / 100; };
      var cp = q("fx2-radio-custom-play");
      if (cp) cp.onclick = playCustom;
      audio.onplaying = function () { state.radioPlaying = true; updateRadioUI(); };
      audio.onpause = function () { state.radioPlaying = false; updateRadioUI(); };
      audio.onerror = function () { if (state.radioPlaying) toast2(L("Поток не отвечает. Попробуй другую станцию.", "Stream is not responding. Try another station.")); };
    }
    updateRadioUI();
  }

  function playStation(i) {
    if (!state.radio) return;
    var s = STATIONS[i];
    if (!s) return;
    state.radio.idx = i;
    try {
      state.radio.audio.src = s.url;
      state.radio.audio.play().catch(function () { toast2(L("Нажми ▶ ещё раз, браузер блокирует автозапуск.", "Press ▶ again, the browser blocked autoplay.")); });
    } catch (e) { toast2(L("Не удалось включить поток.", "Could not start the stream.")); }
    var now = q("fx2-radio-now");
    if (now) now.textContent = s.name;
    Array.prototype.forEach.call(document.querySelectorAll(".fx2-station"), function (b, idx) {
      b.classList.toggle("on", idx === i);
    });
    updateRadioUI();
  }

  function toggleRadio() {
    if (!state.radio) loadRadio();
    if (!state.radio) return;
    var a = state.radio.audio;
    if (a.paused) {
      if (!a.src) { playStation(state.radio.idx || 0); return; }
      a.play().catch(function () { toast2(L("Не удалось включить поток.", "Could not start the stream.")); });
    } else a.pause();
  }

  function playCustom() {
    var inp = q("fx2-radio-custom");
    if (!inp || !state.radio) return;
    var url = (inp.value || "").trim();
    if (!/^https?:\/\//i.test(url)) { toast2(L("Нужна ссылка http(s).", "Need an http(s) link.")); return; }
    try {
      state.radio.audio.src = url;
      state.radio.audio.play().catch(function () {});
      var now = q("fx2-radio-now");
      if (now) now.textContent = L("Своя ссылка", "Custom stream");
      updateRadioUI();
    } catch (e) { toast2(L("Не удалось включить.", "Could not play.")); }
  }

  function updateRadioUI() {
    var t = q("fx2-radio-toggle");
    if (t) t.textContent = state.radio && !state.radio.audio.paused ? "❚❚" : "▶";
    var eq = q("fx2-eq");
    if (eq) eq.classList.toggle("playing", !!(state.radio && !state.radio.audio.paused));
    var now = q("fx2-radio-now");
    if (now && state.radio && STATIONS[state.radio.idx] && !now.textContent) now.textContent = STATIONS[state.radio.idx].name;
  }

  /* ---------------- CTF ---------------- */
  async function loadCtf() {
    var list = q("fx2-ctf-list");
    if (!gu()) { loginPrompt(list); return; }
    if (list) { clear(list); list.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…"))); }
    try {
      state.ctf = (await rpc("ctf_list")) || [];
      renderCtf();
    } catch (e) {
      if (list) empty(list, isMissing(e) ? L("CTF не включён. Примени update-plus-2.sql.", "CTF is not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить CTF.", "Could not load CTF."));
      if (!isMissing(e)) fail(e, "ctf");
    }
  }

  function renderCtf() {
    var list = q("fx2-ctf-list");
    if (!list) return;
    clear(list);
    if (!state.ctf.length) { list.appendChild(mk("div", "fx-empty", L("Челленджей пока нет.", "No challenges yet."))); return; }
    state.ctf.forEach(function (c) {
      var card = mk("div", "fx2-ctf" + (c.solved ? " solved" : ""));
      var top = mk("div", "fx2-ctf-top");
      top.appendChild(mk("b", "", c.title));
      top.appendChild(mk("span", "fx2-ctf-points", "+" + c.points));
      if (c.solved) top.appendChild(mk("span", "fx2-ok", L("решено", "solved")));
      card.appendChild(top);
      card.appendChild(mk("div", "fx2-ctf-desc", c.description));
      var meta = mk("div", "fx2-ctf-meta");
      meta.appendChild(mk("span", "", L("решили: ", "solved by: ") + (Number(c.solves) || 0)));
      if (c.hint) {
        var det = document.createElement("details");
        det.appendChild(mk("summary", "", L("подсказка", "hint")));
        det.appendChild(mk("div", "fx2-hint", c.hint));
        meta.appendChild(det);
      }
      card.appendChild(meta);
      if (!c.solved) {
        var row = mk("div", "fx2-form-row");
        var inp = document.createElement("input");
        inp.type = "text"; inp.className = "fx-input"; inp.placeholder = "fsociety{...}"; inp.autocomplete = "off";
        var btn = mk("button", "fx-btn main", L("Сдать", "Submit"));
        btn.type = "button";
        btn.onclick = function () { submitFlag(c, inp, btn); };
        row.appendChild(inp); row.appendChild(btn);
        card.appendChild(row);
      }
      list.appendChild(card);
    });
  }

  async function submitFlag(c, inp, btn) {
    var flag = (inp.value || "").trim();
    if (!flag) { toast2(L("Введи флаг.", "Enter a flag.")); return; }
    btn.disabled = true;
    try {
      var res = await rpc("ctf_submit", { p_id: c.id, p_flag: flag });
      if (res === "ok") {
        toast2(L("Флаг принят! +", "Flag accepted! +") + c.points + " 🪙");
        await loadWallet();
        await loadCtf();
        reloadPlus();
      } else if (res === "already") toast2(L("Уже решено.", "Already solved."));
      else toast2(L("Неверный флаг.", "Wrong flag."));
    } catch (e) { fail(e, "ctf"); }
    finally { btn.disabled = false; }
  }

  /* ---------------- quests / achievements ---------------- */
  async function loadQuests() {
    var list = q("fx2-quest-list");
    if (!gu()) { loginPrompt(list); return; }
    var tabs = q("fx2-quest-tabs");
    if (tabs) Array.prototype.forEach.call(tabs.children, function (b) {
      b.classList.toggle("on", b.getAttribute("data-qtab") === state.questTab);
    });
    if (list) { clear(list); list.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…"))); }
    try {
      if (state.questTab === "achievements") {
        state.achievements = (await rpc("achievements_list")) || [];
        renderAchievements();
      } else {
        state.quests = (await rpc("quests_list")) || [];
        renderQuests();
      }
    } catch (e) {
      if (list) empty(list, isMissing(e) ? L("Квесты не включены. Примени update-plus-2.sql.", "Quests are not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить квесты.", "Could not load quests."));
      if (!isMissing(e)) fail(e, "quests");
    }
  }

  function rewardText(r) {
    var p = [];
    if (Number(r.reward_coins)) p.push(COIN + " " + nfmt(r.reward_coins));
    if (Number(r.reward_gems)) p.push(GEM + " " + nfmt(r.reward_gems));
    if (Number(r.reward_xp)) p.push("XP " + nfmt(r.reward_xp));
    return p.join(" · ");
  }

  function renderQuests() {
    var list = q("fx2-quest-list");
    if (!list) return;
    clear(list);
    if (!state.quests.length) { list.appendChild(mk("div", "fx-empty", L("Квестов пока нет.", "No quests yet."))); return; }
    state.quests.forEach(function (q) {
      var card = mk("div", "fx2-quest" + (q.claimed ? " done" : ""));
      var top = mk("div", "fx2-quest-top");
      top.appendChild(mk("b", "", q.title));
      top.appendChild(mk("span", "fx2-quest-reward", rewardText(q)));
      card.appendChild(top);
      card.appendChild(mk("div", "fx2-hint", q.description));
      var prog = Math.min(100, Math.round((Number(q.progress) || 0) / (Number(q.target) || 1) * 100));
      var bar = mk("div", "fx2-progress");
      var fill = mk("i"); fill.style.width = prog + "%"; bar.appendChild(fill);
      card.appendChild(bar);
      var foot = mk("div", "fx2-form-row");
      foot.appendChild(mk("span", "fx2-hint", (Number(q.progress) || 0) + " / " + q.target));
      var btn = mk("button", "fx-btn main", q.claimed ? L("Получено", "Claimed") : (Number(q.progress) >= Number(q.target) ? L("Забрать", "Claim") : L("В процессе", "In progress")));
      btn.type = "button";
      btn.disabled = !!q.claimed || Number(q.progress) < Number(q.target);
      btn.onclick = function () { claimQuest(q, btn); };
      foot.appendChild(btn);
      card.appendChild(foot);
      list.appendChild(card);
    });
  }

  function renderAchievements() {
    var list = q("fx2-quest-list");
    if (!list) return;
    clear(list);
    if (!state.achievements.length) { list.appendChild(mk("div", "fx-empty", L("Достижений пока нет.", "No achievements yet."))); return; }
    var solvedNow = new Set();
    state.achievements.forEach(function (a) { if (a.solved) solvedNow.add(a.id); });
    if (state.achSolved) {
      state.achievements.forEach(function (a) {
        if (a.solved && !state.achSolved.has(a.id)) toast2(L("Достижение: ", "Achievement: ") + a.title + " · " + rewardText(a));
      });
    }
    state.achSolved = solvedNow;
    state.achievements.forEach(function (a) {
      var card = mk("div", "fx2-quest" + (a.solved ? " done" : ""));
      var top = mk("div", "fx2-quest-top");
      top.appendChild(mk("span", "fx2-ach-icon", a.icon || "★"));
      top.appendChild(mk("b", "", a.title));
      top.appendChild(mk("span", "fx2-quest-reward", rewardText(a)));
      card.appendChild(top);
      card.appendChild(mk("div", "fx2-hint", a.description));
      var prog = Math.min(100, Math.round((Number(a.progress) || 0) / (Number(a.target) || 1) * 100));
      var bar = mk("div", "fx2-progress");
      var fill = mk("i"); fill.style.width = prog + "%"; bar.appendChild(fill);
      card.appendChild(bar);
      var foot = mk("div", "fx2-form-row");
      foot.appendChild(mk("span", "fx2-hint", (Number(a.progress) || 0) + " / " + a.target));
      foot.appendChild(mk("span", a.solved ? "fx2-ok" : "fx2-hint", a.solved ? L("получено", "unlocked") : L("не получено", "locked")));
      card.appendChild(foot);
      list.appendChild(card);
    });
  }

  async function claimQuest(qq, btn) {
    btn.disabled = true;
    try {
      await rpc("quest_claim", { p_id: qq.id });
      toast2(L("Награда получена: ", "Reward claimed: ") + rewardText(qq));
      await loadWallet();
      await loadQuests();
      reloadPlus();
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("already") > -1) toast2(L("Уже получено.", "Already claimed."));
      else if (m.indexOf("not ready") > -1) toast2(L("Ещё не выполнено.", "Not completed yet."));
      else fail(e, "quests");
    } finally { btn.disabled = false; }
  }

  /* ---------------- server catalog ---------------- */
  async function loadServers() {
    var list = q("fx2-srv-list");
    if (!gu()) { loginPrompt(list); return; }
    if (list) { clear(list); list.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…"))); }
    try {
      state.servers = (await rpc("server_catalog", { p_q: state.serverQuery || "", p_tag: null })) || [];
      renderServers();
      await loadMyServers();
    } catch (e) {
      if (list) empty(list, isMissing(e) ? L("Каталог не включён. Примени update-plus-2.sql.", "Catalog is not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить каталог.", "Could not load the catalog."));
      if (!isMissing(e)) fail(e, "servers");
    }
  }

  function renderServers() {
    var list = q("fx2-srv-list");
    if (!list) return;
    clear(list);
    if (!state.servers.length) { list.appendChild(mk("div", "fx-empty", L("Серверов не найдено.", "No servers found."))); return; }
    state.servers.forEach(function (s) {
      var card = mk("div", "fx2-srv");
      var top = mk("div", "fx2-srv-top");
      top.appendChild(mk("span", "fx2-srv-ico", "#"));
      var main = mk("div", "fx2-srv-main");
      main.appendChild(mk("b", "", s.name));
      main.appendChild(mk("small", "", (s.owner_nick || "?") + " · " + (Number(s.members) || 0) + L(" участников", " members") + (s.category ? " · " + s.category : "")));
      top.appendChild(main);
      card.appendChild(top);
      if (s.description) card.appendChild(mk("div", "fx2-hint", s.description));
      if (Array.isArray(s.tags) && s.tags.length) {
        var tags = mk("div", "fx2-tags");
        s.tags.forEach(function (t) { tags.appendChild(mk("span", "fx2-tag", t)); });
        card.appendChild(tags);
      }
      var foot = mk("div", "fx2-form-row");
      if (s.joined) {
        var open = mk("button", "fx-btn main", L("Открыть", "Open"));
        open.type = "button";
        open.onclick = function () { closePanel(); try { if (typeof go === "function") go("servers"); } catch (e) {} };
        foot.appendChild(open);
      } else {
        var join = mk("button", "fx-btn main", L("Вступить", "Join"));
        join.type = "button";
        join.onclick = function () { joinServer(s, join); };
        foot.appendChild(join);
      }
      card.appendChild(foot);
      list.appendChild(card);
    });
  }

  async function loadMyServers() {
    var box = q("fx2-my-servers");
    if (!box) return;
    try {
      var rows = (await rpc("server_list")) || [];
      state.myServers = rows.filter(function (s) { return s.member_role === "owner" || s.member_role === "admin"; });
      renderMyServers();
    } catch (e) { if (box) clear(box); }
  }

  function renderMyServers() {
    var box = q("fx2-my-servers");
    if (!box) return;
    clear(box);
    if (!state.myServers.length) return;
    box.appendChild(mk("div", "fx2-section-title", L("Мои серверы", "My servers")));
    state.myServers.forEach(function (s) {
      var row = mk("div", "fx2-my-srv");
      var main = mk("div", "fx2-srv-main");
      main.appendChild(mk("b", "", s.name));
      main.appendChild(mk("small", "", (Number(s.members) || 0) + L(" участников · ", " members · ") + s.member_role));
      row.appendChild(main);
      var set = mk("button", "fx-btn", L("Каталог", "Catalog"));
      set.type = "button";
      set.onclick = function () { openServerMeta(s); };
      row.appendChild(set);
      box.appendChild(row);
    });
  }

  async function joinServer(s, btn) {
    btn.disabled = true;
    try {
      await rpc("server_join_public", { p_server: Number(s.id) });
      toast2(L("Ты вступил в ", "Joined ") + s.name);
      await loadServers();
      try { if (typeof window.loadServerList === "function") window.loadServerList(); } catch (e) {}
      reloadPlus();
    } catch (e) { fail(e, "servers"); }
    finally { btn.disabled = false; }
  }

  function openServerMeta(s) {
    openModal(L("Каталог сервера", "Server catalog"), function (body) {
      body.innerHTML = '<div class="fx-empty">' + L("Загрузка…", "Loading…") + '</div>';
      rpc("server_meta_get", { p_server: Number(s.id) }).then(function (rows) {
        var m = (rows || [])[0] || { is_public: true, tags: [], category: "" };
        body.innerHTML =
          '<div class="fx2-form"><p class="fx2-hint">' + s.name + '</p>' +
          '<label class="fx2-check"><input id="fx2-srv-public" type="checkbox"' + (m.is_public ? " checked" : "") + '> ' + L("Показывать в каталоге", "Show in catalog") + '</label>' +
          '<input id="fx2-srv-tags" class="fx-input" maxlength="120" placeholder="Теги через запятую (до 5)" value="' + (Array.isArray(m.tags) ? m.tags.join(", ") : "") + '">' +
          '<input id="fx2-srv-cat" class="fx-input" maxlength="30" placeholder="Категория (до 30)" value="' + (m.category || "") + '">' +
          '<div id="fx2-srv-err" class="fx2-err"></div>' +
          '<div class="fx2-form-row"><button type="button" class="fx-btn main" id="fx2-srv-save">' + L("Сохранить", "Save") + '</button></div></div>';
        var save = q("fx2-srv-save");
        if (save) save.onclick = function () { saveServerMeta(s, save); };
      }).catch(function (e) {
        body.innerHTML = '<div class="fx-empty">' + (isMissing(e) ? L("Настройки каталога не включены. Примени update-plus-2.sql.", "Catalog settings are not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить настройки.", "Could not load settings.")) + '</div>';
      });
    });
  }

  async function saveServerMeta(s, btn) {
    var tags = (q("fx2-srv-tags").value || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 5);
    var cat = (q("fx2-srv-cat").value || "").trim();
    btn.disabled = true;
    try {
      await rpc("server_set_meta", { p_server: Number(s.id), p_public: !!q("fx2-srv-public").checked, p_tags: tags, p_category: cat || null });
      toast2(L("Настройки сохранены.", "Settings saved."));
      closeModal();
      await loadServers();
      try { if (typeof window.loadServerList === "function") window.loadServerList(); } catch (e) {}
    } catch (e) {
      var err = q("fx2-srv-err");
      if (err) err.textContent = ((e && e.message) || L("Ошибка.", "Error."));
      if (!isMissing(e)) fail(e, "servers");
    } finally { btn.disabled = false; }
  }

  /* ---------------- mod center ---------------- */
  async function loadMod() {
    if (!isStaff()) { showView("main"); return; }
    var tabs = q("fx2-mod-tabs");
    if (tabs) Array.prototype.forEach.call(tabs.children, function (b) {
      b.classList.toggle("on", b.getAttribute("data-mtab") === state.modTab);
      if (b.getAttribute("data-mtab") === "grants" || b.getAttribute("data-mtab") === "history") {
        b.style.display = isStaff() ? "" : "none";
      }
    });
    if (state.modTab === "reports") await loadReports();
    else if (state.modTab === "announcements") { await loadAnnouncements(); renderModAnnouncements(); }
    else if (state.modTab === "grants") renderModGrants();
    else if (state.modTab === "history") await renderModHistory();
  }

  function grantFormHtml(prefill) {
    return '<div class="fx2-form">' +
      '<div id="fx2-grant-role" class="fx2-grant-role"></div>' +
      '<p class="fx2-hint">' + L("Выдача монет, кристаллов и опыта. Цель: UUID, короткий ID или ник.", "Grant coins, gems and XP. Target: UUID, short ID or nickname.") + '</p>' +
      '<input id="fx2-grant-target" class="fx-input" maxlength="80" placeholder="' + L("Цель: UUID / short ID / ник", "Target: UUID / short ID / nickname") + '" value="' + escAttr(prefill) + '">' +
      '<div class="fx2-form-row fx2-grant-inputs"><label>' + COIN + ' <input id="fx2-grant-coins" class="fx2-num" type="number" min="0" max="1000000" value="0"></label>' +
      '<label>' + GEM + ' <input id="fx2-grant-gems" class="fx2-num" type="number" min="0" max="1000000" value="0"></label>' +
      '<label>✦ <input id="fx2-grant-xp" class="fx2-num" type="number" min="0" max="1000000" value="0"></label></div>' +
      '<div class="fx2-form-row fx2-quick"><button type="button" class="fx2-chip-btn" data-gem-add="10">+10 💎</button><button type="button" class="fx2-chip-btn" data-gem-add="50">+50 💎</button><button type="button" class="fx2-chip-btn" data-gem-add="100">+100 💎</button></div>' +
      '<div class="fx2-form-row fx2-quick"><button type="button" class="fx2-chip-btn" data-xp-add="50">+50 ✦</button><button type="button" class="fx2-chip-btn" data-xp-add="100">+100 ✦</button><button type="button" class="fx2-chip-btn" data-xp-add="500">+500 ✦</button></div>' +
      '<input id="fx2-grant-reason" class="fx-input" maxlength="200" placeholder="' + L("Причина (необязательно)", "Reason (optional)") + '">' +
      '<div class="fx2-grant-tools"><button type="button" class="fx2-chip-btn" id="fx2-grant-check">' + L("Проверить доступ", "Check access") + '</button><span id="fx2-grant-diag" class="fx2-grant-diag"></span></div>' +
      '<div id="fx2-grant-result" class="fx2-grant-result"></div>' +
      '<div id="fx2-grant-err" class="fx2-err"></div>' +
      '<div class="fx2-form-row"><button type="button" class="fx-btn main" id="fx2-grant-send">' + L("Выдать", "Grant") + '</button></div></div>';
  }

  function bindGrantForm(root) {
    if (!root) return;
    var roleEl = grantEl(root, "fx2-grant-role");
    if (roleEl) {
      var r = rank();
      roleEl.innerHTML = L("Твоя роль: ", "Your role: ") + "<b>" + roleText() + "</b> · " +
        L("ранг ", "rank ") + r + (r >= 3 ? " ✅" : " ⛔");
      roleEl.className = "fx2-grant-role " + (r >= 3 ? "ok" : "bad");
    }
    Array.prototype.forEach.call(root.querySelectorAll("[data-gem-add]"), function (b) {
      b.onclick = function () {
        var inp = grantEl(root, "fx2-grant-gems");
        if (!inp) return;
        inp.value = (parseInt(inp.value, 10) || 0) + (parseInt(b.getAttribute("data-gem-add"), 10) || 0);
      };
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-xp-add]"), function (b) {
      b.onclick = function () {
        var inp = grantEl(root, "fx2-grant-xp");
        if (!inp) return;
        inp.value = (parseInt(inp.value, 10) || 0) + (parseInt(b.getAttribute("data-xp-add"), 10) || 0);
      };
    });
    var check = grantEl(root, "fx2-grant-check");
    if (check) check.onclick = function () { checkGrantAccess(check); };
    var send = grantEl(root, "fx2-grant-send");
    if (send) send.onclick = function () { submitGrant(send); };
  }

  function renderModGrants() {
    var box = q("fx2-mod-body");
    if (!box) return;
    if (!canGrant()) {
      box.innerHTML = '<div class="fx-empty">' +
        L("Выдавать валюту могут админы и выше. Твоя роль: ", "Only admins and above can grant currency. Your role: ") +
        roleText() + " (" + L("ранг ", "rank ") + rank() + ").</div>";
      return;
    }
    box.innerHTML = grantFormHtml("");
    bindGrantForm(box.querySelector(".fx2-form"));
  }

  async function dbRoleLine() {
    try {
      var dbRole = await rpc("my_role", {});
      if (Array.isArray(dbRole)) dbRole = dbRole[0] && (dbRole[0].my_role || dbRole[0].role || dbRole[0]);
      if (!dbRole) return { role: null, rank: null, text: L(" База: роль не найдена.", " DB: role not found.") };
      var dbRank = null;
      try { dbRank = await rpc("role_rank", { r: String(dbRole) }); } catch (e) {}
      if (Array.isArray(dbRank)) dbRank = dbRank[0];
      return {
        role: String(dbRole),
        rank: dbRank,
        text: L(" База: ", " DB: ") + String(dbRole).toUpperCase() + (dbRank != null ? " (" + dbRank + ")" : "")
      };
    } catch (e) {
      return { role: null, rank: null, text: "" };
    }
  }

  async function checkGrantAccess(btn) {
    var root = grantRoot(btn);
    var diag = grantEl(root, "fx2-grant-diag");
    function say(text, cls) {
      if (!diag) return;
      diag.textContent = text;
      diag.className = "fx2-grant-diag " + (cls || "");
    }
    if (!gu()) { say(L("Сначала войди в аккаунт.", "Sign in first."), "bad"); return; }
    if (!canGrant()) {
      say(L("Твоя роль: ", "Your role: ") + roleText() + " (" + L("ранг ", "rank ") + rank() +
        L("). Нужен admin, coowner или owner.", "). Admin, coowner or owner required."), "bad");
      return;
    }
    say(L("Проверяю…", "Checking…"), "");
    btn.disabled = true;
    try {
      var db = await dbRoleLine();
      try {
        await rpc("admin_grant_currency", { p_target: "diag", p_coins: 0, p_gems: 0, p_reason: "diag" });
        say(L("RPC работает, права есть.", "RPC works, permission granted.") + db.text, "ok");
      } catch (e) {
        var m = ((e && e.message) || "").toLowerCase();
        var code = e && e.code ? " (" + e.code + ")" : "";
        if (m.indexOf("bad amount") > -1) {
          say(L("База обновлена, RPC работает, права есть. Можно выдавать.", "Database is updated, RPC works, permission granted.") + db.text, "ok");
        } else if (m.indexOf("forbidden") > -1) {
          say(L("Сайт: ", "Site: ") + roleText() + " (" + L("ранг ", "rank ") + rank() + ")." + db.text +
            L(". Роль в profiles ниже admin.", ". The role in profiles is below admin."), "bad");
          refreshRole();
        } else if (isMissing(e)) {
          say(L("SQL не применён или схема PostgREST не обновилась. Выполни update-plus-2.sql и перезагрузи страницу.", "SQL is not applied or the PostgREST schema is stale. Run update-plus-2.sql and reload."), "bad");
        } else if (m.indexOf("permission denied") > -1) {
          say(L("Функция есть, но у authenticated нет права execute. Выполни grant в SQL.", "The function exists but authenticated has no execute privilege. Run the grant in SQL.") + code, "bad");
        } else if (m.indexOf("ambiguous") > -1 && m.indexOf("column reference") > -1) {
          say(L("Ошибка в SQL-функции: ambiguous column. Выполни site/fix-grant-currency.sql в Supabase.", "SQL function error: ambiguous column. Run site/fix-grant-currency.sql in Supabase."), "bad");
        } else {
          say(L("Ошибка", "Error") + code + ": " + ((e && e.message) || e), "bad");
        }
      }
    } finally {
      btn.disabled = false;
    }
  }

  async function refreshRole() {
    var u = gu();
    if (!u || !u.id) return false;
    try {
      var r = await gsb().from("profiles").select("role").eq("id", u.id).maybeSingle();
      if (r && r.data && r.data.role && r.data.role !== u.role) {
        u.role = r.data.role;
        try { if (typeof renderUser === "function") renderUser(); } catch (e) {}
        updateStaffButtons();
        return true;
      }
    } catch (e) {}
    return false;
  }

  async function submitGrant(btn) {
    var root = grantRoot(btn);
    if (!root) return;
    if (!canGrant()) { toast2(L("Нет прав.", "No permission.")); return; }
    var targetEl = grantEl(root, "fx2-grant-target");
    var coinsEl = grantEl(root, "fx2-grant-coins");
    var gemsEl = grantEl(root, "fx2-grant-gems");
    var xpEl = grantEl(root, "fx2-grant-xp");
    var reasonEl = grantEl(root, "fx2-grant-reason");
    var err = grantEl(root, "fx2-grant-err");
    var res = grantEl(root, "fx2-grant-result");
    var target = (targetEl && targetEl.value || "").trim();
    var coins = Math.max(parseInt(coinsEl && coinsEl.value, 10) || 0, 0);
    var gems = Math.max(parseInt(gemsEl && gemsEl.value, 10) || 0, 0);
    var xp = Math.max(parseInt(xpEl && xpEl.value, 10) || 0, 0);
    var reason = (reasonEl && reasonEl.value || "").trim();
    if (!target) { if (err) err.textContent = L("Укажи цель.", "Enter a target."); return; }
    if (coins <= 0 && gems <= 0 && xp <= 0) { if (err) err.textContent = L("Нужно выдать хотя бы что-то.", "Grant at least something."); return; }
    btn.disabled = true;
    if (err) err.textContent = "";
    if (res) res.innerHTML = "";
    try {
      var rows;
      try {
        rows = await rpc("admin_grant_currency", { p_target: target, p_coins: coins, p_gems: gems, p_xp: xp, p_reason: reason });
      } catch (e1) {
        // Старая SQL-функция без p_xp: без XP можно выдать по-старому.
        if (isMissing(e1) && xp === 0) {
          rows = await rpc("admin_grant_currency", { p_target: target, p_coins: coins, p_gems: gems, p_reason: reason });
        } else if (isMissing(e1) && xp > 0) {
          throw new Error("xp-sql-missing");
        } else {
          throw e1;
        }
      }
      var r = (rows || [])[0];
      if (res) {
        var parts = [];
        if (coins) parts.push(COIN + " " + nfmt(coins));
        if (gems) parts.push(GEM + " " + nfmt(gems));
        if (xp) parts.push("✦ " + nfmt(xp) + " XP");
        res.innerHTML = r ? (L("Выдано ", "Granted to ") + "<b>" + r.nick + "</b>: " + parts.join(" · ")) : L("Готово.", "Done.");
      }
      toast2(L("Награда выдана.", "Reward granted."));
      if (r && String(r.nick).toLowerCase() === String((gu() && gu().nick) || "").toLowerCase()) await loadWallet();
      if (state.modTab === "history") await renderModHistory();
      reloadPlus();
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      var code = e && e.code ? " (" + e.code + ")" : "";
      if (m.indexOf("xp-sql-missing") > -1) { if (err) err.textContent = L("Выдача XP появится после site/fix-grant-currency.sql. Без XP можно выдать уже сейчас.", "XP grants need site/fix-grant-currency.sql. You can still grant without XP now."); }
      else if (m.indexOf("not found") > -1) { if (err) err.textContent = L("Пользователь не найден.", "User not found."); }
      else if (m.indexOf("forbidden") > -1) { if (err) err.textContent = L("Нет прав. Твоя роль: ", "No permission. Your role: ") + roleText() + " (" + L("ранг ", "rank ") + rank() + ")."; }
      else if (m.indexOf("bad amount") > -1) { if (err) err.textContent = L("Некорректная сумма.", "Bad amount."); }
      else if (m.indexOf("permission denied") > -1) { if (err) err.textContent = L("Функция есть, но нет права execute. Выполни grant в SQL.", "The function exists but execute is not granted. Run the grant in SQL.") + code; }
      else if (m.indexOf("ambiguous") > -1 && m.indexOf("column reference") > -1) { if (err) err.textContent = L("Ошибка в SQL-функции: ambiguous column. Выполни site/fix-grant-currency.sql в Supabase.", "SQL function error: ambiguous column. Run site/fix-grant-currency.sql in Supabase."); }
      else if (isMissing(e)) { if (err) err.textContent = L("SQL не применён или схема не обновилась. Выполни update-plus-2.sql.", "SQL is not applied or the schema is stale. Run update-plus-2.sql.") + code; }
      else if (err) err.textContent = ((e && e.message) || L("Ошибка.", "Error.")) + code;
      if (!isMissing(e) && m.indexOf("xp-sql-missing") < 0) fail(e, "grant");
    } finally { btn.disabled = false; }
  }

  async function renderModHistory() {
    var box = q("fx2-mod-body");
    if (!box) return;
    if (!canGrant()) {
      box.innerHTML = '<div class="fx-empty">' +
        L("История выдач доступна админам и выше. Твоя роль: ", "Grant history is available to admins and above. Your role: ") +
        roleText() + " (" + L("ранг ", "rank ") + rank() + ").</div>";
      return;
    }
    box.innerHTML = '<div class="fx-empty">' + L("Загрузка…", "Loading…") + '</div>';
    try {
      var rows = (await rpc("currency_grants_list", { p_limit: 50 })) || [];
      clear(box);
      if (!rows.length) { box.appendChild(mk("div", "fx-empty", L("Выдач пока не было.", "No grants yet."))); return; }
      rows.forEach(function (g) {
        var card = mk("div", "fx2-grant-row");
        var top = mk("div", "fx2-grant-top");
        top.appendChild(mk("b", "", (g.from_nick || "?") + " → " + (g.to_nick || "?")));
        top.appendChild(mk("span", "fx2-hint", dateTime(g.created_at)));
        card.appendChild(top);
        var val = [];
        if (Number(g.coins)) val.push(COIN + " " + nfmt(g.coins));
        if (Number(g.gems)) val.push(GEM + " " + nfmt(g.gems));
        if (Number(g.xp)) val.push("✦ " + nfmt(g.xp) + " XP");
        card.appendChild(mk("div", "fx2-grant-val", val.join(" · ") || "—"));
        if (g.reason) card.appendChild(mk("div", "fx2-hint", g.reason));
        box.appendChild(card);
      });
    } catch (e) {
      if (isMissing(e)) box.innerHTML = '<div class="fx-empty">' + L("История не включена. Примени update-plus-2.sql.", "History is not enabled. Apply update-plus-2.sql.") + '</div>';
      else { clear(box); box.appendChild(mk("div", "fx-empty", L("Не удалось загрузить историю.", "Could not load history."))); fail(e, "grants"); }
    }
  }

  function openGrant(target) {
    if (!canGrant()) {
      toast2(L("Выдавать валюту могут админы и выше. Твоя роль: ", "Only admins and above can grant currency. Your role: ") +
        roleText() + " (" + L("ранг ", "rank ") + rank() + ").");
      return;
    }
    var prefill = "";
    if (target && typeof target === "object") prefill = target.short_id || target.id || target.nick || "";
    else if (target) prefill = String(target);
    openModal(L("Выдать валюту", "Grant currency"), function (body) {
      body.innerHTML = grantFormHtml(prefill);
      bindGrantForm(body.querySelector(".fx2-form"));
    });
  }

  /* ---------------- privilege decorations ---------------- */
  function privItem(id, pid) {
    var c = state.privCache.get(String(id));
    if (!c || !c.list || c.list.indexOf(pid) < 0) return null;
    return state.privilegeMap.get(pid) || null;
  }
  function hasPriv(id, pid) {
    return !!privItem(id, pid);
  }
  function privItems(id) {
    var c = state.privCache.get(String(id));
    if (!c || !c.list) return [];
    return c.list.map(function (pid) { return state.privilegeMap.get(pid); }).filter(Boolean);
  }

  function applyPrivToNick(el, id) {
    if (!el) return;
    Array.prototype.forEach.call(el.querySelectorAll(".fx2-pbadge"), function (b) { b.remove(); });
    el.classList.remove("fx2-glow", "fx2-rainbow", "fx2-hi-nick");
    el.style.removeProperty("--fx2-glow");
    var list = privItems(id);
    list.forEach(function (it) {
      if (it.kind === "badge") {
        var b = mk("span", "fx2-pbadge" + (String(it.value).toUpperCase() === "LEGEND" ? " legend" : ""), it.value || it.title);
        el.appendChild(b);
      } else if (it.kind === "glow") {
        if (it.value === "rainbow") el.classList.add("fx2-rainbow");
        else {
          el.classList.add("fx2-glow");
          el.style.setProperty("--fx2-glow", it.value || "#4ade80");
        }
      } else if (it.kind === "highlight") {
        el.classList.add("fx2-hi-nick");
      }
    });
    var fx = activeEffectFor(id);
    paintNickFx(el, fx ? fx.value : "");
  }

  function applyPrivToAvatar(el, id) {
    if (!el) return;
    el.classList.remove("fx2-frame-gold", "fx2-frame-green", "fx2-frame-red", "fx2-frame-neon");
    privItems(id).forEach(function (it) {
      if (it.kind === "frame") el.classList.add("fx2-frame-" + (it.value || "gold"));
    });
  }

  function queuePriv(id) {
    if (!id || state.privMissing) return;
    id = String(id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return;
    var c = state.privCache.get(id);
    if (c && Date.now() - c.at < 60000) return;
    state.privQueue.add(id);
    clearTimeout(state.privTimer);
    state.privTimer = setTimeout(flushPrivs, 220);
  }

  async function flushPrivs() {
    var ids = Array.from(state.privQueue);
    state.privQueue.clear();
    if (!ids.length || !gu() || state.privMissing) return;
    try {
      var rows = (await rpc("privileges_get", { p_ids: ids })) || [];
      rows.forEach(function (r) {
        state.privCache.set(String(r.id), {
          at: Date.now(),
          list: r.privileges || [],
          active: r.active_effect
        });
      });
      applyAllPrivs();
    } catch (e) {
      if (isMissing(e)) state.privMissing = true;
    }
  }

  async function loadPrivilegeMap(force) {
    if (!gu() || state.privMissing) return;
    if (!force && state.privilegeMap.size && Date.now() - state.privilegeMapAt < 300000) return;
    try {
      var rows = (await rpc("privilege_list")) || [];
      var map = new Map();
      rows.forEach(function (it) { map.set(it.id, it); });
      state.privilegeMap = map;
      state.privilegeMapAt = Date.now();
      applyAllPrivs();
    } catch (e) {
      if (isMissing(e)) state.privMissing = true;
    }
  }

  function decoratePrivileges(force) {
    if (!gu()) return;
    var ids = new Set();
    Array.prototype.forEach.call(document.querySelectorAll("[data-fx2-uid],[data-fx-uid]"), function (el) {
      var id = el.getAttribute("data-fx2-uid") || el.getAttribute("data-fx-uid");
      if (!id) return;
      if (!el.getAttribute("data-fx2-uid")) el.setAttribute("data-fx2-uid", id);
      ids.add(String(id));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-fx2-ava-uid]"), function (el) {
      var id = el.getAttribute("data-fx2-ava-uid");
      if (id) ids.add(String(id));
    });
    var u = gu();
    if (u) ids.add(String(u.id));
    if (userCtx() && userCtx().id) ids.add(String(userCtx().id));
    ids.forEach(queuePriv);
    applyAllPrivs();
    if (force) flushPrivs();
  }

  function applyAllPrivs() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-fx2-uid]"), function (el) {
      applyPrivToNick(el, el.getAttribute("data-fx2-uid"));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-fx2-ava-uid]"), function (el) {
      applyPrivToAvatar(el, el.getAttribute("data-fx2-ava-uid"));
    });
    var u = gu();
    if (u) {
      ["pava", "me", "fx-me-ava", "fx2-w-ava"].forEach(function (id) {
        var el = q(id);
        if (!el) return;
        if (!el.getAttribute("data-fx2-ava-uid")) el.setAttribute("data-fx2-ava-uid", String(u.id));
        applyPrivToAvatar(el, String(u.id));
      });
    }
    decorateProfileBanner();
  }

  function decorateProfileBanner() {
    var card = q("umodal") ? q("umodal").querySelector(".mcard") : null;
    if (!card) return;
    var old = card.querySelector(".fx2-profile-banner");
    var p = userCtx();
    var it = p && privItem(p.id, "profile_banner");
    if (!it) { if (old) old.remove(); return; }
    if (!old) {
      old = mk("div", "fx2-profile-banner");
      card.insertBefore(old, card.firstChild);
    }
    old.className = "fx2-profile-banner fx2-banner-" + (it.value || "green");
    old.textContent = "fsociety";
  }

  function decorateProfileModal() {
    var p = userCtx();
    if (!p || !p.id) return;
    var n = q("u_nick");
    if (n) {
      n.setAttribute("data-fx2-uid", String(p.id));
      queuePriv(p.id);
      applyPrivToNick(n, String(p.id));
    }
    var a = q("u_ava");
    if (a) {
      a.setAttribute("data-fx2-ava-uid", String(p.id));
      queuePriv(p.id);
      applyPrivToAvatar(a, String(p.id));
    }
    decorateProfileBanner();
    var mb = q("umodal") ? q("umodal").querySelector(".mbtns") : null;
    if (mb) {
      var g = q("fx2-u-grant");
      if (!g) {
        g = mk("button", "btn glass sm", "💎 " + L("Выдать", "Grant"));
        g.id = "fx2-u-grant";
        g.type = "button";
        mb.insertBefore(g, mb.firstChild);
      }
      g.style.display = canGrant() && String(p.id) !== String(uid()) ? "" : "none";
      g.onclick = function () { openGrant(p); };
    }
    flushPrivs();
  }

  /* ---------------- message actions / highlights ---------------- */
  var MSG_BOXES = [
    { id: "msgs", kind: "chat", row: ".msg[data-id]", head: ".mh", scope: chatRoomId },
    { id: "dmmsgs", kind: "dm", row: ".msg[data-id]", head: ".mh", scope: dmUserId },
    { id: "groupmsgs", kind: "group", row: ".msg[data-id]", head: ".mh", scope: groupId },
    { id: "srvmsgs", kind: "server", row: ".msg[data-id]", head: ".mh", scope: serverChannel },
    { id: "th_replies", kind: "reply", row: ".tr[data-id]", head: ".trh", scope: threadId }
  ];

  function msgPreview(row) {
    var body = row.querySelector(".mb, .trb");
    var text = body ? body.textContent : row.textContent;
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, 160);
  }

  function canPinKind(kind, authorId) {
    if (!gu()) return false;
    if (kind === "dm" || kind === "group" || kind === "server") return true;
    return String(authorId) === String(uid()) || isStaff();
  }

  function decorateRowNick(row) {
    var n = row.querySelector(".mnik, .trn");
    if (!n) return;
    var id = n.getAttribute("data-fx2-uid") || n.getAttribute("data-fx-uid");
    if (!id) return;
    n.setAttribute("data-fx2-uid", String(id));
    queuePriv(id);
    applyPrivToNick(n, String(id));
    if (hasPriv(id, "chat_highlight")) row.classList.add("fx2-msg-hi");
    else row.classList.remove("fx2-msg-hi");
  }

  function decorateMessages() {
    if (!gu()) return;
    MSG_BOXES.forEach(function (cfg) {
      var box = q(cfg.id);
      if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll(cfg.row), function (row) {
        decorateRowNick(row);
        if (row._fx2Msg) return;
        row._fx2Msg = true;
        var head = row.querySelector(cfg.head);
        var raw = row.getAttribute("data-id");
        if (!head || !raw || isNaN(Number(raw))) return;
        var id = Number(raw);
        var authorEl = row.querySelector(".mnik, .trn");
        var authorId = authorEl ? (authorEl.getAttribute("data-fx2-uid") || authorEl.getAttribute("data-fx-uid")) : null;
        var preview = msgPreview(row);
        if (canPinKind(cfg.kind, authorId)) {
          var pin = mk("button", "mact fx2-mact", "📌");
          pin.type = "button";
          pin.title = L("Закрепить / снять", "Pin / unpin");
          pin.onclick = function (e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            togglePin(cfg.kind, id, cfg.scope());
          };
          head.appendChild(pin);
        }
        if (String(authorId) !== String(uid())) {
          var rep = mk("button", "mact fx2-mact", "⚑");
          rep.type = "button";
          rep.title = L("Пожаловаться", "Report");
          rep.onclick = function (e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            openReport(cfg.kind, id, preview);
          };
          head.appendChild(rep);
        }
      });
    });
  }

  function clearMessageActions() {
    Array.prototype.forEach.call(document.querySelectorAll(".fx2-mact"), function (b) { b.remove(); });
    Array.prototype.forEach.call(document.querySelectorAll(".fx2-msg-hi"), function (r) { r.classList.remove("fx2-msg-hi"); });
    Array.prototype.forEach.call(document.querySelectorAll(".msg, .tr"), function (r) { r._fx2Msg = false; });
  }

  /* ---------------- forum tags ---------------- */
  function injectForumFilter() {
    var pane = q("fpane0"), fnew = q("fnew");
    if (!pane || !fnew || q("fx2-forum-tags")) return;
    var d = mk("div", "fx2-forum-tags");
    d.id = "fx2-forum-tags";
    d.style.display = "none";
    fnew.insertAdjacentElement("afterend", d);
  }

  function renderForumTags(rows) {
    var box = q("fx2-forum-tags");
    if (!box) return;
    var tags = state.forumTags.slice();
    (rows || []).forEach(function (th) {
      (th.tags || []).forEach(function (t) {
        t = String(t || "").trim();
        if (t && tags.indexOf(t) < 0) tags.push(t);
      });
    });
    state.forumTags = tags.slice(0, 30);
    clear(box);
    if (!state.forumTags.length) { box.style.display = "none"; return; }
    box.style.display = "";
    var all = mk("button", "fx2-tag-btn" + (state.forumFilter ? "" : " on"), L("все", "all"));
    all.type = "button";
    all.onclick = function () { filterForum(null); };
    box.appendChild(all);
    state.forumTags.forEach(function (t) {
      var b = mk("button", "fx2-tag-btn" + (state.forumFilter === t ? " on" : ""), "#" + t);
      b.type = "button";
      b.onclick = function () { filterForum(t); };
      box.appendChild(b);
    });
  }

  async function filterForum(tag) {
    if (!gu()) return;
    state.forumFilter = tag || null;
    var box = q("flist");
    if (box) box.textContent = L("Загрузка…", "Loading…");
    try {
      var rows;
      if (tag) rows = await rpc("forum_list_tag", { p_tag: tag, p_limit: 50, p_offset: 0 });
      else rows = await rpc("forum_list", { p_limit: 50, p_offset: 0 });
      rows = rows || [];
      forumCache = rows;
      renderForum(rows);
    } catch (e) {
      if (box) box.textContent = isMissing(e) ? L("Теги не включены. Примени update-plus-2.sql.", "Tags are not enabled. Apply update-plus-2.sql.") : L("Не удалось загрузить темы.", "Could not load threads.");
      if (!isMissing(e)) fail(e, "tags");
    }
  }

  function decorateForum(rows) {
    var box = q("flist");
    if (!box) return;
    var buttons = box.querySelectorAll(".flink");
    (rows || []).forEach(function (th, i) {
      var b = buttons[i];
      if (!b) return;
      var tags = th.tags || [];
      if (!tags.length) return;
      var d = mk("div", "fx2-ftags");
      tags.forEach(function (t) {
        var chip = mk("button", "fx2-tag", "#" + t);
        chip.type = "button";
        chip.onclick = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          filterForum(String(t));
        };
        d.appendChild(chip);
      });
      b.appendChild(d);
    });
  }

  function canEditThread(th) {
    return !!gu() && (String(th.author) === String(uid()) || isStaff());
  }

  function loadThreadTags(id) {
    if (!id || !gu()) return;
    rpc("thread_tags_get", { p_thread: Number(id) }).then(function (tags) {
      state.threadTags = tags || [];
      renderThreadTags(id);
    }).catch(function (e) {
      if (isMissing(e)) state.threadTags = [];
      renderThreadTags(id);
    });
  }

  function renderThreadTags(id) {
    var head = q("th_head");
    if (!head) return;
    var old = q("fx2-thread-tags");
    if (old) old.remove();
    if (!state.threadTags.length && !canEditThread({ author: state.threadAuthor })) return;
    var d = mk("div", "fx2-thread-tags");
    d.id = "fx2-thread-tags";
    state.threadTags.forEach(function (t) {
      var chip = mk("button", "fx2-tag", "#" + t);
      chip.type = "button";
      chip.onclick = function () {
        try { if (typeof go === "function") go("forum"); } catch (e) {}
        state.forumFilter = String(t);
        filterForum(String(t));
      };
      d.appendChild(chip);
    });
    if (canEditThread({ author: state.threadAuthor })) {
      var edit = mk("button", "fx2-link", L("✎ теги", "✎ tags"));
      edit.type = "button";
      edit.onclick = function () { openThreadTags(id); };
      d.appendChild(edit);
    }
    head.appendChild(d);
  }

  function openThreadTags(id) {
    if (!id || !gu()) return;
    openModal(L("Теги темы", "Thread tags"), function (body) {
      body.innerHTML =
        '<div class="fx2-form"><p class="fx2-hint">' + L("До 5 тегов, через запятую. Например: help, code, meme.", "Up to 5 tags, comma separated.") + '</p>' +
        '<input id="fx2-th-tags-in" class="fx-input" maxlength="120" value="' + state.threadTags.join(", ").replace(/"/g, "&quot;") + '">' +
        '<div id="fx2-th-tags-err" class="fx2-err"></div>' +
        '<div class="fx2-form-row"><button type="button" class="fx-btn main" id="fx2-th-tags-save">' + L("Сохранить", "Save") + '</button></div></div>';
      var save = q("fx2-th-tags-save");
      if (!save) return;
      save.onclick = async function () {
        var tags = (q("fx2-th-tags-in").value || "").split(",").map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean).slice(0, 5);
        save.disabled = true;
        try {
          var res = await rpc("thread_tags_set", { p_thread: Number(id), p_tags: tags });
          state.threadTags = res || tags;
          closeModal();
          renderThreadTags(id);
          toast2(L("Теги сохранены.", "Tags saved."));
        } catch (e) {
          var err = q("fx2-th-tags-err");
          if (err) err.textContent = ((e && e.message) || L("Ошибка.", "Error."));
          if (!isMissing(e)) fail(e, "tags");
        } finally { save.disabled = false; }
      };
    });
  }

  function afterThread(th, rows) {
    if (!th) return;
    state.threadAuthor = th.author;
    state.threadRows = rows || [];
    loadThreadTags(th.id);
    var head = q("th_head");
    var fm = head ? head.querySelector(".fm") : null;
    if (fm) {
      var pin = q("fx2-th-pin");
      if (!pin) {
        pin = mk("button", "rdel", "📌");
        pin.id = "fx2-th-pin";
        pin.type = "button";
        pin.title = L("Закрепить тему", "Pin thread");
        pin.onclick = function () { togglePin("thread", Number(th.id), String(th.id)); };
        fm.appendChild(pin);
      }
      var rep = q("fx2-th-report");
      if (!rep) {
        rep = mk("button", "rdel", "⚑");
        rep.id = "fx2-th-report";
        rep.type = "button";
        rep.title = L("Пожаловаться на тему", "Report thread");
        rep.onclick = function () { openReport("thread", Number(th.id), th.title); };
        fm.appendChild(rep);
      }
    }
    setTimeout(decorateMessages, 0);
    refreshInlinePolls(true);
  }

  /* ---------------- hooks into existing UI ---------------- */
  function injectSendPollButtons() {
    var cfg = [
      { id: "fx2-poll-btn-chat", anchor: q("sendrow"), mode: "append" },
      { id: "fx2-poll-btn-dm", anchor: q("dmsendbtn"), mode: "before" },
      { id: "fx2-poll-btn-group", anchor: q("groupsendbtn"), mode: "before" },
      { id: "fx2-poll-btn-srv", anchor: q("srvsend"), mode: "before" },
      { id: "fx2-poll-btn-th", anchor: q("th_send"), mode: "before" }
    ];
    cfg.forEach(function (c) {
      if (!c.anchor || q(c.id)) return;
      var b = mk("button", "btn glass sm fx2-poll-btn", "📊");
      b.id = c.id;
      b.type = "button";
      b.title = L("Создать опрос", "Create poll");
      b.onclick = function () { openPollCreate(); };
      if (c.mode === "append") c.anchor.appendChild(b);
      else c.anchor.parentNode.insertBefore(b, c.anchor);
    });
  }

  function injectAdminButtons() {
    var admin = q("admin");
    var bar = admin ? admin.querySelector(".abar") : null;
    if (!bar) return;
    if (!q("fx2-admin-reports")) {
      var r = mk("button", "btn glass sm", "🛡 " + L("Жалобы", "Reports"));
      r.id = "fx2-admin-reports";
      r.type = "button";
      r.onclick = function () { state.modTab = "reports"; openPanel("mod"); };
      bar.appendChild(r);
    }
    if (!q("fx2-admin-grant")) {
      var g = mk("button", "btn glass sm", "💎 " + L("Выдать валюту", "Grant currency"));
      g.id = "fx2-admin-grant";
      g.type = "button";
      g.onclick = function () { state.modTab = "grants"; openPanel("mod"); };
      bar.appendChild(g);
    }
    var rr = q("fx2-admin-reports"), gg = q("fx2-admin-grant");
    if (rr) rr.style.display = isStaff() ? "" : "none";
    if (gg) gg.style.display = canGrant() ? "" : "none";
  }

  function injectProfileGrant() {
    var mb = q("umodal") ? q("umodal").querySelector(".mbtns") : null;
    if (!mb || q("fx2-u-grant")) return;
    var g = mk("button", "btn glass sm", "💎 " + L("Выдать", "Grant"));
    g.id = "fx2-u-grant";
    g.type = "button";
    g.style.display = "none";
    g.onclick = function () { if (userCtx()) openGrant(userCtx()); };
    mb.insertBefore(g, mb.firstChild);
  }

  function decorateAdminUsers() {
    if (!canGrant()) return;
    var list = q("ulist");
    if (!list) return;
    Array.prototype.forEach.call(list.querySelectorAll(".ucard"), function (card) {
      var name = card.querySelector(".uopen");
      if (!name) return;
      var id = name.getAttribute("data-fx-uid") || name.getAttribute("data-fx2-uid");
      if (!id || String(id) === String(uid())) return;
      if (card.querySelector(".fx2-u-grant-mini")) return;
      var acts = card.querySelector(".uacts");
      if (!acts) { acts = mk("div", "uacts"); card.appendChild(acts); }
      var b = mk("button", "mini fx2-u-grant-mini", "💎");
      b.type = "button";
      b.title = L("Выдать валюту", "Grant currency");
      b.onclick = function (e) {
        if (e) e.stopPropagation();
        openGrant({ id: id, nick: name.textContent || "" });
      };
      acts.appendChild(b);
    });
  }

  function injectPlusHooks() {
    var tiles = q("fx-main") ? q("fx-main").querySelector(".fx-tiles") : null;
    if (tiles && !q("fx2-plus-tile")) {
      var b = mk("button", "fx-tile");
      b.id = "fx2-plus-tile";
      b.type = "button";
      b.innerHTML = '<span class="fx-ico">💎</span><span><b>PLUS 2</b><small id="fx2-plus-tile-sub">' + L("кристаллы и привилегии", "gems and privileges") + '</small></span>';
      b.onclick = function () {
        var p = q("fxpanel");
        if (p) p.classList.remove("show");
        openPanel("main");
      };
      tiles.insertBefore(b, tiles.firstChild);
    }
    var coins = q("fx-me-coins");
    if (coins && !q("fx2-wallet-line")) {
      var line = mk("div", "fx2-wallet-line");
      line.id = "fx2-wallet-line";
      coins.insertAdjacentElement("afterend", line);
    }
  }

  function updateStaffButtons() {
    var staff = isStaff(), grant = canGrant();
    var modTile = q("fx2-tile-mod");
    if (modTile) modTile.style.display = staff ? "" : "none";
    var dot = q("fx2-report-dot");
    if (dot) dot.classList.toggle("show", staff && state.reportCount > 0);
    var mdot = q("fx2-mod-dot");
    if (mdot) mdot.style.display = staff && state.reportCount > 0 ? "" : "none";
    var gt = q("fx2-mtab-grants"), ht = q("fx2-mtab-history");
    if (gt) gt.style.display = staff ? "" : "none";
    if (ht) ht.style.display = staff ? "" : "none";
    var rr = q("fx2-admin-reports"), gg = q("fx2-admin-grant");
    if (rr) rr.style.display = staff ? "" : "none";
    if (gg) gg.style.display = grant ? "" : "none";
  }

  /* ---------------- wrappers ---------------- */
  function wrapGlobals() {
    if (typeof window.richName === "function" && !window.__fx2RichWrapped) {
      var origRich = window.richName;
      window.richName = function (el, id, nick) {
        var out = origRich.apply(this, arguments);
        if (el && id) {
          el.setAttribute("data-fx2-uid", String(id));
          queuePriv(id);
          applyPrivToNick(el, String(id));
        }
        return out;
      };
      window.__fx2RichWrapped = true;
    }

    if (typeof window.renderForum === "function" && !window.__fx2ForumWrapped) {
      var origForum = window.renderForum;
      window.renderForum = function (rows) {
        var out = origForum.apply(this, arguments);
        try {
          rows = rows || [];
          if (state.forumFilter && rows.length && !rows.every(function (th) {
            return (th.tags || []).indexOf(state.forumFilter) > -1;
          })) state.forumFilter = null;
          renderForumTags(rows);
          decorateForum(rows);
        } catch (e) {}
        return out;
      };
      window.__fx2ForumWrapped = true;
    }

    if (typeof window.renderThread === "function" && !window.__fx2ThreadWrapped) {
      var origThread = window.renderThread;
      window.renderThread = function (th, rows) {
        var out = origThread.apply(this, arguments);
        try { afterThread(th, rows || []); } catch (e) {}
        return out;
      };
      window.__fx2ThreadWrapped = true;
    }

    if (typeof window.renderUsers === "function" && !window.__fx2UsersWrapped) {
      var origUsers = window.renderUsers;
      window.renderUsers = function () {
        var out = origUsers.apply(this, arguments);
        try { decorateAdminUsers(); } catch (e) {}
        return out;
      };
      window.__fx2UsersWrapped = true;
    }

    if (typeof window.renderUser === "function" && !window.__fx2UserWrapped) {
      var origUser = window.renderUser;
      window.renderUser = function () {
        var out = origUser.apply(this, arguments);
        try { decoratePrivileges(true); } catch (e) {}
        return out;
      };
      window.__fx2UserWrapped = true;
    }

    if (typeof window.openProfile === "function" && !window.__fx2ProfileWrapped) {
      var origOpen = window.openProfile;
      window.openProfile = function (id) {
        var p = origOpen.apply(this, arguments);
        var apply = function () { try { decorateProfileModal(); } catch (e) {} };
        if (p && typeof p.then === "function") p.then(apply).catch(function () {});
        else setTimeout(apply, 300);
        return p;
      };
      window.__fx2ProfileWrapped = true;
    }
  }

  function injectAll() {
    injectUI();
    injectPlusHooks();
    injectPollSlots();
    injectSendPollButtons();
    injectForumFilter();
    injectAdminButtons();
    injectProfileGrant();
  }

  /* ---------------- auth / tick / boot ---------------- */
  function removeGuestStuff() {
    var ann = q("fx2-ann"); if (ann) ann.remove();
    var mainAnn = q("fx2-main-ann"); if (mainAnn) clear(mainAnn);
    hidePollSlots();
    clearMessageActions();
    Array.prototype.forEach.call(document.querySelectorAll(".fx2-pbadge"), function (b) { b.remove(); });
    Array.prototype.forEach.call(document.querySelectorAll(".fx2-nfx"), function (b) { b.remove(); });
    Array.prototype.forEach.call(document.querySelectorAll(".fx2-nick-fx"), function (el) {
      el.classList.remove("fx2-nick-fx");
      el.removeAttribute("data-fx2-fx");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".fx2-glow,.fx2-rainbow,.fx2-hi-nick"), function (el) {
      el.classList.remove("fx2-glow", "fx2-rainbow", "fx2-hi-nick");
      el.style.removeProperty("--fx2-glow");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".fx2-frame-gold,.fx2-frame-green,.fx2-frame-red,.fx2-frame-neon"), function (el) {
      el.classList.remove("fx2-frame-gold", "fx2-frame-green", "fx2-frame-red", "fx2-frame-neon");
    });
    var banner = q("umodal") ? q("umodal").querySelector(".fx2-profile-banner") : null;
    if (banner) banner.remove();
    var badge = q("fx2-gem-badge"); if (badge) badge.textContent = "0";
    var tile = q("fx2-plus-tile-sub"); if (tile) tile.textContent = L("войди в аккаунт", "sign in");
    var line = q("fx2-wallet-line"); if (line) line.textContent = "💎 0";
    state.forumTags = [];
    state.forumFilter = null;
    state.threadTags = [];
    state.ann = [];
    state.reportCount = 0;
    if (q("fx2panel")) renderGuestWallet();
    updateStaffButtons();
  }

  function syncAuth() {
    var id = uid();
    if (id === state.lastUid) return;
    state.lastUid = id;
    if (id) {
      state.privMissing = false;
      state.privilegeMapAt = 0;
      state.privCache.clear();
      state.privQueue.clear();
      state.missing = {};
      state.wallet = null;
      state.privileges = [];
      state.wallSynced = false;
      injectAll();
      loadPrivilegeMap(true);
      loadWallet();
      loadAnnouncements();
      if (isStaff()) loadReportsCount();
      decoratePrivileges(true);
      if (threadId()) refreshInlinePolls(true);
    } else {
      state.wallet = null;
      state.privCache.clear();
      state.privQueue.clear();
      state.privilegeMap = new Map();
      state.privilegeMapAt = 0;
      state.privileges = [];
      state.wallSynced = false;
      state.wallSel = null;
      stopWallPreview();
      removeGuestStuff();
    }
  }

  function tick() {
    injectAll();
    syncAuth();
    if (!gu()) return;
    var now = Date.now();
    if (now - state.lastPriv > 2500) {
      state.lastPriv = now;
      decoratePrivileges(false);
    }
    if (now - state.lastMsg > 2000) {
      state.lastMsg = now;
      decorateMessages();
    }
    var c = ctx();
    var key = c.scope + ":" + (c.id || "");
    if (key !== state.inlineKey || now - state.inlineAt > 20000) refreshInlinePolls(false);
    if (now - state.lastAnn > 60000 && q("home") && q("home").classList.contains("active")) {
      state.lastAnn = now;
      loadAnnouncements();
    }
    if (now - state.lastWallet > 90000) {
      state.lastWallet = now;
      loadWallet();
    }
    if (isStaff() && now - state.lastReports > 30000) {
      state.lastReports = now;
      loadReportsCount();
    }
    updateStaffButtons();
  }

  function boot() {
    injectAll();
    wrapGlobals();
    state.lastUid = "__boot__";
    syncAuth();
    tick();
    setInterval(tick, 1200);
    try {
      if (gsb()) gsb().auth.onAuthStateChange(function () { setTimeout(syncAuth, 250); });
    } catch (e) {}
    window.fxPlus2 = {
      version: VERSION,
      open: openPanel,
      wallet: function () { return state.wallet; },
      sync: syncAuth,
      reload: function () {
        loadWallet();
        loadAnnouncements();
        if (isStaff()) loadReportsCount();
        decoratePrivileges(true);
      },
      refreshWallet: loadWallet,
      setEffect: setEffect,
      applyWallpaper: applyWallpaper,
      decorate: function () { decoratePrivileges(true); },
      wallUnlocked: wallUnlocked,
      state: state
    };
  }


  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
