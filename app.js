/* ====== Telegram Mini App safe sizing + board build ====== */
(function () {
  // Telegram WebApp (если открыто внутри ТГ)
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.expand();
      tg.setBackgroundColor("#2b353d");
      tg.setHeaderColor("#2b353d");
    } catch (_) {}
  }

  const app = document.getElementById("app");
  const board = document.getElementById("board");
  const playersEl = document.getElementById("players");

  // ===== demo players (потом заменишь на реальные) =====
  const players = [
    { name: "pehi44", money: "17,500k", color: "#ff5b5b" },
    { name: "dimakulik", money: "17,500k", color: "#34d399" },
    { name: "Sanich303", money: "17,500k", color: "#60a5fa" },
  ];

  function renderPlayers() {
    playersEl.innerHTML = "";
    players.forEach(p => {
      const card = document.createElement("div");
      card.className = "player-card";
      const av = document.createElement("div");
      av.className = "player-avatar";
      av.style.borderColor = p.color;

      const name = document.createElement("div");
      name.className = "player-name";
      name.textContent = p.name;

      const money = document.createElement("div");
      money.className = "player-money";
      money.textContent = `$ ${p.money}`;

      card.appendChild(av);
      card.appendChild(name);
      card.appendChild(money);
      playersEl.appendChild(card);
    });
  }

  // ===== 40 cells like Monopoly One layout =====
  // 4 corners + 9 between corners on each side
  // Мы строим по периметру 10 на сторону (включая угол) => 40
  const CELL_COUNT = 40;

  // Поставь сюда свои картинки (потом заменишь на реальные URL или локальные файлы)
  const logos = [
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23ffffff'/><text x='50%25' y='55%25' font-size='42' text-anchor='middle' fill='%23000'>GO</text></svg>",
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23ffffff'/><text x='50%25' y='55%25' font-size='32' text-anchor='middle' fill='%23000'>NOKIA</text></svg>",
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23ffffff'/><text x='50%25' y='55%25' font-size='34' text-anchor='middle' fill='%23000'>BOSS</text></svg>",
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23ffffff'/><text x='50%25' y='55%25' font-size='32' text-anchor='middle' fill='%23000'>APPLE</text></svg>",
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23ffffff'/><text x='50%25' y='55%25' font-size='30' text-anchor='middle' fill='%23000'>ADIDAS</text></svg>",
  ];

  const prices = [
    "200k","400k","600k","800k","1,000k","1,200k","1,500k","2,000k","2,200k","2,400k","2,600k","3,000k"
  ];
  const priceColors = ["#f97316","#ec4899","#22c55e","#3b82f6","#a855f7","#ef4444"];

  function getLogo(i) {
    return logos[i % logos.length];
  }
  function getPrice(i) {
    return prices[i % prices.length];
  }
  function getPriceColor(i) {
    return priceColors[i % priceColors.length];
  }

  let cellDivs = [];

  function buildCells() {
    // удалить старые
    cellDivs.forEach(el => el.remove());
    cellDivs = [];

    for (let i = 0; i < CELL_COUNT; i++) {
      const c = document.createElement("div");
      c.className = "cell";

      const img = document.createElement("img");
      img.src = getLogo(i);

      const priceBar = document.createElement("div");
      priceBar.className = "price";
      priceBar.style.background = getPriceColor(i);
      priceBar.textContent = getPrice(i);

      c.appendChild(img);
      c.appendChild(priceBar);

      board.appendChild(c);
      cellDivs.push(c);
    }
  }

  // ===== sizing like monopoly-one: square board fits between left & right =====
  function updateBoardSize() {
    // available size inside app
    const rect = app.getBoundingClientRect();

    // оставим место по высоте так, чтобы не упиралось в верх/низ
    const maxByHeight = rect.height;
    const maxByWidth = rect.width - parseInt(getComputedStyle(document.documentElement).getPropertyValue("--players-w")) - parseInt(getComputedStyle(document.documentElement).getPropertyValue("--actions-w")) - 20;

    const size = Math.floor(Math.min(maxByWidth, maxByHeight));
    document.documentElement.style.setProperty("--board-size", `${size}px`);

    layoutCells(size);
  }

  // размещаем 40 клеток по периметру
  function layoutCells(boardSize) {
    // 10 клеток на сторону (включая угол)
    const perSide = 10;

    // ширина клетки на верх/низ (маленькие) и угол (большой)
    // как в monopoly: углы чуть крупнее
    const corner = Math.floor(boardSize * 0.12);         // ~12% от поля
    const small = Math.floor((boardSize - corner * 2) / (perSide - 2)); // между углами (8 штук)

    // итоговая корректировка, чтобы не было щелей
    const track = corner + small * (perSide - 2) + corner; // должен ≈ boardSize

    // helper: set rect
    const setRect = (el, x, y, w, h) => {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
    };

    // порядок клеток:
    // 0..9 top (left->right)
    // 10..19 right (top->bottom)
    // 20..29 bottom (right->left)
    // 30..39 left (bottom->top)
    for (let i = 0; i < CELL_COUNT; i++) {
      const el = cellDivs[i];

      if (i >= 0 && i < 10) {
        // TOP
        const idx = i;
        if (idx === 0) {
          setRect(el, 0, 0, corner, corner); // top-left corner
        } else if (idx === 9) {
          setRect(el, boardSize - corner, 0, corner, corner); // top-right corner
        } else {
          const x = corner + (idx - 1) * small;
          setRect(el, x, 0, small, corner);
        }
      } else if (i >= 10 && i < 20) {
        // RIGHT
        const idx = i - 10;
        if (idx === 0) {
          setRect(el, boardSize - corner, 0, corner, corner); // already top-right (overlaps) -> move slightly: we keep unique by nudging
          // instead of overlap, shift one pixel:
          el.style.top = "0px";
        } else if (idx === 9) {
          setRect(el, boardSize - corner, boardSize - corner, corner, corner); // bottom-right corner
        } else {
          const y = corner + (idx - 1) * small;
          setRect(el, boardSize - corner, y, corner, small);
        }
      } else if (i >= 20 && i < 30) {
        // BOTTOM (right->left)
        const idx = i - 20;
        if (idx === 0) {
          setRect(el, boardSize - corner, boardSize - corner, corner, corner); // bottom-right
        } else if (idx === 9) {
          setRect(el, 0, boardSize - corner, corner, corner); // bottom-left
        } else {
          const x = boardSize - corner - idx * small;
          setRect(el, x, boardSize - corner, small, corner);
        }
      } else {
        // LEFT (bottom->top)
        const idx = i - 30;
        if (idx === 0) {
          setRect(el, 0, boardSize - corner, corner, corner); // bottom-left
        } else if (idx === 9) {
          setRect(el, 0, 0, corner, corner); // top-left
        } else {
          const y = boardSize - corner - idx * small;
          setRect(el, 0, y, corner, small);
        }
      }

      // тонкая белая линия как в оригинале
      el.style.borderColor = "rgba(0,0,0,0.12)";
    }

    // IMPORTANT: убираем реальные оверлап-углы (мы создали 4 угла по 2 раза в логике сторон)
    // Поэтому делаем 4 угла только один раз:
    // оставляем углы: 0 (TL), 9 (TR), 19 (BR), 29 (BL)
    // а дублеры: 10(TR), 20(BR), 30(BL), 39(TL) -> скрываем
    [10, 20, 30, 39].forEach(i => {
      if (cellDivs[i]) cellDivs[i].style.display = "none";
    });
  }

  // chat demo
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.addEventListener("click", () => {
    const text = (input.value || "").trim();
    if (!text) return;
    input.value = "";
    if (tg) {
      try { tg.HapticFeedback.impactOccurred("light"); } catch (_) {}
    }
  });

  // init
  renderPlayers();
  buildCells();
  updateBoardSize();

  // keep stable on rotate / resize / telegram viewport changes
  window.addEventListener("resize", () => {
    // небольшой debounce
    clearTimeout(window.__rsz);
    window.__rsz = setTimeout(updateBoardSize, 50);
  });

})();
