(() => {
  "use strict";

  const STORAGE_KEY = "globusiptv.account";
  const HOST = "http://globusiptv.pro:8080";

  const PLANS = [
    { id: "start", name: "Старт", price: 0, deviceLimit: 1, features: ["150+ каналов", "1 устройство", "Качество SD/HD"] },
    { id: "optimal", name: "Оптимальный", price: 499, deviceLimit: 2, features: ["300+ каналов", "2 устройства", "Full HD", "Архив 3 дня"] },
    { id: "max", name: "Максимум", price: 999, deviceLimit: 5, features: ["500+ каналов", "5 устройств", "4K на поддерживаемых каналах", "Архив 7 дней", "Поддержка 24/7"] },
  ];

  const els = {};

  function randomToken(len) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function genConnection() {
    return {
      login: `u${randomToken(6)}`,
      password: randomToken(10),
    };
  }

  function addMonths(date, n) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d.toISOString();
  }

  const defaultState = () => ({
    loggedIn: false,
    name: "",
    email: "",
    phone: "",
    balance: 1250,
    planId: "start",
    activeDevices: 1,
    expiryDate: addMonths(Date.now(), 1),
    notifyEmail: true,
    notifySms: false,
    theme: "system",
    transactions: null,
    conn: null,
  });

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch {
      return defaultState();
    }
  }

  let state = loadState();

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function genTransactions() {
    const items = [
      { desc: "Оплата тарифа Оптимальный", amount: -499 },
      { desc: "Пополнение баланса", amount: 1000 },
      { desc: "Оплата тарифа Старт", amount: 0 },
      { desc: "Возврат средств", amount: 150 },
      { desc: "Пополнение баланса", amount: 500 },
      { desc: "Оплата тарифа Оптимальный", amount: -499 },
    ];
    const now = Date.now();
    return items.map((it, i) => ({
      ...it,
      date: new Date(now - i * 5 * 24 * 3600 * 1000).toISOString(),
      status: it.amount < 0 ? "success" : i === 4 ? "pending" : "success",
    }));
  }

  function fmtMoney(n) {
    return `${n.toLocaleString("ru-RU")} ₽`;
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
  }

  function initials(name) {
    return (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { els.toast.hidden = true; }, 2200);
  }

  function applyTheme() {
    if (state.theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (state.theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function renderGreeting() {
    const hour = new Date().getHours();
    const part = hour < 6 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
    els.greeting.textContent = `${part}, ${state.name || "гость"}!`;
    els.topAvatar.textContent = initials(state.name);
  }

  function currentPlan() {
    return PLANS.find(p => p.id === state.planId) || PLANS[0];
  }

  function renderOverview() {
    els.balanceValue.textContent = fmtMoney(state.balance);
    const plan = currentPlan();
    els.planName.textContent = plan.name;
    els.planRenew.textContent = `Активна до ${fmtDate(state.expiryDate)}`;

    const devices = Math.min(state.activeDevices, plan.deviceLimit);
    const pct = Math.min(100, Math.round((devices / plan.deviceLimit) * 100));
    els.usageFill.style.width = `${pct}%`;
    els.usageText.textContent = `${devices} из ${plan.deviceLimit} устройств`;

    els.recentTx.innerHTML = state.transactions.slice(0, 4).map(txItemHtml).join("");
  }

  function txItemHtml(tx) {
    const isNeg = tx.amount < 0;
    const amountClass = tx.amount === 0 ? "" : isNeg ? "negative" : "positive";
    const sign = tx.amount > 0 ? "+" : "";
    const badge = tx.status === "success"
      ? '<span class="badge badge-success">Выполнено</span>'
      : '<span class="badge badge-warning">В обработке</span>';
    return `<li>
      <div class="tx-main">
        <span class="tx-desc">${tx.desc}</span>
        <span class="tx-date">${fmtDate(tx.date)}</span>
      </div>
      <span class="tx-amount ${amountClass}">${sign}${fmtMoney(tx.amount).replace("-", "")}</span>
      ${badge}
    </li>`;
  }

  function renderProfile() {
    els.profileName.value = state.name;
    els.profileEmail.value = state.email;
    els.profilePhone.value = state.phone;
  }

  function renderPlans() {
    els.plans.innerHTML = PLANS.map(p => `
      <div class="plan ${p.id === state.planId ? "current" : ""}">
        <span class="plan-name">${p.name}</span>
        <span class="plan-price">${p.price === 0 ? "Бесплатно" : fmtMoney(p.price)}${p.price > 0 ? " <span>/мес</span>" : ""}</span>
        <ul class="plan-features">${p.features.map(f => `<li>${f}</li>`).join("")}</ul>
        <button class="btn ${p.id === state.planId ? "btn-ghost" : "btn-primary"}" data-plan="${p.id}" ${p.id === state.planId ? "disabled" : ""}>
          ${p.id === state.planId ? "Текущий тариф" : "Выбрать"}
        </button>
      </div>
    `).join("");

    els.plans.querySelectorAll("[data-plan]").forEach(btn => {
      btn.addEventListener("click", () => {
        const plan = PLANS.find(p => p.id === btn.dataset.plan);
        state.planId = plan.id;
        state.expiryDate = addMonths(Date.now(), 1);
        if (plan.price > 0) {
          state.balance -= plan.price;
          state.transactions.unshift({ desc: `Оплата тарифа ${plan.name}`, amount: -plan.price, date: new Date().toISOString(), status: "success" });
        }
        saveState();
        renderOverview();
        renderPlans();
        renderHistory();
        toast("Тариф обновлён");
      });
    });
  }

  function renderConnection() {
    if (!state.conn) {
      state.conn = genConnection();
      saveState();
    }
    els.connHost.value = HOST;
    els.connLogin.value = state.conn.login;
    els.connPassword.value = state.conn.password;
    els.connM3u.value = `${HOST}/get.php?username=${state.conn.login}&password=${state.conn.password}&type=m3u_plus&output=ts`;
  }

  function renderHistory() {
    els.txTableBody.innerHTML = state.transactions.map(tx => {
      const isNeg = tx.amount < 0;
      const amountClass = tx.amount === 0 ? "" : isNeg ? "negative" : "positive";
      const sign = tx.amount > 0 ? "+" : "";
      const badge = tx.status === "success"
        ? '<span class="badge badge-success">Выполнено</span>'
        : '<span class="badge badge-warning">В обработке</span>';
      return `<tr>
        <td>${fmtDate(tx.date)}</td>
        <td>${tx.desc}</td>
        <td class="tx-amount ${amountClass}">${sign}${fmtMoney(tx.amount).replace("-", "")}</td>
        <td>${badge}</td>
      </tr>`;
    }).join("");
  }

  function renderSettings() {
    els.darkModeToggle.checked = state.theme === "dark";
    els.notifyEmail.checked = state.notifyEmail;
    els.notifySms.checked = state.notifySms;
  }

  function renderAll() {
    renderGreeting();
    renderOverview();
    renderProfile();
    renderPlans();
    renderConnection();
    renderHistory();
    renderSettings();
  }

  function showView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.dataset.view === name));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    const titles = { overview: "Обзор", profile: "Профиль", subscription: "Подписка", connection: "Подключение", history: "История", settings: "Настройки" };
    els.viewTitle.textContent = titles[name] || "";
    els.sidebar.classList.remove("open");
    els.sidebarBackdrop.classList.remove("open");
  }

  function enterApp() {
    els.authScreen.hidden = true;
    els.app.hidden = false;
    if (!state.transactions) {
      state.transactions = genTransactions();
      saveState();
    }
    renderAll();
    showView("overview");
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const tmp = document.createElement("textarea");
        tmp.value = text;
        tmp.style.position = "fixed";
        tmp.style.opacity = "0";
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        document.body.removeChild(tmp);
        return true;
      } catch {
        return false;
      }
    }
  }

  function bind() {
    els.loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      state.loggedIn = true;
      state.name = els.loginName.value.trim();
      state.email = els.loginEmail.value.trim();
      saveState();
      enterApp();
    });

    els.logoutBtn.addEventListener("click", () => {
      state.loggedIn = false;
      saveState();
      els.app.hidden = true;
      els.authScreen.hidden = false;
      els.loginForm.reset();
    });

    els.nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav-item");
      if (btn) showView(btn.dataset.view);
    });

    document.querySelectorAll("[data-goto]").forEach(btn => {
      btn.addEventListener("click", () => showView(btn.dataset.goto));
    });

    els.menuBtn.addEventListener("click", () => {
      els.sidebar.classList.toggle("open");
      els.sidebarBackdrop.classList.toggle("open");
    });

    els.sidebarBackdrop.addEventListener("click", () => {
      els.sidebar.classList.remove("open");
      els.sidebarBackdrop.classList.remove("open");
    });

    els.themeBtn.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      saveState();
      applyTheme();
      renderSettings();
    });

    els.darkModeToggle.addEventListener("change", () => {
      state.theme = els.darkModeToggle.checked ? "dark" : "light";
      saveState();
      applyTheme();
    });

    els.notifyEmail.addEventListener("change", () => { state.notifyEmail = els.notifyEmail.checked; saveState(); });
    els.notifySms.addEventListener("change", () => { state.notifySms = els.notifySms.checked; saveState(); });

    els.profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      state.name = els.profileName.value.trim();
      state.email = els.profileEmail.value.trim();
      state.phone = els.profilePhone.value.trim();
      saveState();
      renderGreeting();
      els.profileSaved.hidden = false;
      setTimeout(() => { els.profileSaved.hidden = true; }, 2000);
    });

    els.topUpBtn.addEventListener("click", () => {
      state.balance += 500;
      state.transactions.unshift({ desc: "Пополнение баланса", amount: 500, date: new Date().toISOString(), status: "success" });
      saveState();
      renderOverview();
      renderHistory();
      toast("Баланс пополнен на 500 ₽");
    });

    document.querySelectorAll(".btn-copy").forEach(btn => {
      btn.addEventListener("click", async () => {
        const input = document.getElementById(btn.dataset.copy);
        const ok = await copyToClipboard(input.value);
        toast(ok ? "Скопировано" : "Не удалось скопировать");
      });
    });

    els.regenConnBtn.addEventListener("click", () => {
      state.conn = genConnection();
      saveState();
      renderConnection();
      toast("Новые данные для подключения сгенерированы");
    });

    els.deleteAccountBtn.addEventListener("click", () => {
      if (!confirm("Удалить демо-аккаунт и очистить все данные в этом браузере?")) return;
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
  }

  function cacheEls() {
    [
      "authScreen", "app", "loginForm", "loginName", "loginEmail", "loginPassword",
      "sidebar", "nav", "logoutBtn", "menuBtn", "viewTitle", "themeBtn", "topAvatar",
      "greeting", "balanceValue", "planName", "planRenew", "usageFill", "usageText",
      "recentTx", "topUpBtn", "profileForm", "profileName", "profileEmail", "profilePhone",
      "profileSaved", "plans", "connHost", "connLogin", "connPassword", "connM3u", "regenConnBtn",
      "txTableBody", "darkModeToggle", "notifyEmail", "notifySms",
      "deleteAccountBtn", "toast", "sidebarBackdrop",
    ].forEach(id => { els[id] = document.getElementById(id); });
    els.sidebar = document.querySelector(".sidebar");
  }

  document.addEventListener("DOMContentLoaded", () => {
    cacheEls();
    applyTheme();
    bind();
    if (state.loggedIn) enterApp();
  });
})();
