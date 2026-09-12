/* Мелкие кирпичики интерфейса: иконки, форматирование, графики, модалки, тосты. */

(function () {
  const GI = (window.GI = window.GI || {});
  const t = (k) => GI.t(k);

  /* ---------- DOM ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) =>
    String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  /* ---------- Иконки (24×24, stroke) ---------- */
  const PATHS = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.8 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.8-3.8-9S9.5 5.7 12 3z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
    users: '<path d="M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19"/><circle cx="9" cy="7" r="3.2"/><path d="M22 19v-1.5a4 4 0 0 0-3-3.8"/><path d="M16 3.7a4 4 0 0 1 0 6.6"/>',
    tv: '<rect x="2.5" y="6" width="19" height="12.5" rx="2.2"/><path d="M8 21h8M8.5 6l4-3.2M15.5 6l-4-3.2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    device: '<rect x="3" y="4" width="13" height="16" rx="2"/><rect x="17" y="9" width="4.5" height="11" rx="1.4"/><path d="M8 20h3"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    wallet: '<rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M2.5 10h19M17 14.5h.01"/>',
    tag: '<path d="M12.6 2.6H21v8.4l-9.7 9.7a2 2 0 0 1-2.8 0l-5.6-5.6a2 2 0 0 1 0-2.8z"/><circle cx="17" cy="7" r="1.4"/>',
    gift: '<rect x="2.5" y="8.5" width="19" height="4.5" rx="1.4"/><path d="M4.5 13v7a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-7M12 8.5V21"/><path d="M12 8.5S10.6 3 8 3a2.6 2.6 0 0 0 0 5.5zM12 8.5S13.4 3 16 3a2.6 2.6 0 0 1 0 5.5z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.3A8 8 0 1 1 21 12z"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.88 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.88.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.5z"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 20a2 2 0 0 1-3.4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    trash: '<path d="M3 6h18M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>',
    play: '<path d="M6 4.5 19 12 6 19.5z"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.4 7.5 9.5 4.4-1.1 7.5-4.9 7.5-9.5V6z"/>',
    logout: '<path d="M15 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2M19 12H9m10 0-3.5-3.5M19 12l-3.5 3.5"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.2 4.2 5.9 5.9M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8 5.9 18.1M18.1 5.9l1.7-1.7"/>',
    moon: '<path d="M20 14.2A8.4 8.4 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    link: '<path d="M10 13a4.5 4.5 0 0 0 6.5.4l3-3A4.5 4.5 0 0 0 13.2 4l-1.7 1.7"/><path d="M14 11a4.5 4.5 0 0 0-6.5-.4l-3 3A4.5 4.5 0 0 0 10.8 20l1.7-1.7"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    up: '<path d="M12 19V5M12 5l-6 6M12 5l6 6"/>',
    down: '<path d="M12 5v14M12 19l-6-6M12 19l6-6"/>',
    signal: '<path d="M4.5 19.5v-5M9.5 19.5v-9M14.5 19.5v-13M19.5 19.5v-17"/>',
    key: '<circle cx="7.5" cy="15.5" r="4"/><path d="m10.4 12.6 8.1-8.1M16 7l2.5 2.5M13.8 9.2l2.5 2.5"/>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  };

  GI.icon = function (name, size) {
    const p = PATHS[name] || PATHS.grid;
    const s = size || 18;
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  };

  /* ---------- Форматирование ---------- */
  const locale = () => (GI.lang === "en" ? "en-GB" : "ru-RU");

  GI.fmt = {
    date(ts) { return new Date(ts).toLocaleDateString(locale(), { day: "2-digit", month: "short", year: "numeric" }); },
    dateTime(ts) { return new Date(ts).toLocaleString(locale(), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); },
    time(ts) { return new Date(ts).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }); },
    num(n) { return Number(n).toLocaleString(locale()); },
    money(n) { return (n < 0 ? "-" : "") + "$" + Math.abs(Number(n)).toFixed(2); },
    rel(ts) {
      const diff = Date.now() - ts;
      const m = Math.round(diff / 60000);
      const en = GI.lang === "en";
      if (m < 1) return en ? "just now" : "только что";
      if (m < 60) return en ? `${m} min ago` : `${m} мин назад`;
      const h = Math.round(m / 60);
      if (h < 24) return en ? `${h} h ago` : `${h} ч назад`;
      const d = Math.round(h / 24);
      if (d < 30) return en ? `${d} d ago` : `${d} дн назад`;
      return GI.fmt.date(ts);
    },
    daysLeft(ts) { return Math.ceil((ts - Date.now()) / GI.DAY); },
  };

  GI.lineStatus = function (line) {
    if (line.blocked) return { key: "blocked", cls: "dead", label: t("common.blocked") };
    const d = GI.fmt.daysLeft(line.exp);
    if (d < 0) return { key: "expired", cls: "dead", label: t("common.expired") };
    if (d <= 7) return { key: "expiring", cls: "warn", label: t("common.expiring") };
    return { key: "active", cls: "ok", label: t("common.active") };
  };

  /* ---------- Тосты ---------- */
  GI.toast = function (msg, kind) {
    let box = $(".toasts");
    if (!box) {
      box = document.createElement("div");
      box.className = "toasts";
      document.body.appendChild(box);
    }
    const el = document.createElement("div");
    el.className = "toast " + (kind || "ok");
    const ico = kind === "err" ? "x" : kind === "info" ? "bolt" : "check";
    el.innerHTML = `<span style="color:var(--${kind === "err" ? "danger" : kind === "info" ? "accent" : "ok"})">${GI.icon(ico, 17)}</span><div>${esc(msg)}</div>`;
    box.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .25s ease, transform .25s ease";
      el.style.opacity = "0";
      el.style.transform = "translateX(16px)";
      setTimeout(() => el.remove(), 260);
    }, 3200);
  };

  GI.copy = function (text) {
    const done = () => GI.toast(t("common.copied"));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { GI.toast(text, "info"); }
      ta.remove();
    }
  };

  /* ---------- Модальные окна ---------- */
  GI.modal = function (opts) {
    GI.closeModal();
    const back = document.createElement("div");
    back.className = "backdrop" + (opts.paletteMode ? " palette" : "");
    back.innerHTML = `
      <div class="modal${opts.wide ? " wide" : ""}" role="dialog" aria-modal="true">
        ${opts.title ? `<div class="modal-head">
          <h3>${esc(opts.title)}</h3>
          <div class="spacer"></div>
          <button class="icon-btn" data-close aria-label="${esc(t("common.close"))}">${GI.icon("x", 16)}</button>
        </div>` : ""}
        <div class="modal-body">${opts.body || ""}</div>
        ${opts.footer ? `<div class="modal-foot">${opts.footer}</div>` : ""}
      </div>`;
    document.body.appendChild(back);
    document.body.style.overflow = "hidden";
    back.addEventListener("mousedown", (e) => { if (e.target === back) GI.closeModal(); });
    $$("[data-close]", back).forEach((b) => b.addEventListener("click", GI.closeModal));
    const focusable = $("input, select, textarea, button", $(".modal-body", back) || back);
    if (focusable && !opts.noFocus) setTimeout(() => focusable.focus(), 40);
    if (opts.mount) opts.mount(back);
    return back;
  };

  GI.closeModal = function () {
    const b = $(".backdrop");
    if (b) b.remove();
    if (!$(".backdrop")) document.body.style.overflow = "";
  };

  GI.confirm = function (text, okLabel) {
    return new Promise((resolve) => {
      const back = GI.modal({
        title: t("common.confirm"),
        body: `<p style="margin:0;line-height:1.6">${esc(text)}</p>`,
        footer: `<button class="btn ghost" data-no>${esc(t("common.cancel"))}</button>
                 <button class="btn danger" data-yes>${esc(okLabel || t("common.delete"))}</button>`,
      });
      $("[data-no]", back).addEventListener("click", () => { GI.closeModal(); resolve(false); });
      $("[data-yes]", back).addEventListener("click", () => { GI.closeModal(); resolve(true); });
    });
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") GI.closeModal();
  });

  /* ---------- Графики (чистый SVG, без библиотек) ---------- */

  const defs = `
    <defs>
      <linearGradient id="gi-area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gi-line" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--accent)"/>
        <stop offset="100%" stop-color="var(--accent-2)"/>
      </linearGradient>
      <linearGradient id="gi-bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)"/>
        <stop offset="100%" stop-color="var(--accent-2)" stop-opacity="0.55"/>
      </linearGradient>
    </defs>`;

  function smoothPath(pts) {
    if (!pts.length) return "";
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const mx = (x0 + x1) / 2;
      d += ` C ${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
    }
    return d;
  }

  GI.areaChart = function (series, opts) {
    opts = opts || {};
    const w = 800, h = opts.height || 220, padL = 38, padB = 26, padT = 14, padR = 8;
    const vals = series.map((s) => s.v);
    const max = Math.max.apply(null, vals) * 1.12 || 1;
    const min = 0;
    const iw = w - padL - padR, ih = h - padB - padT;
    const pts = series.map((s, i) => [
      padL + (series.length === 1 ? iw / 2 : (i / (series.length - 1)) * iw),
      padT + ih - ((s.v - min) / (max - min)) * ih,
    ]);
    const line = smoothPath(pts);
    const area = `${line} L ${pts[pts.length - 1][0]} ${padT + ih} L ${pts[0][0]} ${padT + ih} Z`;
    let grid = "", labels = "";
    for (let g = 0; g <= 4; g++) {
      const y = padT + (ih / 4) * g;
      grid += `<line class="grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
      labels += `<text class="axis" x="4" y="${y + 3}">${GI.fmt.num(Math.round(max - (max / 4) * g))}</text>`;
    }
    let xlab = "";
    const step = Math.max(1, Math.round(series.length / 6));
    series.forEach((s, i) => {
      if (i % step === 0) {
        xlab += `<text class="axis" text-anchor="middle" x="${pts[i][0]}" y="${h - 6}">${new Date(s.t).toLocaleDateString(locale(), { day: "2-digit", month: "short" })}</text>`;
      }
    });
    const dots = pts.map((p, i) =>
      `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="transparent"><title>${GI.fmt.date(series[i].t)}: ${GI.fmt.num(series[i].v)}</title></circle>`
    ).join("");
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">${defs}
      ${grid}${labels}${xlab}
      <path d="${area}" fill="url(#gi-area)"/>
      <path d="${line}" fill="none" stroke="url(#gi-line)" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="4.5" fill="var(--accent)"/>
      ${dots}
    </svg>`;
  };

  GI.barChart = function (series, opts) {
    opts = opts || {};
    const w = 800, h = opts.height || 200, padL = 38, padB = 26, padT = 12, padR = 8;
    const max = Math.max.apply(null, series.map((s) => s.v)) * 1.15 || 1;
    const iw = w - padL - padR, ih = h - padB - padT;
    const bw = Math.max(4, (iw / series.length) * 0.6);
    let grid = "", labels = "";
    for (let g = 0; g <= 3; g++) {
      const y = padT + (ih / 3) * g;
      grid += `<line class="grid-line" x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}"/>`;
      labels += `<text class="axis" x="4" y="${y + 3}">${GI.fmt.num(Math.round(max - (max / 3) * g))}</text>`;
    }
    const bars = series.map((s, i) => {
      const x = padL + (i + 0.5) * (iw / series.length) - bw / 2;
      const bh = Math.max(2, (s.v / max) * ih);
      const y = padT + ih - bh;
      return `<rect class="bar" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="4"><title>${esc(s.label || "")}: ${GI.fmt.num(s.v)}</title></rect>
        <text class="axis" text-anchor="middle" x="${x + bw / 2}" y="${h - 6}">${esc(s.label || "")}</text>`;
    }).join("");
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">${defs}${grid}${labels}${bars}</svg>`;
  };

  GI.sparkline = function (values, color) {
    const w = 300, h = 60;
    const max = Math.max.apply(null, values) || 1;
    const min = Math.min.apply(null, values);
    const pts = values.map((v, i) => [
      (i / (values.length - 1)) * w,
      h - ((v - min) / ((max - min) || 1)) * (h - 8) - 4,
    ]);
    const line = smoothPath(pts);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <path d="${line} L ${w} ${h} L 0 ${h} Z" fill="${color || "var(--accent)"}" opacity="0.14"/>
      <path d="${line}" fill="none" stroke="${color || "var(--accent)"}" stroke-width="2"/>
    </svg>`;
  };

  GI.donut = function (parts, centerLabel) {
    const size = 168, r = 62, cx = size / 2, cy = size / 2, sw = 22;
    const total = parts.reduce((a, p) => a + p.v, 0) || 1;
    const C = 2 * Math.PI * r;
    let off = 0;
    const arcs = parts.map((p) => {
      const len = (p.v / total) * C;
      const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.color}" stroke-width="${sw}"
        stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-off}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"><title>${esc(p.label)}: ${GI.fmt.num(p.v)}</title></circle>`;
      off += len;
      return el;
    }).join("");
    const legend = parts.map((p) =>
      `<div><i style="background:${p.color}"></i>${esc(p.label)} — <b class="mono">${GI.fmt.num(p.v)}</b></div>`
    ).join("");
    return `<div class="donut-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${sw}"/>
        ${arcs}
        <text class="donut-center" x="${cx}" y="${cy - 2}" text-anchor="middle" fill="var(--text)" font-size="21">${esc(centerLabel || total)}</text>
        <text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="var(--text-mute)" font-size="10.5">${esc(t("common.total"))}</text>
      </svg>
      <div class="legend" style="flex-direction:column;gap:9px">${legend}</div>
    </div>`;
  };

  GI.barList = function (rows) {
    const max = Math.max.apply(null, rows.map((r) => r.v)) || 1;
    return `<div class="bar-list">` + rows.map((r) => `
      <div class="b-row">
        <span>${esc(r.label)}</span><b class="mono">${esc(r.text || GI.fmt.num(r.v))}</b>
        <span class="track"><i class="fill" style="width:${Math.round((r.v / max) * 100)}%"></i></span>
      </div>`).join("") + `</div>`;
  };

  /* ---------- Таблица с сортировкой и страницами ---------- */
  GI.table = function (cfg) {
    const cols = cfg.columns;
    const head = cols.map((c) =>
      `<th class="${c.num ? "num " : ""}${c.sort ? "" : "no-sort"}" ${c.sort ? `data-sort="${esc(c.sort)}"` : ""}>${esc(c.label)}${
        cfg.sortKey === c.sort ? ` <span class="arrow">${cfg.sortDir === 1 ? "▲" : "▼"}</span>` : ""
      }</th>`).join("");
    const body = cfg.rows.length
      ? cfg.rows.map((r) => `<tr ${r.id ? `data-row="${esc(r.id)}"` : ""}>${
          r.cells.map((c, i) => `<td class="${cols[i] && cols[i].num ? "num" : ""}">${c}</td>`).join("")
        }</tr>`).join("")
      : `<tr><td colspan="${cols.length}"><div class="empty">${GI.icon("search", 26)}<h4>${esc(t("common.nothing"))}</h4><p>${esc(t("common.nothingHint"))}</p></div></td></tr>`;
    return `<div class="table-wrap"><table class="tbl"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  };

  GI.pager = function (page, pages, total) {
    if (pages <= 1) return `<div class="pager">${esc(t("common.total"))}: <b class="mono">${GI.fmt.num(total)}</b></div>`;
    return `<div class="pager">
      <span>${esc(t("common.total"))}: <b class="mono">${GI.fmt.num(total)}</b></span>
      <button class="btn sm ghost" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>${esc(t("common.prev"))}</button>
      <span class="mono">${page} ${esc(t("common.of"))} ${pages}</span>
      <button class="btn sm ghost" data-page="${page + 1}" ${page >= pages ? "disabled" : ""}>${esc(t("common.next"))}</button>
    </div>`;
  };

  GI.copyRow = function (label, value) {
    return `<div class="field">
      <label>${esc(label)}</label>
      <div class="copy-row"><code>${esc(value)}</code>
        <button class="btn sm ghost" data-copy="${esc(value)}">${GI.icon("copy", 14)}</button>
      </div>
    </div>`;
  };

  GI.bindCopy = function (root) {
    $$("[data-copy]", root).forEach((b) =>
      b.addEventListener("click", (e) => { e.stopPropagation(); GI.copy(b.getAttribute("data-copy")); })
    );
  };

  GI.$ = $;
  GI.$$ = $$;
  GI.esc = esc;
})();
