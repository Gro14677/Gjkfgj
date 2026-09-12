/* Каркас приложения: вход, маршрутизация, шапка, боковое меню, палитра команд. */

(function () {
  const GI = (window.GI = window.GI || {});
  const { $, $$, esc, icon, fmt } = { $: GI.$, $$: GI.$$, esc: GI.esc, icon: GI.icon, fmt: GI.fmt };
  const t = (k) => GI.t(k);
  const S = () => GI.store.state;
  const AUTH_KEY = "globus-iptv:auth";

  const ROUTES = [
    { id: "overview", icon: "grid", group: "nav.main" },
    { id: "lines", icon: "users", group: "nav.main" },
    { id: "channels", icon: "tv", group: "nav.main" },
    { id: "playlists", icon: "list", group: "nav.main" },
    { id: "devices", icon: "device", group: "nav.main" },
    { id: "stats", icon: "chart", group: "nav.main" },
    { id: "billing", icon: "wallet", group: "nav.money" },
    { id: "pricing", icon: "tag", group: "nav.money" },
    { id: "partners", icon: "gift", group: "nav.money" },
    { id: "support", icon: "chat", group: "nav.other" },
    { id: "settings", icon: "gear", group: "nav.other" },
  ];

  const logoMark = (size) => `<span class="logo-mark" style="${size ? `width:${size}px;height:${size}px` : ""}">${icon("globe", size ? size - 18 : 24)}</span>`;

  function applyPrefs() {
    document.documentElement.setAttribute("data-theme", S().prefs.theme);
    GI.lang = S().prefs.lang;
    document.documentElement.lang = GI.lang;
  }

  /* ---------- Экран входа ---------- */

  function renderAuth(mode) {
    applyPrefs();
    const signup = mode === "signup";
    document.body.innerHTML = `
      <div class="auth">
        <div class="auth-promo">
          <div class="logo">${logoMark()}<span class="logo-text">Globus<small>IPTV</small></span></div>
          <h1>${esc(t("auth.title1"))} <span>${esc(t("auth.title2"))}</span></h1>
          <p class="lead">${esc(t("auth.lead"))}</p>
          <ul class="promo-list">
            ${[["bolt", "auth.f1t", "auth.f1d"], ["device", "auth.f2t", "auth.f2d"],
               ["wallet", "auth.f3t", "auth.f3d"], ["shield", "auth.f4t", "auth.f4d"]].map((f) => `
              <li><span class="ico">${icon(f[0], 17)}</span><span><b>${esc(t(f[1]))}</b>${esc(t(f[2]))}</span></li>`).join("")}
          </ul>
          <div class="auth-stats">
            <div><span>4 200+</span><small>${esc(t("auth.channels"))}</small></div>
            <div><span>99,9%</span><small>${esc(t("auth.uptime"))}</small></div>
            <div><span>24/7</span><small>${esc(t("auth.support"))}</small></div>
            <div><span>14</span><small>${esc(GI.lang === "en" ? "days catch-up" : "дней архива")}</small></div>
          </div>
        </div>
        <div class="auth-form-wrap">
          <div class="card auth-card">
            <div class="tabs" style="margin-bottom:20px">
              <button class="${signup ? "" : "on"}" data-mode="signin">${esc(t("auth.signin"))}</button>
              <button class="${signup ? "on" : ""}" data-mode="signup">${esc(t("auth.signup"))}</button>
            </div>
            <form id="auth-form" style="display:grid;gap:14px">
              ${signup ? `<div class="field"><label>${esc(t("auth.name"))}</label><input class="input" id="a-name" value=""></div>
                          <div class="field"><label>${esc(t("auth.email"))}</label><input class="input" id="a-mail" type="email"></div>` : ""}
              <div class="field"><label>${esc(t("common.login"))}</label>
                <input class="input" id="a-user" autocomplete="username" placeholder="demo"></div>
              <div class="field"><label>${esc(t("common.password"))}</label>
                <input class="input" id="a-pass" type="password" autocomplete="current-password" placeholder="demo"></div>
              <div class="row">
                <label class="row" style="gap:8px;font-size:13px;color:var(--text-dim);cursor:pointer">
                  <input type="checkbox" id="a-remember" checked> ${esc(t("auth.remember"))}</label>
                <div class="spacer"></div>
                <a class="hint" href="#" id="a-forgot">${esc(t("auth.forgot"))}</a>
              </div>
              <button class="btn primary" type="submit" style="justify-content:center">
                ${icon("logout", 16)} ${esc(signup ? t("auth.create") : t("auth.submit"))}</button>
              <div id="a-err" class="hint" style="color:var(--danger);min-height:16px"></div>
            </form>
            <div style="border-top:1px solid var(--line);margin-top:16px;padding-top:16px;display:grid;gap:10px">
              <p class="hint" style="margin:0">${esc(signup ? t("auth.regNote") : t("auth.demoNote"))}</p>
              ${signup ? "" : `<button class="btn sm ghost" id="a-fill" style="justify-content:center">${esc(t("auth.fillDemo"))}</button>`}
              <div class="row" style="justify-content:center;gap:8px">
                <button class="btn sm ghost" id="a-theme">${icon(S().prefs.theme === "dark" ? "sun" : "moon", 14)}</button>
                <button class="btn sm ghost" id="a-lang">${S().prefs.lang === "ru" ? "EN" : "RU"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    $$("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => renderAuth(b.getAttribute("data-mode"))));
    const fill = $("#a-fill");
    if (fill) fill.addEventListener("click", () => {
      $("#a-user").value = "demo";
      $("#a-pass").value = "demo";
    });
    $("#a-forgot").addEventListener("click", (e) => {
      e.preventDefault();
      GI.toast(GI.lang === "en" ? "Demo mode: use demo / demo" : "Демо-режим: используйте demo / demo", "info");
    });
    $("#a-theme").addEventListener("click", () => {
      S().prefs.theme = S().prefs.theme === "dark" ? "light" : "dark";
      GI.store.save();
      renderAuth(mode);
    });
    $("#a-lang").addEventListener("click", () => {
      S().prefs.lang = S().prefs.lang === "ru" ? "en" : "ru";
      GI.store.save();
      renderAuth(mode);
    });
    $("#auth-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const u = $("#a-user").value.trim();
      const p = $("#a-pass").value;
      if (signup) {
        const name = ($("#a-name").value || "").trim();
        if (name) S().user.name = name;
        const mail = ($("#a-mail").value || "").trim();
        if (mail) S().user.email = mail;
        if (u) S().user.login = u;
        GI.store.save();
      } else if (!(u === "demo" && p === "demo") && !(u === S().user.login && p === "demo")) {
        $("#a-err").textContent = t("auth.bad");
        return;
      }
      try {
        ($("#a-remember").checked ? localStorage : sessionStorage).setItem(AUTH_KEY, "1");
      } catch (err) { /* приватный режим — просто продолжаем */ }
      bootApp();
      GI.toast(t("auth.welcome"));
    });
  }

  function isAuthed() {
    try {
      return localStorage.getItem(AUTH_KEY) === "1" || sessionStorage.getItem(AUTH_KEY) === "1";
    } catch (e) { return false; }
  }

  function logout() {
    try { localStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
    renderAuth("signin");
  }

  /* ---------- Каркас ---------- */

  function currentRoute() {
    const id = (location.hash || "").replace(/^#\/?/, "").split("?")[0];
    return ROUTES.some((r) => r.id === id) ? id : "overview";
  }

  function navHtml() {
    const s = S();
    const counts = {
      lines: s.lines.length,
      channels: s.channels.length,
      devices: s.lines.filter((l) => l.online).length,
      support: s.tickets.filter((x) => x.status !== "closed").length,
    };
    const cur = currentRoute();
    let html = "", group = null;
    ROUTES.forEach((r) => {
      if (r.group !== group) {
        group = r.group;
        html += `<div class="nav-group">${esc(t(group))}</div>`;
      }
      html += `<a href="#/${r.id}" class="${cur === r.id ? "on" : ""}">${icon(r.icon, 17)}<span>${esc(t("nav." + r.id))}</span>
        ${counts[r.id] !== undefined ? `<span class="count">${fmt.num(counts[r.id])}</span>` : ""}</a>`;
    });
    return html;
  }

  function shellHtml() {
    const s = S();
    const unread = s.notifications.filter((n) => !n.read).length;
    return `
      <div class="app">
        <aside class="sidebar" id="sidebar">
          <a class="logo" href="#/overview" style="padding:4px 8px 8px">${logoMark()}
            <span class="logo-text">Globus<small>IPTV</small></span></a>
          <nav class="nav" id="nav">${navHtml()}</nav>
          <div class="side-card">
            <h4>${esc(GI.lang === "en" ? "Need more channels?" : "Нужно больше каналов?")}</h4>
            <p>${esc(GI.lang === "en" ? "Ultra 4K adds 4200 streams and 5 connections per line." : "Ultra 4K — это 4200 потоков и 5 подключений на линию.")}</p>
            <a class="btn primary sm" href="#/pricing" style="width:100%;justify-content:center">${esc(t("price.pick"))}</a>
          </div>
        </aside>
        <div class="main">
          <header class="topbar">
            <button class="icon-btn burger" id="burger">${icon("menu", 17)}</button>
            <div>
              <h2 id="page-title">${esc(t("nav." + currentRoute()))}</h2>
              <div class="crumb">Globus IPTV · ${esc(t("app.tagline"))}</div>
            </div>
            <div class="spacer"></div>
            <button class="search-btn" id="search-btn">${icon("search", 15)}<span>${esc(t("common.searchAll"))}</span><kbd>Ctrl K</kbd></button>
            <div class="balance-chip">${icon("wallet", 15)}
              <div><small>${esc(t("common.credits"))}</small><b id="chip-credits">${fmt.num(s.user.credits)}</b></div>
            </div>
            <div style="position:relative">
              <button class="icon-btn" id="bell">${icon("bell", 17)}${unread ? '<span class="pip"></span>' : ""}</button>
            </div>
            <div style="position:relative">
              <button class="avatar" id="me" title="${esc(s.user.name)}">${esc(s.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2))}</button>
            </div>
          </header>
          <main class="page" id="page"></main>
        </div>
      </div>`;
  }

  /* ---------- Всплывающие панели ---------- */

  function closePopovers() { $$(".popover").forEach((p) => p.remove()); }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".popover") && !e.target.closest("#bell") && !e.target.closest("#me")) closePopovers();
  });

  function notificationsPopover(anchor) {
    closePopovers();
    const s = S();
    const p = document.createElement("div");
    p.className = "popover";
    p.innerHTML = `
      <div class="p-head"><span>${esc(t("top.notifications"))}</span>
        <button class="btn sm ghost" id="mark">${esc(t("top.markRead"))}</button></div>
      ${s.notifications.length ? s.notifications.slice(0, 6).map((n) => `
        <div class="p-item${n.read ? "" : " unread"}">
          <span>${esc(n.icon)}</span>
          <div>${esc(GI.lang === "en" ? n.en : n.ru)}<time>${esc(fmt.rel(n.at))}</time></div>
        </div>`).join("")
        : `<div class="p-item"><div class="muted">${esc(t("top.noNotes"))}</div></div>`}`;
    anchor.parentNode.appendChild(p);
    $("#mark", p).addEventListener("click", () => {
      s.notifications.forEach((n) => (n.read = true));
      GI.store.save();
      closePopovers();
      GI.renderShell();
    });
  }

  function userPopover(anchor) {
    closePopovers();
    const s = S();
    const p = document.createElement("div");
    p.className = "popover";
    p.innerHTML = `
      <div class="p-item" style="gap:12px">
        <div class="avatar">${esc(s.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2))}</div>
        <div><div style="font-weight:700">${esc(s.user.name)}</div>
          <div class="hint">${esc(s.user.email)} · ${esc(s.user.role)}</div></div>
      </div>
      <div class="menu">
        <button data-act="settings">${icon("gear", 16)} ${esc(t("top.profile"))}</button>
        <button data-act="theme">${icon(s.prefs.theme === "dark" ? "sun" : "moon", 16)} ${esc(t("top.theme"))}</button>
        <button data-act="lang">${icon("globe", 16)} ${esc(t("top.lang"))}: ${s.prefs.lang === "ru" ? "Русский" : "English"}</button>
        <button data-act="reset">${icon("refresh", 16)} ${esc(t("top.resetDemo"))}</button>
        <button data-act="logout" style="color:var(--danger)">${icon("logout", 16)} ${esc(t("top.logout"))}</button>
      </div>`;
    anchor.parentNode.appendChild(p);
    $$("[data-act]", p).forEach((b) =>
      b.addEventListener("click", async () => {
        const a = b.getAttribute("data-act");
        closePopovers();
        if (a === "settings") location.hash = "#/settings";
        else if (a === "theme") {
          S().prefs.theme = S().prefs.theme === "dark" ? "light" : "dark";
          GI.store.save(); applyPrefs(); GI.renderShell();
        } else if (a === "lang") {
          S().prefs.lang = S().prefs.lang === "ru" ? "en" : "ru";
          GI.store.save(); applyPrefs(); GI.renderShell();
        } else if (a === "reset") {
          const ok = await GI.confirm(t("set.resetDesc"), t("common.reset"));
          if (ok) { GI.store.reset(); applyPrefs(); GI.renderShell(); GI.toast(t("top.resetDemo"), "info"); }
        } else if (a === "logout") logout();
      }));
  }

  /* ---------- Палитра команд ---------- */

  function palette() {
    const s = S();
    const items = [];
    ROUTES.forEach((r) => items.push({
      label: t("nav." + r.id), hint: t("app.tagline"), icon: r.icon, go: () => (location.hash = "#/" + r.id),
    }));
    items.push({ label: t("lines.new"), hint: t("nav.lines"), icon: "plus", go: () => GI.actions.newLine() });
    items.push({ label: t("bill.topup"), hint: t("nav.billing"), icon: "wallet", go: () => GI.actions.topup() });
    items.push({ label: t("top.theme"), hint: t("nav.settings"), icon: "sun", go: () => {
      S().prefs.theme = S().prefs.theme === "dark" ? "light" : "dark";
      GI.store.save(); applyPrefs(); GI.renderShell();
    } });
    s.lines.slice(0, 60).forEach((l) => items.push({
      label: l.user, hint: `${t("nav.lines")} · ${GI.pkgById(l.pkg).name}`, icon: "users",
      go: () => GI.actions.lineCard(l.id),
    }));
    s.channels.forEach((c) => items.push({
      label: c.name, hint: `${t("nav.channels")} · ${GI.catName(c.cat)}`, icon: "tv",
      go: () => GI.actions.player(c.id),
    }));

    let cur = 0, list = items.slice(0, 8);
    const render = (root) => {
      $(".results", root).innerHTML = list.length ? list.map((it, i) => `
        <div class="res${i === cur ? " on" : ""}" data-i="${i}">
          <span style="color:var(--accent)">${icon(it.icon, 16)}</span>
          <div><div>${esc(it.label)}</div><div class="hint">${esc(it.hint)}</div></div>
          ${i === cur ? '<span class="k">Enter</span>' : ""}
        </div>`).join("") : `<div class="p-item muted" style="padding:18px">${esc(t("common.nothing"))}</div>`;
      $$(".res", root).forEach((el) =>
        el.addEventListener("click", () => { const it = list[Number(el.getAttribute("data-i"))]; GI.closeModal(); it.go(); }));
    };

    const back = GI.modal({
      paletteMode: true, noFocus: true,
      body: `<input id="pal-q" placeholder="${esc(t("common.searchAll"))}…" autocomplete="off"><div class="results"></div>`,
      mount(root) {
        // Поле поиска рисуется без отступов модалки.
        $(".modal-body", root).style.padding = "0";
        const q = $("#pal-q", root);
        render(root);
        setTimeout(() => q.focus(), 30);
        q.addEventListener("input", () => {
          const v = q.value.trim().toLowerCase();
          list = (v ? items.filter((i) => (i.label + " " + i.hint).toLowerCase().includes(v)) : items).slice(0, 8);
          cur = 0;
          render(root);
        });
        q.addEventListener("keydown", (e) => {
          if (e.key === "ArrowDown") { cur = Math.min(cur + 1, list.length - 1); render(root); e.preventDefault(); }
          else if (e.key === "ArrowUp") { cur = Math.max(cur - 1, 0); render(root); e.preventDefault(); }
          else if (e.key === "Enter" && list[cur]) { const it = list[cur]; GI.closeModal(); it.go(); }
        });
      },
    });
    return back;
  }

  /* ---------- Отрисовка ---------- */

  GI.render = function (after) {
    const id = currentRoute();
    const page = $("#page");
    if (!page) return;
    const view = GI.views[id] ? GI.views[id]() : GI.views.overview();
    page.innerHTML = view.html;
    if (view.mount) view.mount(page);
    const title = $("#page-title");
    if (title) title.textContent = t("nav." + id);
    const chip = $("#chip-credits");
    if (chip) chip.textContent = fmt.num(S().user.credits);
    const nav = $("#nav");
    if (nav) nav.innerHTML = navHtml();
    if (after) after();
  };

  GI.renderShell = function () {
    applyPrefs();
    document.body.innerHTML = shellHtml();
    bindShell();
    GI.render();
  };

  function bindShell() {
    $("#bell").addEventListener("click", (e) => {
      e.stopPropagation();
      if ($(".popover")) { closePopovers(); return; }
      notificationsPopover(e.currentTarget);
    });
    $("#me").addEventListener("click", (e) => {
      e.stopPropagation();
      if ($(".popover")) { closePopovers(); return; }
      userPopover(e.currentTarget);
    });
    $("#search-btn").addEventListener("click", palette);
    const burger = $("#burger");
    burger.addEventListener("click", () => {
      const sb = $("#sidebar");
      sb.classList.add("open");
      const scrim = document.createElement("div");
      scrim.className = "scrim";
      scrim.addEventListener("click", () => { sb.classList.remove("open"); scrim.remove(); });
      document.body.appendChild(scrim);
    });
    $("#nav").addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        $("#sidebar").classList.remove("open");
        const sc = $(".scrim");
        if (sc) sc.remove();
      }
    });
  }

  /* ---------- Живая имитация эфира ---------- */

  function tick() {
    const s = S();
    if (!s) return;
    const now = Date.now();
    let changed = false;
    s.lines.forEach((l) => {
      if (l.blocked || l.exp < now) return;
      if (Math.random() < 0.08) {
        l.online = !l.online;
        l.activeConns = l.online ? 1 + Math.floor(Math.random() * l.conns) : 0;
        changed = true;
      }
    });
    const series = s.series.connections;
    const last = series[series.length - 1];
    last.v = Math.max(20, last.v + Math.round((Math.random() - 0.5) * 14));
    if (changed) GI.store.save();
    const id = currentRoute();
    const busy = $(".backdrop") || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
    if (!busy && (id === "overview" || id === "devices")) GI.render();
  }

  /* ---------- Запуск ---------- */

  function bootApp() {
    GI.renderShell();
    if (!location.hash) location.hash = "#/overview";
  }

  window.addEventListener("hashchange", () => {
    if (!$("#page")) return;
    closePopovers();
    GI.closeModal();
    GI.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      if (!$("#page")) return;
      e.preventDefault();
      palette();
    }
  });

  GI.store.load();
  applyPrefs();
  if (isAuthed()) bootApp(); else renderAuth("signin");
  setInterval(tick, 9000);
})();
