/* ============================================================
   fsociety profile studio v2 — редактор профиля.
   Собирается из старого #emodal: поля, кнопки и сохранение
   остаются за index.html (openEdit / closeEdit / #eyes).
   Если скрипт не загрузился, старый #emodal работает как раньше.
   ============================================================ */
(function () {
  "use strict";

  var VERSION = "edit-2.0";
  var modal = null, card = null, tabsEl = null, indEl = null, panes = null;
  var st = { open: false, tab: "main", lastFocus: null, built: false, spinning: false, snap: null, nickTimer: 0, nickSeq: 0, closingOk: false, timer: 0 };
  var TABS = [
    ["main", "Профиль", "Profile", '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'],
    ["look", "Оформление", "Look", '<path d="M12 3a9 9 0 1 0 0 18c1.7 0 2-1.2 2-2 0-1.4 1-2 2.2-2H18a3 3 0 0 0 3-3c0-5-4-11-9-11z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>'],
    ["clan", "Клан", "Clan", '<path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z"/><path d="M9 12h6M12 9v6"/>'],
    ["acc", "Аккаунт", "Account", '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>']
  ];

  /* ---------------- helpers ---------------- */
  function q(id) { return document.getElementById(id); }
  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }
  function isEn() { return safe(function () { return lang === "en"; }, false); }
  function L(ru, en) { return isEn() ? en : ru; }
  function mk(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
  function txt(el, ru, en) {
    el.setAttribute("data-fxed-ru", ru);
    el.setAttribute("data-fxed-en", en);
    el.textContent = L(ru, en);
    return el;
  }
  function svg(paths, cls) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    if (cls) s.setAttribute("class", cls);
    s.innerHTML = paths;
    return s;
  }
  function clear(el) { if (el) while (el.firstChild) el.removeChild(el.firstChild); }
  function me() { return safe(function () { return user; }, null); }
  function roleOf() { var u = me(); return (u && u.role) || "user"; }
  function calm() {
    return safe(function () { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, false);
  }

  /* ---------------- build ---------------- */
  function build() {
    var mt = card.querySelector(".mt");
    var parts = {
      eava: q("eava"), echoose: q("echoose"), file2: q("file2"), enick: q("enick"), ebio: q("ebio"),
      lab: card.querySelector(".lab"), wgrid: q("wgrid"), ewallup: q("ewallup"), epass: q("epass"),
      eerr: q("eerr"), mbtns: card.querySelector(".mbtns")
    };
    clear(card);
    card.classList.add("fxed-shell");
    card.setAttribute("data-fxed", "1");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "fxed-title-label");
    card.setAttribute("tabindex", "-1");

    /* шапка */
    var head = mk("header", "fxed-head");
    var tw = mk("div", "fxed-titlewrap");
    var kick = mk("div", "fxed-kicker");
    kick.appendChild(mk("i"));
    kick.appendChild(mk("span", "", "profile studio"));
    tw.appendChild(kick);
    if (mt) { mt.id = "fxed-title-label"; tw.appendChild(mt); }
    head.appendChild(tw);
    var adminBtn = mk("button", "fxed-admin");
    adminBtn.type = "button"; adminBtn.id = "fxed-admin"; adminBtn.hidden = true;
    adminBtn.appendChild(svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'));
    adminBtn.appendChild(txt(mk("span"), "Админ-панель", "Admin panel"));
    head.appendChild(adminBtn);
    var x = mk("button", "fxed-x");
    x.type = "button"; x.id = "fxed-close";
    x.setAttribute("aria-label", L("Закрыть", "Close"));
    x.appendChild(svg('<path d="M6 6l12 12M18 6 6 18"/>'));
    head.appendChild(x);
    card.appendChild(head);

    var body = mk("div", "fxed-body");
    body.appendChild(buildPreview(parts.eava));

    var main = mk("div", "fxed-main");
    tabsEl = mk("nav", "fxed-tabs");
    tabsEl.setAttribute("role", "tablist");
    indEl = mk("span", "fxed-tab-ind");
    tabsEl.appendChild(indEl);
    TABS.forEach(function (d, i) {
      var b = mk("button", "fxed-tab" + (i === 0 ? " on" : ""));
      b.type = "button";
      b.setAttribute("data-fxed-tab", d[0]);
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.setAttribute("aria-controls", "fxed-pane-" + d[0]);
      b.tabIndex = i === 0 ? 0 : -1;
      b.appendChild(svg(d[3], "fxed-tab-ico"));
      b.appendChild(txt(mk("span", "fxed-tab-label"), d[1], d[2]));
      tabsEl.appendChild(b);
    });
    main.appendChild(tabsEl);

    panes = mk("div", "fxed-panes");
    panes.appendChild(buildMainPane(parts));
    panes.appendChild(buildLookPane(parts));
    panes.appendChild(buildClanPane());
    panes.appendChild(buildAccPane(parts));
    main.appendChild(panes);

    var foot = mk("footer", "fxed-foot");
    var errSlot = mk("div", "fxed-err");
    errSlot.id = "fxed-err-slot";
    if (parts.eerr) errSlot.appendChild(parts.eerr);
    foot.appendChild(errSlot);
    var frow = mk("div", "fxed-foot-row");
    var dirty = mk("div", "fxed-dirty");
    dirty.id = "fxed-dirty";
    dirty.appendChild(mk("i"));
    dirty.appendChild(txt(mk("span"), "Есть несохранённые изменения", "Unsaved changes"));
    var keys = mk("kbd", "fxed-kbd", /Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘S" : "Ctrl+S");
    dirty.appendChild(keys);
    frow.appendChild(dirty);
    if (parts.mbtns) { parts.mbtns.classList.add("fxed-actions"); frow.appendChild(parts.mbtns); }
    foot.appendChild(frow);
    main.appendChild(foot);
    body.appendChild(main);
    card.appendChild(body);
    if (parts.file2) card.appendChild(parts.file2);

    st.built = true;
    decorateWalls();
    showTab("main", true);
  }

  function buildPreview(eava) {
    var prev = mk("aside", "fxed-preview");
    var plabel = mk("div", "fxed-preview-label");
    plabel.appendChild(txt(mk("span"), "Так тебя видят", "How others see you"));
    var live = mk("span", "fxed-live");
    live.appendChild(mk("i"));
    live.appendChild(txt(mk("span"), "вживую", "live"));
    plabel.appendChild(live);
    prev.appendChild(plabel);

    var pcard = mk("div", "fxed-card ui-beam");
    pcard.id = "fxed-card";
    var cover = mk("div", "fxed-cover");
    cover.appendChild(mk("span", "fxed-cover-mesh"));
    cover.appendChild(mk("span", "fxed-cover-grid"));
    var wallChip = mk("span", "fxed-wall-chip");
    wallChip.id = "fxed-wall-chip";
    wallChip.hidden = true;
    cover.appendChild(wallChip);
    pcard.appendChild(cover);

    var pbody = mk("div", "fxed-pcard-body");
    var ring = mk("div", "fxed-ava-ring");
    ring.id = "fxed-ava-ring";
    if (eava) ring.appendChild(eava);
    var camHint = mk("span", "fxed-ava-hint");
    camHint.appendChild(svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'));
    ring.appendChild(camHint);
    pbody.appendChild(ring);

    var nickLine = mk("div", "fxed-nickline");
    var nickEl = mk("span", "fxed-nick");
    nickEl.id = "fxed-nick";
    nickLine.appendChild(nickEl);
    pbody.appendChild(nickLine);
    var roleChip = mk("div", "fxed-role-chip");
    roleChip.id = "fxed-role-chip";
    pbody.appendChild(roleChip);
    var bioEl = mk("div", "fxed-bio");
    bioEl.id = "fxed-bio";
    pbody.appendChild(bioEl);
    var meta = mk("div", "fxed-meta");
    var sid = mk("span"); sid.id = "fxed-sid"; meta.appendChild(sid);
    var mWall = mk("span"); mWall.id = "fxed-meta-wall"; meta.appendChild(mWall);
    pbody.appendChild(meta);
    pcard.appendChild(pbody);
    prev.appendChild(pcard);

    prev.appendChild(txt(mk("div", "fxed-tip"),
      "Меняй поля справа — карточка обновится сразу. Аватар можно перетащить прямо на круг.",
      "Edit the fields — the card updates instantly. You can drop an image right onto the avatar."));
    return prev;
  }

  function sectionHead(ruT, enT, ruS, enS) {
    var h = mk("div", "fxed-section-head");
    h.appendChild(txt(mk("h3", "fxed-section-title"), ruT, enT));
    if (ruS) h.appendChild(txt(mk("p", "fxed-section-sub"), ruS, enS));
    return h;
  }
  function pane(id) {
    var p = mk("section", "fxed-pane");
    p.id = "fxed-pane-" + id;
    p.setAttribute("data-fxed-pane", id);
    p.setAttribute("role", "tabpanel");
    p.hidden = true;
    return p;
  }
  function ringCounter(id) {
    var w = mk("span", "fxed-ring");
    w.id = id;
    var s = svg('<circle cx="12" cy="12" r="9" class="bg"/><circle cx="12" cy="12" r="9" class="fg"/>');
    w.appendChild(s);
    w.appendChild(mk("b", "", "0"));
    return w;
  }
  function setRing(id, n, max) {
    var w = q(id); if (!w) return;
    var k = Math.min(1, n / max), c = 2 * Math.PI * 9;
    var fg = w.querySelector(".fg");
    if (fg) { fg.style.strokeDasharray = c.toFixed(2); fg.style.strokeDashoffset = (c * (1 - k)).toFixed(2); }
    w.querySelector("b").textContent = max - n > 99 ? "" : String(max - n);
    w.classList.toggle("warn", k > 0.85);
    w.classList.toggle("full", n >= max);
  }

  function buildMainPane(p) {
    var el = pane("main");
    el.appendChild(sectionHead("Основное", "Basics",
      "Ник и описание видны в профиле, чате и на форуме.",
      "Your nick and bio show up in your profile, chat and forum."));

    var nf = mk("div", "fxed-field");
    var nl = mk("label", "fxed-label");
    nl.setAttribute("for", "enick");
    nl.appendChild(txt(mk("span"), "Никнейм", "Nickname"));
    var ns = mk("span", "fxed-nick-st");
    ns.id = "fxed-nick-st";
    nl.appendChild(ns);
    nf.appendChild(nl);
    var nwrap = mk("div", "fxed-input");
    nwrap.appendChild(mk("span", "fxed-prefix", "@"));
    if (p.enick) nwrap.appendChild(p.enick);
    nwrap.appendChild(ringCounter("fxed-nick-ring"));
    nf.appendChild(nwrap);
    nf.appendChild(txt(mk("div", "fxed-help"), "2–20 символов. Свободен ли ник — проверим сразу.", "2–20 characters. We check if it's free as you type."));
    el.appendChild(nf);

    var bf = mk("div", "fxed-field");
    var bl = mk("label", "fxed-label");
    bl.setAttribute("for", "ebio");
    bl.appendChild(txt(mk("span"), "О себе", "About"));
    bf.appendChild(bl);
    var bwrap = mk("div", "fxed-input fxed-input-area");
    if (p.ebio) bwrap.appendChild(p.ebio);
    bwrap.appendChild(ringCounter("fxed-bio-ring"));
    bf.appendChild(bwrap);
    bf.appendChild(txt(mk("div", "fxed-help"), "До 2000 символов. Пара строк о себе делает профиль живым.", "Up to 2000 characters. A couple of lines make the profile feel alive."));
    el.appendChild(bf);

    var av = mk("div", "fxed-ava-card");
    var avL = mk("div", "fxed-ava-drop");
    avL.id = "fxed-ava-drop";
    avL.appendChild(svg('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>'));
    var avT = mk("div", "fxed-ava-txt");
    avT.appendChild(txt(mk("b"), "Аватар", "Avatar"));
    avT.appendChild(txt(mk("small"), "Перетащи картинку сюда или выбери файл. Лучше квадрат.", "Drop an image here or pick a file. Square works best."));
    avL.appendChild(avT);
    av.appendChild(avL);
    var acts = mk("div", "fxed-ava-actions");
    if (p.echoose) acts.appendChild(p.echoose);
    var clr = mk("button", "btn glass sm fxed-btn-ghost");
    clr.type = "button"; clr.id = "fxed-ava-clear";
    txt(clr, "Убрать фото", "Remove photo");
    acts.appendChild(clr);
    av.appendChild(acts);
    el.appendChild(av);
    return el;
  }

  function buildLookPane(p) {
    var el = pane("look");
    el.appendChild(sectionHead("Обои", "Wallpaper",
      "Живой фон сайта. Выбери — и сразу увидишь его за окном. Обои с замком — со статуса «Спонсор».",
      "A live background for the site — you see it behind this window right away. Locked ones need Sponsor."));
    if (p.lab) p.lab.hidden = true;
    if (p.wgrid) { p.wgrid.classList.add("fxed-walls"); el.appendChild(p.wgrid); }
    if (p.ewallup) { p.ewallup.classList.add("fxed-wallup"); el.appendChild(p.ewallup); }
    return el;
  }

  function buildClanPane() {
    var el = pane("clan");
    el.appendChild(sectionHead("Клан", "Clan",
      "Тег клана стоит перед ником везде на сайте.",
      "Your clan tag shows before your nick everywhere."));
    var box = mk("div", "clan-card fxed-clan");
    box.id = "fxed-clan";
    el.appendChild(box);
    return el;
  }

  function buildAccPane(p) {
    var el = pane("acc");
    el.appendChild(sectionHead("Аккаунт", "Account", "Данные входа и безопасность.", "Login details and security."));
    var box = mk("div", "fxed-account");
    [["Email", "Email", "fxed-email"], ["ID", "ID", "fxed-id"], ["Роль", "Role", "fxed-role"]].forEach(function (r) {
      var row = mk("div", "fxed-acc-row");
      row.appendChild(txt(mk("span"), r[0], r[1]));
      var v = mk("b", "", "—"); v.id = r[2]; row.appendChild(v);
      box.appendChild(row);
    });
    el.appendChild(box);
    var sec = mk("div", "fxed-sec");
    sec.appendChild(txt(mk("div", "fxed-sec-title"), "Пароль", "Password"));
    sec.appendChild(txt(mk("div", "fxed-help"), "Смени пароль, не выходя из редактора.", "Change your password without leaving the editor."));
    if (p.epass) sec.appendChild(p.epass);
    el.appendChild(sec);
    return el;
  }

  /* ---------------- tabs ---------------- */
  function moveInd(instant) {
    if (!tabsEl || !indEl) return;
    var on = tabsEl.querySelector(".fxed-tab.on");
    if (!on || !on.offsetWidth) return;
    if (instant) indEl.style.transition = "none";
    indEl.style.width = on.offsetWidth + "px";
    indEl.style.transform = "translateX(" + on.offsetLeft + "px)";
    if (instant) { void indEl.offsetWidth; indEl.style.transition = ""; }
  }
  function showTab(name, instant) {
    if (!tabsEl || !panes) return;
    var ids = TABS.map(function (d) { return d[0]; });
    if (ids.indexOf(name) < 0) name = "main";
    var dir = ids.indexOf(name) >= ids.indexOf(st.tab) ? "fwd" : "back";
    st.tab = name;
    Array.prototype.forEach.call(tabsEl.querySelectorAll("[data-fxed-tab]"), function (b) {
      var on = b.getAttribute("data-fxed-tab") === name;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    Array.prototype.forEach.call(panes.querySelectorAll("[data-fxed-pane]"), function (p) {
      var on = p.getAttribute("data-fxed-pane") === name;
      p.hidden = !on;
      p.classList.toggle("on", on);
      if (on && !instant && !calm()) {
        p.setAttribute("data-dir", dir);
        p.classList.remove("fxed-pane-anim"); void p.offsetWidth; p.classList.add("fxed-pane-anim");
      }
    });
    moveInd(instant);
    if (name === "look") decorateWalls();
    if (name === "clan") safe(function () { if (window.fsClans && fsClans.renderInto) fsClans.renderInto(q("fxed-clan")); });
    panes.scrollTop = 0;
  }

  /* ---------------- nick check ---------------- */
  function nickStatus(kind, ru, en) {
    var s = q("fxed-nick-st"); if (!s) return;
    s.className = "fxed-nick-st" + (kind ? " " + kind : "");
    s.textContent = kind ? L(ru, en) : "";
  }
  function checkNick() {
    clearTimeout(st.nickTimer);
    var inp = q("enick"), u = me();
    if (!inp || !u) return;
    var v = inp.value.trim();
    var seq = ++st.nickSeq;
    if (v === (st.snap ? st.snap.nick : u.nick)) { nickStatus("", "", ""); return; }
    if (v.length < 2 || v.length > 20) { nickStatus("bad", "2–20 символов", "2–20 characters"); return; }
    nickStatus("wait", "проверяю…", "checking…");
    st.nickTimer = setTimeout(async function () {
      var s = safe(function () { return sb; }, null);
      if (!s) { nickStatus("", "", ""); return; }
      try {
        var r = await s.rpc("nick_free", { n: v });
        if (seq !== st.nickSeq) return;
        if (r.error) { nickStatus("", "", ""); return; }
        if (r.data === false) nickStatus("bad", "занят", "taken");
        else nickStatus("ok", "свободен", "available");
      } catch (e) { if (seq === st.nickSeq) nickStatus("", "", ""); }
    }, 450);
  }

  /* ---------------- dirty state ---------------- */
  function snapshot() {
    var u = me();
    st.snap = {
      nick: u ? String(u.nick || "") : "",
      bio: u ? String(u.bio || "") : "",
      wall: safe(function () { return eWall; }, null)
    };
  }
  function isDirty() {
    if (!st.snap) return false;
    var n = q("enick"), b = q("ebio");
    if (n && n.value.trim() !== st.snap.nick) return true;
    if (b && b.value.trim() !== st.snap.bio) return true;
    if (safe(function () { return eWall; }, null) !== st.snap.wall) return true;
    if (safe(function () { return eAva !== undefined; }, false)) return true;
    return false;
  }
  function paintDirty() {
    var d = isDirty();
    var el = q("fxed-dirty");
    if (el) el.classList.toggle("on", d);
    var yes = q("eyes");
    if (yes) yes.classList.toggle("fxed-hot", d);
    return d;
  }

  /* ---------------- preview ---------------- */
  function syncPreview() {
    if (!st.open) return;
    var u = me(), role = roleOf();
    var nickIn = q("enick"), bioIn = q("ebio");
    var nick = nickIn ? nickIn.value.trim() : "";
    var bio = bioIn ? bioIn.value.trim() : "";

    var nickEl = q("fxed-nick");
    if (nickEl) {
      var nextNick = nick || L("твой ник", "your nick");
      var sig = nextNick + "|" + role + "|" + (u ? u.id : "") + "|" + (isEn() ? "en" : "ru");
      if (nickEl.getAttribute("data-fxed-sig") !== sig) {
        nickEl.setAttribute("data-fxed-sig", sig);
        if (typeof window.richName === "function") window.richName(nickEl, u ? u.id : null, nextNick, role);
        else nickEl.textContent = nextNick;
      }
    }
    var ava = q("eava");
    if (ava && u) safe(function () { setRoleClass(ava, role); });
    var ring = q("fxed-ava-ring");
    if (ring) ring.setAttribute("data-role", role);

    var roleChip = q("fxed-role-chip");
    var roleSig = role + "|" + (isEn() ? "en" : "ru") + "|" + (u ? 1 : 0);
    if (roleChip && roleChip.getAttribute("data-sig") !== roleSig) {
      roleChip.setAttribute("data-sig", roleSig);
      clear(roleChip);
      if (u && typeof window.roleBadge === "function") roleChip.appendChild(window.roleBadge(role, "lg"));
    }

    var bioEl = q("fxed-bio");
    if (bioEl) {
      bioEl.textContent = bio || L("Пока без описания. Добавь пару строк о себе.", "No bio yet. Add a couple of lines about yourself.");
      bioEl.classList.toggle("empty", !bio);
    }
    setRing("fxed-nick-ring", nickIn ? nickIn.value.length : 0, 20);
    setRing("fxed-bio-ring", bioIn ? bioIn.value.length : 0, 2000);

    var idTxt = u ? (u.sid ? "ID " + u.sid : "ID " + String(u.id || "").slice(0, 8)) : "";
    var sid = q("fxed-sid"); if (sid) sid.textContent = idTxt;
    var email = q("fxed-email"); if (email) email.textContent = (u && u.email) || "—";
    var fid = q("fxed-id"); if (fid) fid.textContent = idTxt || "—";
    var fr = q("fxed-role"); if (fr) fr.textContent = u ? safe(function () { return roleLabel(role); }, role) : "—";

    var cardEl = q("fxed-card");
    var sel = document.querySelector("#wgrid .wopt.on");
    var accent = sel ? sel.style.getPropertyValue("--wd") : "";
    if (cardEl) cardEl.style.setProperty("--fxed-accent", accent && accent.trim() !== "#333" ? accent : "#ff2b3a");
    var label = sel ? (sel.getAttribute("data-fxed-label") || "") : "";
    var chip = q("fxed-wall-chip");
    if (chip) { chip.textContent = label; chip.hidden = !label; }
    var mw = q("fxed-meta-wall"); if (mw) mw.textContent = label ? "▦ " + label : "";
    paintDirty();
  }

  /* ---------------- wallpaper tiles ---------------- */
  function decorateWalls() {
    var grid = q("wgrid");
    if (!grid) return;
    Array.prototype.forEach.call(grid.querySelectorAll(".wopt"), function (b, i) {
      if (b.getAttribute("data-fxed-done") === "1") return;
      b.setAttribute("data-fxed-done", "1");
      var w = safe(function () { return WALLS[i]; }, null);
      if (w) b.setAttribute("data-fxed-wall", w[0]);
      var label = (b.textContent || "").replace(/^🔒\s*/, "").replace(/^\+\s*/, "").trim();
      b.setAttribute("data-fxed-label", label);
      b.classList.add("fxed-wall");
      var sw = mk("span", "fxed-wall-sw");
      b.insertBefore(sw, b.firstChild);
      if (b.classList.contains("lock")) {
        var lk = svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', "fxed-wall-lock");
        b.appendChild(lk);
      }
      b.appendChild(svg('<path d="m5 12 5 5 9-10"/>', "fxed-wall-check"));
      // убрать «🔒 » из подписи — замок теперь иконкой
      Array.prototype.forEach.call(b.childNodes, function (n) {
        if (n.nodeType === 3) n.textContent = n.textContent.replace(/^🔒\s*/, "");
      });
    });
    syncPreview();
  }

  /* ---------------- admin ---------------- */
  function updateAdminBtn() {
    var b = q("fxed-admin");
    if (!b) return;
    var r = roleOf();
    b.hidden = !(r === "owner" || r === "coowner");
  }

  /* ---------------- open / close ---------------- */
  function onOpen() {
    st.open = true;
    st.closingOk = false;
    st.lastFocus = document.activeElement;
    snapshot();
    updateAdminBtn();
    nickStatus("", "", "");
    var u = me(), ava = q("eava");
    if (ava) {
      if (u) safe(function () { setRoleClass(ava, u.role); });
      ava.setAttribute("role", "button");
      ava.setAttribute("tabindex", "0");
      ava.setAttribute("aria-label", L("Сменить аватар", "Change avatar"));
    }
    ["fxed-nick", "fxed-role-chip"].forEach(function (id) { var n = q(id); if (n) { n.removeAttribute("data-fxed-sig"); n.removeAttribute("data-sig"); } });
    showTab("main", true);
    syncPreview();
    setTimeout(function () { moveInd(true); syncPreview(); }, 60);
    clearInterval(st.timer);
    st.timer = setInterval(syncPreview, 1500);
    document.body.classList.add("fxed-lock");
    safe(function () { card.focus({ preventScroll: true }); });
  }
  function onClose() {
    if (!st.open) return;
    st.open = false;
    clearInterval(st.timer);
    clearTimeout(st.nickTimer);
    document.body.classList.remove("fxed-lock");
    if (st.lastFocus && typeof st.lastFocus.focus === "function") safe(function () { st.lastFocus.focus({ preventScroll: true }); });
  }
  // закрыть с отменой; если есть изменения — спросить
  function requestClose() {
    var no = q("eno");
    if (!no) { safe(function () { closeEdit(true); }); return; }
    no.click();
  }

  /* ---------------- pencil spin ---------------- */
  function bindPen() {
    var pen = q("pen");
    if (!pen || pen.getAttribute("data-fxed-pen") === "1") return;
    pen.setAttribute("data-fxed-pen", "1");
    var original = pen.onclick;
    pen.onclick = function (e) {
      if (st.spinning) { if (e) e.preventDefault(); return; }
      var open = function () {
        pen.classList.remove("fxed-spin");
        st.spinning = false;
        if (typeof original === "function") original.call(pen, e);
      };
      if (calm()) { open(); return; }
      st.spinning = true;
      pen.classList.remove("fxed-spin"); void pen.offsetWidth; pen.classList.add("fxed-spin");
      setTimeout(open, 420);
    };
  }

  /* ---------------- events ---------------- */
  function loadAvatarFile(f) {
    if (!f || !/^image\//i.test(f.type || "")) return;
    safe(function () {
      cropToData(f).then(function (data) {
        safe(function () { eAva = data; });
        safe(function () { setAva(q("eava"), data, false); });
        syncPreview();
      }).catch(function () { safe(function () { toast(t("err_generic")); }); });
    });
  }
  function bindDrop(target) {
    if (!target) return;
    ["dragenter", "dragover"].forEach(function (ev) {
      target.addEventListener(ev, function (e) { e.preventDefault(); target.classList.add("fxed-drop"); });
    });
    ["dragleave", "dragend", "drop"].forEach(function (ev) {
      target.addEventListener(ev, function () { target.classList.remove("fxed-drop"); });
    });
    target.addEventListener("drop", function (e) {
      e.preventDefault();
      loadAvatarFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
    });
  }
  function bind() {
    var close = q("fxed-close");
    if (close) close.onclick = requestClose;
    var adminBtn = q("fxed-admin");
    if (adminBtn) adminBtn.onclick = function () { st.closingOk = true; requestClose(); safe(function () { go("admin"); }); };

    // «Отмена» и клик по фону: при несохранённых изменениях — спросить
    var no = q("eno");
    function guard(e) {
      if (!st.open || st.closingOk || !paintDirty()) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      safe(function () {
        askConfirm(L("Закрыть без сохранения? Изменения пропадут.", "Close without saving? Your changes will be lost."), function () {
          st.closingOk = true;
          if (no) no.click(); else closeEdit(true);
        });
      });
    }
    if (no) no.addEventListener("click", guard, true);
    modal.addEventListener("click", function (e) { if (e.target === modal) guard(e); }, true);

    var ava = q("eava");
    if (ava) {
      ava.addEventListener("click", function () { var f = q("file2"); if (f) f.click(); });
      ava.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); var f = q("file2"); if (f) f.click(); }
      });
    }
    bindDrop(q("fxed-ava-ring"));
    bindDrop(q("fxed-ava-drop"));
    var drop = q("fxed-ava-drop");
    if (drop) drop.addEventListener("click", function () { var f = q("file2"); if (f) f.click(); });

    var clr = q("fxed-ava-clear");
    if (clr) clr.onclick = function () {
      safe(function () { eAva = null; });
      safe(function () { setAva(q("eava"), null, false); });
      syncPreview();
    };
    var f2 = q("file2");
    if (f2) f2.addEventListener("change", function () { setTimeout(syncPreview, 400); });

    var enick = q("enick");
    if (enick) enick.addEventListener("input", function () { syncPreview(); checkNick(); });
    var ebio = q("ebio");
    if (ebio) ebio.addEventListener("input", syncPreview);
    var wgrid = q("wgrid");
    if (wgrid) wgrid.addEventListener("click", function () { setTimeout(function () { decorateWalls(); syncPreview(); }, 0); });

    tabsEl.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-fxed-tab]") : null;
      if (b) showTab(b.getAttribute("data-fxed-tab"));
    });
    tabsEl.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var list = Array.prototype.slice.call(tabsEl.querySelectorAll("[data-fxed-tab]"));
      var idx = list.indexOf(document.activeElement);
      if (idx < 0) return;
      e.preventDefault();
      idx = (idx + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length;
      list[idx].focus();
      showTab(list[idx].getAttribute("data-fxed-tab"));
    });
    window.addEventListener("resize", function () { if (st.open) moveInd(true); });

    document.addEventListener("keydown", function (e) {
      if (!st.open) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "ы" || e.key === "Ы")) {
        e.preventDefault();
        var yes = q("eyes"); if (yes && !yes.disabled) yes.click();
        return;
      }
      if (e.key === "Escape") {
        var other = document.querySelector("#pmodal.show,#modal.show,#bmodal.show,#edmodal.show,#formmodal.show,#sheet.show");
        if (other) return;
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key === "Tab") trapFocus(e);
    });
  }

  function trapFocus(e) {
    var nodes = card.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
    var list = Array.prototype.filter.call(nodes, function (el) { return el.offsetParent !== null; });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function refreshLabels() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-fxed-ru]"), function (el) {
      el.textContent = L(el.getAttribute("data-fxed-ru"), el.getAttribute("data-fxed-en"));
    });
    var close = q("fxed-close");
    if (close) close.setAttribute("aria-label", L("Закрыть", "Close"));
    updateAdminBtn();
    moveInd(true);
    syncPreview();
  }

  function watch() {
    new MutationObserver(function () {
      if (modal.classList.contains("show")) { if (!st.open) onOpen(); }
      else onClose();
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });
    var grid = q("wgrid");
    if (grid) new MutationObserver(function () { decorateWalls(); }).observe(grid, { childList: true });
    new MutationObserver(refreshLabels).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  function init() {
    modal = q("emodal");
    if (!modal) return;
    card = modal.querySelector(".mcard");
    if (!card || card.getAttribute("data-fxed") === "1") return;
    build();
    bind();
    bindPen();
    watch();
    modal.classList.add("fxed-ready");
    window.fxProfileEdit = { version: VERSION, open: function () { safe(function () { openEdit(); }); }, tab: showTab, sync: syncPreview };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
