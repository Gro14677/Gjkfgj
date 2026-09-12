/* Экраны: статистика, финансы, тарифы, партнёрка, поддержка, настройки. */

(function () {
  const GI = (window.GI = window.GI || {});
  const { $, $$, esc, icon, fmt } = { $: GI.$, $$: GI.$$, esc: GI.esc, icon: GI.icon, fmt: GI.fmt };
  const t = (k) => GI.t(k);
  const S = () => GI.store.state;
  const views = GI.views;

  /* ---------- Статистика ---------- */

  const sst = { period: 30 };

  views.stats = function () {
    const s = S();
    const conns = s.series.connections.slice(-sst.period);
    const traffic = s.series.traffic.slice(-sst.period);
    const peak = Math.max.apply(null, conns.map((c) => c.v));
    const totalTraffic = traffic.reduce((a, b) => a + b.v, 0);
    const hours = Array.from({ length: 12 }, (_, i) => {
      const h = i * 2;
      const load = Math.round(30 + Math.sin((h - 6) / 3.6) * 26 + (h >= 18 && h <= 23 ? 55 : 0) + (h < 6 ? -12 : 0));
      return { label: String(h).padStart(2, "0") + ":00", v: Math.max(6, load) };
    });
    const qmix = [
      { label: "4K UHD", v: s.channels.filter((c) => c.quality === "4K").length * 7, color: "var(--accent)" },
      { label: "FHD", v: s.channels.filter((c) => c.quality === "FHD").length * 11, color: "var(--accent-2)" },
      { label: "HD", v: s.channels.filter((c) => c.quality === "HD").length * 14, color: "var(--accent-3)" },
      { label: "SD", v: s.channels.filter((c) => c.quality === "SD").length * 9, color: "var(--warn)" },
    ];
    const top = s.channels.slice().sort((a, b) => b.viewers - a.viewers).slice(0, 8)
      .map((c) => ({ label: c.name, v: c.viewers }));

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("stats.title"))}</h1>
        <p>${esc(t("stats.sub"))}</p>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>${esc(t("stats.period"))}</h3>
          <div class="chips">
            <button class="chip${sst.period === 7 ? " on" : ""}" data-per="7">${esc(t("stats.d7"))}</button>
            <button class="chip${sst.period === 30 ? " on" : ""}" data-per="30">${esc(t("stats.d30"))}</button>
          </div>
        </div>
        <div class="card-body">
          <div class="kpis" style="margin-bottom:18px">
            <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("stats.peak"))}</span><span class="kpi-ico">${icon("signal", 17)}</span></div>
              <div class="value">${fmt.num(peak)}</div><div class="delta up">${icon("up", 14)} ${esc(t("common.total"))}</div></div>
            <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("stats.traffic"))}</span><span class="kpi-ico">${icon("bolt", 17)}</span></div>
              <div class="value">${fmt.num(totalTraffic)}</div><div class="delta up">${icon("up", 14)} ${sst.period} ${esc(GI.plural(sst.period, "days"))}</div></div>
            <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("stats.avgWatch"))}</span><span class="kpi-ico">${icon("clock", 17)}</span></div>
              <div class="value">3:42</div><div class="delta up">${icon("up", 14)} +8%</div></div>
            <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("stats.retention"))}</span><span class="kpi-ico">${icon("refresh", 17)}</span></div>
              <div class="value">86%</div><div class="delta up">${icon("up", 14)} +2.4%</div></div>
          </div>
          ${GI.areaChart(traffic, { height: 230 })}
        </div>
      </div>
      <div class="split">
        <div class="card">
          <div class="card-head"><h3>${esc(t("stats.hours"))}</h3></div>
          <div class="card-body">${GI.barChart(hours, { height: 210 })}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>${esc(t("stats.quality"))}</h3></div>
          <div class="card-body">${GI.donut(qmix, sst.period + " " + t("common.day"))}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>${esc(t("dash.topChannels"))}</h3></div>
        <div class="card-body">${GI.barList(top)}</div>
      </div>`,
      mount(root) {
        $$("[data-per]", root).forEach((b) =>
          b.addEventListener("click", () => { sst.period = Number(b.getAttribute("data-per")); GI.render(); }));
      },
    };
  };

  /* ---------- Финансы ---------- */

  const bst = { filter: "all" };

  views.billing = function () {
    const s = S();
    const since = Date.now() - 30 * GI.DAY;
    const last30 = s.tx.filter((x) => x.date >= since);
    const income = last30.filter((x) => x.amount > 0).reduce((a, b) => a + b.amount, 0);
    const spent = last30.filter((x) => x.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);
    const avg = last30.length ? Math.round((income + spent) / last30.length) : 0;
    const rows = s.tx.filter((x) => bst.filter === "all" || x.type === bst.filter);
    // Ряд дохода — помесячный, поэтому подписи строим шагом в месяц, а не в день.
    const rev = s.series.revenue.map((r, i, arr) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (arr.length - 1 - i));
      return { label: d.toLocaleDateString(GI.lang === "en" ? "en-GB" : "ru-RU", { month: "short" }), v: r.v };
    });

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("bill.title"))}</h1>
        <p>${esc(t("bill.sub"))}</p>
      </div>
      <div class="kpis">
        <div class="card kpi">
          <div class="kpi-top"><span class="label">${esc(t("common.balance"))}</span><span class="kpi-ico">${icon("wallet", 17)}</span></div>
          <div class="value">${fmt.num(s.user.credits)}</div>
          <div class="delta up">${icon("up", 14)} ${esc(t("common.credits"))}</div>
        </div>
        <div class="card kpi">
          <div class="kpi-top"><span class="label">${esc(t("bill.income30"))}</span><span class="kpi-ico">${icon("up", 17)}</span></div>
          <div class="value">+${fmt.num(income)}</div><div class="delta up">${icon("up", 14)} 30 ${esc(GI.plural(30, "days"))}</div>
        </div>
        <div class="card kpi">
          <div class="kpi-top"><span class="label">${esc(t("bill.spent30"))}</span><span class="kpi-ico">${icon("down", 17)}</span></div>
          <div class="value">−${fmt.num(spent)}</div><div class="delta down">${icon("down", 14)} 30 ${esc(GI.plural(30, "days"))}</div>
        </div>
        <div class="card kpi">
          <div class="kpi-top"><span class="label">${esc(t("bill.avgCheck"))}</span><span class="kpi-ico">${icon("tag", 17)}</span></div>
          <div class="value">${fmt.num(avg)}</div><div class="delta up">${icon("up", 14)} ${esc(GI.plural(avg, "credits"))}</div>
        </div>
      </div>
      <div class="split">
        <div class="card">
          <div class="card-head"><h3>${esc(t("bill.revenue"))}</h3>
            <button class="btn primary sm" id="b-topup">${icon("plus", 15)} ${esc(t("bill.topup"))}</button></div>
          <div class="card-body">${GI.barChart(rev, { height: 220 })}</div>
        </div>
        <div class="card">
          <div class="card-head"><h3>${esc(t("bill.invoice"))}</h3></div>
          <div class="card-body" style="display:grid;gap:12px">
            ${["GI-2026-0341", "GI-2026-0298", "GI-2026-0255"].map((n, i) => `
              <div class="row" style="gap:12px">
                <span class="kpi-ico">${icon("file", 16)}</span>
                <div><div style="font-weight:600;font-size:13.5px">${esc(n)}</div>
                  <div class="hint">${esc(fmt.date(Date.now() - (i + 1) * 22 * GI.DAY))} · ${fmt.money(250 - i * 40)}</div></div>
                <div class="spacer"></div>
                <span class="badge ${i === 0 ? "warn" : "ok"}">${esc(i === 0 ? t("common.pending") : t("common.done"))}</span>
              </div>`).join("")}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>${esc(t("bill.history"))}</h3>
          <select class="select" id="b-filter" style="width:auto">
            <option value="all">${esc(t("common.all"))}</option>
            <option value="topup">${esc(GI.lang === "en" ? "Top-ups" : "Пополнения")}</option>
            <option value="renew">${esc(GI.lang === "en" ? "Renewals" : "Продления")}</option>
            <option value="create">${esc(GI.lang === "en" ? "New lines" : "Создание линий")}</option>
            <option value="bonus">${esc(GI.lang === "en" ? "Bonuses" : "Бонусы")}</option>
            <option value="transfer">${esc(GI.lang === "en" ? "Transfers" : "Переводы")}</option>
          </select>
        </div>
        ${GI.table({
          columns: [
            { label: "ID" }, { label: t("common.type") }, { label: t("common.date") },
            { label: t("common.method") }, { label: t("common.status") }, { label: t("common.amount"), num: true },
          ],
          rows: rows.slice(0, 25).map((x) => ({
            cells: [
              `<span class="mono">${esc(x.id)}</span>`,
              `<div class="cell-main">${esc(GI.lang === "en" ? x.titleEn : x.titleRu)}</div>`,
              esc(fmt.dateTime(x.date)),
              esc(x.method),
              `<span class="badge ${x.status === "done" ? "ok" : "warn"}">${esc(x.status === "done" ? t("common.done") : t("common.pending"))}</span>`,
              `<b style="color:var(--${x.amount > 0 ? "ok" : "text"})">${x.amount > 0 ? "+" : "−"}${fmt.num(Math.abs(x.amount))}</b>`,
            ],
          })),
        })}
      </div>`,
      mount(root) {
        $("#b-topup", root).addEventListener("click", () => GI.actions.topup());
        const f = $("#b-filter", root);
        f.value = bst.filter;
        f.addEventListener("change", () => { bst.filter = f.value; GI.render(); });
      },
    };
  };

  /* ---------- Тарифы ---------- */

  const cal = { qty: 10, months: 3, pkg: "pro" };

  function calcTotal() {
    const p = GI.pkgById(cal.pkg);
    const disc = cal.months >= 12 ? 0.25 : cal.months >= 6 ? 0.15 : cal.months >= 3 ? 0.08 : 0;
    const bulk = cal.qty >= 50 ? 0.1 : cal.qty >= 20 ? 0.05 : 0;
    const total = p.credits * cal.months * cal.qty;
    const off = Math.round(total * (disc + bulk));
    return { total: total - off, off, pct: Math.round((disc + bulk) * 100) };
  }

  views.pricing = function () {
    const feats = (p) => [
      `${p.channels} ${t("price.chan")}`,
      `${p.conns} ${GI.plural(p.conns, "conns")}`,
      p.quality,
      t("price.arch"),
      t("price.epg"),
      t("price.vod"),
    ];
    const r = calcTotal();

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("price.title"))}</h1>
        <p>${esc(t("price.sub"))}</p>
      </div>
      <div class="plans">
        ${GI.PACKAGES.map((p) => `
          <div class="card plan${p.id === "pro" ? " best" : ""}">
            ${p.id === "pro" ? `<span class="badge accent tag">${esc(t("price.best"))}</span>` : ""}
            <div>
              <div style="font-weight:700;font-size:16px">${esc(p.name)}</div>
              <div class="hint">${esc(p.quality)}</div>
            </div>
            <div class="price">$${p.price}<small> / ${esc(t("price.per"))}</small></div>
            <ul>${feats(p).map((f) => `<li>${icon("check", 15)}<span>${esc(f)}</span></li>`).join("")}</ul>
            <div class="spacer"></div>
            <button class="btn ${p.id === "pro" ? "primary" : ""}" data-pick="${esc(p.id)}">${esc(t("price.pick"))}</button>
            <div class="hint" style="text-align:center">${p.credits} ${esc(GI.plural(p.credits, "credits"))} / ${esc(t("common.month"))}</div>
          </div>`).join("")}
      </div>
      <div class="card">
        <div class="card-head"><h3>${esc(t("price.calc"))}</h3></div>
        <div class="card-body">
          <div class="split">
            <div class="grid" style="gap:14px">
              <div class="field"><label>${esc(t("common.package"))}</label>
                <select class="select" id="cal-pkg">
                  ${GI.PACKAGES.map((p) => `<option value="${p.id}"${cal.pkg === p.id ? " selected" : ""}>${esc(p.name)} — ${p.credits} ${esc(GI.plural(p.credits, "credits"))}/${esc(t("common.month"))}</option>`).join("")}
                </select></div>
              <div class="two-col">
                <div class="field"><label>${esc(t("price.qty"))}</label>
                  <input class="input mono" id="cal-qty" type="number" min="1" value="${cal.qty}"></div>
                <div class="field"><label>${esc(t("price.months"))}</label>
                  <select class="select" id="cal-m">
                    ${[1, 3, 6, 12].map((m) => `<option value="${m}"${cal.months === m ? " selected" : ""}>${m}</option>`).join("")}
                  </select></div>
              </div>
            </div>
            <div class="card" style="padding:20px;display:grid;gap:12px;align-content:start">
              <div class="row"><span class="muted">${esc(t("price.discount"))}</span><div class="spacer"></div>
                <span class="badge ok">−${r.pct}% (${r.off} ${esc(GI.plural(r.off, "credits"))})</span></div>
              <div class="row"><span class="muted">${esc(t("price.result"))}</span><div class="spacer"></div>
                <b class="mono" style="font-size:26px">${fmt.num(r.total)}</b></div>
              <div class="hint">≈ ${fmt.money(r.total)} · ${esc(t("common.balance"))}: ${fmt.num(S().user.credits)}</div>
              <button class="btn primary" id="cal-buy">${icon("bolt", 16)} ${esc(t("dash.newLine"))}</button>
            </div>
          </div>
        </div>
      </div>`,
      mount(root) {
        $$("[data-pick]", root).forEach((b) =>
          b.addEventListener("click", () => GI.actions.newLine(b.getAttribute("data-pick"))));
        const pkg = $("#cal-pkg", root), qty = $("#cal-qty", root), m = $("#cal-m", root);
        const upd = () => {
          cal.pkg = pkg.value;
          cal.qty = Math.max(1, Number(qty.value) || 1);
          cal.months = Number(m.value);
          GI.render();
        };
        pkg.addEventListener("change", upd);
        m.addEventListener("change", upd);
        qty.addEventListener("change", upd);
        $("#cal-buy", root).addEventListener("click", () => GI.actions.newLine(cal.pkg));
      },
    };
  };

  /* ---------- Партнёрка ---------- */

  views.partners = function () {
    const s = S();
    const link = `https://globus-iptv.tv/r/${s.user.referral}`;
    const earned = s.tx.filter((x) => x.type === "bonus").reduce((a, b) => a + b.amount, 0);
    const tiers = [
      [GI.lang === "en" ? "Up to 20 lines" : "До 20 линий", "10%"],
      [GI.lang === "en" ? "20–100 lines" : "20–100 линий", "15%"],
      [GI.lang === "en" ? "100–500 lines" : "100–500 линий", "20%"],
      [GI.lang === "en" ? "500+ lines" : "500+ линий", "25%"],
    ];

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("ref.title"))}</h1>
        <p>${esc(t("ref.sub"))}</p>
      </div>
      <div class="kpis">
        <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("ref.earned"))}</span><span class="kpi-ico">${icon("gift", 17)}</span></div>
          <div class="value">${fmt.num(earned)}</div><div class="delta up">${icon("up", 14)} ${esc(GI.plural(earned, "credits"))}</div></div>
        <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("ref.subs"))}</span><span class="kpi-ico">${icon("users", 17)}</span></div>
          <div class="value">${s.subs.length}</div><div class="delta up">${icon("up", 14)} ${s.subs.reduce((a, b) => a + b.lines, 0)} ${esc(GI.plural(s.subs.reduce((a, b) => a + b.lines, 0), "lines"))}</div></div>
        <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("ref.rate"))}</span><span class="kpi-ico">${icon("tag", 17)}</span></div>
          <div class="value">20%</div><div class="delta up">${icon("up", 14)} ${esc(GI.lang === "en" ? "tier 3" : "3-й уровень")}</div></div>
        <div class="card kpi"><div class="kpi-top"><span class="label">${esc(t("common.balance"))}</span><span class="kpi-ico">${icon("wallet", 17)}</span></div>
          <div class="value">${fmt.num(s.user.credits)}</div><div class="delta up">${icon("up", 14)} ${esc(GI.plural(s.user.credits, "credits"))}</div></div>
      </div>
      <div class="split">
        <div class="card">
          <div class="card-head"><h3>${esc(t("ref.subs"))}</h3>
            <button class="btn sm primary" id="r-transfer">${icon("bolt", 15)} ${esc(t("ref.transfer"))}</button></div>
          ${GI.table({
            columns: [{ label: t("common.login") }, { label: t("ref.lines"), num: true },
              { label: t("common.credits"), num: true }, { label: t("ref.since") }],
            rows: s.subs.map((x) => ({
              cells: [
                `<div class="cell-main">${esc(x.name)}</div>`,
                `<b class="mono">${x.lines}</b>`,
                `<b class="mono">${x.credits}</b>`,
                esc(fmt.date(x.since)),
              ],
            })),
          })}
        </div>
        <div class="card">
          <div class="card-head"><h3>${esc(t("ref.link"))}</h3></div>
          <div class="card-body" style="display:grid;gap:14px">
            ${GI.copyRow(t("ref.link"), link)}
            ${GI.copyRow("ID", s.user.referral)}
            <div>
              <div style="font-weight:600;margin-bottom:10px;font-size:13.5px">${esc(t("ref.tiers"))}</div>
              <div class="bar-list">
                ${tiers.map((x, i) => `
                  <div class="b-row"><span>${esc(x[0])}</span><b class="mono">${esc(x[1])}</b>
                    <span class="track"><i class="fill" style="width:${(i + 1) * 25}%"></i></span></div>`).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>`,
      mount(root) {
        GI.bindCopy(root);
        $("#r-transfer", root).addEventListener("click", () => {
          GI.modal({
            title: t("ref.transfer"),
            body: `
              <div class="field"><label>${esc(t("ref.to"))}</label>
                <select class="select" id="tr-to">${S().subs.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}</select></div>
              <div class="field"><label>${esc(t("common.credits"))}</label>
                <input class="input mono" id="tr-amt" type="number" min="1" value="25"></div>
              <p class="hint">${esc(t("common.balance"))}: ${fmt.num(S().user.credits)}</p>`,
            footer: `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button>
                     <button class="btn primary" id="tr-go">${esc(t("ref.transfer"))}</button>`,
            mount(m) {
              $("#tr-go", m).addEventListener("click", () => {
                const v = Math.max(1, Number($("#tr-amt", m).value) || 0);
                if (S().user.credits < v) { GI.toast(t("lines.noCredits"), "err"); return; }
                const sub = S().subs.find((x) => x.id === $("#tr-to", m).value);
                S().user.credits -= v;
                sub.credits += v;
                S().tx.unshift({
                  id: "TX-" + Math.floor(Math.random() * 90000 + 10000), date: Date.now(), type: "transfer",
                  titleRu: "Перевод суб-дилеру " + sub.name, titleEn: "Transfer to " + sub.name,
                  amount: -v, method: "—", status: "done",
                });
                GI.store.log(`Переведено ${v} кредитов дилеру ${sub.name}`, `Transferred ${v} credits to ${sub.name}`, "🤝");
                GI.closeModal();
                GI.toast(t("ref.sent"));
                GI.render();
              });
            },
          });
        });
      },
    };
  };

  /* ---------- Поддержка ---------- */

  const tst = { open: null };

  views.support = function () {
    const s = S();
    if (!tst.open || !s.tickets.some((x) => x.id === tst.open)) tst.open = s.tickets[0] ? s.tickets[0].id : null;
    const tk = s.tickets.find((x) => x.id === tst.open);
    const stBadge = (st) => st === "open" ? `<span class="badge warn">${esc(t("sup.open"))}</span>`
      : st === "answered" ? `<span class="badge ok">${esc(t("sup.answered"))}</span>`
      : `<span class="badge mute">${esc(t("sup.closed"))}</span>`;

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("sup.title"))}</h1>
        <p>${esc(t("sup.sub"))}</p>
      </div>
      <div class="split">
        <div class="card">
          <div class="card-head">
            <h3>${esc(tk ? tk.id + " · " + (GI.lang === "en" ? tk.subjectEn : tk.subjectRu) : t("sup.title"))}</h3>
            ${tk ? stBadge(tk.status) : ""}
          </div>
          <div class="card-body">
            ${tk ? `
              <div class="thread" id="thread">
                ${tk.messages.map((m) => `
                  <div class="msg ${m.me ? "me" : ""}">
                    <div>${esc(m.text)}</div>
                    <time>${esc(m.me ? (GI.lang === "en" ? "You" : "Вы") : "Globus Support")} · ${esc(fmt.dateTime(m.at))}</time>
                  </div>`).join("")}
              </div>
              ${tk.status !== "closed" ? `
                <div class="row" style="margin-top:16px;gap:10px;align-items:flex-end">
                  <div class="field" style="flex:1"><label>${esc(t("sup.message"))}</label>
                    <textarea class="input" id="sup-msg" rows="2" placeholder="${esc(t("sup.message"))}"></textarea></div>
                  <button class="btn primary" id="sup-send">${icon("mail", 16)} ${esc(t("sup.send"))}</button>
                </div>` : ""}`
              : `<div class="empty">${icon("chat", 28)}<h4>${esc(t("common.nothing"))}</h4><p>${esc(t("sup.sub"))}</p></div>`}
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <div class="card-head"><h3>${esc(t("sup.tickets"))}</h3>
              <button class="btn sm primary" id="sup-new">${icon("plus", 15)} ${esc(t("sup.new"))}</button></div>
            <div class="card-body" style="display:grid;gap:8px">
              ${s.tickets.map((x) => `
                <button class="chip${x.id === tst.open ? " on" : ""}" data-tk="${esc(x.id)}"
                  style="width:100%;text-align:left;display:flex;gap:10px;align-items:center;border-radius:12px;padding:11px 13px">
                  <span class="mono" style="font-size:11px">${esc(x.id)}</span>
                  <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(GI.lang === "en" ? x.subjectEn : x.subjectRu)}</span>
                  ${stBadge(x.status)}
                </button>`).join("")}
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3>${esc(t("sup.faq"))}</h3></div>
            <div class="card-body" style="display:grid;gap:14px">
              ${[["sup.q1", "sup.a1"], ["sup.q2", "sup.a2"], ["sup.q3", "sup.a3"]].map((p) => `
                <div><div style="font-weight:600;font-size:13.5px;margin-bottom:4px">${esc(t(p[0]))}</div>
                <div class="hint" style="line-height:1.55">${esc(t(p[1]))}</div></div>`).join("")}
            </div>
          </div>
        </div>
      </div>`,
      mount(root) {
        $$("[data-tk]", root).forEach((b) =>
          b.addEventListener("click", () => { tst.open = b.getAttribute("data-tk"); GI.render(); }));
        const thread = $("#thread", root);
        if (thread) thread.scrollTop = thread.scrollHeight;
        const send = $("#sup-send", root);
        if (send) send.addEventListener("click", () => {
          const ta = $("#sup-msg", root);
          const text = ta.value.trim();
          if (!text) return;
          const tk2 = S().tickets.find((x) => x.id === tst.open);
          tk2.messages.push({ me: true, text, at: Date.now() });
          tk2.status = "open";
          tk2.updated = Date.now();
          GI.store.save();
          GI.toast(t("sup.replied"));
          GI.render();
          // Демо-ответ поддержки приходит через пару секунд.
          setTimeout(() => {
            const tk3 = S().tickets.find((x) => x.id === tk2.id);
            if (!tk3) return;
            tk3.messages.push({
              me: false,
              text: GI.lang === "en"
                ? "Thanks for the details — the request is with an engineer, we will reply here shortly."
                : "Спасибо за детали — передали инженеру, ответим здесь в ближайшее время.",
              at: Date.now(),
            });
            tk3.status = "answered";
            tk3.updated = Date.now();
            GI.store.save();
            if (location.hash === "#/support") GI.render();
          }, 2600);
        });
        $("#sup-new", root).addEventListener("click", () => {
          GI.modal({
            title: t("sup.new"),
            body: `
              <div class="field"><label>${esc(t("sup.subject"))}</label><input class="input" id="nt-sub"></div>
              <div class="field"><label>${esc(t("sup.priority"))}</label>
                <select class="select" id="nt-pri">
                  <option value="low">${esc(t("sup.low"))}</option>
                  <option value="normal" selected>${esc(t("sup.normal"))}</option>
                  <option value="high">${esc(t("sup.high"))}</option>
                </select></div>
              <div class="field"><label>${esc(t("sup.message"))}</label><textarea class="input" id="nt-msg" rows="4"></textarea></div>`,
            footer: `<button class="btn ghost" data-close>${esc(t("common.cancel"))}</button>
                     <button class="btn primary" id="nt-go">${esc(t("sup.send"))}</button>`,
            mount(m) {
              $("#nt-go", m).addEventListener("click", () => {
                const sub = $("#nt-sub", m).value.trim() || t("sup.new");
                const msg = $("#nt-msg", m).value.trim() || "—";
                const id = "T-" + Math.floor(Math.random() * 900 + 1900);
                S().tickets.unshift({
                  id, subjectRu: sub, subjectEn: sub, status: "open",
                  priority: $("#nt-pri", m).value, updated: Date.now(),
                  messages: [{ me: true, text: msg, at: Date.now() }],
                });
                tst.open = id;
                GI.store.log(`Создан тикет ${id}`, `Ticket ${id} created`, "💬");
                GI.closeModal();
                GI.toast(t("sup.created"));
                GI.render();
              });
            },
          });
        });
      },
    };
  };

  /* ---------- Настройки ---------- */

  views.settings = function () {
    const s = S();
    const sessions = [
      [GI.lang === "en" ? "This browser" : "Этот браузер", "Chrome · " + (navigator.platform || "Web"), true],
      ["iPhone 15", "Safari · iOS 18", false],
      ["MacBook Pro", "Safari · macOS", false],
    ];

    return {
      html: `
      <div class="page-intro">
        <h1>${esc(t("set.title"))}</h1>
        <p>${esc(t("set.sub"))}</p>
      </div>
      <div class="split">
        <div class="grid">
          <div class="card">
            <div class="card-head"><h3>${esc(t("set.profile"))}</h3></div>
            <div class="card-body" style="display:grid;gap:14px">
              <div class="two-col">
                <div class="field"><label>${esc(t("set.name"))}</label><input class="input" id="st-name" value="${esc(s.user.name)}"></div>
                <div class="field"><label>${esc(t("set.email"))}</label><input class="input" id="st-mail" value="${esc(s.user.email)}"></div>
              </div>
              <div class="two-col">
                <div class="field"><label>${esc(t("set.tg"))}</label><input class="input" id="st-tg" value="${esc(s.user.telegram)}"></div>
                <div class="field"><label>${esc(t("common.login"))}</label><input class="input" value="${esc(s.user.login)}" disabled></div>
              </div>
              <div class="row"><div class="spacer"></div><button class="btn primary" id="st-save">${esc(t("common.save"))}</button></div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3>${esc(t("set.security"))}</h3></div>
            <div class="card-body">
              <div class="two-col">
                <div class="field"><label>${esc(t("set.newPass"))}</label><input class="input" type="password" id="st-p1"></div>
                <div class="field"><label>${esc(t("set.repeatPass"))}</label><input class="input" type="password" id="st-p2"></div>
              </div>
              <div class="row" style="margin-top:12px"><div class="spacer"></div>
                <button class="btn" id="st-pass">${icon("key", 15)} ${esc(t("set.changePass"))}</button></div>
              <div class="set-row" style="margin-top:8px">
                <div style="flex:1"><div class="t">${esc(t("set.2fa"))}</div><div class="d">${esc(t("set.2faDesc"))}</div></div>
                <div class="switch${s.user.twoFa ? " on" : ""}" id="sw-2fa"><i></i></div>
              </div>
              <div style="margin-top:14px">
                <div style="font-weight:600;font-size:13.5px;margin-bottom:10px">${esc(t("set.sessions"))}</div>
                ${sessions.map((x) => `
                  <div class="row" style="gap:12px;padding:9px 0">
                    <span class="kpi-ico">${icon("device", 15)}</span>
                    <div><div style="font-size:13.5px;font-weight:600">${esc(x[0])}</div><div class="hint">${esc(x[1])}</div></div>
                    <div class="spacer"></div>
                    ${x[2] ? `<span class="badge ok"><i class="dot live"></i>${esc(t("common.online"))}</span>`
                           : `<button class="btn sm ghost" data-sess>${esc(t("dev.kick"))}</button>`}
                  </div>`).join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-head"><h3>${esc(t("set.notify"))}</h3></div>
            <div class="card-body">
              <div class="set-row">
                <div style="flex:1"><div class="t">${esc(t("set.mailAlerts"))}</div><div class="d">${esc(t("set.mailDesc"))}</div></div>
                <div class="switch${s.user.emailAlerts ? " on" : ""}" id="sw-mail"><i></i></div>
              </div>
              <div class="set-row">
                <div style="flex:1"><div class="t">${esc(t("set.expAlerts"))}</div><div class="d">${esc(t("set.expDesc"))}</div></div>
                <div class="switch${s.user.expiryAlerts ? " on" : ""}" id="sw-exp"><i></i></div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3>${esc(t("set.api"))}</h3></div>
            <div class="card-body" style="display:grid;gap:13px">
              <p class="hint" style="margin:0">${esc(t("set.apiDesc"))}</p>
              ${GI.copyRow(t("set.apiKey"), s.user.apiKey)}
              <div class="row"><div class="spacer"></div>
                <button class="btn sm" id="st-regen">${icon("refresh", 15)} ${esc(t("set.regen"))}</button></div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3 style="color:var(--danger)">${esc(t("set.danger"))}</h3></div>
            <div class="card-body" style="display:grid;gap:12px">
              <p class="hint" style="margin:0">${esc(t("set.resetDesc"))}</p>
              <button class="btn danger" id="st-reset">${icon("trash", 15)} ${esc(t("top.resetDemo"))}</button>
            </div>
          </div>
        </div>
      </div>`,
      mount(root) {
        GI.bindCopy(root);
        $("#st-save", root).addEventListener("click", () => {
          const u = S().user;
          u.name = $("#st-name", root).value.trim() || u.name;
          u.email = $("#st-mail", root).value.trim();
          u.telegram = $("#st-tg", root).value.trim();
          GI.store.save();
          GI.toast(t("set.saved"));
          GI.render();
        });
        $("#st-pass", root).addEventListener("click", () => {
          const a = $("#st-p1", root).value, b = $("#st-p2", root).value;
          if (!a || a !== b) { GI.toast(t("set.passMismatch"), "err"); return; }
          GI.toast(t("set.passChanged"));
          $("#st-p1", root).value = ""; $("#st-p2", root).value = "";
        });
        const sw = (id, key) => {
          const el = $(id, root);
          if (!el) return;
          el.addEventListener("click", () => {
            S().user[key] = !S().user[key];
            el.classList.toggle("on");
            GI.store.save();
            GI.toast(t("set.saved"));
          });
        };
        sw("#sw-2fa", "twoFa"); sw("#sw-mail", "emailAlerts"); sw("#sw-exp", "expiryAlerts");
        $("#st-regen", root).addEventListener("click", () => {
          S().user.apiKey = "gi_live_" + GI.randomPass() + GI.randomPass();
          GI.store.save();
          GI.toast(t("set.regenDone"));
          GI.render();
        });
        $$("[data-sess]", root).forEach((b) =>
          b.addEventListener("click", () => { b.closest(".row").remove(); GI.toast(t("dev.kicked"), "info"); }));
        $("#st-reset", root).addEventListener("click", async () => {
          const ok = await GI.confirm(t("set.resetDesc"), t("common.reset"));
          if (!ok) return;
          GI.store.reset();
          GI.toast(t("top.resetDemo"), "info");
          location.hash = "#/overview";
          GI.render();
        });
      },
    };
  };
})();
