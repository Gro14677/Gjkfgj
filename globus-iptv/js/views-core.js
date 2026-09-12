/* Экраны: обзор, подписки, каналы, плейлисты, устройства + общие модалки действий. */

(function () {
  const GI = (window.GI = window.GI || {});
  const { $, $$, esc, icon, fmt } = { $: GI.$, $$: GI.$$, esc: GI.esc, icon: GI.icon, fmt: GI.fmt };
  const t = (k) => GI.t(k);
  const S = () => GI.store.state;
  const views = (GI.views = GI.views || {});

  const HOST = "cdn.globus-iptv.tv";
  const linkM3U = (l) => `http://${HOST}/get.php?username=${l.user}&password=${l.pass}&type=m3u_plus&output=ts`;
  const linkXtream = (l) => `http://${HOST}:8080 | ${l.user} | ${l.pass}`;
  const linkPortal = () => `http://${HOST}/c/`;
  const linkEpg = (l) => `http://${HOST}/xmltv.php?username=${l.user}&password=${l.pass}`;

  const catName = (id) => {
    const c = GI.CATEGORIES.find((x) => x.id === id);
    return c ? (GI.lang === "en" ? c.en : c.ru) : id;
  };
  const countryName = (l) => (GI.lang === "en" ? l.countryEn : l.countryRu);

  /* ---------- Общие модалки ---------- */

  const actions = (GI.actions = {});

  actions.newLine = function (preset) {
    const pkgOpts = GI.PACKAGES.map((p) => `<option value="${p.id}">${esc(p.name)} — ${p.channels} ${esc(GI.plural(p.channels, "channels"))}, ${p.conns} ${esc(GI.plural(p.conns, "conns"))}</option>`).join("");
    const body = `
      <div class="two-col">
        <div class="field"><label>${esc(t("common.login"))}</label>
          <input class="input" id="nl-user" value="globus${Math.floor(Math.random() * 9000 + 1000)}" autocomplete="off"></div>
        <div class="field"><label>${esc(t("common.password"))}</label>
          <input class="input mono" id="nl-pass" value="${esc(GI.randomPass())}" autocomplete="off"></div>
      </div>
      <div class="field"><label>${esc(t("common.package"))}</label>
        <select class="select" id="nl-pkg">${pkgOpts}</select></div>
      <div class="two-col">
        <div class="field"><label>${esc(t("lines.period"))}</label>
          <select class="select" id="nl-months">
            ${[1, 3, 6, 12].map((m) => `<option value="${m}"${m === 12 ? " selected" : ""}>${m} ${esc(GI.plural(m, "months"))}</option>`).join("")}
          </select></div>
        <div class="field"><label>${esc(t("common.device"))}</label>
          <select class="select" id="nl-dev">${GI.DEVICE_TYPES.map((d) => `<option>${esc(d)}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>${esc(t("dev.mac"))}</label>
        <input class="input mono" id="nl-mac" value="${esc(GI.randomMac())}"></div>
      <div class="field"><label>${esc(t("common.note"))}</label>
        <input class="input" id="nl-note" placeholder="${esc(GI.lang === "en" ? "e.g. customer from Berlin" : "например, клиент из Берлина")}"></div>
      <div class="card" style="padding:14px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div><div class="hint">${esc(t("lines.cost"))}</div><b class="mono" id="nl-cost" style="font-size:19px">0</b> <span class="muted" id="nl-unit"></span></div>
        <div class="spacer"></div>
        <div><div class="hint">${esc(t("common.balance"))}</div><b class="mono" id="nl-bal">${S().user.credits}</b></div>
      </div>`;
    const back = GI.modal({
      title: t("lines.new"),
      body,
      footer: `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button>
               <button class="btn primary" id="nl-go">${icon("plus", 16)} ${esc(t("common.create"))}</button>`,
      mount(root) {
        const pkgSel = $("#nl-pkg", root), mSel = $("#nl-months", root), cost = $("#nl-cost", root);
        if (preset) pkgSel.value = preset;
        const calc = () => {
          const p = GI.pkgById(pkgSel.value);
          const m = Number(mSel.value);
          const disc = m >= 12 ? 0.75 : m >= 6 ? 0.85 : m >= 3 ? 0.92 : 1;
          const c = Math.max(1, Math.round(p.credits * m * disc));
          cost.textContent = c;
          $("#nl-unit", root).textContent = GI.plural(c, "credits");
          return c;
        };
        calc();
        pkgSel.addEventListener("change", calc);
        mSel.addEventListener("change", calc);
        $("#nl-go", root).addEventListener("click", () => {
          const c = calc();
          if (S().user.credits < c) { GI.toast(t("lines.noCredits"), "err"); return; }
          const months = Number(mSel.value);
          const pkg = GI.pkgById(pkgSel.value);
          const country = GI.COUNTRIES[Math.floor(Math.random() * GI.COUNTRIES.length)];
          const line = {
            id: "L" + (10300 + Math.floor(Math.random() * 8000)),
            user: $("#nl-user", root).value.trim() || "globus" + Date.now(),
            pass: $("#nl-pass", root).value.trim() || GI.randomPass(),
            pkg: pkg.id,
            conns: pkg.conns,
            activeConns: 0,
            created: Date.now(),
            exp: Date.now() + months * 30 * GI.DAY,
            online: false,
            note: $("#nl-note", root).value.trim(),
            blocked: false,
            device: $("#nl-dev", root).value,
            mac: $("#nl-mac", root).value.trim(),
            ip: "—",
            flag: country[0], countryRu: country[1], countryEn: country[2],
            trial: false,
          };
          S().lines.unshift(line);
          S().user.credits -= c;
          S().tx.unshift({
            id: "TX-" + Math.floor(Math.random() * 90000 + 10000), date: Date.now(), type: "create",
            titleRu: "Создание линии " + line.user, titleEn: "Line created: " + line.user,
            amount: -c, method: "—", status: "done",
          });
          GI.store.log(`Создана подписка ${line.user} (${pkg.name}, ${months} мес.)`, `Subscription ${line.user} created (${pkg.name}, ${months} mo)`, "✨");
          GI.closeModal();
          GI.toast(t("lines.created"));
          GI.render();
          actions.lineCard(line.id);
        });
      },
    });
    return back;
  };

  actions.lineCard = function (id) {
    const l = S().lines.find((x) => x.id === id);
    if (!l) return;
    const pkg = GI.pkgById(l.pkg);
    const st = GI.lineStatus(l);
    const left = fmt.daysLeft(l.exp);
    const body = `
      <div class="row wrap" style="gap:12px">
        <div class="avatar" style="width:46px;height:46px;border-radius:14px">${esc(l.user.slice(0, 2).toUpperCase())}</div>
        <div>
          <div style="font-weight:700;font-size:16px">${esc(l.user)}</div>
          <div class="hint mono">${esc(l.id)} · ${esc(pkg.name)} · ${esc(l.flag)} ${esc(countryName(l))}</div>
        </div>
        <div class="spacer"></div>
        <span class="badge ${st.cls}"><i class="dot"></i>${esc(st.label)}</span>
      </div>
      <div class="split-3" style="gap:12px">
        <div class="card" style="padding:13px"><div class="hint">${esc(t("common.expires"))}</div>
          <b class="mono">${esc(fmt.date(l.exp))}</b>
          <div class="hint">${left >= 0 ? esc(left + " " + GI.plural(left, "days")) : esc(t("common.expired"))}</div></div>
        <div class="card" style="padding:13px"><div class="hint">${esc(t("common.connections"))}</div>
          <b class="mono">${l.activeConns} / ${l.conns}</b>
          <div class="hint">${esc(l.online ? t("common.online") : t("common.offline"))}</div></div>
        <div class="card" style="padding:13px"><div class="hint">${esc(t("common.created"))}</div>
          <b class="mono">${esc(fmt.date(l.created))}</b>
          <div class="hint">${esc(l.device)}</div></div>
      </div>
      ${GI.copyRow(t("lines.m3u"), linkM3U(l))}
      ${GI.copyRow(t("lines.xtream"), linkXtream(l))}
      ${GI.copyRow(t("pl.epgUrl"), linkEpg(l))}
      <div class="two-col">
        <div class="field"><label>${esc(t("dev.mac"))}</label><input class="input mono" id="lc-mac" value="${esc(l.mac)}"></div>
        <div class="field"><label>${esc(t("common.note"))}</label><input class="input" id="lc-note" value="${esc(l.note)}"></div>
      </div>`;
    const back = GI.modal({
      title: t("lines.card"), wide: true, body,
      footer: `
        <button class="btn danger" data-del>${icon("trash", 15)} ${esc(t("common.delete"))}</button>
        <button class="btn" data-block>${icon("shield", 15)} ${esc(l.blocked ? t("lines.unblock") : t("lines.block"))}</button>
        <div class="spacer"></div>
        <button class="btn" data-save>${esc(t("common.save"))}</button>
        <button class="btn primary" data-renew>${icon("refresh", 15)} ${esc(t("common.renew"))}</button>`,
      mount(root) {
        GI.bindCopy(root);
        $("[data-save]", root).addEventListener("click", () => {
          l.mac = $("#lc-mac", root).value.trim();
          l.note = $("#lc-note", root).value.trim();
          GI.store.save();
          GI.toast(t("set.saved"));
          GI.closeModal();
          GI.render();
        });
        $("[data-block]", root).addEventListener("click", () => {
          l.blocked = !l.blocked;
          if (l.blocked) { l.online = false; l.activeConns = 0; }
          GI.store.log(
            `${l.blocked ? "Заблокирована" : "Разблокирована"} подписка ${l.user}`,
            `Subscription ${l.user} ${l.blocked ? "blocked" : "unblocked"}`, "🛡");
          GI.toast(t(l.blocked ? "lines.blocked" : "lines.unblocked"), "info");
          GI.closeModal();
          GI.render();
        });
        $("[data-del]", root).addEventListener("click", async () => {
          const el = $(".backdrop");
          if (el) el.style.display = "none";
          const ok = await GI.confirm(t("lines.confirmDelete"));
          GI.closeModal();
          if (!ok) return;
          S().lines = S().lines.filter((x) => x.id !== l.id);
          GI.store.log(`Удалена подписка ${l.user}`, `Subscription ${l.user} deleted`, "🗑");
          GI.toast(t("lines.deleted"), "info");
          GI.render();
        });
        $("[data-renew]", root).addEventListener("click", () => {
          GI.closeModal();
          actions.renew(l.id);
        });
      },
    });
    return back;
  };

  actions.renew = function (id) {
    const l = S().lines.find((x) => x.id === id);
    if (!l) return;
    const pkg = GI.pkgById(l.pkg);
    GI.modal({
      title: t("common.renew") + " · " + l.user,
      body: `
        <div class="field"><label>${esc(t("lines.period"))}</label>
          <select class="select" id="rn-m">
            ${[1, 3, 6, 12].map((m) => `<option value="${m}"${m === 12 ? " selected" : ""}>${m} ${esc(GI.plural(m, "months"))}</option>`).join("")}
          </select></div>
        <div class="card" style="padding:14px 16px">
          <div class="row"><div><div class="hint">${esc(t("lines.cost"))}</div>
            <b class="mono" id="rn-cost" style="font-size:19px">0</b> <span class="muted" id="rn-unit"></span></div>
          <div class="spacer"></div>
          <div><div class="hint">${esc(t("common.expires"))}</div><b class="mono" id="rn-new">—</b></div></div>
        </div>`,
      footer: `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button>
               <button class="btn primary" id="rn-go">${esc(t("common.renew"))}</button>`,
      mount(root) {
        const sel = $("#rn-m", root);
        const calc = () => {
          const m = Number(sel.value);
          const disc = m >= 12 ? 0.75 : m >= 6 ? 0.85 : m >= 3 ? 0.92 : 1;
          const c = Math.max(1, Math.round(pkg.credits * m * disc));
          $("#rn-cost", root).textContent = c;
          $("#rn-unit", root).textContent = GI.plural(c, "credits");
          const base = Math.max(Date.now(), l.exp);
          $("#rn-new", root).textContent = fmt.date(base + m * 30 * GI.DAY);
          return { c, m };
        };
        calc();
        sel.addEventListener("change", calc);
        $("#rn-go", root).addEventListener("click", () => {
          const { c, m } = calc();
          if (S().user.credits < c) { GI.toast(t("lines.noCredits"), "err"); return; }
          S().user.credits -= c;
          l.exp = Math.max(Date.now(), l.exp) + m * 30 * GI.DAY;
          l.blocked = false;
          S().tx.unshift({
            id: "TX-" + Math.floor(Math.random() * 90000 + 10000), date: Date.now(), type: "renew",
            titleRu: "Продление " + l.user, titleEn: "Renewal: " + l.user,
            amount: -c, method: "—", status: "done",
          });
          GI.store.log(`Продлена подписка ${l.user} на ${m} мес.`, `Subscription ${l.user} renewed for ${m} mo`, "🔄");
          GI.closeModal();
          GI.toast(t("lines.renewed"));
          GI.render();
        });
      },
    });
  };

  actions.topup = function () {
    GI.modal({
      title: t("bill.topup"),
      body: `
        <div class="chips" id="tu-quick">
          ${[50, 100, 250, 500, 1000].map((v, i) => `<button class="chip${i === 1 ? " on" : ""}" data-v="${v}">${v}</button>`).join("")}
        </div>
        <div class="field"><label>${esc(t("bill.amount"))} (${esc(t("common.credits").toLowerCase())})</label>
          <input class="input mono" id="tu-amt" type="number" min="10" value="100"></div>
        <div class="field"><label>${esc(t("bill.method"))}</label>
          <select class="select" id="tu-m">
            <option>USDT TRC-20</option><option>Bitcoin</option>
            <option>${esc(GI.lang === "en" ? "Bank card" : "Банковская карта")}</option>
            <option>${esc(GI.lang === "en" ? "Fast payments (SBP)" : "СБП")}</option>
          </select></div>
        <p class="hint">${esc(GI.lang === "en"
          ? "1 credit = $1. Demo mode: the balance changes locally, no real payment is made."
          : "1 кредит = $1. Демо-режим: баланс меняется локально, реальная оплата не производится.")}</p>`,
      footer: `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button>
               <button class="btn primary" id="tu-go">${icon("wallet", 16)} ${esc(t("bill.topup"))}</button>`,
      mount(root) {
        $$("#tu-quick .chip", root).forEach((c) =>
          c.addEventListener("click", () => {
            $$("#tu-quick .chip", root).forEach((x) => x.classList.remove("on"));
            c.classList.add("on");
            $("#tu-amt", root).value = c.getAttribute("data-v");
          }));
        $("#tu-go", root).addEventListener("click", () => {
          const v = Math.max(1, Math.round(Number($("#tu-amt", root).value) || 0));
          const m = $("#tu-m", root).value;
          S().user.credits += v;
          S().tx.unshift({
            id: "TX-" + Math.floor(Math.random() * 90000 + 10000), date: Date.now(), type: "topup",
            titleRu: "Пополнение баланса", titleEn: "Balance top-up",
            amount: v, method: m, status: "done",
          });
          GI.store.log(`Баланс пополнен на ${v} кредитов`, `Balance topped up by ${v} credits`, "💳");
          GI.closeModal();
          GI.toast(t("bill.done") + ": +" + v);
          GI.render();
        });
      },
    });
  };

  /* ---------- Обзор ---------- */

  views.overview = function () {
    const s = S();
    const now = Date.now();
    const active = s.lines.filter((l) => !l.blocked && l.exp > now);
    const online = s.lines.filter((l) => l.online && l.exp > now);
    const soon = s.lines.filter((l) => l.exp > now && fmt.daysLeft(l.exp) <= 7)
      .sort((a, b) => a.exp - b.exp);
    const conns = s.series.connections;
    const last = conns[conns.length - 1].v, prev = conns[conns.length - 8].v;
    const growth = prev ? Math.round(((last - prev) / prev) * 100) : 0;

    const devCount = {};
    s.lines.forEach((l) => { devCount[l.device] = (devCount[l.device] || 0) + 1; });
    const palette = ["var(--accent)", "var(--accent-2)", "var(--accent-3)", "var(--warn)", "#ff7ab8", "#7ea7ff"];
    const donutParts = Object.keys(devCount)
      .map((k) => ({ label: k, v: devCount[k] }))
      .sort((a, b) => b.v - a.v).slice(0, 6)
      .map((p, i) => Object.assign(p, { color: palette[i % palette.length] }));

    const geo = {};
    s.lines.forEach((l) => {
      const key = l.flag + " " + countryName(l);
      geo[key] = (geo[key] || 0) + 1;
    });
    const geoRows = Object.keys(geo).map((k) => ({ k, v: geo[k] })).sort((a, b) => b.v - a.v).slice(0, 6);
    const geoMax = geoRows[0] ? geoRows[0].v : 1;

    const top = s.channels.slice().sort((a, b) => b.viewers - a.viewers).slice(0, 6)
      .map((c) => ({ label: c.name, v: c.viewers }));

    const kpi = (label, value, delta, up, ico, spark) => `
      <div class="card kpi">
        <div class="kpi-top"><span class="label">${esc(label)}</span><span class="kpi-ico">${icon(ico, 17)}</span></div>
        <div class="value">${esc(value)}</div>
        <div class="delta ${up ? "up" : "down"}">${icon(up ? "up" : "down", 14)} ${esc(delta)}</div>
        ${spark || ""}
      </div>`;

    const acts = s.activity.length ? s.activity.slice(0, 7) : null;

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("dash.title"))}</h1>
        <p>${esc(t("dash.sub"))}</p>
      </div>

      <div class="kpis">
        ${kpi(t("dash.activeLines"), fmt.num(active.length), (growth >= 0 ? "+" : "") + growth + "% / 7 " + t("common.day"), growth >= 0, "users",
          GI.sparkline(conns.map((c) => c.v)))}
        ${kpi(t("dash.onlineNow"), fmt.num(online.length), fmt.num(last) + " " + (GI.lang === "en" ? "streams" : "потоков"), true, "signal",
          GI.sparkline(conns.slice(-14).map((c) => c.v), "var(--accent-3)"))}
        ${kpi(t("dash.expiring"), fmt.num(soon.length), GI.lang === "en" ? "needs attention" : "требуют внимания", soon.length === 0, "clock", "")}
        ${kpi(t("dash.creditsLeft"), fmt.num(s.user.credits), fmt.money(s.user.money) + " " + (GI.lang === "en" ? "in wallet" : "на счёте"), true, "wallet", "")}
      </div>

      <div class="split">
        <div class="card">
          <div class="card-head">
            <div><h3>${esc(t("dash.connChart"))}</h3><p class="sub">${esc(t("dash.connChartSub"))}</p></div>
            <span class="badge accent"><i class="dot live"></i>${esc(fmt.num(last))} ${esc(GI.lang === "en" ? "now" : "сейчас")}</span>
          </div>
          <div class="card-body">${GI.areaChart(conns, { height: 240 })}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>${esc(t("dash.devices"))}</h3></div>
          <div class="card-body">${GI.donut(donutParts, String(s.lines.length))}</div>
        </div>
      </div>

      <div class="split-3">
        <div class="card">
          <div class="card-head"><h3>${esc(t("dash.topChannels"))}</h3></div>
          <div class="card-body">${GI.barList(top)}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>${esc(t("dash.geo"))}</h3></div>
          <div class="card-body"><div class="world">
            ${geoRows.map((r) => `
              <div class="w-row">
                <span>${esc(r.k.split(" ")[0])}</span>
                <span>
                  <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                    <span>${esc(r.k.split(" ").slice(1).join(" "))}</span>
                  </div>
                  <div class="w-track"><div class="w-fill" style="width:${Math.round((r.v / geoMax) * 100)}%"></div></div>
                </span>
                <b class="mono">${r.v}</b>
              </div>`).join("")}
          </div></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>${esc(t("dash.quick"))}</h3></div>
          <div class="card-body" style="display:grid;gap:10px">
            <button class="btn primary" data-go="new-line">${icon("plus", 16)} ${esc(t("dash.newLine"))}</button>
            <button class="btn" data-go="topup">${icon("wallet", 16)} ${esc(t("dash.topup"))}</button>
            <button class="btn" data-go="#/playlists">${icon("list", 16)} ${esc(t("dash.playlist"))}</button>
            <button class="btn" data-go="#/support">${icon("chat", 16)} ${esc(t("dash.ticket"))}</button>
          </div>
        </div>
      </div>

      <div class="split">
        <div class="card">
          <div class="card-head">
            <h3>${esc(t("dash.expSoon"))}</h3>
            <a class="btn sm ghost" href="#/lines">${esc(t("common.details"))}</a>
          </div>
          ${GI.table({
            columns: [
              { label: t("common.login") }, { label: t("common.package") },
              { label: t("common.expires") }, { label: "", num: true },
            ],
            rows: soon.slice(0, 6).map((l) => ({
              id: l.id,
              cells: [
                `<div class="cell-main">${esc(l.user)}</div><div class="cell-sub mono">${esc(l.id)}</div>`,
                `<span class="badge mute">${esc(GI.pkgById(l.pkg).name)}</span>`,
                `<span class="nowrap">${esc(fmt.date(l.exp))}</span><div class="cell-sub">${esc(fmt.daysLeft(l.exp) + " " + GI.plural(fmt.daysLeft(l.exp), "days"))}</div>`,
                `<button class="btn sm" data-renew="${esc(l.id)}">${esc(t("common.renew"))}</button>`,
              ],
            })),
          })}
        </div>
        <div class="card">
          <div class="card-head"><h3>${esc(t("dash.activity"))}</h3></div>
          <div class="card-body">
            ${acts ? `<div class="timeline">${acts.map((a) => `
              <div class="tl-item">
                <div class="tl-dot">${esc(a.icon)}</div>
                <div class="tl-body">${esc(GI.lang === "en" ? a.en : a.ru)}<time>${esc(fmt.rel(a.at))}</time></div>
              </div>`).join("")}</div>`
              : `<div class="empty">${icon("bolt", 26)}<h4>${esc(t("dash.activity"))}</h4><p>${esc(t("dash.noActivity"))}</p></div>`}
          </div>
        </div>
      </div>`,
      mount(root) {
        $$("[data-go]", root).forEach((b) => b.addEventListener("click", () => {
          const g = b.getAttribute("data-go");
          if (g === "new-line") actions.newLine();
          else if (g === "topup") actions.topup();
          else location.hash = g;
        }));
        $$("[data-renew]", root).forEach((b) =>
          b.addEventListener("click", () => actions.renew(b.getAttribute("data-renew"))));
        $$("tr[data-row]", root).forEach((tr) => {
          tr.style.cursor = "pointer";
          tr.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;
            actions.lineCard(tr.getAttribute("data-row"));
          });
        });
      },
    };
  };

  /* ---------- Подписки ---------- */

  const lst = { q: "", status: "all", pkg: "all", sort: "exp", dir: 1, page: 1, per: 10 };

  function filterLines() {
    const q = lst.q.trim().toLowerCase();
    let rows = S().lines.filter((l) => {
      if (lst.pkg !== "all" && l.pkg !== lst.pkg) return false;
      if (lst.status !== "all" && GI.lineStatus(l).key !== lst.status) return false;
      if (!q) return true;
      return (l.user + " " + l.id + " " + l.mac + " " + l.note + " " + l.device).toLowerCase().includes(q);
    });
    const k = lst.sort;
    rows.sort((a, b) => {
      let va = a[k], vb = b[k];
      if (k === "pkg") { va = GI.pkgById(a.pkg).name; vb = GI.pkgById(b.pkg).name; }
      if (typeof va === "string") return va.localeCompare(vb) * lst.dir;
      return (va - vb) * lst.dir;
    });
    return rows;
  }

  views.lines = function () {
    const all = filterLines();
    const pages = Math.max(1, Math.ceil(all.length / lst.per));
    if (lst.page > pages) lst.page = pages;
    const rows = all.slice((lst.page - 1) * lst.per, lst.page * lst.per);

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("lines.title"))}</h1>
        <p>${esc(t("lines.sub"))}</p>
      </div>
      <div class="card">
        <div class="card-head">
          <div class="toolbar">
            <input class="input" id="lq" placeholder="${esc(t("lines.search"))}" value="${esc(lst.q)}" style="min-width:230px">
            <select class="select" id="lst-status">
              <option value="all">${esc(t("lines.filterStatus"))}: ${esc(t("common.all"))}</option>
              <option value="active">${esc(t("common.active"))}</option>
              <option value="expiring">${esc(t("common.expiring"))}</option>
              <option value="expired">${esc(t("common.expired"))}</option>
              <option value="blocked">${esc(t("common.blocked"))}</option>
            </select>
            <select class="select" id="lst-pkg">
              <option value="all">${esc(t("lines.filterPkg"))}: ${esc(t("common.all"))}</option>
              ${GI.PACKAGES.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}
            </select>
          </div>
          <div class="row">
            <button class="btn sm ghost" id="l-export">${icon("file", 15)} ${esc(t("lines.export"))}</button>
            <button class="btn primary sm" id="l-new">${icon("plus", 15)} ${esc(t("lines.new"))}</button>
          </div>
        </div>
        ${GI.table({
          sortKey: lst.sort, sortDir: lst.dir,
          columns: [
            { label: t("common.login"), sort: "user" },
            { label: t("common.package"), sort: "pkg" },
            { label: t("common.status") },
            { label: t("common.expires"), sort: "exp" },
            { label: t("common.connections"), num: true },
            { label: t("common.device") },
            { label: t("common.actions"), num: true },
          ],
          rows: rows.map((l) => {
            const st = GI.lineStatus(l);
            const left = fmt.daysLeft(l.exp);
            return {
              id: l.id,
              cells: [
                `<div class="cell-main">${esc(l.user)}${l.trial ? ` <span class="badge mute">${esc(t("common.trial"))}</span>` : ""}</div>
                 <div class="cell-sub mono">${esc(l.id)}${l.note ? " · " + esc(l.note) : ""}</div>`,
                `<span class="badge mute">${esc(GI.pkgById(l.pkg).name)}</span>`,
                `<span class="badge ${st.cls}"><i class="dot${l.online ? " live" : ""}"></i>${esc(st.label)}</span>`,
                `<span class="nowrap">${esc(fmt.date(l.exp))}</span><div class="cell-sub">${left >= 0 ? esc(left + " " + GI.plural(left, "days")) : esc(t("common.expired"))}</div>`,
                `<b class="mono">${l.activeConns}/${l.conns}</b>`,
                `${esc(l.device)}<div class="cell-sub">${esc(l.flag)} ${esc(countryName(l))} · <span class="mono">${esc(l.ip)}</span></div>`,
                `<div class="row" style="justify-content:flex-end;gap:6px">
                   <button class="btn sm icon" title="${esc(t("common.copy"))}" data-copy="${esc(linkM3U(l))}">${icon("copy", 14)}</button>
                   <button class="btn sm" data-renew="${esc(l.id)}">${esc(t("common.renew"))}</button>
                 </div>`,
              ],
            };
          }),
        })}
        ${GI.pager(lst.page, pages, all.length)}
      </div>`,
      mount(root) {
        const q = $("#lq", root);
        q.addEventListener("input", () => {
          lst.q = q.value; lst.page = 1;
          GI.render(() => { const f = $("#lq"); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } });
        });
        const st = $("#lst-status", root); st.value = lst.status;
        st.addEventListener("change", () => { lst.status = st.value; lst.page = 1; GI.render(); });
        const pk = $("#lst-pkg", root); pk.value = lst.pkg;
        pk.addEventListener("change", () => { lst.pkg = pk.value; lst.page = 1; GI.render(); });
        $("#l-new", root).addEventListener("click", () => actions.newLine());
        $("#l-export", root).addEventListener("click", () => {
          const head = "id,username,password,package,expires,status,device,mac,country\n";
          const csv = head + filterLines().map((l) =>
            [l.id, l.user, l.pass, GI.pkgById(l.pkg).name, new Date(l.exp).toISOString().slice(0, 10),
             GI.lineStatus(l).key, l.device, l.mac, l.countryEn].join(",")).join("\n");
          GI.copy(csv);
        });
        $$("th[data-sort]", root).forEach((th) =>
          th.addEventListener("click", () => {
            const k = th.getAttribute("data-sort");
            if (lst.sort === k) lst.dir *= -1; else { lst.sort = k; lst.dir = 1; }
            GI.render();
          }));
        $$("[data-page]", root).forEach((b) =>
          b.addEventListener("click", () => { lst.page = Number(b.getAttribute("data-page")); GI.render(); }));
        $$("[data-renew]", root).forEach((b) =>
          b.addEventListener("click", (e) => { e.stopPropagation(); actions.renew(b.getAttribute("data-renew")); }));
        GI.bindCopy(root);
        $$("tr[data-row]", root).forEach((tr) => {
          tr.style.cursor = "pointer";
          tr.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;
            actions.lineCard(tr.getAttribute("data-row"));
          });
        });
      },
    };
  };

  /* ---------- Каналы ---------- */

  const cst = { q: "", cat: "all", favOnly: false };

  function chanTile(c) {
    const fav = S().favorites.includes(c.id);
    const pct = Math.round((c.passed / c.duration) * 100);
    return `
      <div class="chan" data-ch="${esc(c.id)}">
        <button class="fav${fav ? " on" : ""}" data-fav="${esc(c.id)}" title="${esc(t("chan.fav"))}">${fav ? "★" : "☆"}</button>
        <div class="top">
          <div class="tile" style="background:linear-gradient(140deg, hsl(${c.hue} 85% 62%), hsl(${(c.hue + 48) % 360} 85% 56%))">
            ${esc(c.name.slice(0, 2).toUpperCase())}
          </div>
          <div>
            <div class="name">${esc(c.name)}</div>
            <div class="cat">№${c.num} · ${esc(catName(c.cat))}</div>
          </div>
        </div>
        <div class="epg">
          <span class="title">${esc(c.epg)}</span>
          <div class="row" style="justify-content:space-between">
            <span class="muted">${esc(t("chan.then"))}: ${esc(c.next)}</span>
          </div>
          <div class="progress"><i style="width:${pct}%"></i></div>
        </div>
        <div class="row wrap" style="margin-top:12px;gap:6px">
          <span class="badge accent">${esc(c.quality)}</span>
          ${c.archive ? `<span class="badge mute">${esc(t("chan.archive"))}</span>` : ""}
          <span class="badge mute">${icon("users", 12)} ${esc(fmt.num(c.viewers))}</span>
        </div>
      </div>`;
  }

  actions.player = function (id) {
    const c = S().channels.find((x) => x.id === id);
    if (!c) return;
    const bars = Array.from({ length: 22 }, (_, i) =>
      `<i style="animation-delay:${(i * 0.07).toFixed(2)}s"></i>`).join("");
    GI.modal({
      title: c.name, wide: true,
      body: `
        <div class="player">
          <span class="badge dead live-tag"><i class="dot live"></i>LIVE</span>
          <div class="eq">${bars}</div>
          <div class="ov">
            <div>
              <div style="font-weight:700">${esc(c.epg)}</div>
              <div class="hint">${esc(catName(c.cat))} · ${esc(c.quality)} · ${esc(fmt.num(c.viewers))} ${esc(t("common.viewers").toLowerCase())}</div>
            </div>
            <div class="spacer"></div>
            <span class="badge accent">${esc(c.quality)}</span>
          </div>
        </div>
        <div class="row wrap" style="gap:8px">
          <span class="badge mute">№${c.num}</span>
          ${c.archive ? `<span class="badge ok">${esc(t("chan.archive"))}</span>` : ""}
          <span class="badge mute">${esc(t("chan.then"))}: ${esc(c.next)}</span>
        </div>
        <p class="hint" style="margin:0">${esc(t("chan.demoPlayer"))}</p>`,
      footer: `<button class="btn ghost" data-close>${esc(t("common.close"))}</button>
               <button class="btn" data-copy="http://${HOST}/live/${esc(c.id)}.m3u8">${icon("link", 15)} ${esc(t("common.copy"))}</button>`,
      mount(root) { GI.bindCopy(root); },
    });
  };

  views.channels = function () {
    const s = S();
    const q = cst.q.trim().toLowerCase();
    const list = s.channels.filter((c) => {
      if (cst.cat !== "all" && c.cat !== cst.cat) return false;
      if (cst.favOnly && !s.favorites.includes(c.id)) return false;
      return !q || c.name.toLowerCase().includes(q);
    });
    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("chan.title"))}</h1>
        <p>${esc(t("chan.sub"))}</p>
      </div>
      <div class="card">
        <div class="card-head">
          <div class="toolbar">
            <input class="input" id="cq" placeholder="${esc(t("chan.search"))}" value="${esc(cst.q)}" style="min-width:220px">
            <button class="chip${cst.favOnly ? " on" : ""}" id="c-fav">★ ${esc(t("chan.fav"))}</button>
          </div>
          <span class="badge mute">${esc(fmt.num(list.length))} / ${esc(fmt.num(s.channels.length))}</span>
        </div>
        <div class="card-body" style="display:grid;gap:16px">
          <div class="chips">
            ${GI.CATEGORIES.map((c) =>
              `<button class="chip${cst.cat === c.id ? " on" : ""}" data-cat="${esc(c.id)}">${esc(GI.lang === "en" ? c.en : c.ru)}</button>`).join("")}
          </div>
          ${list.length
            ? `<div class="chan-grid">${list.map(chanTile).join("")}</div>`
            : `<div class="empty">${icon("tv", 28)}<h4>${esc(t("common.nothing"))}</h4><p>${esc(t("common.nothingHint"))}</p></div>`}
        </div>
      </div>`,
      mount(root) {
        const q = $("#cq", root);
        q.addEventListener("input", () => {
          cst.q = q.value;
          GI.render(() => { const f = $("#cq"); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } });
        });
        $$("[data-cat]", root).forEach((b) =>
          b.addEventListener("click", () => { cst.cat = b.getAttribute("data-cat"); GI.render(); }));
        $("#c-fav", root).addEventListener("click", () => { cst.favOnly = !cst.favOnly; GI.render(); });
        $$("[data-fav]", root).forEach((b) =>
          b.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = b.getAttribute("data-fav");
            const i = S().favorites.indexOf(id);
            if (i >= 0) { S().favorites.splice(i, 1); GI.toast(t("chan.removed"), "info"); }
            else { S().favorites.push(id); GI.toast(t("chan.added")); }
            GI.store.save();
            GI.render();
          }));
        $$("[data-ch]", root).forEach((el) =>
          el.addEventListener("click", () => actions.player(el.getAttribute("data-ch"))));
      },
    };
  };

  /* ---------- Плейлисты ---------- */

  const pst = { line: null, fmt: "m3u_plus" };

  views.playlists = function () {
    const s = S();
    const lines = s.lines.filter((l) => !l.blocked);
    if (!pst.line || !lines.some((l) => l.id === pst.line)) pst.line = lines.length ? lines[0].id : null;
    const l = lines.find((x) => x.id === pst.line);

    const apps = [
      ["Smart TV (Samsung/LG)", "SS IPTV, OTT Navigator", "tv"],
      ["Android / Android TV", "TiviMate, IPTV Smarters Pro", "device"],
      ["iOS / Apple TV", "IPTV Smarters, GSE Smart IPTV", "device"],
      ["MAG / Infomir", GI.lang === "en" ? "built-in portal" : "встроенный портал", "signal"],
      ["Windows / macOS", "VLC, Kodi (PVR Simple)", "grid"],
      ["Web", GI.lang === "en" ? "any HLS player" : "любой HLS-плеер", "globe"],
    ];

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("pl.title"))}</h1>
        <p>${esc(t("pl.sub"))}</p>
      </div>
      ${l ? `
      <div class="split">
        <div class="card">
          <div class="card-head">
            <h3>${esc(t("pl.links"))}</h3>
            <div class="toolbar">
              <select class="select" id="pl-line">
                ${lines.map((x) => `<option value="${esc(x.id)}"${x.id === pst.line ? " selected" : ""}>${esc(x.user)} · ${esc(GI.pkgById(x.pkg).name)}</option>`).join("")}
              </select>
              <select class="select" id="pl-fmt">
                <option value="m3u_plus">M3U Plus (ts)</option>
                <option value="m3u">M3U (hls)</option>
                <option value="enigma">Enigma2</option>
              </select>
            </div>
          </div>
          <div class="card-body" style="display:grid;gap:14px">
            ${GI.copyRow(t("lines.m3u"), `http://${HOST}/get.php?username=${l.user}&password=${l.pass}&type=${pst.fmt}&output=${pst.fmt === "m3u" ? "hls" : "ts"}`)}
            ${GI.copyRow(t("lines.portal"), linkPortal())}
            ${GI.copyRow(t("lines.xtream"), linkXtream(l))}
            ${GI.copyRow(t("pl.epgUrl"), linkEpg(l))}
            ${GI.copyRow(t("dev.mac"), l.mac)}
            <div class="row wrap">
              <span class="badge ok"><i class="dot"></i>${esc(GI.pkgById(l.pkg).quality)}</span>
              <span class="badge mute">${GI.pkgById(l.pkg).channels} ${esc(GI.plural(GI.pkgById(l.pkg).channels, "channels"))}</span>
              <span class="badge mute">${l.conns} ${esc(GI.plural(l.conns, "conns"))}</span>
              <span class="badge mute">${esc(t("common.expires"))}: ${esc(fmt.date(l.exp))}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div><h3>${esc(t("pl.apps"))}</h3><p class="sub">${esc(t("pl.appsSub"))}</p></div></div>
          <div class="card-body" style="display:grid;gap:12px">
            ${apps.map((a) => `
              <div class="row" style="gap:12px">
                <span class="kpi-ico">${icon(a[2], 16)}</span>
                <div><div style="font-weight:600;font-size:13.5px">${esc(a[0])}</div>
                <div class="hint">${esc(a[1])}</div></div>
              </div>`).join("")}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>${esc(t("pl.guide"))}</h3></div>
        <div class="card-body">
          <div class="timeline">
            ${[t("pl.g1"), t("pl.g2"), t("pl.g3")].map((g, i) => `
              <div class="tl-item"><div class="tl-dot mono">${i + 1}</div><div class="tl-body">${esc(g)}</div></div>`).join("")}
          </div>
        </div>
      </div>` : `<div class="card"><div class="empty">${icon("list", 28)}<h4>${esc(t("common.nothing"))}</h4>
        <p>${esc(GI.lang === "en" ? "Create a subscription first." : "Сначала создайте подписку.")}</p>
        <button class="btn primary" id="pl-new" style="margin-top:14px">${esc(t("lines.new"))}</button></div></div>`}`,
      mount(root) {
        GI.bindCopy(root);
        const sel = $("#pl-line", root);
        if (sel) sel.addEventListener("change", () => { pst.line = sel.value; GI.render(); });
        const f = $("#pl-fmt", root);
        if (f) { f.value = pst.fmt; f.addEventListener("change", () => { pst.fmt = f.value; GI.render(); }); }
        const nb = $("#pl-new", root);
        if (nb) nb.addEventListener("click", () => actions.newLine());
      },
    };
  };

  /* ---------- Устройства ---------- */

  const dst = { onlyOnline: false, q: "" };

  views.devices = function () {
    const q = dst.q.trim().toLowerCase();
    const rows = S().lines.filter((l) => {
      if (dst.onlyOnline && !l.online) return false;
      return !q || (l.device + " " + l.mac + " " + l.ip + " " + l.user).toLowerCase().includes(q);
    }).sort((a, b) => Number(b.online) - Number(a.online));

    const online = S().lines.filter((l) => l.online).length;

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("dev.title"))}</h1>
        <p>${esc(t("dev.sub"))}</p>
      </div>
      <div class="kpis">
        <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("common.online"))}</span><span class="kpi-ico">${icon("signal", 17)}</span></div>
          <div class="value">${fmt.num(online)}</div><div class="delta up">${icon("up", 14)} ${esc(t("dash.onlineNow"))}</div></div>
        <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("dev.title"))}</span><span class="kpi-ico">${icon("device", 17)}</span></div>
          <div class="value">${fmt.num(S().lines.length)}</div><div class="delta up">${icon("up", 14)} ${esc(t("common.total"))}</div></div>
        <div class="card kpi"><div class="kpi-top"><span class="label">MAG</span><span class="kpi-ico">${icon("tv", 17)}</span></div>
          <div class="value">${fmt.num(S().lines.filter((l) => l.device.indexOf("MAG") === 0).length)}</div>
          <div class="delta up">${icon("up", 14)} ${esc(GI.lang === "en" ? "set-top boxes" : "приставок")}</div></div>
        <div class="card kpi"><div class="kpi-top"><span class="label">Smart TV</span><span class="kpi-ico">${icon("tv", 17)}</span></div>
          <div class="value">${fmt.num(S().lines.filter((l) => l.device.indexOf("Smart TV") === 0).length)}</div>
          <div class="delta up">${icon("up", 14)} Samsung / LG</div></div>
      </div>
      <div class="card">
        <div class="card-head">
          <div class="toolbar">
            <input class="input" id="dq" placeholder="MAC, IP, ${esc(t("common.login").toLowerCase())}" value="${esc(dst.q)}" style="min-width:220px">
            <button class="chip${dst.onlyOnline ? " on" : ""}" id="d-on"><i class="dot"></i> ${esc(t("common.online"))}</button>
          </div>
        </div>
        ${GI.table({
          columns: [
            { label: t("common.device") }, { label: t("common.login") }, { label: t("dev.mac") },
            { label: t("dev.ip") }, { label: t("common.country") },
            { label: t("common.status") }, { label: t("common.actions"), num: true },
          ],
          rows: rows.slice(0, 40).map((l) => ({
            id: l.id,
            cells: [
              `<div class="cell-main">${esc(l.device)}</div><div class="cell-sub">${esc(GI.pkgById(l.pkg).name)}</div>`,
              esc(l.user),
              `<span class="mono">${esc(l.mac)}</span>`,
              `<span class="mono">${esc(l.ip)}</span>`,
              `${esc(l.flag)} ${esc(countryName(l))}`,
              l.online
                ? `<span class="badge ok"><i class="dot live"></i>${esc(t("common.online"))}</span>`
                : `<span class="badge mute"><i class="dot"></i>${esc(t("common.offline"))}</span>`,
              l.online
                ? `<button class="btn sm danger" data-kick="${esc(l.id)}">${esc(t("dev.kick"))}</button>`
                : `<span class="muted hint">${esc(fmt.rel(l.created))}</span>`,
            ],
          })),
        })}
      </div>`,
      mount(root) {
        const q = $("#dq", root);
        q.addEventListener("input", () => {
          dst.q = q.value;
          GI.render(() => { const f = $("#dq"); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } });
        });
        $("#d-on", root).addEventListener("click", () => { dst.onlyOnline = !dst.onlyOnline; GI.render(); });
        $$("[data-kick]", root).forEach((b) =>
          b.addEventListener("click", (e) => {
            e.stopPropagation();
            const l = S().lines.find((x) => x.id === b.getAttribute("data-kick"));
            if (!l) return;
            l.online = false; l.activeConns = 0;
            GI.store.log(`Сессия ${l.user} завершена`, `Session ${l.user} terminated`, "⛔");
            GI.toast(t("dev.kicked"), "info");
            GI.render();
          }));
        $$("tr[data-row]", root).forEach((tr) => {
          tr.style.cursor = "pointer";
          tr.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;
            actions.lineCard(tr.getAttribute("data-row"));
          });
        });
      },
    };
  };

  GI.links = { m3u: linkM3U, xtream: linkXtream, portal: linkPortal, epg: linkEpg, host: HOST };
  GI.catName = catName;
})();
