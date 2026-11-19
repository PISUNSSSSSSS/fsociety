/* ============================================================
   fsociety CLANS — кланы и клан-теги.
   Нужен sql/clans.sql в Supabase. Тег клана рисуется перед ником
   везде, где сайт вызывает richName() (см. name_tags в index.html).
   ============================================================ */
(function () {
  "use strict";

  var COLORS = ["#ff2b3a", "#f59e0b", "#facc15", "#4ade80", "#2dd4bf", "#38bdf8", "#a78bfa", "#f472b6", "#e5e5e5"];
  var TAG_RE = /^[A-Z0-9А-ЯЁ]{2,5}$/;
  var HEX6 = /^#[0-9a-f]{6}$/i;
  var MAX_MEMBERS = 100;
  var st = { my: null, myUid: null, myAt: 0, myLoading: null, missing: false, selfTimer: 0 };

  /* ---------------- helpers ---------------- */
  function q(id) { return document.getElementById(id); }
  function L(ru, en) { try { return lang === "en" ? en : ru; } catch (e) { return ru; } }
  function mk(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function btn(cls, text, onClick) {
    var b = mk("button", cls, text);
    b.type = "button";
    if (onClick) b.onclick = onClick;
    return b;
  }
  function client() { try { return sb; } catch (e) { return null; } }
  function me() { try { return user; } catch (e) { return null; } }
  function say(msg) { try { toast(msg); } catch (e) {} }
  function siteRank() { try { return myRank(); } catch (e) { return 0; } }
  function forget(id) { try { if (id) ntForget(id); } catch (e) {} }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(L("ru-RU", "en-GB")); } catch (e) { return ""; }
  }
  function missingFn(e) {
    try { if (typeof isMissingFn === "function") return isMissingFn(e); } catch (x) {}
    var m = String((e && e.message) || "");
    return !!e && (e.code === "PGRST202" || /could not find the function/i.test(m));
  }
  async function rpc(name, args) {
    var s = client();
    if (!s) throw new Error("offline");
    var r = await s.rpc(name, args || {});
    if (r.error) {
      if (missingFn(r.error)) st.missing = true;
      throw r.error;
    }
    return r.data;
  }
  function errText(e) {
    var m = String((e && e.message) || "").toLowerCase();
    if (missingFn(e)) return L("Кланы ещё не подключены на сервере", "Clans are not enabled on the server yet");
    if (m.indexOf("tag taken") > -1) return L("Этот тег уже занят", "This tag is already taken");
    if (m.indexOf("bad tag") > -1) return L("Тег: 2–5 букв или цифр", "Tag: 2–5 letters or digits");
    if (m.indexOf("bad name") > -1) return L("Название: от 2 до 32 символов", "Name: 2–32 characters");
    if (m.indexOf("already in clan") > -1) return L("Ты уже состоишь в клане", "You are already in a clan");
    if (m.indexOf("bad code") > -1) return L("Неверный код приглашения", "Wrong invite code");
    if (m.indexOf("clan full") > -1) return L("В клане уже " + MAX_MEMBERS + " участников", "The clan already has " + MAX_MEMBERS + " members");
    if (m.indexOf("owner must transfer") > -1) return L("Сначала передай клан другому участнику или распусти его", "Transfer the clan to another member or disband it first");
    if (m.indexOf("not allowed") > -1) return L("Недостаточно прав", "Not allowed");
    try { return t("err_generic"); } catch (x) { return "Error"; }
  }
  function normTag(v) {
    return String(v || "").toUpperCase().replace(/[^A-Z0-9А-ЯЁ]/g, "").slice(0, 5);
  }
  function tagEl(tag, color, big) {
    var s = mk("span", "ctag" + (big ? " ctag-lg" : ""), tag || "");
    if (HEX6.test(color || "")) s.style.setProperty("--cc", color);
    return s;
  }
  function clanRoleLabel(r) {
    if (r === "owner") return L("Глава", "Leader");
    if (r === "officer") return L("Офицер", "Officer");
    return L("Участник", "Member");
  }
  function membersWord(n) {
    n = Math.abs(Number(n) || 0);
    if (L("ru", "en") === "en") return n + (n === 1 ? " member" : " members");
    var a = n % 100, b = n % 10;
    var w = (a > 10 && a < 20) ? "участников" : b === 1 ? "участник" : (b >= 2 && b <= 4) ? "участника" : "участников";
    return n + " " + w;
  }
  function confirmThen(msg, fn) {
    try { askConfirm(msg, fn); } catch (e) { if (window.confirm(msg)) fn(); }
  }
  function openModal(title, builder) {
    openFormModal(title, builder);
    var fm = q("formmodal");
    if (fm) fm.setAttribute("data-kind", "clan");
  }
  function closeModal() { try { closeFormModal(); } catch (e) {} }

  /* ---------------- my clan ---------------- */
  async function loadMy(force) {
    var u = me();
    if (!u || !client()) { st.my = null; st.myUid = null; return null; }
    if (!force && st.myUid === u.id && Date.now() - st.myAt < 60000) return st.my;
    if (st.myLoading) return st.myLoading;
    st.myLoading = (async function () {
      try {
        var rows = await rpc("clan_my");
        st.my = (rows && rows[0]) || null;
        st.missing = false;
      } catch (e) {
        if (!missingFn(e)) throw e;
        st.my = null;
      } finally {
        st.myUid = u.id;
        st.myAt = Date.now();
        st.myLoading = null;
      }
      return st.my;
    })();
    try { return await st.myLoading; } catch (e) { return st.my; }
  }

  async function afterChange(ids) {
    var u = me();
    if (u) forget(u.id);
    (ids || []).forEach(forget);
    await loadMy(true);
    renderSelfCard();
    try { if (me()) renderUser(); } catch (e) {}
  }

  /* ---------------- profile card ---------------- */
  function selfCardEl() {
    var el = q("pclan");
    if (el) return el;
    var bio = q("pbio");
    if (!bio || !bio.parentNode) return null;
    el = mk("div", "clan-card glass");
    el.id = "pclan";
    bio.parentNode.insertBefore(el, bio.nextSibling);
    return el;
  }

  function renderSelfCard() {
    var el = selfCardEl();
    if (!el) return;
    var u = me();
    el.textContent = "";
    if (!u) { el.hidden = true; return; }
    if (st.missing) {
      el.hidden = siteRank() < 4;
      el.appendChild(mk("div", "clan-k", L("Кланы", "Clans")));
      el.appendChild(mk("p", "clan-note", L(
        "Кланы включатся после запуска sql/clans.sql в Supabase → SQL Editor.",
        "Clans turn on after running sql/clans.sql in Supabase → SQL Editor.")));
      return;
    }
    el.hidden = false;
    el.appendChild(mk("div", "clan-k", L("Клан", "Clan")));
    var c = st.my;
    if (c) {
      var open = btn("clan-open", null, function () { openClan(c.id); });
      open.appendChild(tagEl(c.tag, c.color, true));
      var mid = mk("span", "clan-open-main");
      mid.appendChild(mk("b", "", c.name));
      mid.appendChild(mk("small", "", membersWord(c.members) + " · " + clanRoleLabel(c.my_role)));
      open.appendChild(mid);
      open.appendChild(mk("span", "clan-chev", "›"));
      el.appendChild(open);
      return;
    }
    el.appendChild(mk("p", "clan-note", L(
      "Ты пока не в клане. Создай свой — и тег будет стоять перед ником везде на сайте.",
      "You are not in a clan yet. Create one and its tag will show before your nick everywhere.")));
    var row = mk("div", "clan-btns");
    row.appendChild(btn("btn main sm", L("Создать клан", "Create clan"), openCreate));
    row.appendChild(btn("btn glass sm", L("Вступить по коду", "Join by code"), openJoin));
    row.appendChild(btn("btn glass sm", L("Все кланы", "All clans"), openList));
    el.appendChild(row);
  }

  function onSelf() {
    clearTimeout(st.selfTimer);
    st.selfTimer = setTimeout(async function () {
      var u = me();
      if (!u) { st.my = null; st.myUid = null; renderSelfCard(); return; }
      renderSelfCard();
      var fresh = st.myUid === u.id && Date.now() - st.myAt < 60000;
      if (!fresh) { await loadMy(true); renderSelfCard(); }
    }, 30);
  }

  /* ---------------- someone else's profile ---------------- */
  async function onProfile(p) {
    var badge = q("u_badge");
    if (!badge || !p) return;
    var row = q("u_clan");
    if (!row) {
      row = btn("clan-urow");
      row.id = "u_clan";
      badge.parentNode.insertBefore(row, badge.nextSibling);
    }
    row.hidden = true;
    row.textContent = "";
    row.onclick = null;
    var pid = String(p.id);
    row.setAttribute("data-uid", pid);
    var info = null;
    try {
      var c = nameTags.get(pid);
      if (c && c.at && Date.now() - c.at < 60000 && c.role !== undefined) info = c.tag ? { clan_id: c.clan, clan_tag: c.tag, clan_color: c.color, clan_name: c.cname } : {};
    } catch (e) {}
    if (!info) {
      try {
        var rows = await rpc("name_tags", { p_ids: [pid] });
        info = (rows && rows[0]) || {};
      } catch (e) { info = {}; }
    }
    if (row.getAttribute("data-uid") !== pid || !info.clan_id) return;
    row.appendChild(mk("span", "clan-urow-k", L("Клан", "Clan")));
    row.appendChild(tagEl(info.clan_tag, info.clan_color));
    row.appendChild(mk("span", "clan-urow-name", info.clan_name || ""));
    row.appendChild(mk("span", "clan-chev", "›"));
    row.onclick = function () { openClan(info.clan_id); };
    row.hidden = false;
  }

  /* ---------------- clan card ---------------- */
  async function openClan(id) {
    if (!id) return;
    var c, members;
    try {
      var res = await Promise.all([rpc("clan_get", { p_clan: Number(id) }), rpc("clan_members", { p_clan: Number(id) })]);
      c = res[0] && res[0][0];
      members = res[1] || [];
    } catch (e) { say(errText(e)); return; }
    if (!c) { say(L("Клан не найден", "Clan not found")); return; }
    var u = me();
    var mine = c.my_role || null;
    var ids = members.map(function (m) { return m.user_id; });

    openModal(L("Клан", "Clan"), function (body) {
      var head = mk("div", "clan-head");
      head.style.setProperty("--cc", HEX6.test(c.color || "") ? c.color : "#e5e5e5");
      head.appendChild(tagEl(c.tag, c.color, true));
      head.appendChild(mk("div", "clan-name", c.name));
      if (c.description) head.appendChild(mk("div", "clan-desc", c.description));
      head.appendChild(mk("div", "clan-meta",
        membersWord(c.members) + " / " + MAX_MEMBERS + " · " + L("создан ", "since ") + fmtDate(c.created_at)));
      body.appendChild(head);

      var acts = mk("div", "clan-btns");
      if (mine === "owner") {
        acts.appendChild(btn("btn glass sm", L("Настроить", "Settings"), function () { openEdit(c, ids); }));
        acts.appendChild(btn("btn glass sm danger", L("Распустить", "Disband"), function () {
          confirmThen(L("Распустить клан [" + c.tag + "]? Тег пропадёт у всех участников.", "Disband [" + c.tag + "]? The tag disappears for every member."), async function () {
            try { await rpc("clan_delete", { p_clan: Number(c.id) }); closeModal(); say(L("Клан распущен", "Clan disbanded")); await afterChange(ids); }
            catch (e) { say(errText(e)); }
          });
        }));
      } else if (mine) {
        acts.appendChild(btn("btn glass sm danger", L("Выйти из клана", "Leave clan"), function () {
          confirmThen(L("Выйти из клана [" + c.tag + "]?", "Leave [" + c.tag + "]?"), async function () {
            try { await rpc("clan_leave"); closeModal(); say(L("Ты вышел из клана", "You left the clan")); await afterChange([]); }
            catch (e) { say(errText(e)); }
          });
        }));
      }
      if (mine !== "owner" && siteRank() >= 3) {
        acts.appendChild(btn("btn glass sm danger", L("Удалить (модерация)", "Delete (moderation)"), function () {
          confirmThen(L("Удалить клан [" + c.tag + "] у всех участников?", "Delete clan [" + c.tag + "] for every member?"), async function () {
            try { await rpc("clan_delete", { p_clan: Number(c.id) }); closeModal(); say(L("Клан удалён", "Clan deleted")); await afterChange(ids); }
            catch (e) { say(errText(e)); }
          });
        }));
      }
      if (acts.children.length) body.appendChild(acts);

      if (c.invite_code) {
        var inv = mk("div", "clan-invite");
        inv.appendChild(mk("div", "formhint", L("Код приглашения — отправь его тем, кого зовёшь в клан:", "Invite code — send it to people you invite:")));
        var code = mk("div", "formcode", c.invite_code);
        inv.appendChild(code);
        var ir = mk("div", "clan-btns");
        ir.appendChild(btn("btn glass sm", L("Копировать", "Copy"), function () {
          try { copyText(c.invite_code); } catch (e) {}
        }));
        ir.appendChild(btn("btn glass sm", L("Новый код", "New code"), function () {
          confirmThen(L("Старый код перестанет работать. Продолжить?", "The old code will stop working. Continue?"), async function () {
            try { var nc = await rpc("clan_regen_invite"); c.invite_code = nc; code.textContent = nc; say(L("Код обновлён", "Code updated")); }
            catch (e) { say(errText(e)); }
          });
        }));
        inv.appendChild(ir);
        body.appendChild(inv);
      }

      body.appendChild(mk("div", "clan-sec", L("Участники", "Members") + " · " + members.length));
      var list = mk("div", "clan-list");
      members.forEach(function (m) {
        var row = mk("div", "pickrow clan-mrow");
        var av = mk("div", "ava");
        try { setAva(av, m.avatar, false); setRoleClass(av, m.user_role || "user"); } catch (e) {}
        row.appendChild(av);
        var gr = mk("div", "grow");
        var nm = mk("button", "pname clan-mnick");
        nm.type = "button";
        try { richName(nm, m.user_id, (m.nick || "?") + (u && m.user_id === u.id ? L(" (ты)", " (you)") : ""), m.user_role); }
        catch (e) { nm.textContent = m.nick || "?"; }
        nm.onclick = function () { closeModal(); try { openProfile(m.user_id); } catch (e) {} };
        gr.appendChild(nm);
        gr.appendChild(mk("div", "gsub clan-role-" + m.clan_role, clanRoleLabel(m.clan_role)));
        row.appendChild(gr);
        var opts = memberActions(c, mine, m, u, ids);
        if (opts.length) {
          var more = btn("mini clan-more", "⋯");
          more.setAttribute("aria-label", L("Действия", "Actions"));
          more.onclick = function () {
            try {
              openSheet(m.nick || "?", opts.map(function (o, i) { return { v: i, label: o.label }; }), -1, function (i) { opts[i].run(); });
            } catch (e) {}
          };
          row.appendChild(more);
        }
        list.appendChild(row);
      });
      body.appendChild(list);
    });
  }

  function memberActions(c, mine, m, u, ids) {
    var out = [];
    if (!u || m.user_id === u.id || !mine) return out;
    var nick = m.nick || "?";
    var reopen = function () { openClan(c.id); };
    if (mine === "owner") {
      if (m.clan_role === "officer") out.push({ label: L("Сделать участником", "Make member"), run: function () { setRole(m.user_id, "member", reopen); } });
      else out.push({ label: L("Сделать офицером", "Make officer"), run: function () { setRole(m.user_id, "officer", reopen); } });
      out.push({ label: L("Передать клан", "Transfer clan"), run: function () {
        confirmThen(L("Передать клан игроку " + nick + "? Ты станешь офицером.", "Transfer the clan to " + nick + "? You will become an officer."), function () {
          setRole(m.user_id, "owner", async function () { await afterChange([]); reopen(); });
        });
      } });
    }
    if (mine === "owner" || (mine === "officer" && m.clan_role === "member")) {
      out.push({ label: L("Исключить из клана", "Kick from clan"), run: function () {
        confirmThen(L("Исключить " + nick + " из клана?", "Kick " + nick + " from the clan?"), async function () {
          try { await rpc("clan_kick", { p_user: m.user_id }); say(L("Игрок исключён", "Member kicked")); forget(m.user_id); await afterChange([]); reopen(); }
          catch (e) { say(errText(e)); }
        });
      } });
    }
    return out;
  }

  async function setRole(uid, role, done) {
    try {
      await rpc("clan_set_role", { p_user: uid, p_role: role });
      say(L("Готово", "Done"));
      if (done) await done();
    } catch (e) { say(errText(e)); }
  }

  /* ---------------- create / edit ---------------- */
  function clanForm(body, init, submitLabel, onSubmit) {
    var u = me();
    var color = HEX6.test((init && init.color) || "") ? init.color.toLowerCase() : COLORS[0];

    var prev = mk("div", "clan-prev");
    var pTag = tagEl("", color);
    var pNick = mk("span", "nm");
    pNick.setAttribute("data-role", (u && u.role) || "user");
    pNick.setAttribute("data-rfix", "1");
    pNick.appendChild(mk("span", "rnm", (u && u.nick) || L("ник", "nick")));
    prev.appendChild(pTag);
    prev.appendChild(pNick);
    body.appendChild(mk("div", "formhint", L("Так тег будет выглядеть в чате:", "This is how the tag looks in chat:")));
    body.appendChild(prev);

    var tag = mk("input", "glass");
    tag.type = "text"; tag.maxLength = 5; tag.autocomplete = "off";
    tag.setAttribute("autocapitalize", "characters");
    tag.placeholder = L("Тег (2–5 букв/цифр)", "Tag (2–5 letters/digits)");
    tag.value = (init && init.tag) || "";
    body.appendChild(tag);

    var name = mk("input", "glass");
    name.type = "text"; name.maxLength = 32; name.autocomplete = "off";
    name.placeholder = L("Название клана", "Clan name");
    name.value = (init && init.name) || "";
    body.appendChild(name);

    body.appendChild(mk("div", "formhint", L("Цвет тега", "Tag color")));
    var sw = mk("div", "clan-swatches");
    var customWrap = mk("label", "clan-sw clan-sw-custom");
    customWrap.title = L("Свой цвет", "Custom color");
    var custom = mk("input");
    custom.type = "color";
    custom.setAttribute("aria-label", L("Свой цвет", "Custom color"));
    customWrap.appendChild(custom);
    function paint() {
      pTag.textContent = normTag(tag.value) || "TAG";
      pTag.style.setProperty("--cc", color);
      Array.prototype.forEach.call(sw.querySelectorAll(".clan-sw"), function (b) {
        b.classList.toggle("on", b.getAttribute("data-c") === color);
      });
      custom.value = color;
      var own = COLORS.indexOf(color) < 0;
      customWrap.classList.toggle("on", own);
      if (own) customWrap.style.setProperty("--sw", color); else customWrap.style.removeProperty("--sw");
    }
    COLORS.forEach(function (cc) {
      var b = btn("clan-sw", null, function () { color = cc; paint(); });
      b.setAttribute("data-c", cc);
      b.style.setProperty("--sw", cc);
      b.setAttribute("aria-label", cc);
      sw.appendChild(b);
    });
    custom.oninput = function () { if (HEX6.test(custom.value)) { color = custom.value.toLowerCase(); paint(); } };
    sw.appendChild(customWrap);
    body.appendChild(sw);

    var desc = mk("textarea", "glass");
    desc.maxLength = 300;
    desc.placeholder = L("Описание (необязательно)", "Description (optional)");
    desc.value = (init && init.description) || "";
    body.appendChild(desc);

    var err = mk("div", "err");
    body.appendChild(err);
    var go = btn("btn main", submitLabel);
    body.appendChild(go);

    tag.oninput = function () {
      var v = normTag(tag.value);
      if (v !== tag.value) tag.value = v;
      paint();
    };
    go.onclick = async function () {
      var v = { tag: normTag(tag.value), name: name.value.trim(), color: color, description: desc.value.trim() };
      if (!TAG_RE.test(v.tag)) { err.textContent = L("Тег: 2–5 букв или цифр", "Tag: 2–5 letters or digits"); tag.focus(); return; }
      if (v.name.length < 2 || v.name.length > 32) { err.textContent = L("Название: от 2 до 32 символов", "Name: 2–32 characters"); name.focus(); return; }
      err.textContent = "";
      go.disabled = true;
      try { await onSubmit(v); }
      catch (e) { err.textContent = errText(e); go.disabled = false; }
    };
    paint();
    setTimeout(function () { try { tag.focus(); } catch (e) {} }, 150);
  }

  function openCreate() {
    if (!me()) { try { go("register"); } catch (e) {} return; }
    openModal(L("Новый клан", "New clan"), function (body) {
      clanForm(body, null, L("Создать клан", "Create clan"), async function (v) {
        var id = await rpc("clan_create", { p_tag: v.tag, p_name: v.name, p_color: v.color, p_description: v.description });
        closeModal();
        say(L("Клан [" + v.tag + "] создан", "Clan [" + v.tag + "] created"));
        await afterChange([]);
        if (id) openClan(id);
      });
    });
  }

  function openEdit(c, ids) {
    openModal(L("Настройки клана", "Clan settings"), function (body) {
      clanForm(body, c, L("Сохранить", "Save"), async function (v) {
        await rpc("clan_update", { p_tag: v.tag, p_name: v.name, p_color: v.color, p_description: v.description });
        closeModal();
        say(L("Сохранено", "Saved"));
        await afterChange(ids);
        openClan(c.id);
      });
    });
  }

  function openJoin() {
    if (!me()) { try { go("register"); } catch (e) {} return; }
    openModal(L("Вступить в клан", "Join a clan"), function (body) {
      body.appendChild(mk("div", "formhint", L("Попроси код у главы или офицера клана.", "Ask the clan leader or an officer for the code.")));
      var code = mk("input", "glass");
      code.type = "text"; code.maxLength = 32; code.autocomplete = "off";
      code.setAttribute("autocapitalize", "characters");
      code.placeholder = L("Код приглашения", "Invite code");
      body.appendChild(code);
      var err = mk("div", "err");
      body.appendChild(err);
      var go2 = btn("btn main", L("Вступить", "Join"));
      body.appendChild(go2);
      go2.onclick = async function () {
        var v = code.value.trim();
        if (v.length < 6) { err.textContent = L("Введи код целиком", "Enter the full code"); return; }
        go2.disabled = true;
        try {
          var id = await rpc("clan_join", { p_code: v });
          closeModal();
          say(L("Ты в клане!", "You joined the clan!"));
          await afterChange([]);
          if (id) openClan(id);
        } catch (e) { err.textContent = errText(e); go2.disabled = false; }
      };
      setTimeout(function () { try { code.focus(); } catch (e) {} }, 150);
    });
  }

  function openList() {
    openModal(L("Кланы", "Clans"), function (body) {
      var search = mk("input", "glass");
      search.type = "text"; search.autocomplete = "off"; search.setAttribute("inputmode", "search"); search.setAttribute("enterkeyhint", "search");
      search.placeholder = L("Поиск по тегу или названию", "Search by tag or name");
      body.appendChild(search);
      var list = mk("div", "clan-list");
      body.appendChild(list);
      var timer = 0, seq = 0;
      async function load() {
        var my = ++seq;
        list.textContent = "";
        list.appendChild(mk("p", "formhint", L("Загрузка...", "Loading...")));
        var rows = [];
        try { rows = (await rpc("clan_list", { p_search: search.value.trim() || null, p_limit: 50 })) || []; }
        catch (e) { if (my === seq) { list.textContent = ""; list.appendChild(mk("p", "formhint", errText(e))); } return; }
        if (my !== seq) return;
        list.textContent = "";
        if (!rows.length) {
          list.appendChild(mk("p", "formhint", search.value.trim()
            ? L("Ничего не найдено", "Nothing found")
            : L("Кланов пока нет. Создай первый!", "No clans yet. Create the first one!")));
          return;
        }
        rows.forEach(function (c, i) {
          var row = btn("pickrow clan-lrow", null, function () { openClan(c.id); });
          row.appendChild(mk("span", "clan-rank", String(i + 1)));
          row.appendChild(tagEl(c.tag, c.color));
          var gr = mk("span", "grow");
          gr.appendChild(mk("span", "pname", c.name));
          gr.appendChild(mk("span", "gsub", membersWord(c.members)));
          row.appendChild(gr);
          row.appendChild(mk("span", "clan-chev", "›"));
          list.appendChild(row);
        });
      }
      search.oninput = function () { clearTimeout(timer); timer = setTimeout(load, 300); };
      load();
    });
  }

  /* ---------------- wiring ---------------- */
  function bind() {
    var fm = q("formmodal");
    if (fm) {
      new MutationObserver(function () {
        if (!fm.classList.contains("show")) fm.removeAttribute("data-kind");
      }).observe(fm, { attributes: true, attributeFilter: ["class"] });
    }
    // клик по клан-тегу в профиле открывает клан
    document.addEventListener("click", function (e) {
      var tg = e.target && e.target.closest ? e.target.closest("#pnick .ctag, #u_nick .ctag") : null;
      if (!tg) return;
      var host = tg.parentNode;
      var uid = host && host.getAttribute("data-uid");
      var info = null;
      try { info = uid ? nameTags.get(uid) : null; } catch (x) {}
      if (info && info.clan) { e.stopPropagation(); openClan(info.clan); }
    });
  }

  bind();
  window.fsClans = {
    onSelf: onSelf,
    onProfile: onProfile,
    open: openClan,
    create: openCreate,
    join: openJoin,
    list: openList,
    reload: function () { return loadMy(true).then(renderSelfCard); }
  };
  try { if (me()) onSelf(); } catch (e) {}
})();
