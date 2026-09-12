/* Демо-данные и хранилище состояния Globus IPTV.
   Всё живёт в localStorage: действия в интерфейсе реально меняют состояние. */

(function () {
  const GI = (window.GI = window.GI || {});
  const KEY = "globus-iptv:v1";
  const DAY = 86400000;

  /* Детерминированный генератор — демо-данные одинаковы при каждом сбросе. */
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  const rnd = rng(20260912);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  const CATEGORIES = [
    { id: "all", ru: "Все", en: "All" },
    { id: "sport", ru: "Спорт", en: "Sports" },
    { id: "movies", ru: "Кино", en: "Movies" },
    { id: "news", ru: "Новости", en: "News" },
    { id: "kids", ru: "Детские", en: "Kids" },
    { id: "music", ru: "Музыка", en: "Music" },
    { id: "doc", ru: "Познавательные", en: "Documentary" },
    { id: "ent", ru: "Развлечения", en: "Entertainment" },
    { id: "4k", ru: "4K UHD", en: "4K UHD" },
  ];

  const CHANNEL_SEED = [
    ["Globus Sport 1", "sport", "FHD"], ["Globus Sport 2", "sport", "FHD"],
    ["Match Arena", "sport", "HD"], ["Euro Football", "sport", "FHD"],
    ["Fight Club TV", "sport", "HD"], ["Moto Racing", "sport", "HD"],
    ["Basket Zone", "sport", "HD"], ["Sport 4K Ultra", "sport", "4K"],
    ["Globus Cinema", "movies", "FHD"], ["Premiere Hall", "movies", "FHD"],
    ["Action Max", "movies", "HD"], ["Comedy Room", "movies", "HD"],
    ["Drama Line", "movies", "HD"], ["Horror Night", "movies", "HD"],
    ["Classic Film", "movies", "SD"], ["Cinema 4K", "movies", "4K"],
    ["Globus News", "news", "FHD"], ["World Report", "news", "HD"],
    ["Business Wire", "news", "HD"], ["Local 24", "news", "SD"],
    ["Kids Planet", "kids", "HD"], ["Cartoon Box", "kids", "HD"],
    ["Baby Time", "kids", "SD"], ["Teen Wave", "kids", "HD"],
    ["Music Beat", "music", "HD"], ["Rock Legends", "music", "HD"],
    ["Jazz Cafe", "music", "SD"], ["Club Dance", "music", "FHD"],
    ["Discovery Globe", "doc", "FHD"], ["Nature Life", "doc", "FHD"],
    ["History Line", "doc", "HD"], ["Space & Science", "doc", "4K"],
    ["Show Time", "ent", "HD"], ["Reality Plus", "ent", "HD"],
    ["Cook Studio", "ent", "HD"], ["Travel Road", "ent", "FHD"],
    ["Fashion One", "ent", "HD"], ["Auto Drive", "ent", "HD"],
    ["Globus 4K Demo", "4k", "4K"], ["Nature 4K", "4k", "4K"],
    ["City Cam 4K", "4k", "4K"], ["Concert 4K", "4k", "4K"],
  ];

  const PROGRAMS = {
    sport: ["Лига чемпионов: обзор", "Прямой эфир: матч тура", "Гран-при: квалификация", "Аналитика недели", "Бокс: вечер боёв"],
    movies: ["Премьера: «Северный ветер»", "Кинохит вечера", "Ретроспектива классики", "Сериал: 3 сезон", "Ночной сеанс"],
    news: ["Новости часа", "Деловой обзор", "Погода и трафик", "Интервью дня", "Итоги недели"],
    kids: ["Весёлые приключения", "Школа рисования", "Мультсериал: 12 серия", "Сказка на ночь", "Утренний блок"],
    music: ["Топ-40 недели", "Живой концерт", "Клипы 2000-х", "Ночной микс", "Акустика"],
    doc: ["Тайны океана", "Как устроен город", "Древние цивилизации", "Космос: миссия", "Дикая природа"],
    ent: ["Вечернее шоу", "Кулинарный поединок", "Тревел-дневник", "Модный приговор", "Тест-драйв"],
    "4k": ["Панорамы планеты", "Ультра-детализация", "Живые города", "Концерт в 4K", "Природа крупным планом"],
  };

  const PACKAGES = [
    { id: "start", name: "Start", channels: 620, conns: 1, price: 4, credits: 1, quality: "HD" },
    { id: "plus", name: "Plus", channels: 1480, conns: 2, price: 7, credits: 2, quality: "FHD" },
    { id: "pro", name: "Pro", channels: 2600, conns: 3, price: 11, credits: 3, quality: "FHD + 4K" },
    { id: "ultra", name: "Ultra 4K", channels: 4200, conns: 5, price: 16, credits: 4, quality: "4K UHD" },
  ];

  const DEVICE_TYPES = ["MAG 424", "Smart TV Samsung", "Smart TV LG", "Android TV Box", "iPhone", "Android", "Windows PC", "Apple TV"];
  const COUNTRIES = [
    ["🇷🇺", "Россия", "Russia"], ["🇩🇪", "Германия", "Germany"], ["🇰🇿", "Казахстан", "Kazakhstan"],
    ["🇺🇸", "США", "USA"], ["🇬🇧", "Великобритания", "UK"], ["🇦🇲", "Армения", "Armenia"],
    ["🇹🇷", "Турция", "Turkey"], ["🇮🇱", "Израиль", "Israel"],
  ];
  const NAMES = ["ivanov", "petrov", "sidorov", "kuznec", "orlov", "smirnov", "volkov", "belov", "markov", "titov",
    "gruber", "schmidt", "keller", "novak", "horvat", "kaplan", "demir", "yildiz", "ahmed", "cohen",
    "jones", "miller", "davis", "clark", "wright", "hall", "young", "king"];

  const HEX = "0123456789ABCDEF";
  function mac() {
    let s = "00:1A:79";
    for (let i = 0; i < 3; i++) s += ":" + HEX[int(0, 15)] + HEX[int(0, 15)];
    return s;
  }
  function ip() { return `${int(31, 212)}.${int(1, 254)}.${int(1, 254)}.${int(1, 254)}`; }
  function pass() {
    const c = "abcdefghjkmnpqrstuvwxyz23456789";
    let s = "";
    for (let i = 0; i < 10; i++) s += c[int(0, c.length - 1)];
    return s;
  }

  function buildChannels() {
    return CHANNEL_SEED.map((c, i) => {
      const [name, cat, q] = c;
      const dur = int(25, 95);
      return {
        id: "ch" + (i + 1),
        num: 100 + i,
        name,
        cat,
        quality: q,
        hue: (i * 37) % 360,
        viewers: int(120, 24000),
        epg: pick(PROGRAMS[cat]),
        next: pick(PROGRAMS[cat]),
        duration: dur,
        passed: int(3, dur - 3),
        archive: rnd() > 0.35,
      };
    });
  }

  function buildLines(now) {
    const out = [];
    for (let i = 0; i < 34; i++) {
      const pkg = pick(PACKAGES);
      const created = now - int(10, 520) * DAY;
      const months = pick([1, 1, 3, 6, 12]);
      let exp = created + months * 30 * DAY;
      // Немного просроченных и несколько «скоро истекает» — чтобы дашборд был живым.
      if (i % 9 === 0) exp = now - int(1, 25) * DAY;
      else if (i % 5 === 0) exp = now + int(1, 7) * DAY;
      else if (exp < now) exp = now + int(20, 300) * DAY;
      const country = pick(COUNTRIES);
      const online = exp > now && rnd() > 0.55;
      out.push({
        id: "L" + (10240 + i),
        user: pick(NAMES) + int(10, 999),
        pass: pass(),
        pkg: pkg.id,
        conns: pkg.conns,
        activeConns: online ? int(1, pkg.conns) : 0,
        created,
        exp,
        online,
        note: "",
        blocked: i % 17 === 0,
        device: pick(DEVICE_TYPES),
        mac: mac(),
        ip: ip(),
        flag: country[0],
        countryRu: country[1],
        countryEn: country[2],
        trial: i % 11 === 0,
      });
    }
    return out;
  }

  function buildTx(now) {
    const kinds = [
      { type: "topup", ru: "Пополнение баланса", en: "Balance top-up" },
      { type: "renew", ru: "Продление подписки", en: "Subscription renewal" },
      { type: "create", ru: "Создание линии", en: "Line created" },
      { type: "bonus", ru: "Реферальный бонус", en: "Referral bonus" },
      { type: "transfer", ru: "Перевод суб-дилеру", en: "Transfer to sub-reseller" },
    ];
    const out = [];
    for (let i = 0; i < 26; i++) {
      const k = pick(kinds);
      const income = k.type === "topup" || k.type === "bonus";
      out.push({
        id: "TX-" + (80410 + i),
        date: now - int(0, 90) * DAY - int(0, 82000000),
        type: k.type,
        titleRu: k.ru,
        titleEn: k.en,
        amount: income ? int(20, 400) : -int(4, 64),
        method: income ? pick(["USDT TRC-20", "Банковская карта", "Bitcoin", "СБП"]) : "—",
        status: rnd() > 0.09 ? "done" : "pending",
      });
    }
    return out.sort((a, b) => b.date - a.date);
  }

  function buildTickets(now) {
    return [
      {
        id: "T-1841", subjectRu: "Не грузится Globus Sport 2", subjectEn: "Globus Sport 2 won't load",
        status: "open", priority: "high", updated: now - 2 * 3600000,
        messages: [
          { me: true, text: "Добрый день! У клиента на MAG 424 не открывается Globus Sport 2, остальные каналы работают.", at: now - 5 * 3600000 },
          { me: false, text: "Здравствуйте! Видим повышенную нагрузку на этом источнике. Уже переключили канал на резервный CDN — попросите клиента перезапустить портал.", at: now - 2 * 3600000 },
        ],
      },
      {
        id: "T-1836", subjectRu: "Нужен счёт на оплату для юрлица", subjectEn: "Invoice for a company needed",
        status: "answered", priority: "normal", updated: now - 26 * 3600000,
        messages: [
          { me: true, text: "Можно выставить счёт на 500 кредитов?", at: now - 30 * 3600000 },
          { me: false, text: "Счёт GI-2026-0341 сформирован и доступен в разделе «Финансы».", at: now - 26 * 3600000 },
        ],
      },
      {
        id: "T-1802", subjectRu: "Просьба добавить армянские каналы", subjectEn: "Please add Armenian channels",
        status: "closed", priority: "low", updated: now - 9 * DAY,
        messages: [
          { me: true, text: "Добавьте, пожалуйста, пакет армянских каналов.", at: now - 12 * DAY },
          { me: false, text: "Добавили 18 каналов, они уже в букете Plus и выше.", at: now - 9 * DAY },
        ],
      },
    ];
  }

  function buildNotifications(now) {
    return [
      { id: "n1", ru: "12 подписок истекают в ближайшие 7 дней", en: "12 subscriptions expire within 7 days", at: now - 40 * 60000, read: false, icon: "⏳" },
      { id: "n2", ru: "Добавлено 34 канала в букет Ultra 4K", en: "34 channels added to the Ultra 4K bouquet", at: now - 5 * 3600000, read: false, icon: "📡" },
      { id: "n3", ru: "Поддержка ответила по тикету T-1841", en: "Support replied to ticket T-1841", at: now - 2 * 3600000, read: false, icon: "💬" },
      { id: "n4", ru: "Баланс пополнен на 250 кредитов", en: "Balance topped up by 250 credits", at: now - 2 * DAY, read: true, icon: "💳" },
      { id: "n5", ru: "Плановые работы на CDN-узле Frankfurt 03:00–04:00 UTC", en: "Scheduled CDN maintenance in Frankfurt, 03:00–04:00 UTC", at: now - 3 * DAY, read: true, icon: "🛠" },
    ];
  }

  function buildSeries(now, days, base, spread) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const weekend = new Date(now - i * DAY).getDay() % 6 === 0;
      out.push({
        t: now - i * DAY,
        v: Math.max(0, Math.round(base + Math.sin(i / 3.4) * spread * 0.5 + rnd() * spread + (weekend ? spread * 0.6 : 0))),
      });
    }
    return out;
  }

  function fresh() {
    const now = Date.now();
    return {
      version: 1,
      user: {
        name: "Grish Hayrapetyan",
        login: "demo",
        email: "demo@globus.tv",
        role: "reseller",
        credits: 486,
        money: 1240.5,
        since: now - 430 * DAY,
        apiKey: "gi_live_" + pass() + pass(),
        twoFa: false,
        emailAlerts: true,
        expiryAlerts: true,
        telegram: "@globus_demo",
        referral: "GLOBUS-DEMO-7742",
      },
      prefs: { theme: "dark", lang: "ru" },
      channels: buildChannels(),
      favorites: ["ch1", "ch9", "ch17", "ch39"],
      lines: buildLines(now),
      tx: buildTx(now),
      tickets: buildTickets(now),
      notifications: buildNotifications(now),
      subs: [
        { id: "s1", name: "tv-shop-berlin", credits: 74, lines: 41, since: now - 210 * DAY },
        { id: "s2", name: "almaty-iptv", credits: 18, lines: 12, since: now - 96 * DAY },
        { id: "s3", name: "yerevan-net", credits: 132, lines: 63, since: now - 320 * DAY },
      ],
      series: {
        connections: buildSeries(now, 30, 180, 70),
        traffic: buildSeries(now, 30, 620, 260),
        revenue: buildSeries(now, 12, 220, 140),
      },
      activity: [],
    };
  }

  const store = {
    state: null,
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1) { this.state = parsed; return this.state; }
        }
      } catch (e) { /* повреждённое хранилище — просто пересоздаём */ }
      this.state = fresh();
      this.save();
      return this.state;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* приватный режим */ }
    },
    reset() { this.state = fresh(); this.save(); return this.state; },
    log(ru, en, icon) {
      this.state.activity.unshift({ at: Date.now(), ru, en, icon: icon || "•" });
      this.state.activity = this.state.activity.slice(0, 40);
      this.save();
    },
  };

  GI.DAY = DAY;
  GI.CATEGORIES = CATEGORIES;
  GI.PACKAGES = PACKAGES;
  GI.DEVICE_TYPES = DEVICE_TYPES;
  GI.COUNTRIES = COUNTRIES;
  GI.store = store;
  GI.randomPass = pass;
  GI.randomMac = mac;
  GI.pkgById = (id) => PACKAGES.find((p) => p.id === id) || PACKAGES[0];
})();
