/* ============================================================
   fsociety profile studio — редактор профиля нового формата.
   Прогрессивное улучшение: если скрипт не загрузился,
   старый #emodal продолжает работать как раньше.
   ============================================================ */
(function () {
  "use strict";

  var VERSION = "edit-1.0";
  var modal = null;
  var card = null;
  var tabs = null;
  var panes = null;
  var st = {
    open: false,
    tab: "main",
    timer: 0,
    lastFocus: null,
    built: false,
    spinning: false,
    ownedSig: ""
  };

  function q(id) { return document.getElementById(id); }
  function safe(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }
  function isEn() {
    return safe(function () { return lang === "en"; }, false);
  }
  function L(ru, en) { return isEn() ? en : ru; }
  function tr(key, fallback) {
    return safe(function () { return t(key) || fallback; }, fallback);
  }
  function mk(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
  function txt(el, ru, en) {
    if (!el) return el;
    el.setAttribute("data-fxed-ru", ru);
    el.setAttribute("data-fxed-en", en);
    el.textContent = L(ru, en);
    return el;
  }
  function clear(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }
  function roleOf() {
    var u = safe(function () { return user; }, null);
    return (u && u.role) || "user";
  }
  function currentUser() { return safe(function () { return user; }, null); }
  function wallet() {
    return safe(function () {
      return window.fxPlus2 && typeof window.fxPlus2.wallet === "function" ? window.fxPlus2.wallet() : null;
    }, null);
  }
  function decorate() {
    safe(function () {
      if (window.fxPlus2 && typeof window.fxPlus2.decorate === "function") window.fxPlus2.decorate();
    });
  }

  /* ---------------- build ---------------- */
  function build() {
    var mt = card.querySelector(".mt");
    var eava = q("eava");
    var echoose = q("echoose");
    var file2 = q("file2");
    var enick = q("enick");
    var ebio = q("ebio");
    var lab = card.querySelector(".lab");
    var ewallup = q("ewallup");
    var wgrid = q("wgrid");
    var epass = q("epass");
    var eerr = q("eerr");
    var mbtns = card.querySelector(".mbtns");

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
    tw.appendChild(mk("div", "fxed-kicker", "fsociety // profile studio"));
    if (mt) {
      mt.id = "fxed-title-label";
      tw.appendChild(mt);
    }
    head.appendChild(tw);
    var x = mk("button", "fxed-x", "✕");
    x.type = "button";
    x.id = "fxed-close";
    x.setAttribute("aria-label", L("Закрыть", "Close"));
    head.appendChild(x);
    card.appendChild(head);

    var body = mk("div", "fxed-body");

    /* превью */
    var prev = mk("aside", "fxed-preview");
    var plabel = mk("div", "fxed-preview-label");
    plabel.appendChild(txt(mk("span"), "Превью", "Preview"));
    var live = mk("span", "fxed-live");
    live.appendChild(mk("i"));
    live.appendChild(txt(mk("span"), "вживую", "live"));
    plabel.appendChild(live);
    prev.appendChild(plabel);

    var pcard = mk("div", "fxed-card");
    pcard.id = "fxed-card";
    var cover = mk("div", "fxed-cover");
    cover.appendChild(mk("span", "fxed-cover-grid"));
    var wallChip = mk("span", "fxed-wall-chip");
    wallChip.id = "fxed-wall-chip";
    wallChip.hidden = true;
    cover.appendChild(wallChip);
    pcard.appendChild(cover);

    var pbody = mk("div", "fxed-pcard-body");
    var avaRow = mk("div", "fxed-ava-row");
    var ring = mk("div", "fxed-ava-ring");
    ring.id = "fxed-ava-ring";
    avaRow.appendChild(ring);
    var roleChip = mk("span", "fxed-role-chip");
    roleChip.id = "fxed-role-chip";
    avaRow.appendChild(roleChip);
    pbody.appendChild(avaRow);

    var nickLine = mk("div", "fxed-nickline");
    var nickEl = mk("span", "fxed-nick");
    nickEl.id = "fxed-nick";
    nickLine.appendChild(nickEl);
    pbody.appendChild(nickLine);

    var titleEl = mk("div", "fxed-title");
    titleEl.id = "fxed-title";
    titleEl.hidden = true;
    pbody.appendChild(titleEl);

    var bioEl = mk("div", "fxed-bio");
    bioEl.id = "fxed-bio";
    pbody.appendChild(bioEl);

    var meta = mk("div", "fxed-meta");
    var sid = mk("span");
    sid.id = "fxed-sid";
    meta.appendChild(sid);
    var fxChip = mk("span", "fxed-chip fx");
    fxChip.id = "fxed-fx";
    fxChip.hidden = true;
    meta.appendChild(fxChip);
    pbody.appendChild(meta);

    pcard.appendChild(pbody);
    prev.appendChild(pcard);

    var tip = mk("div", "fxed-tip");
    txt(tip,
      "Так тебя видят другие. Меняй поля справа — карточка обновится сразу.",
      "This is how others see you. Edit fields on the right — the card updates live.");
    prev.appendChild(tip);
    body.appendChild(prev);

    if (eava) ring.appendChild(eava);

    /* правая часть */
    var main = mk("div", "fxed-main");
    tabs = mk("nav", "fxed-tabs");
    tabs.setAttribute("role", "tablist");
    buildTabs();
    main.appendChild(tabs);

    panes = mk("div", "fxed-panes");
    panes.appendChild(buildMainPane(echoose, file2, enick, ebio));
    panes.appendChild(buildAppearancePane(lab, wgrid, ewallup));
    panes.appendChild(buildAccountPane(epass));
    main.appendChild(panes);

    var foot = mk("footer", "fxed-foot");
    var errSlot = mk("div", "fxed-err");
    errSlot.id = "fxed-err-slot";
    if (eerr) errSlot.appendChild(eerr);
    foot.appendChild(errSlot);
    var frow = mk("div", "fxed-foot-row");
    var fhint = mk("div", "fxed-foot-hint");
    txt(fhint,
      "Изменения появятся сразу после сохранения.",
      "Changes appear right after saving.");
    frow.appendChild(fhint);
    if (mbtns) {
      mbtns.classList.add("fxed-actions");
      frow.appendChild(mbtns);
    }
    foot.appendChild(frow);
    main.appendChild(foot);
    body.appendChild(main);
    card.appendChild(body);

    if (file2) main.appendChild(file2);

    st.built = true;
    decorateWalls();
    showTab("main");
  }

  function buildTabs() {
    var defs = [
      ["main", "👤", "Профиль", "Profile"],
      ["look", "🎨", "Оформление", "Appearance"],
      ["acc", "🔐", "Аккаунт", "Account"]
    ];
    defs.forEach(function (d, i) {
      var b = mk("button", "fxed-tab" + (i === 0 ? " on" : ""));
      b.type = "button";
      b.setAttribute("data-fxed-tab", d[0]);
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.setAttribute("aria-controls", "fxed-pane-" + d[0]);
      b.tabIndex = i === 0 ? 0 : -1;
      b.appendChild(mk("span", "fxed-tab-ico", d[1]));
      b.appendChild(txt(mk("span", "fxed-tab-label"), d[2], d[3]));
      tabs.appendChild(b);
    });
  }

  function sectionHead(ruTitle, enTitle, ruSub, enSub) {
    var head = mk("div", "fxed-section-head");
    head.appendChild(txt(mk("h3", "fxed-section-title"), ruTitle, enTitle));
    head.appendChild(txt(mk("p", "fxed-section-sub"), ruSub, enSub));
    return head;
  }

  function buildMainPane(echoose, file2, enick, ebio) {
    var p = mk("section", "fxed-pane on");
    p.id = "fxed-pane-main";
    p.setAttribute("data-fxed-pane", "main");
    p.setAttribute("role", "tabpanel");
    p.appendChild(sectionHead(
      "Основное", "Basics",
      "Ник и описание видны в профиле, чате и на форуме.",
      "Your nick and bio are visible in your profile, chat and forum."
    ));

    var nickField = mk("div", "fxed-field");
    var nickLabel = mk("label", "fxed-label");
    nickLabel.setAttribute("for", "enick");
    nickLabel.appendChild(txt(mk("span"), "Никнейм", "Nickname"));
    var nickCount = mk("span", "fxed-count", "0/20");
    nickCount.id = "fxed-nick-count";
    nickLabel.appendChild(nickCount);
    nickField.appendChild(nickLabel);
    if (enick) nickField.appendChild(enick);
    nickField.appendChild(txt(mk("div", "fxed-help"),
      "2–20 символов. Если ник свободен, его можно сменить.",
      "2–20 characters. You can change it if the nickname is free."));
    p.appendChild(nickField);

    var bioField = mk("div", "fxed-field");
    var bioLabel = mk("label", "fxed-label");
    bioLabel.setAttribute("for", "ebio");
    bioLabel.appendChild(txt(mk("span"), "О себе", "About"));
    var bioCount = mk("span", "fxed-count", "0/2000");
    bioCount.id = "fxed-bio-count";
    bioLabel.appendChild(bioCount);
    bioField.appendChild(bioLabel);
    if (ebio) bioField.appendChild(ebio);
    bioField.appendChild(txt(mk("div", "fxed-help"),
      "До 2000 символов. Пара строк о себе делает профиль живым.",
      "Up to 2000 characters. A few lines make your profile feel alive."));
    p.appendChild(bioField);

    var avaCard = mk("div", "fxed-ava-card");
    avaCard.appendChild(txt(mk("div", "fxed-label"),
      "Аватар", "Avatar"));
    var avaActions = mk("div", "fxed-ava-actions");
    if (echoose) avaActions.appendChild(echoose);
    var clearBtn = mk("button", "fxed-btn-ghost");
    clearBtn.type = "button";
    clearBtn.id = "fxed-ava-clear";
    txt(clearBtn, "Убрать фото", "Remove photo");
    avaActions.appendChild(clearBtn);
    avaCard.appendChild(avaActions);
    avaCard.appendChild(txt(mk("div", "fxed-help"),
      "Нажми на аватар в превью или выбери файл. JPG/PNG, лучше квадрат.",
      "Tap the avatar in the preview or choose a file. JPG/PNG, square works best."));
    p.appendChild(avaCard);

    if (file2) p.appendChild(file2);
    return p;
  }

  function buildAppearancePane(lab, wgrid, ewallup) {
    var p = mk("section", "fxed-pane");
    p.id = "fxed-pane-look";
    p.setAttribute("data-fxed-pane", "look");
    p.setAttribute("role", "tabpanel");
    p.appendChild(sectionHead(
      "Оформление", "Appearance",
      "Фон сайта, статус и атмосфера профиля.",
      "Site background, status and profile vibe."
    ));

    var wallField = mk("div", "fxed-field");
    var wallLabel = mk("div", "fxed-label");
    if (lab) {
      lab.classList.add("fxed-label-text");
      wallLabel.appendChild(lab);
    } else {
      wallLabel.appendChild(txt(mk("span"), "Обои", "Wallpaper"));
    }
    wallField.appendChild(wallLabel);
    wallField.appendChild(txt(mk("div", "fxed-help"),
      "Обои применяются к фону сайта. Платные открываются в PLUS 2 → Обои.",
      "Wallpapers apply to the site background. Premium ones are in PLUS 2 → Wallpapers."));
    if (wgrid) wallField.appendChild(wgrid);
    if (ewallup) wallField.appendChild(ewallup);
    p.appendChild(wallField);

    var owned = mk("div", "fxed-owned");
    var ownedHead = mk("div", "fxed-owned-head");
    ownedHead.appendChild(txt(mk("b"), "Куплено", "Purchased"));
    var ownedCount = mk("span", "fxed-owned-count", "0");
    ownedCount.id = "fxed-owned-count";
    ownedHead.appendChild(ownedCount);
    owned.appendChild(ownedHead);
    owned.appendChild(txt(mk("div", "fxed-help"),
      "Всё, что ты уже купил: привилегии, эффекты, обои и титул.",
      "Everything you already bought: privileges, effects, wallpapers and title."));
    var ownedList = mk("div", "fxed-owned-list");
    ownedList.id = "fxed-owned-list";
    owned.appendChild(ownedList);
    p.appendChild(owned);

    var premium = mk("div", "fxed-premium");
    premium.appendChild(mk("span", "fxed-premium-ico", "💎"));
    var premMain = mk("div");
    premMain.appendChild(txt(mk("b"), "Эффекты ника", "Nick effects"));
    premMain.appendChild(txt(mk("small"),
      "Дождь, звёзды, огонь и «дождь из денег» — в PLUS 2 → Эффекты.",
      "Rain, stars, fire and money rain — in PLUS 2 → Effects."));
    premium.appendChild(premMain);
    p.appendChild(premium);
    return p;
  }

  function buildAccountPane(epass) {
    var p = mk("section", "fxed-pane");
    p.id = "fxed-pane-acc";
    p.setAttribute("data-fxed-pane", "acc");
    p.setAttribute("role", "tabpanel");
    p.appendChild(sectionHead(
      "Аккаунт", "Account",
      "Данные входа и безопасность.",
      "Login details and security."
    ));

    var box = mk("div", "fxed-account");
    box.appendChild(accountRow("Email", "Email", "fxed-email"));
    box.appendChild(accountRow("ID", "ID", "fxed-id"));
    box.appendChild(accountRow("Роль", "Role", "fxed-role"));
    box.appendChild(accountRow("Кристаллы", "Crystals", "fxed-gems"));
    p.appendChild(box);

    var sec = mk("div", "fxed-sec");
    sec.appendChild(txt(mk("div", "fxed-sec-title"), "Безопасность", "Security"));
    sec.appendChild(txt(mk("div", "fxed-help"),
      "Пароль можно сменить отдельно, не выходя из редактора.",
      "You can change your password separately without leaving the editor."));
    if (epass) sec.appendChild(epass);
    p.appendChild(sec);
    return p;
  }

  function accountRow(ru, en, id) {
    var row = mk("div", "fxed-acc-row");
    row.appendChild(txt(mk("span"), ru, en));
    var val = mk("b", "", "—");
    val.id = id;
    row.appendChild(val);
    return row;
  }

  /* ---------------- owned purchases ---------------- */
  function privilegeMap() {
    var map = safe(function () {
      return window.fxPlus2 && window.fxPlus2.state ? window.fxPlus2.state.privilegeMap : null;
    }, null);
    return map instanceof Map ? map : new Map();
  }
  function wallTitle(pid) {
    var id = String(pid || "").replace(/^wall_/, "");
    var row = safe(function () {
      for (var i = 0; i < WALLS.length; i++) if (WALLS[i][0] === id) return WALLS[i];
      return null;
    }, null);
    return row ? tr(row[1], id) : id;
  }
  function kindTitle(kind) {
    if (kind === "badge") return L("бейдж", "badge");
    if (kind === "glow") return L("свечение ника", "name glow");
    if (kind === "frame") return L("рамка аватара", "avatar frame");
    if (kind === "banner") return L("баннер профиля", "profile banner");
    if (kind === "highlight") return L("подсветка чата", "chat highlight");
    if (kind === "effect") return L("эффект ника", "nick effect");
    if (kind === "wallpaper") return L("обои", "wallpaper");
    if (kind === "title") return L("титул", "title");
    return L("привилегия", "privilege");
  }
  function ownedRows() {
    var w = wallet();
    if (!w) return [];
    var map = privilegeMap();
    var rows = [];
    if (w.title) rows.push({ title: w.title, kind: "title", active: false });
    var privs = Array.isArray(w.privileges) ? w.privileges : [];
    privs.forEach(function (pid) {
      pid = String(pid || "");
      if (!pid) return;
      var item = map.get(pid);
      var kind = item && item.kind ? item.kind
        : pid.indexOf("wall_") === 0 ? "wallpaper"
        : pid.indexOf("fx_") === 0 ? "effect" : "privilege";
      var title = item && item.title ? item.title
        : kind === "wallpaper" ? L("Обои: ", "Wallpaper: ") + wallTitle(pid)
        : pid;
      rows.push({
        title: title,
        kind: kind,
        active: String(w.active_effect || "") === pid
      });
    });
    return rows;
  }
  function renderOwned(force) {
    var list = q("fxed-owned-list");
    var count = q("fxed-owned-count");
    if (!list) return;
    var w = wallet();
    if (!w) {
      if (count) count.textContent = "0";
      if (!force && st.ownedSig === "guest") return;
      st.ownedSig = "guest";
      clear(list);
      list.appendChild(mk("div", "fxed-owned-empty",
        L("Войди в аккаунт, чтобы видеть покупки.", "Sign in to see your purchases.")));
      return;
    }
    var rows = ownedRows();
    var sig = JSON.stringify(rows);
    if (!force && sig === st.ownedSig) return;
    st.ownedSig = sig;
    if (count) count.textContent = String(rows.length);
    clear(list);
    if (!rows.length) {
      list.appendChild(mk("div", "fxed-owned-empty",
        L("Пока ничего не куплено. Загляни в PLUS 2 → Привилегии.",
          "Nothing purchased yet. Check PLUS 2 → Privileges.")));
      return;
    }
    rows.forEach(function (r) {
      var row = mk("div", "fxed-owned-row");
      var icon = r.kind === "wallpaper" ? "▦"
        : r.kind === "effect" ? "✦"
        : r.kind === "badge" ? "◆"
        : r.kind === "frame" ? "▣"
        : r.kind === "title" ? "✎"
        : r.kind === "highlight" ? "▤"
        : "●";
      row.appendChild(mk("span", "fxed-owned-ico", icon));
      var main = mk("div", "fxed-owned-main");
      main.appendChild(mk("b", "", r.title));
      main.appendChild(mk("small", "", kindTitle(r.kind)));
      row.appendChild(main);
      if (r.active) row.appendChild(mk("span", "fxed-owned-on", L("активно", "active")));
      list.appendChild(row);
    });
  }
  async function loadOwned(force) {
    var w = wallet();
    var map = privilegeMap();
    if (w && Array.isArray(w.privileges) && w.privileges.length && !map.size) {
      var s = safe(function () { return sb; }, null);
      if (s) {
        try {
          var r = await s.rpc("privilege_list");
          if (r && !r.error && Array.isArray(r.data)) {
            var next = new Map();
            r.data.forEach(function (it) { next.set(it.id, it); });
            safe(function () {
              if (window.fxPlus2 && window.fxPlus2.state) window.fxPlus2.state.privilegeMap = next;
            });
          }
        } catch (e) {}
      }
    }
    renderOwned(force);
  }

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    if (!tabs || !panes) return;
    if (name !== "main" && name !== "look" && name !== "acc") name = "main";
    var order = ["main", "look", "acc"];
    var oldIdx = order.indexOf(st.tab);
    var nextIdx = order.indexOf(name);
    if (oldIdx < 0) oldIdx = 0;
    panes.setAttribute("data-dir", nextIdx >= oldIdx ? "fwd" : "back");
    st.tab = name;
    Array.prototype.forEach.call(tabs.querySelectorAll("[data-fxed-tab]"), function (b) {
      var on = b.getAttribute("data-fxed-tab") === name;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      if (on) {
        b.classList.remove("fxed-tab-pop");
        void b.offsetWidth;
        b.classList.add("fxed-tab-pop");
      }
    });
    Array.prototype.forEach.call(panes.querySelectorAll("[data-fxed-pane]"), function (p) {
      var on = p.getAttribute("data-fxed-pane") === name;
      p.classList.toggle("on", on);
      p.hidden = !on;
      if (on) {
        p.classList.remove("fxed-pane-anim");
        void p.offsetWidth;
        p.classList.add("fxed-pane-anim");
      }
    });
    if (name === "look") {
      decorateWalls();
      loadOwned(true);
      setTimeout(function () { syncPreview(false); }, 0);
    }
  }

  /* ---------------- preview ---------------- */
  function syncPreview(force) {
    if (!st.open) return;
    var u = currentUser();
    var role = roleOf();
    var nickInput = q("enick");
    var bioInput = q("ebio");
    var nick = nickInput ? nickInput.value.trim() : "";
    var bio = bioInput ? bioInput.value.trim() : "";

    var nickEl = q("fxed-nick");
    if (nickEl) {
      var tx = nickEl.querySelector(".rnm");
      if (!tx) {
        tx = mk("span", "rnm");
        nickEl.insertBefore(tx, nickEl.firstChild);
      }
      var nextNick = nick || L("Твой ник", "Your nick");
      if (tx.textContent !== nextNick) tx.textContent = nextNick;
      if (u && u.id) nickEl.setAttribute("data-fx2-uid", String(u.id));
      safe(function () { setRoleClass(nickEl, role); });

    }

    var ava = q("eava");
    if (ava && u) {
      safe(function () { setRoleClass(ava, role); });
      ava.setAttribute("data-fx2-ava-uid", String(u.id));
    }

    var bioEl = q("fxed-bio");
    if (bioEl) {
      bioEl.textContent = bio || L("Пока без описания. Добавь пару строк о себе.", "No bio yet. Add a few lines about yourself.");
      bioEl.classList.toggle("empty", !bio);
    }

    var nickCount = q("fxed-nick-count");
    if (nickCount) nickCount.textContent = (nickInput ? nickInput.value.length : 0) + "/20";
    var bioCount = q("fxed-bio-count");
    if (bioCount) bioCount.textContent = (bioInput ? bioInput.value.length : 0) + "/2000";

    var email = q("fxed-email");
    if (email) email.textContent = (u && u.email) || "—";
    var previewSid = q("fxed-sid");
    if (previewSid) previewSid.textContent = u ? (u.sid ? "ID: " + u.sid : (u.id ? "ID: " + String(u.id).slice(0, 8) : "")) : "";
    var sid = q("fxed-id");
    if (sid) sid.textContent = u ? (u.sid ? "ID: " + u.sid : (u.id ? "ID: " + String(u.id).slice(0, 8) : "—")) : "—";
    var roleVal = q("fxed-role");
    if (roleVal) roleVal.textContent = u ? safe(function () { return roleLabel(role); }, role) : "—";

    var roleChip = q("fxed-role-chip");
    if (roleChip) {
      roleChip.textContent = u ? safe(function () { return roleLabel(role); }, role) : L("Гость", "Guest");
      roleChip.className = "fxed-role-chip " + role;
    }

    var w = wallet();
    var titleEl = q("fxed-title");
    if (titleEl) {
      if (w && w.title) {
        titleEl.textContent = w.title;
        titleEl.hidden = false;
      } else {
        titleEl.textContent = "";
        titleEl.hidden = true;
      }
    }

    var fxEl = q("fxed-fx");
    if (fxEl) {
      var active = w && w.active_effect;
      if (active) {
        var item = safe(function () {
          return window.fxPlus2 && window.fxPlus2.state && window.fxPlus2.state.privilegeMap
            ? window.fxPlus2.state.privilegeMap.get(active)
            : null;
        }, null);
        fxEl.textContent = "💫 " + (item && item.title ? item.title : L("эффект включён", "effect on"));
        fxEl.hidden = false;
      } else {
        fxEl.hidden = true;
      }
    }

    var gems = q("fxed-gems");
    if (gems) gems.textContent = w ? "💎 " + (Number(w.gems) || 0) : "—";
    renderOwned(false);

    var cardEl = q("fxed-card");
    var sel = document.querySelector("#wgrid .wopt.on");
    if (cardEl && sel) {
      var accent = sel.style.getPropertyValue("--wd");
      if (accent) cardEl.style.setProperty("--fxed-accent", accent);
    }
    var wallChip = q("fxed-wall-chip");
    if (wallChip) {
      var label = sel ? sel.getAttribute("data-fxed-label") : "";
      if (!label && sel) label = (sel.textContent || "").replace(/^🔒\s*/, "").replace(/✓\s*$/, "").trim();
      wallChip.textContent = label || "";
      wallChip.hidden = !label;
    }

    if (force) decorate();
  }

  /* ---------------- wall grid ---------------- */
  function decorateWalls() {
    var grid = q("wgrid");
    if (!grid) return;
    var btns = grid.querySelectorAll(".wopt");
    Array.prototype.forEach.call(btns, function (b, i) {
      var w = safe(function () { return WALLS[i]; }, null);
      if (w && !b.getAttribute("data-fxed-wall")) b.setAttribute("data-fxed-wall", w[0]);
      if (!b.getAttribute("data-fxed-label")) {
        b.setAttribute("data-fxed-label", (b.textContent || "").replace(/^🔒\s*/, "").replace(/✓\s*$/, "").trim());
      }
      if (!b.querySelector(".fxed-wall-check")) {
        var check = mk("span", "fxed-wall-check", "✓");
        b.appendChild(check);
      }
    });
    syncPreview(false);
  }

  /* ---------------- open / close ---------------- */
  function onOpen() {
    st.open = true;
    st.lastFocus = document.activeElement;
    var u = currentUser();
    var ava = q("eava");
    if (ava) {
      if (u) {
        safe(function () { setRoleClass(ava, u.role); });
        ava.setAttribute("data-fx2-ava-uid", String(u.id));
      }
      ava.setAttribute("role", "button");
      ava.setAttribute("tabindex", "0");
      ava.setAttribute("aria-label", L("Сменить аватар", "Change avatar"));
    }
    var nickEl = q("fxed-nick");
    if (nickEl && u) nickEl.setAttribute("data-fx2-uid", String(u.id));

    showTab("main");
    syncPreview(true);
    setTimeout(function () { syncPreview(true); }, 350);
    setTimeout(function () { syncPreview(false); }, 900);
    if (window.fxPlus2 && typeof window.fxPlus2.reload === "function" && !wallet()) {
      safe(function () { window.fxPlus2.reload(); });
    }
    clearInterval(st.timer);
    st.timer = setInterval(function () { syncPreview(false); }, 2200);
    document.body.classList.add("fxed-lock");
    safe(function () { card.focus({ preventScroll: true }); });
  }

  function onClose() {
    if (!st.open) return;
    st.open = false;
    clearInterval(st.timer);
    st.timer = 0;
    document.body.classList.remove("fxed-lock");
    var nickEl = q("fxed-nick");
    if (nickEl) nickEl.removeAttribute("data-fx2-uid");
    var ava = q("eava");
    if (ava) ava.removeAttribute("data-fx2-ava-uid");
    if (st.lastFocus && typeof st.lastFocus.focus === "function") {
      safe(function () { st.lastFocus.focus({ preventScroll: true }); });
    }
  }

  /* ---------------- pencil spin ---------------- */
  function bindPen() {
    var pen = q("pen");
    if (!pen || pen.getAttribute("data-fxed-pen") === "1") return;
    pen.setAttribute("data-fxed-pen", "1");
    var original = pen.onclick;
    pen.onclick = function (e) {
      if (st.spinning) {
        if (e) e.preventDefault();
        return;
      }
      var reduce = safe(function () {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      }, false);
      var open = function () {
        pen.classList.remove("fxed-spin");
        pen.removeAttribute("aria-busy");
        st.spinning = false;
        if (typeof original === "function") original.call(pen, e);
      };
      if (reduce) { open(); return; }
      st.spinning = true;
      pen.setAttribute("aria-busy", "true");
      pen.classList.remove("fxed-spin");
      void pen.offsetWidth;
      pen.classList.add("fxed-spin");
      setTimeout(open, 640);
    };
  }

  /* ---------------- events ---------------- */
  function bind() {
    var close = q("fxed-close");
    if (close) close.onclick = function () {
      var no = q("eno");
      if (no) no.click();
      else safe(function () { closeEdit(true); });
    };

    var ava = q("eava");
    if (ava) {
      ava.addEventListener("click", function () {
        var f = q("file2");
        if (f) f.click();
      });
      ava.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          var f = q("file2");
          if (f) f.click();
        }
      });
      ["dragenter", "dragover"].forEach(function (ev) {
        ava.addEventListener(ev, function (e) {
          e.preventDefault();
          ava.classList.add("fxed-drop");
        });
      });
      ["dragleave", "dragend", "drop"].forEach(function (ev) {
        ava.addEventListener(ev, function () { ava.classList.remove("fxed-drop"); });
      });
      ava.addEventListener("drop", function (e) {
        e.preventDefault();
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (!f || !/^image\//i.test(f.type || "")) return;
        safe(function () {
          cropToData(f).then(function (data) {
            safe(function () { eAva = data; });
            safe(function () { setAva(ava, data, false); });
            syncPreview(false);
          }).catch(function () {
            safe(function () { toast(t("err_generic")); });
          });
        });
      });
    }

    var clearAva = q("fxed-ava-clear");
    if (clearAva) clearAva.onclick = function () {
      safe(function () { eAva = null; });
      safe(function () { setAva(q("eava"), null, false); });
      syncPreview(false);
    };

    var enick = q("enick");
    if (enick) enick.addEventListener("input", function () { syncPreview(false); });
    var ebio = q("ebio");
    if (ebio) ebio.addEventListener("input", function () { syncPreview(false); });
    var wgrid = q("wgrid");
    if (wgrid) wgrid.addEventListener("click", function () {
      setTimeout(function () { decorateWalls(); syncPreview(false); }, 0);
    });
    var ewallup = q("ewallup");
    if (ewallup) ewallup.addEventListener("click", function () {
      setTimeout(function () { decorateWalls(); syncPreview(false); }, 400);
    });

    if (tabs) {
      tabs.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest("[data-fxed-tab]") : null;
        if (b) showTab(b.getAttribute("data-fxed-tab"));
      });
      tabs.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        var list = Array.prototype.slice.call(tabs.querySelectorAll("[data-fxed-tab]"));
        var idx = list.indexOf(document.activeElement);
        if (idx < 0) return;
        e.preventDefault();
        idx = (idx + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length;
        list[idx].focus();
        showTab(list[idx].getAttribute("data-fxed-tab"));
      });
    }

    document.addEventListener("keydown", function (e) {
      if (!st.open) return;
      if (e.key === "Escape") {
        var other = document.querySelector("#pmodal.show,#modal.show,#bmodal.show,#edmodal.show,#fx2modal.show,#fx2panel.show,#fxpanel.show");
        if (other) return;
        e.preventDefault();
        var no = q("eno");
        if (no) no.click();
        return;
      }
      if (e.key === "Tab") trapFocus(e);
    });
  }

  function trapFocus(e) {
    if (!card) return;
    var nodes = card.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])');
    var list = Array.prototype.filter.call(nodes, function (el) {
      return el.offsetParent !== null;
    });
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function refreshLabels() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-fxed-ru]"), function (el) {
      el.textContent = L(el.getAttribute("data-fxed-ru"), el.getAttribute("data-fxed-en"));
    });
    var close = q("fxed-close");
    if (close) close.setAttribute("aria-label", L("Закрыть", "Close"));
    var ava = q("eava");
    if (ava) ava.setAttribute("aria-label", L("Сменить аватар", "Change avatar"));
    syncPreview(false);
  }

  /* ---------------- observers ---------------- */
  function watch() {
    new MutationObserver(function () {
      var open = modal.classList.contains("show");
      if (open) onOpen();
      else onClose();
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });

    var grid = q("wgrid");
    if (grid) {
      new MutationObserver(function () { decorateWalls(); }).observe(grid, { childList: true });
    }

    new MutationObserver(function () { refreshLabels(); }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"]
    });
  }

  function init() {
    modal = q("emodal");
    if (!modal) return;
    card = modal.querySelector(".mcard");
    if (!card) return;
    if (card.getAttribute("data-fxed") === "1") return;
    build();
    bind();
    bindPen();
    watch();
    modal.classList.add("fxed-ready");
    if (typeof window !== "undefined") {
      window.fxProfileEdit = {
        version: VERSION,
        open: function () { safe(function () { openEdit(); }); },
        refresh: function () { syncPreview(true); },
        showTab: showTab
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
