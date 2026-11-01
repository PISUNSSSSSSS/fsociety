/* ============================================================
   fsociety APP — сайт как приложение на телефоне + приватность.
   * кнопка «Назад» Android и свайп от левого края закрывают окна
     и возвращают по разделам, а не выкидывают с сайта;
   * центр приватности: невидимка, инкогнито, заявки, пауза ЛС,
     блокировка, скрытая почта (нужен update-privacy.sql);
   * главная-хаб: быстрые плитки и свежие темы форума;
   * чаты: кнопка «вниз» со счётчиком новых, свайп для ответа,
     черновики не теряются.
   Отключить: удалить из index.html строки fsociety-app.css/.js.
   ============================================================ */
(function () {
  "use strict";
  var D = document, B = D.body;
  function byId(id) { return D.getElementById(id); }
  function mk(tag, cls, txt) { var n = D.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function ru() { try { return lang !== "en"; } catch (e) { return true; } }
  function L(r, e) { return ru() ? r : e; }
  function me() { try { return user; } catch (e) { return null; } }
  function client() { try { return sb; } catch (e) { return null; } }
  function curView() { try { return cur; } catch (e) { return "home"; } }
  function say(msg) { try { toast(msg); } catch (e) {} }
  function shown(n) { return !!(n && n.offsetParent !== null); }
  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  function esc() { D.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); }
  async function rpc(name, args) {
    var s = client(); if (!s) throw new Error("offline");
    var r = await s.rpc(name, args || {});
    if (r.error) throw r.error;
    return r.data;
  }
  function missingFn(e) {
    var m = String((e && (e.message || e.code)) || "");
    return /PGRST202|Could not find the function|does not exist/i.test(m);
  }

  /* =========================================================
     1. Кнопка «Назад» и свайп от края
     ========================================================= */
  var nav = { ready: false, leaving: false };

  function closeModalEl(m) {
    // 1) клик по затемнению (так закрывается большинство окон)
    m.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    if (!m.classList.contains("show")) return;
    // 2) кнопка «Отмена» / «Закрыть»
    var btns = m.querySelectorAll(".mbtns button, [id$='_close'], [id$='no'], .fx2-modal-close");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      if (!shown(b) || b.classList.contains("main") && btns.length > 1) continue;
      b.click();
      if (!m.classList.contains("show")) return;
    }
    // 3) крайний случай
    m.classList.remove("show");
  }

  function backStep() {
    var n;
    if ((n = byId("fspriv")) && n.classList.contains("show")) { closePrivacy(); return true; }
    if ((n = byId("fxstoryview")) && n.classList.contains("show")) { esc(); return true; }
    if ((n = byId("fx2modal")) && n.classList.contains("show")) { esc(); return true; }
    if ((n = byId("fxex-palette")) && shown(n)) { esc(); return true; }
    if ((n = byId("emodal")) && n.classList.contains("show")) { esc(); if (n.classList.contains("show")) closeModalEl(n); return true; }
    var modals = D.querySelectorAll("#edmodal.show,#formmodal.show,#amodal.show,#wlmodal.show,#wmodal.show,#tmodal.show,#nmodal.show,#umodal.show,#pmodal.show,#bmodal.show,#modal.show");
    if (modals.length) { closeModalEl(modals[0]); return true; }
    if ((n = byId("sheet")) && n.classList.contains("show")) { try { closeSheet(); } catch (e) { n.classList.remove("show"); } return true; }
    if ((n = byId("shade")) && n.classList.contains("open")) { try { closeShade(); } catch (e) { n.classList.remove("open"); } return true; }
    var panels = [["fx2panel", "[data-fx2-back]"], ["fxpanel", "[data-fx-back]"]];
    for (var i = 0; i < panels.length; i++) {
      var p = byId(panels[i][0]);
      if (!p || !p.classList.contains("show")) continue;
      var backs = p.querySelectorAll(panels[i][1] + ",[data-fxex-back]");
      for (var j = 0; j < backs.length; j++) if (shown(backs[j])) { backs[j].click(); return true; }
      esc();
      if (p.classList.contains("show")) { var x = p.querySelector(".fx-x,#fxclose,#fx2close"); if (x) x.click(); else p.classList.remove("show"); }
      return true;
    }
    var v = curView();
    var inner = { dm: ["dmback", "groupback"], servers: ["srvback"] }[v] || [];
    for (var k = 0; k < inner.length; k++) { var ib = byId(inner[k]); if (shown(ib)) { ib.click(); return true; } }
    if (v === "thread" || v === "admin" || v === "register") { var bb = byId("back"); if (bb) { bb.click(); return true; } }
    if (v !== "home" && typeof window.go === "function") { window.go("home"); return true; }
    return false;
  }

  function initNav() {
    if (!window.history || !history.pushState) return;
    try {
      history.replaceState({ fs: "root" }, "");
      history.pushState({ fs: "top" }, "");
      nav.ready = true;
    } catch (e) { return; }
    window.addEventListener("popstate", function () {
      if (nav.leaving) return;
      var handled = false;
      try { handled = backStep(); } catch (e) {}
      if (handled) { try { history.pushState({ fs: "top" }, ""); } catch (e) {} return; }
      // на главной и ничего не открыто — второй «Назад» закрывает сайт
      if (!nav.armed) {
        nav.armed = true;
        say(L("Нажми «Назад» ещё раз, чтобы выйти", "Press Back again to exit"));
        try { history.pushState({ fs: "top" }, ""); } catch (e) {}
        setTimeout(function () { nav.armed = false; }, 2000);
        return;
      }
      nav.leaving = true;
      history.back();
    });
  }

  // свайп от левого края вправо = «Назад» (удобно на iPhone, где нет кнопки)
  (function edgeSwipe() {
    var s = null, hint = mk("div"); hint.id = "fsedge"; hint.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>';
    B.appendChild(hint);
    D.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { s = null; return; }
      var t = e.touches[0];
      s = t.clientX < 22 ? { x: t.clientX, y: t.clientY, dx: 0 } : null;
    }, { passive: true });
    D.addEventListener("touchmove", function (e) {
      if (!s) return;
      var t = e.touches[0];
      s.dx = t.clientX - s.x;
      if (Math.abs(t.clientY - s.y) > 60) { s = null; hint.classList.remove("on"); hint.style.transform = ""; return; }
      var p = Math.max(0, Math.min(1, s.dx / 90));
      hint.classList.toggle("on", p > 0.05);
      hint.classList.toggle("go", p >= 1);
      hint.style.transform = "translate(" + (p * 36 - 36) + "px,-50%)";
    }, { passive: true });
    D.addEventListener("touchend", function () {
      if (!s) return;
      var go = s.dx > 90; s = null;
      hint.classList.remove("on", "go"); hint.style.transform = "";
      if (go) { try { backStep(); } catch (e) {} }
    }, { passive: true });
  })();

  /* =========================================================
     2. Центр приватности
     ========================================================= */
  var priv = { data: null, blocked: [], missing: false };

  function applyInvisible(on) {
    ls("fs_invisible", on ? "1" : null);
    try { if (window.fxPlus && typeof window.fxPlus.presence === "function") window.fxPlus.presence(!on); } catch (e) {}
  }
  function applyEmailMask() {
    var on = ls("fs_hide_mail") !== "0";
    B.classList.toggle("fs-mask-mail", on);
  }
  applyEmailMask();
  D.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("#pmail");
    if (t && B.classList.contains("fs-mask-mail")) { t.classList.toggle("fs-peek"); }
  });

  async function loadPrivacy() {
    if (!me()) return null;
    try {
      priv.data = await rpc("privacy_get");
      priv.missing = false;
      applyInvisible(!!priv.data.invisible);
    } catch (e) { if (missingFn(e)) priv.missing = true; }
    return priv.data;
  }
  async function loadBlocks() {
    try { priv.blocked = (await rpc("blocks_list")) || []; } catch (e) { priv.blocked = []; }
    return priv.blocked;
  }

  function sw(label, hint, on, onChange) {
    var row = mk("div", "fsp-row");
    var txt = mk("div", "fsp-txt"); txt.appendChild(mk("b", "", label)); if (hint) txt.appendChild(mk("small", "", hint));
    var b = mk("button", "fsp-sw" + (on ? " on" : "")); b.type = "button"; b.setAttribute("role", "switch"); b.setAttribute("aria-checked", on ? "true" : "false"); b.setAttribute("aria-label", label);
    b.onclick = async function () {
      if (b.disabled) return;
      var nv = !b.classList.contains("on");
      b.disabled = true; b.classList.toggle("on", nv); b.setAttribute("aria-checked", nv ? "true" : "false");
      try { await onChange(nv); } catch (e) { b.classList.toggle("on", !nv); b.setAttribute("aria-checked", !nv ? "true" : "false"); say(L("Не получилось сохранить", "Could not save")); }
      b.disabled = false;
    };
    row.appendChild(txt); row.appendChild(b);
    return row;
  }
  async function setPriv(obj) {
    priv.data = await rpc("privacy_set", { p: obj });
    return priv.data;
  }

  function buildPrivacy() {
    var wrap = byId("fspriv");
    if (!wrap) {
      wrap = mk("div"); wrap.id = "fspriv"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true");
      wrap.addEventListener("click", function (e) { if (e.target === wrap) closePrivacy(); });
      B.appendChild(wrap);
    }
    wrap.textContent = "";
    var card = mk("div", "mcard fsp-card");
    var head = mk("div", "fsp-head");
    head.appendChild(mk("div", "mt", L("Приватность", "Privacy")));
    var x = mk("button", "fsp-x", "✕"); x.type = "button"; x.setAttribute("aria-label", L("Закрыть", "Close")); x.onclick = closePrivacy;
    head.appendChild(x); card.appendChild(head);

    var d = priv.data || {};
    if (priv.missing) {
      card.appendChild(mk("p", "fsp-note", L("Часть настроек заработает, когда владелец сайта применит update-privacy.sql в Supabase.", "Some settings will work once the site owner applies update-privacy.sql in Supabase.")));
    }
    var srv = !priv.missing && !!priv.data;

    card.appendChild(mk("div", "fsp-sec", L("Кто меня видит", "Who sees me")));
    card.appendChild(sw(L("Невидимка", "Invisible"), L("Не показываться в списке «Онлайн»", "Hide me from the Online list"), srv ? !!d.invisible : ls("fs_invisible") === "1", async function (on) {
      if (srv) await setPriv({ invisible: on });
      applyInvisible(on);
    }));
    if (srv) card.appendChild(sw(L("Инкогнито", "Incognito"), L("Смотреть профили, не попадая в «Гости»", "View profiles without showing up in Guests"), !!d.incognito, function (on) { return setPriv({ incognito: on }); }));
    card.appendChild(sw(L("Скрывать почту", "Hide my email"), L("Почта в профиле размыта, пока не нажмёшь на неё", "Email on your profile stays blurred until tapped"), ls("fs_hide_mail") !== "0", async function (on) {
      ls("fs_hide_mail", on ? null : "0"); applyEmailMask();
    }));

    if (srv) {
      card.appendChild(mk("div", "fsp-sec", L("Кто может писать", "Who can reach me")));
      card.appendChild(sw(L("Заявки в друзья", "Friend requests"), L("Выключи, чтобы никто не мог звать в друзья", "Turn off so nobody can send requests"), d.friend_req !== "nobody", function (on) { return setPriv({ friend_req: on ? "all" : "nobody" }); }));
      card.appendChild(sw(L("Личные сообщения", "Direct messages"), L("Выключи, чтобы поставить ЛС на паузу (даже для друзей)", "Turn off to pause DMs, even from friends"), d.dm !== "nobody", function (on) { return setPriv({ dm: on ? "friends" : "nobody" }); }));

      card.appendChild(mk("div", "fsp-sec", L("Заблокированные", "Blocked")));
      var list = mk("div", "fsp-blocks"); card.appendChild(list);
      list.appendChild(mk("p", "fsp-note", L("Загрузка...", "Loading...")));
      loadBlocks().then(function (rows) {
        list.textContent = "";
        if (!rows.length) { list.appendChild(mk("p", "fsp-note", L("Никого. Заблокировать можно в профиле человека.", "Nobody. You can block someone from their profile."))); return; }
        rows.forEach(function (r) {
          var row = mk("div", "fsp-brow");
          var av = mk("span", "fsp-av");
          if (r.avatar && /^data:image\//.test(r.avatar)) { var im = mk("img"); im.src = r.avatar; im.alt = ""; av.appendChild(im); } else av.textContent = (r.nick || "?").charAt(0).toUpperCase();
          row.appendChild(av); row.appendChild(mk("span", "fsp-bn", r.nick || "?"));
          var ub = mk("button", "mini", L("Разблокировать", "Unblock")); ub.type = "button";
          ub.onclick = async function () {
            ub.disabled = true;
            try { await rpc("unblock_user", { p_target: r.id }); row.remove(); say(L("Разблокирован", "Unblocked")); if (!list.children.length) list.appendChild(mk("p", "fsp-note", L("Никого.", "Nobody."))); }
            catch (e) { ub.disabled = false; say(L("Не получилось", "Failed")); }
          };
          row.appendChild(ub); list.appendChild(row);
        });
      });
    }

    var foot = mk("p", "fsp-note fsp-foot", L("Сайт не использует рекламные трекеры. Фото из чатов и форума пересохраняются без геометок.", "No ad trackers. Photos in chats and the forum are re-saved without location tags."));
    card.appendChild(foot);
    wrap.appendChild(card);
  }
  async function openPrivacy() {
    if (!me()) { try { window.go("register"); } catch (e) {} return; }
    buildPrivacy();
    var w = byId("fspriv"); void w.offsetWidth; w.classList.add("show");
    await loadPrivacy(); buildPrivacy();
  }
  function closePrivacy() { var w = byId("fspriv"); if (w) w.classList.remove("show"); }
  window.fsPrivacy = { open: openPrivacy, close: closePrivacy };

  // кнопка в профиле
  (function profileBtn() {
    var lo = byId("logout"); if (!lo || byId("fsprivbtn")) return;
    var b = mk("button", "btn glass fs-privbtn"); b.id = "fsprivbtn"; b.type = "button";
    b.innerHTML = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span></span>';
    b.onclick = openPrivacy;
    lo.parentNode.insertBefore(b, lo);
  })();

  // кнопка «Заблокировать» в чужом профиле
  (function blockBtn() {
    var um = byId("umodal"); if (!um) return;
    var b = mk("button", "btn glass sm fs-blockbtn"); b.id = "fsblockbtn"; b.type = "button"; b.style.display = "none";
    var fr = byId("u_friend"); if (fr) fr.parentNode.insertBefore(b, fr.nextSibling); else um.querySelector(".mcard").appendChild(b);
    function target() { try { return uCtx; } catch (e) { return null; } }
    function paint(isBlocked) {
      b.dataset.blocked = isBlocked ? "1" : "";
      b.textContent = isBlocked ? L("Разблокировать", "Unblock") : L("Заблокировать", "Block");
      b.classList.toggle("danger", !isBlocked);
      var f = byId("u_friend"); if (f && isBlocked) f.style.display = "none";
    }
    new MutationObserver(async function () {
      if (!um.classList.contains("show")) return;
      var p = target(); var u = me();
      if (!p || !u || p.id === u.id || priv.missing) { b.style.display = "none"; return; }
      b.style.display = "";
      if (!priv.blockedLoaded) { await loadBlocks(); priv.blockedLoaded = true; }
      if (priv.missing) { b.style.display = "none"; return; }
      paint(priv.blocked.some(function (x) { return x.id === p.id; }));
    }).observe(um, { attributes: true, attributeFilter: ["class"] });
    b.onclick = function () {
      var p = target(); if (!p) return;
      var isB = b.dataset.blocked === "1";
      var run = async function () {
        b.disabled = true;
        try {
          if (isB) { await rpc("unblock_user", { p_target: p.id }); priv.blocked = priv.blocked.filter(function (x) { return x.id !== p.id; }); say(L("Разблокирован", "Unblocked")); }
          else { await rpc("block_user", { p_target: p.id }); priv.blocked.unshift({ id: p.id, nick: p.nick, avatar: p.avatar }); say(L("Заблокирован: не сможет писать тебе и звать в друзья", "Blocked: they can't message you or send requests")); }
          paint(!isB);
          try { if (typeof loadFriends === "function") loadFriends(); } catch (e) {}
        } catch (e) { if (missingFn(e)) { priv.missing = true; b.style.display = "none"; } say(L("Не получилось", "Failed")); }
        b.disabled = false;
      };
      if (isB) run();
      else { try { askConfirm(L("Заблокировать " + (p.nick || "") + "? Дружба удалится, ЛС и заявки от него закроются.", "Block " + (p.nick || "") + "? Friendship is removed, their DMs and requests are closed."), run); } catch (e) { run(); } }
    };
  })();

  /* =========================================================
     3. Главная-хаб
     ========================================================= */
  (function hub() {
    var box = D.querySelector("#home .box"); if (!box || byId("fshub")) return;
    var hubEl = mk("div"); hubEl.id = "fshub";
    var tiles = mk("div", "fsh-tiles");
    var defs = [
      ["chat", L("Чат", "Chat"), '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/>'],
      ["forum", "Forum", '<rect x="3" y="4" width="18" height="14" rx="3"/><path d="M8 21h8M12 18v3"/>'],
      ["dm", L("Личные", "DMs"), '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>'],
      ["servers", L("Серверы", "Servers"), '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/>']
    ];
    var meta = {};
    defs.forEach(function (d) {
      var b = mk("button", "fsh-tile"); b.type = "button"; b.dataset.go = d[0];
      b.innerHTML = '<svg viewBox="0 0 24 24">' + d[2] + "</svg>";
      var t = mk("span", "fsh-t"); t.appendChild(mk("b", "", d[1])); var s = mk("small", "", "—"); t.appendChild(s);
      b.appendChild(t); meta[d[0]] = s;
      b.onclick = function () { try { window.go(d[0]); } catch (e) {} };
      tiles.appendChild(b);
    });
    hubEl.appendChild(tiles);
    var fresh = mk("div", "fsh-fresh");
    var fh = mk("div", "fsh-head"); fh.appendChild(mk("span", "", L("Свежее на форуме", "Fresh on the forum")));
    var all = mk("button", "fsh-all", L("все →", "all →")); all.type = "button"; all.onclick = function () { try { window.go("forum"); } catch (e) {} };
    fh.appendChild(all); fresh.appendChild(fh);
    var fl = mk("div", "fsh-list"); fresh.appendChild(fl);
    hubEl.appendChild(fresh);
    box.appendChild(hubEl);

    var lastForum = 0;
    async function refresh() {
      var u = me();
      hubEl.style.display = u ? "" : "none";
      if (!u) return;
      var on = byId("fx-online-count"); var oc = on ? parseInt(on.textContent, 10) || 0 : 0;
      meta.chat.textContent = oc > 0 ? L(oc + " в сети", oc + " online") : L("общая комната", "main room");
      var dmb = byId("dmbadge"), n = dmb ? parseInt(dmb.textContent, 10) || 0 : 0;
      meta.dm.textContent = n ? L(n + " непрочит.", n + " unread") : L("нет новых", "no new");
      meta.dm.classList.toggle("hot", n > 0);
      var sl; try { sl = srvList; } catch (e) { sl = []; }
      meta.servers.textContent = sl && sl.length ? L(sl.length + " твоих", sl.length + " joined") : L("создай свой", "create one");
      if (Date.now() - lastForum < 60000) return;
      lastForum = Date.now();
      var rows; try { rows = forumCache; } catch (e) { rows = []; }
      if (!rows || !rows.length) { try { rows = (await rpc("forum_list", { p_limit: 5, p_offset: 0 })) || []; } catch (e) { rows = []; } }
      meta.forum.textContent = rows.length ? L("тем: " + rows.length + (rows.length >= 5 ? "+" : ""), rows.length + (rows.length >= 5 ? "+" : "") + " threads") : L("пока пусто", "empty");
      fl.textContent = "";
      rows.slice(0, 3).forEach(function (th) {
        var b = mk("button", "fsh-th"); b.type = "button";
        b.appendChild(mk("b", "", th.title || "—"));
        var when = ""; try { when = new Date(th.created_at).toLocaleDateString(locale(), { day: "numeric", month: "short" }); } catch (e) {}
        b.appendChild(mk("small", "", (th.nick || "?") + " · " + when + " · " + (th.replies || 0) + " ↩"));
        b.onclick = function () { try { openThread(Number(th.id)); } catch (e) { window.go("forum"); } };
        fl.appendChild(b);
      });
      fresh.style.display = rows.length ? "" : "none";
    }
    window.fsHubRefresh = function () { lastForum = 0; refresh(); };
    var home = byId("home");
    new MutationObserver(function () { if (home.classList.contains("active")) refresh(); }).observe(home, { attributes: true, attributeFilter: ["class"] });
    setInterval(function () { if (!D.hidden && home.classList.contains("active")) refresh(); }, 8000);
    setTimeout(refresh, 1500);
  })();

  /* =========================================================
     4. Чаты: «вниз», свайп-ответ, черновики
     ========================================================= */
  (function downFab() {
    var fab = mk("button"); fab.id = "fsdown"; fab.type = "button"; fab.setAttribute("aria-label", L("Вниз", "Scroll down"));
    fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg><span></span>';
    B.appendChild(fab);
    var cnt = fab.querySelector("span"), active = null, unseen = 0;
    function box() {
      var list = D.querySelectorAll(".view.active .msgs");
      for (var i = 0; i < list.length; i++) if (shown(list[i])) return list[i];
      return null;
    }
    function far(b) { return b.scrollHeight - b.scrollTop - b.clientHeight > 220; }
    function update() {
      var b = box();
      if (b !== active) { active = b; unseen = 0; }
      var show = !!b && far(b);
      if (!show) unseen = 0;
      fab.classList.toggle("on", show);
      cnt.textContent = unseen > 99 ? "99+" : String(unseen);
      cnt.style.display = unseen ? "" : "none";
      if (show) {
        var row = b.parentElement && b.parentElement.querySelector(".sendrow");
        var r = (row && shown(row) ? row : b).getBoundingClientRect();
        fab.style.top = (r.top - 54) + "px";
        var br = b.getBoundingClientRect();
        fab.style.left = (br.right - 50) + "px";
      }
    }
    D.addEventListener("scroll", function (e) { if (e.target && e.target.classList && e.target.classList.contains("msgs")) update(); }, true);
    window.addEventListener("resize", update);
    new MutationObserver(function (muts) {
      var b = active; if (!b || !far(b)) return;
      muts.forEach(function (m) { if (m.target !== b) return; m.addedNodes.forEach(function (n) { if (n.nodeType === 1 && n.classList.contains("msg") && !n.classList.contains("mine")) unseen++; }); });
      update();
    }).observe(byId("app") || B, { childList: true, subtree: true });
    fab.onclick = function () { var b = box(); if (b) b.scrollTo({ top: b.scrollHeight, behavior: "smooth" }); unseen = 0; setTimeout(update, 400); };
    setInterval(update, 1200);
  })();

  (function swipeReply() {
    var s = null;
    D.addEventListener("touchstart", function (e) {
      var m = e.target.closest && e.target.closest(".msgs .msg");
      if (!m || e.touches.length !== 1 || e.touches[0].clientX < 30) { s = null; return; }
      if (e.target.closest("a,button,img,video,audio,textarea,input")) { s = null; return; }
      s = { m: m, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, lock: null };
    }, { passive: true });
    D.addEventListener("touchmove", function (e) {
      if (!s) return;
      var t = e.touches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
      if (s.lock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.lock = Math.abs(dx) > Math.abs(dy) * 1.4 ? "x" : "y";
      if (s.lock !== "x") return;
      s.dx = Math.max(0, Math.min(80, dx));
      s.m.style.transition = "none";
      s.m.style.transform = "translateX(" + s.dx + "px)";
      s.m.classList.toggle("fs-replyready", s.dx >= 56);
    }, { passive: true });
    D.addEventListener("touchend", function () {
      if (!s) return;
      var m = s.m, ok = s.dx >= 56; s = null;
      m.style.transition = "transform .28s cubic-bezier(.2,1.3,.35,1)"; m.style.transform = "";
      m.classList.remove("fs-replyready");
      setTimeout(function () { m.style.transition = ""; }, 320);
      if (!ok) return;
      var acts = m.querySelectorAll(".mact");
      for (var i = 0; i < acts.length; i++) if (acts[i].textContent.trim() === "↩") {
        acts[i].click();
        try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
        var ta = m.closest(".box") && m.closest(".box").querySelector(".sendrow textarea");
        if (ta) ta.focus();
        break;
      }
    }, { passive: true });
  })();

  // нажатие на сообщение показывает его кнопки (на телефоне они спрятаны)
  (function tapSelect() {
    var touch = false; try { touch = window.matchMedia("(hover: none)").matches; } catch (e) {}
    if (!touch) return;
    D.addEventListener("click", function (e) {
      var m = e.target.closest && e.target.closest(".msgs .msg");
      var prev = D.querySelectorAll(".msgs .msg.fs-sel");
      if (m && e.target.closest("a,button,img,video,audio,input,textarea,.fx-react")) return;
      for (var i = 0; i < prev.length; i++) if (prev[i] !== m) prev[i].classList.remove("fs-sel");
      if (!m) return;
      m.classList.toggle("fs-sel");
      if (!ls("fs_tip_tap")) { ls("fs_tip_tap", "1"); say(L("Свайп вправо по сообщению — ответить", "Swipe a message right to reply")); }
    });
  })();

  (function drafts() {
    var defs = {
      msgin: function () { try { return chatRoom; } catch (e) { return null; } },
      dmin: function () { try { return dmWith && (dmWith.id || dmWith); } catch (e) { return null; } },
      th_in: function () { try { return forumThreadId; } catch (e) { return null; } }
    };
    var st = {};
    function key(id) { var c = defs[id](); return c == null ? null : "fs_draft:" + id + ":" + c; }
    Object.keys(defs).forEach(function (id) {
      var ta = byId(id); if (!ta) return;
      st[id] = { key: key(id), val: ta.value };
      ta.addEventListener("input", function () {
        var k = key(id); if (!k) return;
        ls(k, ta.value.trim() ? ta.value.slice(0, 8000) : null);
        st[id] = { key: k, val: ta.value };
      });
    });
    setInterval(function () {
      Object.keys(st).forEach(function (id) {
        var ta = byId(id); if (!ta) return;
        var k = key(id), s = st[id];
        if (k === s.key) {
          if (ta.value !== s.val) { if (k) ls(k, ta.value.trim() ? ta.value.slice(0, 8000) : null); s.val = ta.value; }
          return;
        }
        s.key = k;
        if (k && !ta.value) {
          var d = ls(k);
          if (d) { ta.value = d; ta.dispatchEvent(new Event("input", { bubbles: true })); ta.classList.add("fs-draft"); setTimeout(function () { ta.classList.remove("fs-draft"); }, 1400); }
        }
        s.val = ta.value;
      });
    }, 700);
  })();

  /* =========================================================
     5. Подписи, которые меняются при смене языка
     ========================================================= */
  function relabel() {
    var b = byId("fsprivbtn"); if (b) b.querySelector("span").textContent = L("Приватность", "Privacy");
  }
  relabel();
  var lb = byId("langbtn"); if (lb) lb.addEventListener("click", function () { setTimeout(relabel, 50); });

  /* ---------- старт ---------- */
  initNav();
  var lastUid = null;
  setInterval(function () {
    var u = me(), id = u ? u.id : null;
    if (id !== lastUid) { lastUid = id; priv.blockedLoaded = false; priv.data = null; if (id) loadPrivacy(); }
    relabel();
  }, 1000);
})();
