const board = document.getElementById("board");
const token = document.getElementById("token");
const panel = document.getElementById("panel");
const moneyEl = document.getElementById("money");
const rollBtn = document.getElementById("roll");
const playerNameEl = document.getElementById("playerName");

// ⭐ баланс
let stars = 1500;
let position = 0;
let rolling = false;

// Палитры “как Monopoly One по ощущению”, но Vice
const COLORSETS = [
  ["#7C3AED","#A78BFA"], // purple
  ["#06B6D4","#67E8F9"], // cyan
  ["#F43F5E","#FDA4AF"], // rose
  ["#F59E0B","#FDE68A"], // amber
  ["#22C55E","#86EFAC"], // green
  ["#3B82F6","#93C5FD"], // blue
];

// 40 клеток: уникальные названия (свои) + типы
// (без копирования оригинальных названий/ассетов)
const CELLS = [
  { type:"start", name:"START", bar:["#00F6FF","#FF2BD6"] },

  { type:"prop", name:"Vice Street", price:60, rent:2, set:0 },
  { type:"chance", name:"CHANCE", bar:["#FF2BD6","#00F6FF"] },
  { type:"prop", name:"Neon Avenue", price:60, rent:4, set:0 },
  { type:"tax", name:"STAR TAX", value:200, bar:["#FFD36A","#FF2BD6"] },

  { type:"station", name:"Skyline Transit", price:200, rent:25, bar:["#00F6FF","#00F6FF"] },
  { type:"prop", name:"Pink Boulevard", price:100, rent:6, set:2 },
  { type:"chance", name:"CHANCE", bar:["#FF2BD6","#00F6FF"] },
  { type:"prop", name:"Ocean Drive", price:100, rent:6, set:2 },
  { type:"prop", name:"Sunset Pier", price:120, rent:8, set:2 },

  { type:"jail", name:"IN JAIL", bar:["#00F6FF","#FF2BD6"] },

  { type:"prop", name:"Club District", price:140, rent:10, set:1 },
  { type:"utility", name:"Neon Power", price:150, rent:12, bar:["#67E8F9","#A78BFA"] },
  { type:"prop", name:"Vice Plaza", price:140, rent:10, set:1 },
  { type:"prop", name:"Arcade Strip", price:160, rent:12, set:1 },

  { type:"station", name:"Coast Transit", price:200, rent:25, bar:["#00F6FF","#00F6FF"] },

  { type:"prop", name:"Cyber Street", price:180, rent:14, set:5 },
  { type:"chance", name:"CHANCE", bar:["#FF2BD6","#00F6FF"] },
  { type:"prop", name:"Miami Way", price:180, rent:14, set:5 },
  { type:"prop", name:"Palm Heights", price:200, rent:16, set:5 },

  { type:"parking", name:"FREE PARKING", bar:["#22C55E","#86EFAC"] },

  { type:"prop", name:"Vice Tower", price:220, rent:18, set:3 },
  { type:"chance", name:"CHANCE", bar:["#FF2BD6","#00F6FF"] },
  { type:"prop", name:"Neon Hills", price:220, rent:18, set:3 },
  { type:"prop", name:"Gold Marina", price:240, rent:20, set:3 },

  { type:"station", name:"Night Transit", price:200, rent:25, bar:["#00F6FF","#00F6FF"] },

  { type:"prop", name:"Ocean Tower", price:260, rent:22, set:4 },
  { type:"prop", name:"Luxury Mile", price:260, rent:22, set:4 },
  { type:"utility", name:"Vice Water", price:150, rent:12, bar:["#67E8F9","#A78BFA"] },
  { type:"prop", name:"Resort Bay", price:280, rent:24, set:4 },

  { type:"gotojail", name:"GO TO JAIL", bar:["#FF2BD6","#00F6FF"] },

  { type:"prop", name:"Neon Resort", price:300, rent:26, set:1 },
  { type:"chance", name:"CHANCE", bar:["#FF2BD6","#00F6FF"] },
  { type:"prop", name:"Vice Palace", price:300, rent:26, set:1 },
  { type:"prop", name:"Starline Hotel", price:320, rent:28, set:1 },

  { type:"station", name:"Airport Transit", price:200, rent:25, bar:["#00F6FF","#00F6FF"] },
  { type:"chance", name:"CHANCE", bar:["#FF2BD6","#00F6FF"] },
  { type:"prop", name:"Ultra Penthouse", price:350, rent:35, set:0 },
  { type:"tax", name:"LUXURY TAX", value:100, bar:["#FFD36A","#FF2BD6"] },
  { type:"prop", name:"VICE ICON", price:400, rent:50, set:0 },
];

const ownedByMe = new Set(); // MVP: один игрок

function star(n){ return `⭐ ${n}`; }
function clamp0(n){ return Math.max(0, n); }

function renderBoard(){
  board.querySelectorAll(".cell").forEach(n=>n.remove());

  // Периметр 11x11: координаты в процентах
  // Углы (0,10,20,30)
  const coords = getPerimeterCoords();

  for (let i=0;i<40;i++){
    const c = CELLS[i];
    const el = document.createElement("div");
    el.className = "cell" + (isCorner(i) ? " corner" : "");
    el.style.left = coords[i].x + "%";
    el.style.top  = coords[i].y + "%";
    el.style.width  = (isCorner(i) ? "18%" : (isHorizontal(i) ? "8%" : "18%"));
    el.style.height = (isCorner(i) ? "18%" : (isHorizontal(i) ? "18%" : "8%"));

    // полоска цвета (как в Monopoly One)
    let bar = c.bar;
    if (!bar && c.type === "prop"){
      const [a,b] = COLORSETS[c.set % COLORSETS.length];
      bar = [a,b];
    }
    if (!bar) bar = ["#2dd4bf","#a78bfa"];

    el.innerHTML = `
      <div class="bar" style="background:linear-gradient(90deg, ${bar[0]}, ${bar[1]})"></div>
      <div class="label">${c.name}</div>
      <div class="sub">
        <span class="badge">${badgeFor(c, i)}</span>
        <span>${priceText(c, i)}</span>
      </div>
    `;
    board.appendChild(el);
  }
}

function badgeFor(c, i){
  if (c.type==="start") return "GO";
  if (c.type==="jail") return "JAIL";
  if (c.type==="gotojail") return "🚓";
  if (c.type==="parking") return "FREE";
  if (c.type==="chance") return "?";
  if (c.type==="tax") return "TAX";
  if (c.type==="station") return "TRANSIT";
  if (c.type==="utility") return "UTIL";
  if (c.type==="prop") return ownedByMe.has(i) ? "OWNED" : "BUY";
  return "";
}

function priceText(c, i){
  if (c.type==="prop" || c.type==="station" || c.type==="utility"){
    return ownedByMe.has(i) ? "" : star(c.price);
  }
  if (c.type==="tax") return `-${star(c.value)}`;
  return "";
}

function isCorner(i){ return i===0 || i===10 || i===20 || i===30; }
function isHorizontal(i){ return (i>0 && i<10) || (i>20 && i<30); }

function getPerimeterCoords(){
  // координаты по периметру, чтобы было “как Monopoly”
  // нижняя сторона: 0..10 (0 правый низ угол, 10 левый низ угол) — мы делаем старт в правом нижнем?
  // Чтобы проще: пусть 0 = правый нижний угол (как ощущение “старт”), дальше идём влево.
  const coords = [];
  // Нижняя: x 82..0 шаг 8, y 82
  coords.push({x:82,y:82}); // 0 corner
  for(let k=1;k<=9;k++) coords.push({x:82-k*8,y:82});
  coords.push({x:0,y:82}); // 10 corner
  // Левая: y 74..8 шаг 8, x 0
  for(let k=1;k<=9;k++) coords.push({x:0,y:82-k*8});
  coords.push({x:0,y:0}); // 20 corner
  // Верхняя: x 8..74 шаг 8, y 0
  for(let k=1;k<=9;k++) coords.push({x:k*8,y:0});
  coords.push({x:82,y:0}); // 30 corner
  // Правая: y 8..74 шаг 8, x 82
  for(let k=1;k<=9;k++) coords.push({x:82,y:k*8});

  return coords; // 40
}

function updateToken(){
  const coords = getPerimeterCoords();
  token.style.left = (coords[position].x + 2) + "%";
  token.style.top  = (coords[position].y + 2) + "%";
}

function openPanel(html){
  panel.style.display = "block";
  panel.innerHTML = html;
}

function closePanel(){
  panel.style.display = "none";
}

function applyCell(){
  const c = CELLS[position];

  if (c.type==="start"){
    // small bonus feeling
    stars += 50;
    moneyEl.textContent = star(stars);
    openPanel(`<div class="title">START</div><div class="row"><span>Бонус</span><span>+${star(50)}</span></div>`);
    return;
  }

  if (c.type==="tax"){
    stars = clamp0(stars - c.value);
    moneyEl.textContent = star(stars);
    openPanel(`<div class="title">${c.name}</div><div class="row"><span>Оплата</span><span>-${star(c.value)}</span></div>`);
    return;
  }

  if (c.type==="chance"){
    // MVP: простые события
    const events = [
      {t:"Ночной бонус", d:+100},
      {t:"Штраф за парковку", d:-75},
      {t:"Подарок подписчика", d:+60},
      {t:"Лимузин", d:-50},
    ];
    const e = events[Math.floor(Math.random()*events.length)];
    stars = clamp0(stars + e.d);
    moneyEl.textContent = star(stars);
    openPanel(`<div class="title">CHANCE</div><div class="row"><span>${e.t}</span><span>${e.d>0?"+":""}${star(Math.abs(e.d))}</span></div>`);
    return;
  }

  if (c.type==="gotojail"){
    position = 10; // “jail”
    updateToken();
    openPanel(`<div class="title">GO TO JAIL</div><div class="row"><span>Переход</span><span>В тюрьму</span></div>`);
    return;
  }

  if (c.type==="jail" || c.type==="parking"){
    openPanel(`<div class="title">${c.name}</div><div class="row"><span>Событие</span><span>Отдых</span></div>`);
    return;
  }

  // Покупка клеток
  if ((c.type==="prop" || c.type==="station" || c.type==="utility")){
    const owned = ownedByMe.has(position);
    const canBuy = !owned && stars >= c.price;

    openPanel(`
      <div class="title">${c.name}</div>
      <div class="row"><span>Цена</span><span>${star(c.price)}</span></div>
      <div class="row"><span>Рента</span><span>${star(c.rent || 10)}</span></div>
      <div class="actions">
        <button class="btn primary" ${canBuy ? "" : "disabled"} id="buyBtn">${owned ? "Уже твоё" : (canBuy ? "Купить" : "Не хватает ⭐")}</button>
        <button class="btn ghost" id="closeBtn">Ок</button>
      </div>
    `);

    const buyBtn = document.getElementById("buyBtn");
    const closeBtn = document.getElementById("closeBtn");

    closeBtn.onclick = closePanel;

    buyBtn.onclick = () => {
      if (owned) return closePanel;
      if (stars < c.price) return;
      stars -= c.price;
      ownedByMe.add(position);
      moneyEl.textContent = star(stars);
      renderBoard(); // обновим бейджи/цену
      openPanel(`<div class="title">Куплено ✔</div><div class="row"><span>${c.name}</span><span>теперь твоё</span></div>
      <div class="actions"><button class="btn ghost" id="ok2">Ок</button></div>`);
      document.getElementById("ok2").onclick = closePanel;
    };

    return;
  }
}

rollBtn.onclick = () => {
  if (rolling) return;
  rolling = true;
  rollBtn.disabled = true;
  rollBtn.classList.add("rolling");

  // “анимация” + случай
  setTimeout(() => {
    const roll = Math.floor(Math.random()*6) + 1;
    position = (position + roll) % 40;
    updateToken();
    applyCell();

    rollBtn.classList.remove("rolling");
    rollBtn.disabled = false;
    rolling = false;
  }, 650);
};

// Init (имя можно позже получить из Telegram.WebApp)
playerNameEl.textContent = "PLAYER";
moneyEl.textContent = star(stars);

renderBoard();
updateToken();
