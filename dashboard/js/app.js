(() => {
  "use strict";

  const STORAGE_KEY = "orbit.account";

  const PLANS = [
    { id: "basic", name: "Basic", price: 0, features: ["1 устройство", "10 ГБ трафика", "Базовая поддержка"] },
    { id: "pro", name: "Pro", price: 499, features: ["5 устройств", "100 ГБ трафика", "Приоритетная поддержка", "Без рекламы"] },
    { id: "premium", name: "Premium", price: 999, features: ["Безлимит устройств", "1 ТБ трафика", "Поддержка 24/7", "Ранний доступ к новинкам"] },
  ];

  const els = {};

  const defaultState = () => ({
    loggedIn: false,
    name: "",
    email: "",
    phone: "",
    balance: 1250,
    planId: "basic",
    usageGb: 42,
    usageLimitGb: 100,
    notifyEmail: true,
    notifySms: false,
    theme: "system",
    transactions: null,
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
      { desc: "Оплата тарифа Pro", amount: -499 },
      { desc: "Пополнение баланса", amount: 1000 },
      { desc: "Оплата тарифа Basic", amount: 0 },
      { desc: "Возврат средств", amount: 150 },
      { desc: "Пополнение баланса", amount: 500 },
      { desc: "Оплата тарифа Pro", amount: -499 },
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

  function renderOverview() {
    els.balanceValue.textContent = fmtMoney(state.balance);
    const plan = PLANS.find(p => p.id === state.planId) || PLANS[0];
    els.planName.textContent = plan.name;
    els.planRenew.textContent = plan.price > 0 ? "Продление 1 числа" : "Бесплатный тариф";

    const pct = Math.min(100, Math.round((state.usageGb / state.usageLimitGb) * 100));
    els.usageFill.style.width = `${pct}%`;
    els.usageText.textContent = `${state.usageGb} из ${state.usageLimitGb} ГБ`;

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
        state.planId = btn.dataset.plan;
        saveState();
        renderOverview();
        renderPlans();
        toast("Тариф обновлён");
      });
    });
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
    renderHistory();
    renderSettings();
  }

  function showView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.dataset.view === name));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    const titles = { overview: "Обзор", profile: "Профиль", subscription: "Подписка", history: "История", settings: "Настройки" };
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
      "profileSaved", "plans", "txTableBody", "darkModeToggle", "notifyEmail", "notifySms",
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
