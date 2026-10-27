/* ============================================================
   fsociety PLUS — прогрессивный слой поверх основного сайта.
   Ничего не переписывает: добавляет панель, статистику, магазин,
   истории, реакции, голосовые, поиск, закладки и онлайн-статусы.
   ============================================================ */
(function () {
  "use strict";

  var VERSION = "plus-2.0";
  var EMOJIS = ["👍", "❤️", "🔥", "😂", "😮", "💀"];
  var state = {
    stats: null,
    shop: [],
    leadBy: "xp",
    bookmarks: new Set(),
    stories: [],
    storyView: null,
    titles: new Map(),
    titleQueue: new Set(),
    titleTimer: 0,
    reactCache: new Map(),
    reactQueue: {},
    reactTimer: 0,
    reactionsMissing: false,
    missing: {},
    channel: null,
    online: new Map(),
    typing: new Map(),
    install: null,
    lastUid: null,
    lastThread: null,
    rec: null,
    termHistory: [],
    termPos: -1,
    searchTimer: 0
  };

  /* ---------------- helpers ---------------- */
  function q(id) { return document.getElementById(id); }
  function gsb() { try { return sb; } catch (e) { return null; } }
  function gu() { try { return user; } catch (e) { return null; } }
  function glang() { try { return lang; } catch (e) { return "ru"; } }
  function L(ru, en) { return glang() === "en" ? en : ru; }
  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function clear(n) { if (n) while (n.firstChild) n.removeChild(n.firstChild); }
  function uid() { var u = gu(); return u && u.id ? String(u.id) : null; }
  function initial(name) { return (name || "?").trim().slice(0, 1).toUpperCase() || "?"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function nfmt(n) { return Number(n || 0).toLocaleString(glang() === "en" ? "en-US" : "ru-RU"); }
  function dateShort(iso) {
    try {
      return new Date(iso).toLocaleDateString(glang() === "en" ? "en-US" : "ru-RU", { day: "2-digit", month: "short" });
    } catch (e) { return ""; }
  }
  function timeShort(iso) {
    try {
      return new Date(iso).toLocaleTimeString(glang() === "en" ? "en-US" : "ru-RU", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }
  function xpForLevel(l) { l = Math.max(1, Number(l) || 1); return (l - 1) * (l - 1) * 40; }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function claimedToday(st) { return !!(st && st.last_daily && String(st.last_daily).slice(0, 10) === todayIso()); }
  function toastFx(msg) {
    try { if (typeof toast === "function") { toast(msg); return; } } catch (e) {}
    var el = q("fxtoast");
    if (!el) {
      el = mk("div", "fx-toast"); el.id = "fxtoast"; document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2400);
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
      toastFx(L("Фича ещё не включена в базе. Нужно применить update-plus.sql.", "This feature is not enabled in the database yet. Apply update-plus.sql."));
    } else {
      toastFx(L("Ошибка: ", "Error: ") + ((err && (err.message || err.error_description)) || err || "?"));
    }
  }
  async function rpc(name, args) {
    var s = gsb();
    if (!s) throw new Error("no-supabase");
    var r = await s.rpc(name, args || {});
    if (r.error) throw r.error;
    return r.data;
  }

  /* ---------------- UI skeleton ---------------- */
  function injectUI() {
    if (q("fxbtn")) return;

    var btn = document.createElement("button");
    btn.id = "fxbtn";
    btn.type = "button";
    btn.className = "glass";
    btn.title = "fsociety PLUS";
    btn.setAttribute("aria-label", "fsociety PLUS");
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.4 6 .9-4.4 4.2 1 6-5.2-2.8-5.2 2.8 1-6L3.4 9.3l6-.9z"/></svg><span class="fx-dot"></span>';
    document.body.appendChild(btn);

    var panel = document.createElement("div");
    panel.id = "fxpanel";
    panel.innerHTML =
      '<div class="fx-wrap"><div class="fx-inner">' +
        '<div class="fx-top"><h2>fsociety <span style="color:#4ade80">PLUS</span></h2><button type="button" class="fx-x" id="fxclose" aria-label="Close">✕</button></div>' +

        '<div id="fx-main" class="fx-view on">' +
          '<div class="fx-card">' +
            '<div class="fx-me">' +
              '<div class="fx-ava" id="fx-me-ava"><span>?</span></div>' +
              '<div class="fx-me-main">' +
                '<div class="fx-nick"><span id="fx-me-nick">Гость</span><span class="fx-lvl" id="fx-me-lvl">LVL —</span></div>' +
                '<div class="fx-coins" id="fx-me-coins">Войди в аккаунт</div>' +
                '<div class="fx-bar"><i id="fx-me-bar"></i></div>' +
                '<small id="fx-me-next">XP появится после входа</small>' +
              '</div>' +
              '<button type="button" class="fx-daily" id="fx-daily-btn" disabled>Бонус</button>' +
            '</div>' +
          '</div>' +
          '<div class="fx-tiles">' +
            '<button type="button" class="fx-tile" data-fx-view="shop"><span class="fx-ico">🛒</span><span><b>Магазин</b><small>титулы, цвета, рамки</small></span></button>' +
            '<button type="button" class="fx-tile" data-fx-view="top"><span class="fx-ico">🏆</span><span><b>Лидеры</b><small>топ по XP и монетам</small></span></button>' +
            '<button type="button" class="fx-tile" data-fx-view="search"><span class="fx-ico">🔎</span><span><b>Поиск</b><small>темы и люди</small></span></button>' +
            '<button type="button" class="fx-tile" data-fx-view="bookmarks"><span class="fx-ico">🔖</span><span><b>Закладки</b><small>сохранённые темы</small></span></button>' +
            '<button type="button" class="fx-tile" data-fx-view="stories"><span class="fx-ico">⚡</span><span><b>Истории</b><small>24 часа</small></span></button>' +
            '<button type="button" class="fx-tile" data-fx-view="terminal"><span class="fx-ico">▚</span><span><b>Терминал</b><small>команды fsociety</small></span></button>' +
            '<button type="button" class="fx-tile" data-fx-view="online"><span class="fx-ico">●</span><span><b>Онлайн</b><small><span id="fx-online-count">0</span> в сети</small></span></button>' +
            '<button type="button" class="fx-tile" data-fx-view="settings"><span class="fx-ico">⚙</span><span><b>Настройки</b><small>PWA и интерфейс</small></span></button>' +
          '</div>' +
          '<div class="fx-card" id="fx-online-card">' +
            '<div class="fx-row" style="cursor:default"><span class="fx-ava" style="background:rgba(74,222,128,.14);color:#4ade80">●</span><span class="fx-row-main"><b>Онлайн сейчас</b><small id="fx-online-mini">0 человек</small></span></div>' +
          '</div>' +
        '</div>' +

        '<div id="fx-view-shop" class="fx-view">' +
          '<div class="fx-head"><button type="button" class="fx-back" data-fx-back>←</button><h3>Магазин</h3><span class="fx-coins" id="fx-shop-coins"></span></div>' +
          '<div id="fx-shop-grid" class="fx-shop"></div>' +
        '</div>' +

        '<div id="fx-view-top" class="fx-view">' +
          '<div class="fx-head"><button type="button" class="fx-back" data-fx-back>←</button><h3>Лидеры</h3></div>' +
          '<div class="fx-tabs" id="fx-top-tabs"><button type="button" class="on" data-top="xp">XP</button><button type="button" data-top="coins">Монеты</button></div>' +
          '<div id="fx-lead-list" class="fx-list fx-lead"></div>' +
        '</div>' +

        '<div id="fx-view-bookmarks" class="fx-view">' +
          '<div class="fx-head"><button type="button" class="fx-back" data-fx-back>←</button><h3>Закладки</h3></div>' +
          '<div id="fx-bookmarks-list" class="fx-list"></div>' +
        '</div>' +

        '<div id="fx-view-search" class="fx-view">' +
          '<div class="fx-head"><button type="button" class="fx-back" data-fx-back>←</button><h3>Поиск</h3></div>' +
          '<input id="fx-search-in" class="fx-input" type="search" autocomplete="off" placeholder="Тема, ник или ID…">' +
          '<div id="fx-search-res" class="fx-list fx-res"></div>' +
        '</div>' +

        '<div id="fx-view-stories" class="fx-view">' +
          '<div class="fx-head"><button type="button" class="fx-back" data-fx-back>←</button><h3>Истории</h3><button type="button" class="fx-btn main" id="fx-story-add">+ Добавить</button></div>' +
          '<div id="fx-stories-list" class="fx-list"></div>' +
        '</div>' +

        '<div id="fx-view-terminal" class="fx-view">' +
          '<div class="fx-head"><button type="button" class="fx-back" data-fx-back>←</button><h3>Терминал</h3><button type="button" class="fx-btn" id="fx-term-clear">clear</button></div>' +
          '<pre id="fx-term-out" class="fx-term-out"></pre>' +
          '<div class="fx-term-line"><span>fsociety:~$</span><input id="fx-term-in" class="fx-input" type="text" autocomplete="off" spellcheck="false" placeholder="help"></div>' +
        '</div>' +

        '<div id="fx-view-online" class="fx-view">' +
          '<div class="fx-head"><button type="button" class="fx-back" data-fx-back>←</button><h3>Онлайн</h3><span class="fx-coins" id="fx-online-count2">0</span></div>' +
          '<div id="fx-online-list" class="fx-list"></div>' +
        '</div>' +

        '<div id="fx-view-settings" class="fx-view">' +
          '<div class="fx-head"><button type="button" class="fx-back" data-fx-back>←</button><h3>Настройки</h3></div>' +
          '<div class="fx-set"><div><b>Анимации</b><small>плавные переходы и эффекты</small></div><button type="button" class="fx-switch on" id="fx-set-anim" aria-label="Animations"></button></div>' +
          '<div class="fx-set"><div><b>Установить приложение</b><small>PWA на рабочий стол</small></div><button type="button" class="fx-btn" id="fx-set-install">Установить</button></div>' +
          '<div class="fx-set"><div><b>Кэш сайта</b><small>сбросить сохранённые файлы</small></div><button type="button" class="fx-btn" id="fx-set-cache">Сбросить</button></div>' +
          '<div class="fx-set"><div><b>Выйти из аккаунта</b><small>завершить сессию</small></div><button type="button" class="fx-btn" id="fx-set-out">Выйти</button></div>' +
          '<div class="fx-set"><div><b>Версия</b><small>fsociety PLUS</small></div><span class="fx-coins" id="fx-set-ver">' + VERSION + '</span></div>' +
        '</div>' +

      '</div></div>';
    document.body.appendChild(panel);

    var toast = mk("div", "fx-toast"); toast.id = "fxtoast"; document.body.appendChild(toast);

    var dot = mk("div", "fx-recdot"); dot.id = "fxrecdot"; dot.textContent = "● 0:00"; document.body.appendChild(dot);

    /* stories strip removed from home — stories live inside the PLUS panel */
    var oldStrip = q("fxstories"); if (oldStrip) oldStrip.remove();

    /* profile stats */
    var profileBox = document.querySelector("#profile .box");
    if (profileBox && !q("fxpstats")) {
      var ps = mk("div", ""); ps.id = "fxpstats"; ps.style.display = "none";
      var pava = q("pava");
      if (pava && pava.nextSibling) profileBox.insertBefore(ps, pava.nextSibling);
      else profileBox.insertBefore(ps, profileBox.firstChild);
    }

    /* typing line in chat */
    var chatBox = document.querySelector("#chat .box");
    if (chatBox && !q("fx_typing")) {
      var ty = mk("div", "fx-typing"); ty.id = "fx_typing";
      var sendrow = q("sendrow");
      if (sendrow) chatBox.insertBefore(ty, sendrow);
      else chatBox.appendChild(ty);
    }

    /* story viewer */
    if (!q("fxstoryview")) {
      var sv = document.createElement("div");
      sv.id = "fxstoryview";
      sv.innerHTML =
        '<div class="fx-sv-top"><div class="fx-ava" id="fx-sv-ava"><span>?</span></div><b id="fx-sv-nick"></b>' +
          '<button type="button" id="fx-sv-del" style="display:none" title="Удалить">🗑</button>' +
          '<button type="button" id="fx-sv-close" title="Закрыть">✕</button></div>' +
        '<div class="fx-sv-bars" id="fx-sv-bars"></div>' +
        '<div class="fx-sv-body"><img id="fx-sv-img" alt=""><div class="fx-sv-cap" id="fx-sv-cap"></div>' +
          '<div class="fx-sv-nav"><button type="button" id="fx-sv-prev" aria-label="Назад"></button><button type="button" id="fx-sv-next" aria-label="Вперёд"></button></div>' +
        '</div>';
      document.body.appendChild(sv);
    }

    /* hidden story file input */
    if (!q("fxstoryfile")) {
      var fi = document.createElement("input");
      fi.type = "file"; fi.accept = "image/*"; fi.id = "fxstoryfile"; fi.style.display = "none";
      document.body.appendChild(fi);
      fi.onchange = onStoryFile;
    }

    bindUI();
  }

  function bindUI() {
    var btn = q("fxbtn");
    if (btn) btn.onclick = function () { openPanel(); };

    var panel = q("fxpanel");
    if (!panel) return;
    panel.addEventListener("click", function (e) {
      var t = e.target;
      if (t === panel) { closePanel(); return; }
      var back = t.closest("[data-fx-back]");
      if (back) { showView("main"); return; }
      var tile = t.closest("[data-fx-view]");
      if (tile) { showView(tile.getAttribute("data-fx-view")); return; }
    });
    var close = q("fxclose");
    if (close) close.onclick = closePanel;

    var daily = q("fx-daily-btn");
    if (daily) daily.onclick = claimDaily;
    var pDaily = q("fxp-daily");
    if (pDaily) pDaily.onclick = claimDaily;

    var topTabs = q("fx-top-tabs");
    if (topTabs) topTabs.addEventListener("click", function (e) {
      var b = e.target.closest("[data-top]");
      if (!b) return;
      state.leadBy = b.getAttribute("data-top");
      Array.prototype.forEach.call(topTabs.children, function (x) { x.classList.toggle("on", x === b); });
      loadLeaderboard();
    });

    var si = q("fx-search-in");
    if (si) si.addEventListener("input", function () {
      clearTimeout(state.searchTimer);
      var v = si.value.trim();
      state.searchTimer = setTimeout(function () { runSearch(v); }, 320);
    });

    var termIn = q("fx-term-in");
    if (termIn) termIn.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var v = termIn.value.trim();
        termIn.value = "";
        if (v) { state.termHistory.push(v); state.termPos = state.termHistory.length; runCommand(v); }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (state.termPos > 0) { state.termPos--; termIn.value = state.termHistory[state.termPos] || ""; }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (state.termPos < state.termHistory.length - 1) { state.termPos++; termIn.value = state.termHistory[state.termPos] || ""; }
        else { state.termPos = state.termHistory.length; termIn.value = ""; }
      }
    });
    var tc = q("fx-term-clear");
    if (tc) tc.onclick = function () { clear(q("fx-term-out")); termPrint("fsociety terminal " + VERSION + " — введи help"); };

    var add = q("fx-story-add");
    if (add) add.onclick = function () {
      if (!gu()) { toastFx(L("Сначала войди.", "Sign in first.")); return; }
      var f = q("fxstoryfile"); if (f) f.click();
    };

    var anim = q("fx-set-anim");
    if (anim) {
      var on = localStorage.getItem("fx_anim") !== "0";
      anim.classList.toggle("on", on);
      document.body.classList.toggle("fx-noanim", !on);
      anim.onclick = function () {
        var now = !anim.classList.contains("on");
        anim.classList.toggle("on", now);
        document.body.classList.toggle("fx-noanim", !now);
        localStorage.setItem("fx_anim", now ? "1" : "0");
      };
    }
    var inst = q("fx-set-install");
    if (inst) inst.onclick = installPwa;
    var cache = q("fx-set-cache");
    if (cache) cache.onclick = clearCache;
    var out = q("fx-set-out");
    if (out) out.onclick = function () {
      var s = gsb();
      if (s) s.auth.signOut().then(function () { closePanel(); }).catch(function () { toastFx(L("Не получилось выйти.", "Could not sign out.")); });
    };
    updateInstallButton();

    var svClose = q("fx-sv-close");
    if (svClose) svClose.onclick = closeStoryViewer;
    var svPrev = q("fx-sv-prev");
    if (svPrev) svPrev.onclick = function () { storyStep(-1); };
    var svNext = q("fx-sv-next");
    if (svNext) svNext.onclick = function () { storyStep(1); };
    var svDel = q("fx-sv-del");
    if (svDel) svDel.onclick = deleteCurrentStory;

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (q("fxstoryview") && q("fxstoryview").classList.contains("show")) closeStoryViewer();
        else if (q("fxpanel") && q("fxpanel").classList.contains("show")) closePanel();
      }
    });
  }

  function openPanel() {
    injectUI();
    var p = q("fxpanel"); if (!p) return;
    p.classList.add("show");
    showView("main");
    loadStats();
    loadBookmarks();
    loadStories();
    loadOnline();
  }
  function closePanel() {
    var p = q("fxpanel"); if (p) p.classList.remove("show");
  }
  function showView(name) {
    var panel = q("fxpanel"); if (!panel) return;
    Array.prototype.forEach.call(panel.querySelectorAll(".fx-view"), function (v) {
      v.classList.toggle("on", v.id === "fx-view-" + name || (name === "main" && v.id === "fx-main"));
    });
    if (name === "shop") loadShop();
    else if (name === "top") loadLeaderboard();
    else if (name === "bookmarks") loadBookmarks(true);
    else if (name === "stories") loadStories(true);
    else if (name === "online") loadOnline(true);
    else if (name === "settings") updateInstallButton();
    else if (name === "terminal") setTimeout(function () { var i = q("fx-term-in"); if (i) i.focus(); }, 100);
  }

  /* ---------------- stats / daily ---------------- */
  async function loadStats() {
    var u = gu(), s = gsb();
    if (!u || !s) { renderGuest(); return; }
    try {
      var rows = await rpc("profile_stats", { p_id: u.id });
      var st = (rows || [])[0] || null;
      if (!st) { renderStatsFallback(); return; }
      state.stats = st;
      renderStats(st);
    } catch (e) {
      if (isMissing(e)) state.missing.stats = true;
      renderStatsFallback();
    }
  }

  function renderGuest() {
    var nick = q("fx-me-nick"); if (nick) { nick.textContent = L("Гость", "Guest"); nick.style.color = ""; }
    var lvl = q("fx-me-lvl"); if (lvl) lvl.textContent = "LVL —";
    var coins = q("fx-me-coins"); if (coins) coins.textContent = L("Войди в аккаунт", "Sign in");
    var bar = q("fx-me-bar"); if (bar) bar.style.width = "0%";
    var next = q("fx-me-next"); if (next) next.textContent = L("XP появится после входа", "XP appears after sign-in");
    var daily = q("fx-daily-btn"); if (daily) daily.disabled = true;
    fillAva(q("fx-me-ava"), null);
    var ps = q("fxpstats"); if (ps) { clear(ps); ps.style.display = "none"; }
    var strip = q("fxstories"); if (strip) strip.style.display = "none";
  }

  function renderStatsFallback() {
    var u = gu();
    var nick = q("fx-me-nick"); if (nick) nick.textContent = u ? u.nick : L("Гость", "Guest");
    var lvl = q("fx-me-lvl"); if (lvl) lvl.textContent = "LVL ?";
    var coins = q("fx-me-coins"); if (coins) coins.textContent = L("Статистика недоступна", "Stats unavailable");
    var bar = q("fx-me-bar"); if (bar) bar.style.width = "0%";
    var next = q("fx-me-next"); if (next) next.textContent = L("Примени update-plus.sql", "Apply update-plus.sql");
    var daily = q("fx-daily-btn"); if (daily) daily.disabled = true;
    fillAva(q("fx-me-ava"), u);
    var ps = q("fxpstats"); if (ps) ps.style.display = "none";
  }

  function fillAva(box, u) {
    if (!box) return;
    clear(box);
    if (u && u.avatar) {
      var im = document.createElement("img");
      im.src = u.avatar; im.alt = ""; box.appendChild(im);
    } else {
      var sp = mk("span", "", initial(u && u.nick));
      box.appendChild(sp);
    }
  }

  function renderStats(st) {
    var u = gu();
    if (!st) return;
    var nick = q("fx-me-nick");
    if (nick) {
      nick.textContent = st.nick || (u && u.nick) || "?";
      nick.style.color = st.name_color || "";
      nick.classList.toggle("fx-namecolor", !!st.name_color);
    }
    var lvl = q("fx-me-lvl"); if (lvl) lvl.textContent = "LVL " + st.level;
    var coins = q("fx-me-coins"); if (coins) coins.textContent = "🪙 " + nfmt(st.coins) + L(" монет", " coins");
    var from = xpForLevel(st.level), to = xpForLevel(st.level + 1);
    var pct = to > from ? Math.max(0, Math.min(100, ((st.xp - from) / (to - from)) * 100)) : 100;
    var bar = q("fx-me-bar"); if (bar) bar.style.width = pct.toFixed(1) + "%";
    var next = q("fx-me-next"); if (next) next.textContent = nfmt(st.xp) + " / " + nfmt(to) + " XP · " + L("место #", "rank #") + st.rank;
    var daily = q("fx-daily-btn");
    if (daily) {
      daily.disabled = false;
      daily.textContent = claimedToday(st) ? L("Бонус взят", "Claimed") : L("Бонус", "Bonus");
    }
    fillAva(q("fx-me-ava"), u);
    applyFrame(q("fx-me-ava"), st.avatar_frame);
    applyOwnCosmetics(st);
    renderProfileStats(st);
  }

  function renderProfileStats(st) {
    var ps = q("fxpstats");
    if (!ps) return;
    ps.style.display = "";
    ps.innerHTML =
      '<div class="fx-card"><div class="fx-me">' +
        '<div class="fx-ava" id="fxp-ava"><span>?</span></div>' +
        '<div class="fx-me-main">' +
          '<div class="fx-nick"><span id="fxp-nick"></span><span class="fx-lvl" id="fxp-lvl"></span></div>' +
          '<div class="fx-coins" id="fxp-coins"></div>' +
          '<div class="fx-bar"><i id="fxp-bar"></i></div>' +
          '<small id="fxp-next"></small>' +
        '</div>' +
        '<button type="button" class="fx-daily" id="fxp-daily">' + L("Бонус", "Bonus") + '</button>' +
      '</div></div>';
    var u = gu();
    fillAva(q("fxp-ava"), u);
    applyFrame(q("fxp-ava"), st.avatar_frame);
    var n = q("fxp-nick");
    if (n) { n.textContent = st.nick || (u && u.nick) || "?"; n.style.color = st.name_color || ""; n.classList.toggle("fx-namecolor", !!st.name_color); }
    var l = q("fxp-lvl"); if (l) l.textContent = "LVL " + st.level;
    var c = q("fxp-coins"); if (c) c.textContent = "🪙 " + nfmt(st.coins) + L(" монет", " coins");
    var from = xpForLevel(st.level), to = xpForLevel(st.level + 1);
    var pct = to > from ? Math.max(0, Math.min(100, ((st.xp - from) / (to - from)) * 100)) : 100;
    var b = q("fxp-bar"); if (b) b.style.width = pct.toFixed(1) + "%";
    var nx = q("fxp-next"); if (nx) nx.textContent = nfmt(st.xp) + " / " + nfmt(to) + " XP";
    var d = q("fxp-daily");
    if (d) {
      d.onclick = claimDaily;
      d.disabled = false;
      d.textContent = claimedToday(st) ? L("Бонус взят", "Claimed") : L("Бонус", "Bonus");
    }
  }

  async function claimDaily() {
    var u = gu();
    if (!u) { toastFx(L("Сначала войди.", "Sign in first.")); return; }
    try {
      var bonus = await rpc("daily_bonus");
      toastFx(L("Ежедневный бонус: +", "Daily bonus: +") + nfmt(bonus) + L(" монет", " coins"));
      await loadStats();
    } catch (e) {
      if (isMissing(e)) fail(e, "daily");
      else {
        var m = ((e && e.message) || "").toLowerCase();
        if (m.indexOf("already") > -1) toastFx(L("Бонус уже получен сегодня. Возвращайся завтра!", "Already claimed today. Come back tomorrow!"));
        else fail(e, "daily");
      }
    }
  }

  /* ---------------- shop ---------------- */
  async function loadShop() {
    var grid = q("fx-shop-grid");
    if (!gu()) { if (grid) { clear(grid); grid.appendChild(mk("div", "fx-empty", L("Войди, чтобы открыть магазин.", "Sign in to open the shop."))); } return; }
    if (grid && !state.shop.length) grid.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…")));
    try {
      state.shop = (await rpc("shop_list")) || [];
      renderShop();
    } catch (e) {
      if (grid) { clear(grid); grid.appendChild(mk("div", "fx-empty", isMissing(e) ? L("Магазин не активирован. Примени update-plus.sql.", "Shop is not enabled. Apply update-plus.sql.") : L("Не удалось загрузить магазин.", "Could not load the shop."))); }
      if (!isMissing(e)) fail(e, "shop");
    }
  }

  function renderShop() {
    var grid = q("fx-shop-grid"); if (!grid) return;
    clear(grid);
    var coins = q("fx-shop-coins");
    if (coins) coins.textContent = state.stats ? "🪙 " + nfmt(state.stats.coins) : "";
    if (!state.shop.length) { grid.appendChild(mk("div", "fx-empty", L("Пока пусто.", "Empty for now."))); return; }
    state.shop.forEach(function (it) {
      var card = mk("div", "fx-item" + (it.equipped ? " equipped" : it.owned ? " owned" : ""));
      var top = mk("div", "fx-item-top");
      if (it.slot === "name_color") {
        var sw = mk("span", "fx-swatch"); sw.style.background = it.value; top.appendChild(sw);
      } else if (it.slot === "avatar_frame") {
        var fr = mk("div", "fx-frame-preview " + (it.value || ""), "A"); top.appendChild(fr);
      } else {
        top.appendChild(mk("span", "fx-ico", "★"));
      }
      var b = mk("b", "", it.title); top.appendChild(b);
      card.appendChild(top);
      card.appendChild(mk("div", "fx-price", "🪙 " + nfmt(it.cost)));
      card.appendChild(mk("small", "", L("с ", "from ") + "LVL " + it.min_level + (it.equipped ? L(" · надето", " · equipped") : it.owned ? L(" · куплено", " · owned") : "")));
      var acts = mk("div", "fx-actions");
      if (it.equipped) {
        var off = mk("button", "fx-btn", L("Снять", "Remove"));
        off.type = "button";
        off.onclick = function () { equipItem(it, null); };
        acts.appendChild(off);
      } else if (it.owned) {
        var eq = mk("button", "fx-btn main", L("Надеть", "Equip"));
        eq.type = "button";
        eq.onclick = function () { equipItem(it, it.id); };
        acts.appendChild(eq);
      } else {
        var buy = mk("button", "fx-btn main", L("Купить", "Buy"));
        buy.type = "button";
        buy.onclick = function () { buyItem(it); };
        acts.appendChild(buy);
      }
      card.appendChild(acts);
      grid.appendChild(card);
    });
  }

  async function buyItem(it) {
    if (!gu()) { toastFx(L("Сначала войди.", "Sign in first.")); return; }
    try {
      await rpc("shop_buy", { p_id: it.id });
      toastFx(L("Куплено: ", "Bought: ") + it.title);
      await loadStats();
      await loadShop();
    } catch (e) {
      var m = ((e && e.message) || "").toLowerCase();
      if (m.indexOf("coins") > -1) toastFx(L("Не хватает монет.", "Not enough coins."));
      else if (m.indexOf("level") > -1) toastFx(L("Слишком низкий уровень.", "Level too low."));
      else if (m.indexOf("owned") > -1) toastFx(L("Уже куплено.", "Already owned."));
      else fail(e, "shop");
    }
  }

  async function equipItem(it, id) {
    try {
      await rpc("shop_equip", { p_slot: it.slot, p_id: id });
      toastFx(id ? L("Надето: ", "Equipped: ") + it.title : L("Снято.", "Removed."));
      await loadStats();
      await loadShop();
    } catch (e) { fail(e, "shop"); }
  }

  /* ---------------- leaderboard ---------------- */
  async function loadLeaderboard() {
    var list = q("fx-lead-list"); if (!list) return;
    if (!gu()) { clear(list); list.appendChild(mk("div", "fx-empty", L("Войди, чтобы увидеть топ.", "Sign in to see the leaderboard."))); return; }
    clear(list); list.appendChild(mk("div", "fx-empty", L("Загрузка…", "Loading…")));
    try {
      var rows = (await rpc("leaderboard", { p_by: state.leadBy })) || [];
      clear(list);
      if (!rows.length) { list.appendChild(mk("div", "fx-empty", L("Пока никого.", "Nobody yet."))); return; }
      rows.forEach(function (r, i) {
        var row = mk("button", "fx-row"); row.type = "button";
        row.appendChild(mk("span", "fx-rank", "#" + (i + 1)));
        var av = mk("span", "fx-ava"); av.textContent = initial(r.nick); row.appendChild(av);
        var main = mk("span", "fx-row-main");
        var b = mk("b");
        b.appendChild(document.createTextNode(r.nick || "?"));
        if (r.title) b.appendChild(mk("span", "fx-title", r.title));
        main.appendChild(b);
        main.appendChild(mk("small", "", "LVL " + r.level + " · " + nfmt(state.leadBy === "coins" ? r.coins : r.xp) + (state.leadBy === "coins" ? L(" монет", " coins") : " XP")));
        row.appendChild(main);
        row.onclick = function () { closePanel(); if (typeof openProfile === "function") openProfile(r.id); };
        list.appendChild(row);
      });
    } catch (e) {
      clear(list);
      list.appendChild(mk("div", "fx-empty", isMissing(e) ? L("Лидерборд не активирован. Примени update-plus.sql.", "Leaderboard is not enabled. Apply update-plus.sql.") : L("Не удалось загрузить топ.", "Could not load leaderboard.")));
      if (!isMissing(e)) fail(e, "leaderboard");
    }
  }

  /* ---------------- bookmarks ---------------- */
  async function loadBookmarks(forceRender) {
    if (!gu()) { state.bookmarks = new Set(); renderBookmarks(); return; }
    try {
      var rows = (await rpc("bookmarks_list")) || [];
      state.bookmarks = new Set(rows.map(function (r) { return String(r.thread_id); }));
      state.bookmarkRows = rows;
      renderBookmarks(rows);
      updateBookmarkBtn();
    } catch (e) {
      state.bookmarkRows = [];
      if (isMissing(e)) state.missing.bookmarks = true;
      renderBookmarks([]);
    }
  }
  function renderBookmarks(rows) {
    var list = q("fx-bookmarks-list"); if (!list) return;
    clear(list);
    if (!gu()) { list.appendChild(mk("div", "fx-empty", L("Войди, чтобы видеть закладки.", "Sign in to see bookmarks."))); return; }
    rows = rows || state.bookmarkRows || [];
    if (!rows.length) {
      list.appendChild(mk("div", "fx-empty", state.missing.bookmarks ? L("Закладки не активированы. Примени update-plus.sql.", "Bookmarks are not enabled. Apply update-plus.sql.") : L("Пока нет закладок. Открой тему и нажми ☆.", "No bookmarks yet. Open a thread and press ☆.")));
      return;
    }
    rows.forEach(function (r) {
      var row = mk("button", "fx-row"); row.type = "button";
      var av = mk("span", "fx-ava"); av.textContent = initial(r.nick); row.appendChild(av);
      var main = mk("span", "fx-row-main");
      main.appendChild(mk("b", "", r.title));
      main.appendChild(mk("small", "", (r.nick || "?") + " · " + dateShort(r.created_at)));
      row.appendChild(main);
      row.onclick = function () { closePanel(); if (typeof openThread === "function") openThread(Number(r.thread_id)); };
      list.appendChild(row);
    });
  }
  async function toggleBookmark() {
    var id = null;
    try { id = forumThreadId; } catch (e) {}
    if (!id) return;
    if (!gu()) { toastFx(L("Сначала войди.", "Sign in first.")); return; }
    try {
      var added = await rpc("bookmark_toggle", { p_thread: Number(id) });
      if (added) state.bookmarks.add(String(id)); else state.bookmarks.delete(String(id));
      updateBookmarkBtn();
      toastFx(added ? L("Добавлено в закладки.", "Bookmarked.") : L("Убрано из закладок.", "Bookmark removed."));
      loadBookmarks();
    } catch (e) { fail(e, "bookmarks"); }
  }
  function updateBookmarkBtn() {
    var b = q("fxbookmark");
    if (!b) return;
    var id = null;
    try { id = forumThreadId; } catch (e) {}
    var on = id && state.bookmarks.has(String(id));
    b.textContent = on ? "★" : "☆";
    b.title = on ? L("Убрать из закладок", "Remove bookmark") : L("В закладки", "Bookmark");
    b.classList.toggle("on", !!on);
  }

  /* ---------------- search ---------------- */
  async function runSearch(v) {
    var box = q("fx-search-res"); if (!box) return;
    if (!gu()) { clear(box); box.appendChild(mk("div", "fx-empty", L("Войди, чтобы искать.", "Sign in to search."))); return; }
    if (v.length < 2) { clear(box); box.appendChild(mk("div", "fx-empty", L("Введи минимум 2 символа.", "Type at least 2 characters."))); return; }
    clear(box); box.appendChild(mk("div", "fx-empty", L("Ищу…", "Searching…")));
    try {
      var rows = (await rpc("search_all", { p_q: v })) || [];
      clear(box);
      if (!rows.length) { box.appendChild(mk("div", "fx-empty", L("Ничего не найдено.", "Nothing found."))); return; }
      rows.forEach(function (r) {
        var row = mk("button", "fx-row"); row.type = "button";
        var av = mk("span", "fx-ava", r.kind === "user" ? initial(r.title) : (r.kind === "thread" ? "§" : "?"));
        row.appendChild(av);
        var main = mk("span", "fx-row-main");
        var b = mk("b"); markText(b, r.title || "?", v); main.appendChild(b);
        var small = mk("small");
        markText(small, (r.subtitle || "") + (r.extra ? " · " + r.extra : ""), v);
        main.appendChild(small);
        row.appendChild(main);
        row.onclick = function () {
          closePanel();
          if (r.kind === "thread" && typeof openThread === "function") openThread(Number(r.id));
          else if (r.kind === "user" && typeof openProfile === "function") openProfile(r.id);
        };
        box.appendChild(row);
      });
    } catch (e) {
      clear(box);
      box.appendChild(mk("div", "fx-empty", isMissing(e) ? L("Поиск не активирован. Примени update-plus.sql.", "Search is not enabled. Apply update-plus.sql.") : L("Ошибка поиска.", "Search failed.")));
      if (!isMissing(e)) fail(e, "search");
    }
  }
  function markText(el, text, qq) {
    text = String(text || "");
    var low = text.toLowerCase(), needle = String(qq || "").toLowerCase();
    var at = needle ? low.indexOf(needle) : -1;
    if (at < 0) { el.textContent = text; return; }
    el.appendChild(document.createTextNode(text.slice(0, at)));
    el.appendChild(mk("mark", "", text.slice(at, at + needle.length)));
    el.appendChild(document.createTextNode(text.slice(at + needle.length)));
  }

  /* ---------------- stories ---------------- */
  async function loadStories(forceRender) {
    var strip = q("fxstories");
    if (!gu()) {
      state.stories = [];
      if (strip) strip.style.display = "none";
      renderStoriesList();
      return;
    }
    try {
      state.stories = (await rpc("stories_list")) || [];
      if (strip) strip.style.display = "";
      renderStoryStrip();
      renderStoriesList();
    } catch (e) {
      state.stories = [];
      if (strip) {
        strip.style.display = "";
        clear(strip);
        var b = mk("button", "fx-story add"); b.type = "button";
        b.innerHTML = '<span class="fx-ring"><span>+</span></span><b>' + L("История", "Story") + '</b>';
        b.onclick = function () { if (isMissing(e)) fail(e, "stories"); else { var f = q("fxstoryfile"); if (f) f.click(); } };
        strip.appendChild(b);
      }
      if (isMissing(e)) state.missing.stories = true;
      renderStoriesList();
    }
  }

  function renderStoryStrip() {
    var strip = q("fxstories"); if (!strip) return;
    clear(strip);
    if (!gu()) { strip.style.display = "none"; return; }
    strip.style.display = "";

    var add = mk("button", "fx-story add"); add.type = "button";
    add.innerHTML = '<span class="fx-ring"><span>+</span></span><b>' + L("Добавить", "Add") + '</b>';
    add.onclick = function () { var f = q("fxstoryfile"); if (f) f.click(); };
    strip.appendChild(add);

    var map = new Map();
    state.stories.forEach(function (s) {
      var k = String(s.user_id);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    });
    map.forEach(function (items, userKey) {
      var first = items[0];
      var seen = items.every(function (x) { return x.seen; });
      var b = mk("button", "fx-story" + (seen ? " seen" : "")); b.type = "button";
      var ring = mk("span", "fx-ring");
      var inner = mk("span");
      if (first.avatar) {
        var im = document.createElement("img"); im.src = first.avatar; im.alt = ""; inner.appendChild(im);
      } else inner.textContent = initial(first.nick);
      ring.appendChild(inner); b.appendChild(ring);
      b.appendChild(mk("b", "", userKey === uid() ? L("Ты", "You") : (first.nick || "?")));
      b.onclick = function () {
        var idx = 0;
        for (var i = 0; i < items.length; i++) { if (!items[i].seen) { idx = i; break; } }
        openStoryViewer(items, idx);
      };
      strip.appendChild(b);
    });
  }

  function renderStoriesList() {
    var list = q("fx-stories-list"); if (!list) return;
    clear(list);
    if (!gu()) { list.appendChild(mk("div", "fx-empty", L("Войди, чтобы смотреть истории.", "Sign in to view stories."))); return; }
    if (!state.stories.length) {
      list.appendChild(mk("div", "fx-empty", state.missing.stories ? L("Истории не активированы. Примени update-plus.sql.", "Stories are not enabled. Apply update-plus.sql.") : L("Пока нет историй. Добавь первую!", "No stories yet. Add the first one!")));
      return;
    }
    state.stories.slice().reverse().forEach(function (s) {
      var row = mk("button", "fx-row"); row.type = "button";
      var av = mk("span", "fx-ava", initial(s.nick)); row.appendChild(av);
      var main = mk("span", "fx-row-main");
      main.appendChild(mk("b", "", (s.nick || "?") + (s.seen ? " · " + L("просмотрено", "seen") : "")));
      main.appendChild(mk("small", "", (s.caption || L("История", "Story")) + " · " + timeShort(s.created_at) + " · 👁 " + nfmt(s.views)));
      row.appendChild(main);
      row.onclick = function () {
        var items = state.stories.filter(function (x) { return String(x.user_id) === String(s.user_id); });
        var idx = Math.max(0, items.findIndex(function (x) { return String(x.id) === String(s.id); }));
        openStoryViewer(items, idx);
      };
      list.appendChild(row);
    });
  }

  async function onStoryFile(e) {
    var f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f || !gu() || !gsb()) return;
    var u = gu();
    toastFx(L("Загружаю историю…", "Uploading story…"));
    try {
      var blob = f, type = f.type || "image/jpeg", name = "story.jpg";
      if (type.indexOf("image/") === 0 && typeof shrinkImage === "function") {
        try { blob = await shrinkImage(f, 1400, 0.8); type = "image/jpeg"; } catch (err) { blob = f; }
      }
      var path = u.id + "/story-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
      if (blob.size > (typeof TUS_MIN !== "undefined" ? TUS_MIN : 20 * 1024 * 1024) && typeof uploadBig === "function") {
        await uploadBig(blob, name, path, type, function () {}, "media");
      } else {
        var up = await gsb().storage.from("media").upload(path, blob, { contentType: type, cacheControl: "31536000" });
        if (up.error) throw up.error;
      }
      var caption = "";
      try { caption = window.prompt(L("Подпись к истории (можно пропустить):", "Story caption (optional):"), "") || ""; } catch (err) {}
      await rpc("story_add", { p_path: path, p_caption: caption || null });
      toastFx(L("История опубликована на 24 часа.", "Story published for 24 hours."));
      await loadStories(true);
    } catch (err) { fail(err, "stories"); }
  }

  function openStoryViewer(items, index) {
    if (!items || !items.length) return;
    state.storyView = { items: items, index: Math.max(0, Math.min(index || 0, items.length - 1)), timer: null };
    var v = q("fxstoryview"); if (!v) return;
    v.classList.add("show");
    showStoryAt(state.storyView.index);
  }
  function showStoryAt(i) {
    var sv = state.storyView; if (!sv) return;
    if (i < 0) { closeStoryViewer(); return; }
    if (i >= sv.items.length) { closeStoryViewer(); return; }
    sv.index = i;
    var s = sv.items[i];
    var img = q("fx-sv-img");
    if (img) img.src = typeof mediaUrl === "function" ? mediaUrl(s.path, "media") : "";
    var cap = q("fx-sv-cap"); if (cap) cap.textContent = s.caption || "";
    var nick = q("fx-sv-nick"); if (nick) nick.textContent = (s.nick || "?") + " · " + timeShort(s.created_at);
    fillAva(q("fx-sv-ava"), { nick: s.nick, avatar: s.avatar });
    var bars = q("fx-sv-bars"); if (bars) {
      clear(bars);
      sv.items.forEach(function (_, k) {
        var b = document.createElement("i");
        if (k < i) b.className = "done";
        else if (k === i) { b.className = "now"; var inner = document.createElement("b"); b.appendChild(inner); }
        bars.appendChild(b);
      });
    }
    var del = q("fx-sv-del");
    if (del) del.style.display = (s.user_id && String(s.user_id) === uid()) ? "" : "none";
    if (s.user_id) {
      rpc("story_view", { p_id: Number(s.id) }).then(function () {
        s.seen = true;
        var bars2 = q("fx-sv-bars");
        if (bars2 && bars2.children[i]) bars2.children[i].classList.add("done");
      }).catch(function () {});
    }
    clearTimeout(sv.timer);
    sv.timer = setTimeout(function () { storyStep(1); }, 15000);
  }
  function storyStep(d) {
    var sv = state.storyView; if (!sv) return;
    showStoryAt(sv.index + d);
  }
  function closeStoryViewer() {
    var v = q("fxstoryview"); if (v) v.classList.remove("show");
    if (state.storyView) { clearTimeout(state.storyView.timer); state.storyView = null; }
    loadStories();
  }
  async function deleteCurrentStory() {
    var sv = state.storyView; if (!sv) return;
    var s = sv.items[sv.index]; if (!s) return;
    try {
      await rpc("story_delete", { p_id: Number(s.id) });
      toastFx(L("История удалена.", "Story deleted."));
      sv.items.splice(sv.index, 1);
      if (!sv.items.length) closeStoryViewer();
      else showStoryAt(Math.min(sv.index, sv.items.length - 1));
    } catch (e) { fail(e, "stories"); }
  }

  /* ---------------- reactions ---------------- */
  var REACT_BOXES = [
    { id: "msgs", kind: "chat", sel: ".msg[data-id]" },
    { id: "dmmsgs", kind: "dm", sel: ".msg[data-id]" },
    { id: "groupmsgs", kind: "group", sel: ".msg[data-id]" },
    { id: "srvmsgs", kind: "server", sel: ".msg[data-id]" },
    { id: "th_replies", kind: "reply", sel: ".tr[data-id]" }
  ];

  function observeReactions() {
    REACT_BOXES.forEach(function (c) {
      var box = q(c.id); if (!box) return;
      if (!box._fxObs) {
        box._fxObs = new MutationObserver(function () { scheduleDecorate(c); });
        box._fxObs.observe(box, { childList: true, subtree: true });
      }
      scheduleDecorate(c);
    });
  }
  function scheduleDecorate(c) {
    clearTimeout(c._fxT);
    c._fxT = setTimeout(function () { decorateBox(c); }, 80);
  }
  function decorateBox(c) {
    var box = q(c.id); if (!box || !gu() || state.reactionsMissing) return;
    Array.prototype.forEach.call(box.querySelectorAll(c.sel), function (node) {
      var id = node.getAttribute("data-id");
      if (!id || id.indexOf("tmp") === 0) return;
      if (node.querySelector(":scope > .fx-react")) return;
      if (node.querySelector(".del")) return;
      var bar = mk("div", "fx-react");
      bar.setAttribute("data-fx-react-kind", c.kind);
      bar.setAttribute("data-fx-react-id", String(id));
      var counts = mk("span", "fx-counts"); bar.appendChild(counts);
      var plus = mk("button", "fx-plus", "＋"); plus.type = "button"; plus.title = L("Реакция", "React");
      plus.onclick = function () { openReactionPicker(bar, c.kind, String(id)); };
      bar.appendChild(plus);
      node.appendChild(bar);
      queueReaction(c.kind, String(id));
    });
  }
  function openReactionPicker(bar, kind, id) {
    if (!gu()) { toastFx(L("Сначала войди.", "Sign in first.")); return; }
    var old = bar.querySelector(".fx-picker");
    if (old) { old.remove(); return; }
    var pick = mk("span", "fx-picker");
    EMOJIS.forEach(function (e) {
      var b = mk("button", "", e); b.type = "button";
      b.onclick = function () { pick.remove(); toggleReaction(kind, id, e); };
      pick.appendChild(b);
    });
    bar.appendChild(pick);
  }
  function queueReaction(kind, id) {
    if (!state.reactQueue[kind]) state.reactQueue[kind] = new Set();
    state.reactQueue[kind].add(String(id));
    clearTimeout(state.reactTimer);
    state.reactTimer = setTimeout(flushReactions, 140);
  }
  async function flushReactions() {
    if (!gu() || state.reactionsMissing) return;
    var jobs = state.reactQueue; state.reactQueue = {};
    var keys = Object.keys(jobs);
    for (var i = 0; i < keys.length; i++) {
      var kind = keys[i], ids = Array.from(jobs[kind]);
      if (!ids.length) continue;
      try {
        var rows = (await rpc("reactions_get", { p_kind: kind, p_ids: ids })) || [];
        var byId = {};
        rows.forEach(function (r) {
          var k = String(r.message_id);
          if (!byId[k]) byId[k] = [];
          byId[k].push(r);
        });
        ids.forEach(function (id) {
          state.reactCache.set(kind + ":" + id, byId[id] || []);
          var bars = document.querySelectorAll('.fx-react[data-fx-react-kind="' + kind + '"][data-fx-react-id="' + id + '"]');
          Array.prototype.forEach.call(bars, function (bar) { renderReactionBar(bar, byId[id] || [], kind, id); });
        });
      } catch (e) {
        if (isMissing(e)) {
          state.reactionsMissing = true;
          Array.prototype.forEach.call(document.querySelectorAll(".fx-react[data-fx-react-kind]"), function (b) { b.remove(); });
          toastFx(L("Реакции не активированы. Примени update-plus.sql.", "Reactions are not enabled. Apply update-plus.sql."));
        }
      }
    }
  }
  function renderReactionBar(bar, rows, kind, id) {
    var counts = bar.querySelector(".fx-counts");
    if (!counts) { counts = mk("span", "fx-counts"); bar.insertBefore(counts, bar.firstChild); }
    clear(counts);
    rows.forEach(function (r) {
      var b = mk("button", r.mine ? "mine" : "", r.emoji + " " + r.cnt);
      b.type = "button";
      b.onclick = function () { toggleReaction(kind, id, r.emoji); };
      counts.appendChild(b);
    });
  }
  async function toggleReaction(kind, id, emoji) {
    if (!gu()) { toastFx(L("Сначала войди.", "Sign in first.")); return; }
    try {
      await rpc("react_toggle", { p_kind: kind, p_id: Number(id), p_emoji: emoji });
      var rows = (await rpc("reactions_get", { p_kind: kind, p_ids: [Number(id)] })) || [];
      state.reactCache.set(kind + ":" + id, rows);
      var bars = document.querySelectorAll('.fx-react[data-fx-react-kind="' + kind + '"][data-fx-react-id="' + id + '"]');
      Array.prototype.forEach.call(bars, function (bar) { renderReactionBar(bar, rows, kind, id); });
    } catch (e) { fail(e, "reactions"); }
  }

  function setupThread() {
    var id = null;
    try { id = forumThreadId; } catch (e) {}
    if (!id) { var old = q("fx_thread_react"); if (old) old.remove(); return; }
    var body = q("th_body"); if (!body) return;
    var bar = q("fx_thread_react");
    if (!bar) {
      bar = mk("div", "fx-react"); bar.id = "fx_thread_react";
      body.insertAdjacentElement("afterend", bar);
      var counts = mk("span", "fx-counts"); bar.appendChild(counts);
      var plus = mk("button", "fx-plus", "＋"); plus.type = "button"; plus.title = L("Реакция", "React");
      plus.onclick = function () { openReactionPicker(bar, "thread", String(id)); };
      bar.appendChild(plus);
    }
    bar.setAttribute("data-fx-react-kind", "thread");
    bar.setAttribute("data-fx-react-id", String(id));
    var threadPlus = bar.querySelector(".fx-plus");
    if (threadPlus) threadPlus.onclick = function () { openReactionPicker(bar, "thread", String(id)); };
    if (gu()) queueReaction("thread", String(id));

    var head = q("th_head");
    if (head && !q("fxbookmark")) {
      var b = mk("button", "rdel"); b.type = "button"; b.id = "fxbookmark";
      b.onclick = toggleBookmark;
      head.appendChild(b);
      updateBookmarkBtn();
    }
  }

  /* ---------------- titles / name colors / frames ---------------- */
  function applyTitle(el, id) {
    if (!el) return;
    var old = el.querySelector(".fx-title");
    if (old) old.remove();
    el.classList.remove("fx-namecolor");
    el.style.color = "";
    var t = state.titles.get(String(id));
    if (!t) return;
    if (t.name_color) { el.style.color = t.name_color; el.classList.add("fx-namecolor"); }
    if (t.title) el.appendChild(mk("span", "fx-title", t.title));
  }
  function applyAllTitles() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-fx-uid]"), function (el) {
      applyTitle(el, el.getAttribute("data-fx-uid"));
    });
  }
  function queueTitle(id) {
    if (!id) return;
    state.titleQueue.add(String(id));
    clearTimeout(state.titleTimer);
    state.titleTimer = setTimeout(flushTitles, 180);
  }
  async function flushTitles() {
    var ids = Array.from(state.titleQueue); state.titleQueue.clear();
    if (!ids.length || !gu() || !gsb() || state.missing.titles) return;
    try {
      var rows = (await rpc("titles_get", { p_ids: ids })) || [];
      rows.forEach(function (r) { state.titles.set(String(r.id), r); });
      applyAllTitles();
      var un = q("u_nick"), ua = q("u_ava");
      if (un && ua) {
        var t = state.titles.get(String(un.getAttribute("data-fx-uid")));
        applyFrame(ua, t && t.avatar_frame);
      }
      if (state.stats) applyOwnCosmetics(state.stats);
    } catch (e) { if (isMissing(e)) state.missing.titles = true; }
  }
  function applyFrame(el, frame) {
    if (!el) return;
    el.classList.remove("fx-frame-green", "fx-frame-gold", "fx-frame-red");
    if (frame) el.classList.add("fx-frame-" + frame);
  }
  function applyOwnCosmetics(st) {
    var u = gu(); if (!u || !st) return;
    state.titles.set(String(u.id), { id: u.id, title: st.title, name_color: st.name_color, avatar_frame: st.avatar_frame });
    applyAllTitles();
    applyFrame(q("pava"), st.avatar_frame);
    applyFrame(q("me"), st.avatar_frame);
    applyFrame(q("fx-me-ava"), st.avatar_frame);
    applyFrame(q("fxp-ava"), st.avatar_frame);
    var pn = q("pnick");
    if (pn) {
      pn.setAttribute("data-fx-uid", String(u.id));
      applyTitle(pn, String(u.id));
    }
  }

  function wrapNames() {
    if (typeof window.richName === "function" && !window.__fxRichWrapped) {
      var orig = window.richName;
      window.richName = function (el, id, nick) {
        var out = orig.apply(this, arguments);
        if (el && id) {
          el.setAttribute("data-fx-uid", String(id));
          applyTitle(el, String(id));
          queueTitle(id);
        }
        return out;
      };
      window.__fxRichWrapped = true;
    }
    if (typeof window.renderThread === "function" && !window.__fxThreadWrapped) {
      var origThread = window.renderThread;
      window.renderThread = function () {
        var out = origThread.apply(this, arguments);
        setTimeout(setupThread, 0);
        return out;
      };
      window.__fxThreadWrapped = true;
    }
    if (typeof window.renderUser === "function" && !window.__fxUserWrapped) {
      var origUser = window.renderUser;
      window.renderUser = function () {
        var out = origUser.apply(this, arguments);
        if (state.stats) applyOwnCosmetics(state.stats);
        return out;
      };
      window.__fxUserWrapped = true;
    }
    if (typeof window.openProfile === "function" && !window.__fxProfileWrapped) {
      var origOpen = window.openProfile;
      window.openProfile = function (id) {
        var p = origOpen.apply(this, arguments);
        if (id) {
          queueTitle(id);
          var applyProfile = function () {
            var n = q("u_nick");
            if (n) { n.setAttribute("data-fx-uid", String(id)); applyTitle(n, String(id)); }
            var t = state.titles.get(String(id));
            applyFrame(q("u_ava"), t && t.avatar_frame);
          };
          if (p && typeof p.then === "function") p.then(applyProfile).catch(function () {});
          else setTimeout(applyProfile, 250);
        }
        return p;
      };
      window.__fxProfileWrapped = true;
    }
  }

  /* ---------------- presence / typing ---------------- */
  async function startPresence() {
    var s = gsb(), u = gu();
    if (!s || !u || state.channel) return;
    try {
      var ch = s.channel("fx:presence", { config: { presence: { key: String(u.id) } } });
      state.channel = ch;
      ch.on("presence", { event: "sync" }, function () {
        state.online.clear();
        var ps = ch.presenceState();
        Object.keys(ps || {}).forEach(function (k) {
          (ps[k] || []).forEach(function (p) {
            state.online.set(String(p.id || k), p);
          });
        });
        renderOnline();
      });
      ch.on("broadcast", { event: "typing" }, function (msg) {
        var p = msg && msg.payload; if (!p || !p.id) return;
        var me = uid(); if (me && String(p.id) === me) return;
        var room = null;
        try { room = chatRoom; } catch (e) {}
        if (p.room && room && String(p.room) !== String(room)) return;
        state.typing.set(String(p.id), { nick: p.nick || "?", at: Date.now() });
        renderTyping();
      });
      ch.subscribe(function (status) {
        if (status === "SUBSCRIBED") {
          try { ch.track({ id: u.id, nick: u.nick, avatar: u.avatar || null, at: Date.now() }); } catch (e) {}
        }
      });
    } catch (e) { state.channel = null; }
  }
  function stopPresence() {
    var s = gsb();
    if (state.channel) {
      try { state.channel.unsubscribe(); } catch (e) {}
      try { if (s) s.removeChannel(state.channel); } catch (e) {}
      state.channel = null;
    }
    state.online.clear(); state.typing.clear();
    renderOnline(); renderTyping();
  }
  function loadOnline(force) {
    if (gu() && !state.channel) startPresence();
    renderOnline();
  }
  function renderOnline() {
    var n = state.online.size;
    var c1 = q("fx-online-count"); if (c1) c1.textContent = n;
    var c2 = q("fx-online-count2"); if (c2) c2.textContent = n;
    var mini = q("fx-online-mini"); if (mini) mini.textContent = n + L(" человек", " people");
    var list = q("fx-online-list");
    if (list) {
      clear(list);
      if (!n) list.appendChild(mk("div", "fx-empty", L("Пока никого. Зайди с другого устройства или подожди.", "Nobody online yet.")));
      state.online.forEach(function (p) {
        var row = mk("button", "fx-row"); row.type = "button";
        var av = mk("span", "fx-ava", initial(p.nick)); row.appendChild(av);
        var main = mk("span", "fx-row-main");
        main.appendChild(mk("b", "", p.nick || "?"));
        main.appendChild(mk("small", "", L("в сети", "online")));
        row.appendChild(main);
        row.onclick = function () { closePanel(); if (p.id && typeof openProfile === "function") openProfile(p.id); };
        list.appendChild(row);
      });
    }
    var btn = q("fxbtn");
    if (btn) btn.classList.toggle("has", n > 0);
  }
  function renderTyping() {
    var box = q("fx_typing"); if (!box) return;
    var now = Date.now(), names = [];
    state.typing.forEach(function (v, k) {
      if (now - v.at > 4500) state.typing.delete(k);
      else names.push(v.nick);
    });
    if (!names.length) { box.textContent = ""; box.classList.remove("show"); return; }
    box.textContent = names.slice(0, 3).join(", ") + (names.length > 3 ? " +" + (names.length - 3) : "") + L(" печатает…", " typing…");
    box.classList.add("show");
  }
  var lastTyping = 0;
  function bindTyping() {
    var inp = q("msgin");
    if (!inp || inp._fxTyping) return;
    inp._fxTyping = true;
    inp.addEventListener("input", function () {
      var u = gu(); if (!u || !state.channel) return;
      var now = Date.now(); if (now - lastTyping < 1600) return;
      lastTyping = now;
      var room = null;
      try { room = chatRoom; } catch (e) {}
      try { state.channel.send({ type: "broadcast", event: "typing", payload: { id: u.id, nick: u.nick, room: room } }); } catch (e) {}
    });
  }

  /* ---------------- chat voice ---------------- */
  function injectMic() {
    var row = q("sendrow");
    if (!row || q("fxmic")) return;
    var b = document.createElement("button");
    b.id = "fxmic"; b.type = "button"; b.className = "btn glass sm fx-mic";
    b.title = L("Голосовое сообщение", "Voice message");
    b.setAttribute("aria-label", "Voice");
    b.innerHTML = '<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
    b.onclick = toggleRecord;
    var send = q("msgsend");
    if (send) row.insertBefore(b, send); else row.appendChild(b);
  }
  async function toggleRecord() {
    if (state.rec) {
      if (state.rec.media && state.rec.media.state === "recording") stopRecord();
      return;
    }
    if (!gu()) { toastFx(L("Сначала войди.", "Sign in first.")); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      toastFx(L("Браузер не поддерживает запись голоса.", "This browser cannot record audio.")); return;
    }
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      var mime = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mime = "audio/webm;codecs=opus";
      else if (MediaRecorder.isTypeSupported("audio/webm")) mime = "audio/webm";
      var mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      state.rec = { media: mr, chunks: [], stream: stream, start: Date.now(), timer: null, mime: mime || "audio/webm" };
      mr.ondataavailable = function (e) { if (e.data && e.data.size) state.rec.chunks.push(e.data); };
      mr.onstop = finishRecord;
      mr.start();
      var mic = q("fxmic"); if (mic) mic.classList.add("rec");
      var dot = q("fxrecdot"); if (dot) { dot.classList.add("show"); dot.textContent = "● 0:00"; }
      state.rec.timer = setInterval(function () {
        if (!state.rec) return;
        var sec = Math.floor((Date.now() - state.rec.start) / 1000);
        var d = q("fxrecdot"); if (d) d.textContent = "● " + Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
      }, 250);
      setTimeout(function () { if (state.rec && state.rec.media && state.rec.media.state === "recording") stopRecord(); }, 120000);
    } catch (e) {
      toastFx(L("Нет доступа к микрофону.", "Microphone access denied."));
      state.rec = null;
    }
  }
  function stopRecord() {
    if (!state.rec || !state.rec.media) return;
    try { state.rec.media.stop(); } catch (e) {}
    if (state.rec.stream) { try { state.rec.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} }
    clearInterval(state.rec.timer);
    var mic = q("fxmic"); if (mic) mic.classList.remove("rec");
    var dot = q("fxrecdot"); if (dot) dot.classList.remove("show");
  }
  async function finishRecord() {
    var rec = state.rec;
    if (!rec) return;
    state.rec = null;
    var blob = new Blob(rec.chunks, { type: rec.mime || "audio/webm" });
    if (blob.size < 900) { toastFx(L("Слишком короткая запись.", "Recording too short.")); return; }
    var u = gu(); if (!u || !gsb()) return;
    toastFx(L("Отправляю голосовое…", "Sending voice…"));
    try {
      var path = u.id + "/v-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".webm";
      var type = blob.type || "audio/webm";
      if (blob.size > (typeof TUS_MIN !== "undefined" ? TUS_MIN : 20 * 1024 * 1024) && typeof uploadBig === "function") {
        await uploadBig(blob, "voice.webm", path, type, function () {}, "chat");
      } else {
        var up = await gsb().storage.from("chat").upload(path, blob, { contentType: type, cacheControl: "31536000" });
        if (up.error) throw up.error;
      }
      var args = { p_room: chatRoom, p_body: "", p_device: typeof deviceId === "function" ? deviceId() : "", p_att_path: path, p_att_name: "voice.webm", p_att_type: type, p_att_size: blob.size };
      await rpc("chat_send", args);
      toastFx(L("Голосовое отправлено.", "Voice sent."));
      if (typeof chatPoll === "function") await chatPoll();
    } catch (e) { fail(e, "voice"); }
  }
  function decorateChatMedia() {
    var u = gu();
    if (!u) return;
    var rows = [];
    try { rows = chatRows || []; } catch (e) { rows = []; }
    var map = new Map();
    rows.forEach(function (m) { map.set(String(m.id), m); });
    Array.prototype.forEach.call(document.querySelectorAll("#msgs .msg[data-id]"), function (node) {
      var m = map.get(String(node.getAttribute("data-id")));
      if (!m || !m.att_path || m.deleted || node.querySelector("[data-fx-att]")) return;
      var wrap = mk("div", "fx-audio"); wrap.setAttribute("data-fx-att", "1");
      var url = typeof mediaUrl === "function" ? mediaUrl(m.att_path, "chat") : "";
      var tp = (m.att_type || "").toLowerCase();
      if (tp.indexOf("audio/") === 0 || tp.indexOf("video/") === 0) {
        var media = document.createElement(tp.indexOf("video/") === 0 ? "video" : "audio");
        media.controls = true; media.preload = "metadata"; media.src = url;
        if (tp.indexOf("video/") === 0) { media.playsInline = true; media.setAttribute("playsinline", ""); media.className = "dmvid"; }
        wrap.appendChild(media);
        var small = mk("small", "", (m.att_name || (tp.indexOf("video/") === 0 ? L("видео", "video") : L("голосовое", "voice"))) + (m.att_size ? " · " + fmtSize(m.att_size) : ""));
        wrap.appendChild(small);
      } else if (tp.indexOf("image/") === 0) {
        var im = document.createElement("img"); im.className = "mimg"; im.src = url; im.loading = "lazy"; im.alt = "";
        im.onclick = function () { try { window.open(url, "_blank", "noopener"); } catch (e) {} };
        wrap.appendChild(im);
      } else {
        wrap.appendChild(fileNode({ name: m.att_name || "file", size: m.att_size, type: m.att_type, url: url }));
      }
      node.appendChild(wrap);
    });
  }

  /* ---------------- terminal ---------------- */
  function termPrint(text, cls) {
    var out = q("fx-term-out"); if (!out) return;
    var line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }
  function termBoot() {
    var out = q("fx-term-out");
    if (out && !out.childNodes.length) {
      termPrint("fsociety terminal " + VERSION);
      termPrint(L("Введи help, чтобы увидеть команды.", "Type help to see commands."));
    }
  }
  async function runCommand(raw) {
    var parts = raw.trim().split(/\s+/);
    var cmd = (parts.shift() || "").toLowerCase();
    var arg = parts.join(" ");
    termPrint("fsociety:~$ " + raw, "fx-term-cmd");
    if (!cmd) return;
    if (cmd === "help") {
      termPrint(L("Команды: help, me, stats, daily, top, shop, search <q>, open <id>, online, time, ping, coinflip, joke, echo, clear, version, sudo", "Commands: help, me, stats, daily, top, shop, search <q>, open <id>, online, time, ping, coinflip, joke, echo, clear, version, sudo"));
      return;
    }
    if (cmd === "clear") { clear(q("fx-term-out")); return; }
    if (cmd === "version") { termPrint(VERSION + " · fsociety PLUS"); return; }
    if (cmd === "echo") { termPrint(arg); return; }
    if (cmd === "time") { termPrint(new Date().toLocaleString(glang() === "en" ? "en-US" : "ru-RU")); return; }
    if (cmd === "ping") { termPrint("pong · " + Math.floor(8 + Math.random() * 42) + " ms"); return; }
    if (cmd === "coinflip") { termPrint(Math.random() < 0.5 ? L("Орёл", "Heads") : L("Решка", "Tails")); return; }
    if (cmd === "joke") {
      var jokes = L(
        ["Почему хакеры не любят природу? Там слишком много багов.", "— Как дела? — 200 OK.", "Мой пароль — 123456. Шучу, он длиннее.", "Сколько программистов нужно, чтобы поменять лампочку? Ни одного, это аппаратная проблема."],
        ["Why do hackers hate nature? Too many bugs.", "— How are you? — 200 OK.", "My password is 123456. Just kidding, it is longer.", "How many programmers does it take to change a light bulb? None, that is a hardware problem."]
      );
      termPrint(jokes[Math.floor(Math.random() * jokes.length)]); return;
    }
    if (cmd === "sudo") { termPrint(L("Нет прав. И не проси.", "Permission denied. And do not ask.")); return; }
    if (cmd === "me" || cmd === "whoami") {
      var u = gu();
      if (!u) { termPrint(L("Ты не в системе. Войди.", "You are not signed in.")); return; }
      termPrint("nick: " + u.nick + "\nrole: " + u.role + "\nid: " + u.id + "\nemail: " + (u.email || "—"));
      return;
    }
    if (cmd === "stats") {
      await loadStats();
      if (!state.stats) { termPrint(L("Статистика недоступна.", "Stats unavailable.")); return; }
      var st = state.stats;
      termPrint("LVL " + st.level + " · XP " + nfmt(st.xp) + " · coins " + nfmt(st.coins) + "\nrank #" + st.rank + " · title " + (st.title || "—"));
      return;
    }
    if (cmd === "daily") { await claimDaily(); termPrint(L("Запрос бонуса отправлен.", "Daily bonus requested.")); return; }
    if (cmd === "top") {
      try {
        var rows = (await rpc("leaderboard", { p_by: "xp" })) || [];
        if (!rows.length) termPrint(L("Топ пуст.", "Leaderboard is empty."));
        rows.slice(0, 10).forEach(function (r, i) { termPrint("#" + (i + 1) + "  " + r.nick + "  LVL " + r.level + "  " + nfmt(r.xp) + " XP"); });
      } catch (e) { termPrint(isMissing(e) ? L("Лидерборд не активирован.", "Leaderboard not enabled.") : L("Ошибка.", "Error.")); }
      return;
    }
    if (cmd === "shop") {
      try {
        var items = (await rpc("shop_list")) || [];
        if (!items.length) termPrint(L("Магазин пуст.", "Shop is empty."));
        items.forEach(function (it) { termPrint((it.equipped ? "[+] " : it.owned ? "[x] " : "[ ] ") + it.title + " — " + nfmt(it.cost) + L(" монет", " coins")); });
      } catch (e) { termPrint(isMissing(e) ? L("Магазин не активирован.", "Shop not enabled.") : L("Ошибка.", "Error.")); }
      return;
    }
    if (cmd === "search") {
      if (arg.length < 2) { termPrint(L("Нужно минимум 2 символа.", "At least 2 characters.")); return; }
      try {
        var res = (await rpc("search_all", { p_q: arg })) || [];
        if (!res.length) termPrint(L("Ничего не найдено.", "Nothing found."));
        res.forEach(function (r) { termPrint("[" + r.kind + "] " + r.title + " — " + (r.subtitle || "")); });
      } catch (e) { termPrint(isMissing(e) ? L("Поиск не активирован.", "Search not enabled.") : L("Ошибка.", "Error.")); }
      return;
    }
    if (cmd === "open") {
      var id = Number(arg);
      if (!id) { termPrint(L("Укажи ID темы: open 123", "Usage: open 123")); return; }
      if (typeof openThread === "function") { closePanel(); openThread(id); termPrint(L("Открываю тему #", "Opening thread #") + id); }
      return;
    }
    if (cmd === "online") {
      termPrint(L("Онлайн: ", "Online: ") + state.online.size);
      state.online.forEach(function (p) { termPrint("● " + (p.nick || "?")); });
      return;
    }
    termPrint(L("Команда не найдена: ", "Unknown command: ") + cmd + " · help");
  }

  /* ---------------- PWA / settings ---------------- */
  function updateInstallButton() {
    var b = q("fx-set-install");
    if (!b) return;
    if (state.install) { b.disabled = false; b.textContent = L("Установить", "Install"); }
    else { b.disabled = true; b.textContent = L("Недоступно", "Unavailable"); }
  }
  async function installPwa() {
    if (!state.install) { toastFx(L("Открой сайт в Chrome/Edge и попробуй снова.", "Open in Chrome/Edge and try again.")); return; }
    try {
      state.install.prompt();
      var choice = await state.install.userChoice;
      if (choice && choice.outcome === "accepted") toastFx(L("Приложение установлено.", "App installed."));
      state.install = null;
      updateInstallButton();
    } catch (e) { toastFx(L("Не получилось установить.", "Install failed.")); }
  }
  async function clearCache() {
    try {
      if (window.caches) {
        var keys = await caches.keys();
        await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }
      toastFx(L("Кэш сброшен. Перезагрузи страницу.", "Cache cleared. Reload the page."));
    } catch (e) { toastFx(L("Не получилось сбросить кэш.", "Could not clear cache.")); }
  }
  function registerPwa() {
    if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
      try {
        navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function () {});
      } catch (e) {}
    }
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      state.install = e;
      updateInstallButton();
    });
    window.addEventListener("appinstalled", function () {
      state.install = null;
      updateInstallButton();
      toastFx(L("fsociety установлен как приложение.", "fsociety installed as an app."));
    });
  }

  /* ---------------- auth sync / init ---------------- */
  function syncAuth() {
    var id = uid();
    if (id === state.lastUid) return;
    state.lastUid = id;
    if (id) {
      startPresence();
      loadStats();
      loadBookmarks();
      loadStories();
      loadOnline();
      scheduleAllDecorations();
    } else {
      stopPresence();
      state.stats = null;
      state.bookmarks = new Set();
      state.titles.clear();
      state.stories = [];
      applyAllTitles();
      renderGuest();
      renderStoryStrip();
      renderStoriesList();
      Array.prototype.forEach.call(document.querySelectorAll(".fx-react[data-fx-react-kind]"), function (b) { b.remove(); });
    }
  }
  function scheduleAllDecorations() {
    REACT_BOXES.forEach(scheduleDecorate);
    decorateChatMedia();
    setupThread();
  }
  function tick() {
    syncAuth();
    observeReactions();
    bindTyping();
    injectMic();
    decorateChatMedia();
    var th = null;
    try { th = forumThreadId; } catch (e) {}
    if (th !== state.lastThread || (th && (!q("fxbookmark") || !q("fx_thread_react")))) {
      state.lastThread = th;
      setupThread();
    }
    renderTyping();
  }

  function bootPlus() {
    injectUI();
    wrapNames();
    registerPwa();
    termBoot();
    observeReactions();
    bindTyping();
    injectMic();
    state.lastUid = "__boot__";
    syncAuth();
    tick();
    setInterval(tick, 1200);
    setInterval(function () { if (state.stats && !state.missing.stats) loadStats(); }, 60000);
    try {
      if (gsb()) gsb().auth.onAuthStateChange(function () { setTimeout(syncAuth, 250); });
    } catch (e) {}
    window.fxPlus = {
      version: VERSION,
      open: openPanel,
      stats: function () { return state.stats; },
      reload: function () { loadStats(); loadShop(); loadStories(); loadBookmarks(); }
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootPlus);
  else bootPlus();
})();
