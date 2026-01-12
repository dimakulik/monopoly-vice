const board = document.getElementById("board");
const token = document.getElementById("token");
const bottomPanel = document.getElementById("bottomPanel");

const meStarsEl = document.getElementById("meStars");
const rollBtn = document.getElementById("rollBtn");

const chatPanel = document.getElementById("chatPanel");
const chatToggle = document.getElementById("chatToggle");
const chatClose = document.getElementById("chatClose");
const chatBody = document.getElementById("chatBody");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

let stars = 1450;
let position = 0;
let rolling = false;

const COLORSETS = [
  ["#7C3AED","#A78BFA"], // purple
  ["#06B6D4","#67E8F9"], // cyan
  ["#F43F5E","#FDA4AF"], // rose
  ["#F59E0B","#FDE68A"], // amber
  ["#22C55E","#86EFAC"], // green
  ["#3B82F6","#93C5FD"], // blue
];

const CELLS = [
  { type:"start", name:"START", bar:["#00F6FF","#FF2BD6"] },

  { type:"prop", name:"Vice Street", price:60, rent:2, set:0, icon:"palm" },
  { type:"chance", name:"CHANCE", icon:"question" },
  { type:"prop", name:"Neon Avenue", price:60, rent:4, set:0, icon:"neon" },
  { type:"tax", name:"STAR TAX", value:200, icon:"coin" },

  { type:"station", name:"Skyline Transit", price:200, rent:25, icon:"train" },
  { type:"prop", name:"Pink Boulevard", price:100, rent:6, set:2, icon:"heart" },
  { type:"chance", name:"CHANCE", icon:"question" },
  { type:"prop", name:"Ocean Drive", price:100, rent:6, set:2, icon:"wave" },
  { type:"prop", name:"Sunset Pier", price:120, rent:8, set:2, icon:"sun" },

  { type:"jail", name:"IN JAIL", icon:"jail" },

  { type:"prop", name:"Club District", price:140, rent:10, set:1, icon:"music" },
  { type:"utility", name:"Neon Power", price:150, rent:12, icon:"bolt" },
  { type:"prop", name:"Vice Plaza", price:140, rent:10, set:1, icon:"tower" },
  { type:"prop", name:"Arcade Strip", price:160, rent:12, set:1, icon:"game" },

  { type:"station", name:"Coast Transit", price:200, rent:25, icon:"train" },

  { type:"prop", name:"Cyber Street", price:180, rent:14, set:5, icon:"chip" },
  { type:"chance", name:"CHANCE", icon:"question" },
  { type:"prop", name:"Miami Way", price:180, rent:14, set:5, icon:"car" },
  { type:"prop", name:"Palm Heights", price:200, rent:16, set:5, icon:"palm" },

  { type:"parking", name:"FREE PARKING", icon:"park" },

  { type:"prop", name:"Vice Tower", price:220, rent:18, set:3, icon:"tower" },
  { type:"chance", name:"CHANCE", icon:"question" },
  { type:"prop", name:"Neon Hills", price:220, rent:18, set:3, icon:"mount" },
  { type:"prop", name:"Gold Marina", price:240, rent:20, set:3, icon:"anchor" },

  { type:"station", name:"Night Transit", price:200, rent:25, icon:"train" },

  { type:"prop", name:"Ocean Tower", price:260, rent:22, set:4, icon:"tower" },
  { type:"prop", name:"Luxury Mile", price:260, rent:22, set:4, icon:"diamond" },
  { type:"utility", name:"Vice Water", price:150, rent:12, icon:"drop" },
  { type:"prop", name:"Resort Bay", price:280, rent:24, set:4, icon:"hotel" },

  { type:"gotojail", name:"GO TO JAIL", icon:"police" },

  { type:"prop", name:"Neon Resort", price:300, rent:26, set:1, icon:"hotel" },
  { type:"chance", name:"CHANCE", icon:"question" },
  { type:"prop", name:"Vice Palace", price:300, rent:26, set:1, icon:"crown" },
  { type:"prop", name:"Starline Hotel", price:320, rent:28, set:1, icon:"hotel" },

  { type:"station", name:"Airport Transit", price:200, rent:25, icon:"plane" },
  { type:"chance", name:"CHANCE", icon:"question" },
  { type:"prop", name:"Ultra Penthouse", price:350, rent:35, set:0, icon:"pent" },
  { type:"tax", name:"LUXURY TAX", value:100, icon:"coin" },
  { type:"prop", name:"VICE ICON", price:400, rent:50, set:0, icon:"star" },
];

const ownedByMe = new Set();

function fmtStars(n){ return `⭐ ${n}`; }
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function nowTime(){
  const d = new Date();
  return d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
}
function addLog(who, text){
  const el = document.createElement("div");
  el.className = "msg";
  el.innerHTML = `
    <div class="mhead">
      <div class="who">${escapeHtml(who)}</div>
      <div class="time">${nowTime()}</div>
    </div>
    <div class="text">${escapeHtml(text)}</div>
  `;
  chatBody.appendChild(el);
  chatBody.scrollTop = chatBody.scrollHeight;
}

chatToggle.onclick = () => chatPanel.classList.add("open");
chatClose.onclick = () => chatPanel.classList.remove("open");

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const txt = chatInput.value.trim();
  if (!txt) return;
  addLog("YOU", txt);
  chatInput.value = "";
});

function isCorner(i){ return i===0 || i===10 || i===20 || i===30; }
function isHorizontal(i){ return (i>0 && i<10) || (i>20 && i<30); }

function getPerimeterCoords(){
  const coords = [];
  coords.push({x:82,y:82}); // 0 corner bottom-right
  for(let k=1;k<=9;k++) coords.push({x:82-k*8,y:82});
  coords.push({x:0,y:82});  // 10 corner bottom-left
  for(let k=1;k<=9;k++) coords.push({x:0,y:82-k*8});
  coords.push({x:0,y:0});   // 20 corner top-left
  for(let k=1;k<=9;k++) coords.push({x:k*8,y:0});
  coords.push({x:82,y:0});  // 30 corner top-right
  for(let k=1;k<=9;k++) coords.push({x:82,y:k*8});
  return coords;
}

/* SVG “картинки” (иконки) — это и есть изображения на клетках */
function iconSvg(name){
  const stroke = "rgba(255,255,255,0.85)";
  const fill = "rgba(0,246,255,0.18)";
  const pink = "rgba(255,43,214,0.28)";

  const svg = (body) => `
    <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      ${body}
    </svg>
  `;

  switch(name){
    case "question": return svg(`<path d="M12 18h.01" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.9.7-1.5 1.1-1.5 2.5" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "coin": return svg(`<circle cx="12" cy="12" r="7" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M9.5 12h5" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "train": return svg(`<rect x="7" y="4" width="10" height="12" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M8 16l-2 4M16 16l2 4" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><path d="M9 8h6" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "bolt": return svg(`<path d="M13 2L6 14h6l-1 8 7-12h-6l1-8z" fill="${pink}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`);
    case "jail": return svg(`<rect x="6" y="5" width="12" height="14" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M10 5v14M14 5v14" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "police": return svg(`<path d="M12 3l8 4v6c0 5-4 8-8 8s-8-3-8-8V7l8-4z" fill="${pink}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/><path d="M9 11h6" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "palm": return svg(`<path d="M12 21v-8" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><path d="M12 13c-3 0-6-2-7-4 3 1 6 0 7-2 1 2 4 3 7 2-1 2-4 4-7 4z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`);
    case "wave": return svg(`<path d="M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "sun": return svg(`<circle cx="12" cy="12" r="4" fill="${pink}" stroke="${stroke}" stroke-width="1.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>`);
    case "music": return svg(`<path d="M10 18a2 2 0 1 1-1-1.73V7l10-2v8.5" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/><circle cx="18" cy="17" r="2" fill="${pink}" stroke="${stroke}" stroke-width="1.5"/>`);
    case "tower": return svg(`<path d="M8 21V8l4-4 4 4v13" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/><path d="M10 12h4M10 16h4" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "game": return svg(`<rect x="6" y="9" width="12" height="8" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M9 13h2M10 12v2" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><circle cx="15.5" cy="12.5" r="1" fill="${pink}"/><circle cx="16.8" cy="14.2" r="1" fill="${pink}"/>`);
    case "chip": return svg(`<rect x="7" y="7" width="10" height="10" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "car": return svg(`<path d="M6 15l1-5h10l1 5" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/><path d="M7 10l2-3h6l2 3" fill="${pink}" stroke="${stroke}" stroke-width="1.5"/><circle cx="8" cy="16" r="1.5" fill="${stroke}"/><circle cx="16" cy="16" r="1.5" fill="${stroke}"/>`);
    case "park": return svg(`<path d="M8 21V9c0-3 2-5 4-5s4 2 4 5v12" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M8 13h8" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "mount": return svg(`<path d="M3 19l6-10 4 6 2-3 6 7" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "anchor": return svg(`<path d="M12 4v10" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="4" r="2" fill="${pink}" stroke="${stroke}" stroke-width="1.5"/><path d="M6 14c0 4 3 7 6 7s6-3 6-7" fill="none" stroke="${stroke}" stroke-width="2"/><path d="M9 11h6" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "diamond": return svg(`<path d="M12 3l5 6-5 12L7 9l5-6z" fill="${pink}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "drop": return svg(`<path d="M12 3c4 6 6 8 6 11a6 6 0 0 1-12 0c0-3 2-5 6-11z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "hotel": return svg(`<rect x="7" y="6" width="10" height="15" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M10 9h4M10 12h4M10 15h4" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "crown": return svg(`<path d="M5 10l3 3 4-6 4 6 3-3v8H5v-8z" fill="${pink}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "plane": return svg(`<path d="M2 13l20-5-20-5 5 5v10l-5-5z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "pent": return svg(`<path d="M12 3l8 6-3 10H7L4 9l8-6z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "star": return svg(`<path d="M12 3l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 16.9 6.5 19.5 7.9 13 3.2 9.3l6.2-.6L12 3z" fill="${pink}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`);
    case "neon": return svg(`<path d="M6 18V6h6a4 4 0 0 1 0 8H6" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/><path d="M13 14l5 4" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "heart": return svg(`<path d="M12 20s-7-4.6-7-9.5A3.8 3.8 0 0 1 8.8 7c1.3 0 2.5.6 3.2 1.6A4 4 0 0 1 15.2 7 3.8 3.8 0 0 1 19 10.5C19 15.4 12 20 12 20z" fill="${pink}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`);
    default: return svg(`<circle cx="12" cy="12" r="6" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
  }
}

function renderBoard(){
  board.querySelectorAll(".cell").forEach(n=>n.remove());
  const coords = getPerimeterCoords();

  for(let i=0;i<40;i++){
    const c = CELLS[i];
    const el = document.createElement("div");
    el.className = "cell" + (isCorner(i) ? " corner" : "");
    el.style.left = coords[i].x + "%";
    el.style.top  = coords[i].y + "%";
    el.style.width  = (isCorner(i) ? "18%" : (isHorizontal(i) ? "8%" : "18%"));
    el.style.height = (isCorner(i) ? "18%" : (isHorizontal(i) ? "18%" : "8%"));

    let bar = c.bar;
    if (!bar && c.type === "prop"){
      const [a,b] = COLORSETS[c.set % COLORSETS.length];
      bar = [a,b];
    }
    if (!bar) bar = ["#2dd4bf","#a78bfa"];

    const badge = badgeFor(c, i);
    const right = rightText(c, i);

    el.innerHTML = `
      <div class="bar" style="background:linear-gradient(90deg, ${bar[0]}, ${bar[1]})"></div>
      <div class="mid">
        ${iconSvg(c.icon || c.type)}
        <span class="badge">${escapeHtml(badge)}</span>
      </div>
      <div class="label">${escapeHtml(c.name)}</div>
      <div class="sub">
        <span></span>
        <span>${escapeHtml(right)}</span>
      </div>
    `;

    el.addEventListener("click", () => openCellPanel(i));
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
function rightText(c, i){
  if (c.type==="prop" || c.type==="station" || c.type==="utility"){
    return ownedByMe.has(i) ? "" : fmtStars(c.price);
  }
  if (c.type==="tax") return `-⭐ ${c.value}`;
  return "";
}

/* ВАЖНО: фишка теперь позиционируется по ЦЕНТРУ клетки в пикселях */
function updateToken(){
  const cellEl = board.querySelectorAll(".cell")[position];
  if (!cellEl) return;

  const b = board.getBoundingClientRect();
  const r = cellEl.getBoundingClientRect();
  const cx = (r.left - b.left) + r.width / 2;
  const cy = (r.top - b.top) + r.height / 2;

  token.style.left = cx + "px";
  token.style.top  = cy + "px";
}

function closeBottomPanel(){ bottomPanel.style.display = "none"; }

function openBottomPanel(html){
  bottomPanel.style.display = "block";
  bottomPanel.innerHTML = html;
}

function openCellPanel(i){
  const c = CELLS[i];

  if (c.type==="prop" || c.type==="station" || c.type==="utility"){
    const owned = ownedByMe.has(i);
    const canBuy = !owned && stars >= c.price;

    openBottomPanel(`
      <div class="title">${escapeHtml(c.name)}</div>
      <div class="row"><span>Цена</span><span>${fmtStars(c.price)}</span></div>
      <div class="row"><span>Рента</span><span>${fmtStars(c.rent || 10)}</span></div>
      <div class="actions">
        <button class="btn primary" id="buyBtn" ${canBuy ? "" : "disabled"}>${owned ? "Уже твоё" : (canBuy ? "Купить" : "Не хватает ⭐")}</button>
        <button class="btn ghost" id="closeBtn">Закрыть</button>
      </div>
    `);

    document.getElementById("closeBtn").onclick = closeBottomPanel;
    document.getElementById("buyBtn").onclick = () => {
      if (owned || stars < c.price) return;
      stars -= c.price;
      ownedByMe.add(i);
      meStarsEl.textContent = String(stars);
      renderBoard();
      addLog("SYSTEM", `Ты купил ${c.name} за ⭐ ${c.price}`);
      closeBottomPanel();
    };

    return;
  }

  if (c.type==="tax"){
    openBottomPanel(`
      <div class="title">${escapeHtml(c.name)}</div>
      <div class="row"><span>Оплата</span><span>-⭐ ${c.value}</span></div>
      <div class="actions">
        <button class="btn ghost" id="closeBtn">Ок</button>
      </div>
    `);
    document.getElementById("closeBtn").onclick = closeBottomPanel;
    return;
  }

  openBottomPanel(`
    <div class="title">${escapeHtml(c.name)}</div>
    <div class="row"><span>Тип</span><span>${escapeHtml(c.type)}</span></div>
    <div class="actions">
      <button class="btn ghost" id="closeBtn">Ок</button>
    </div>
  `);
  document.getElementById("closeBtn").onclick = closeBottomPanel;
}

function applyCell(){
  const c = CELLS[position];

  if (c.type==="start"){
    stars += 50;
    meStarsEl.textContent = String(stars);
    addLog("SYSTEM", `START бонус: +⭐ 50`);
    return;
  }
  if (c.type==="tax"){
    stars = Math.max(0, stars - c.value);
    meStarsEl.textContent = String(stars);
    addLog("SYSTEM", `${c.name}: -⭐ ${c.value}`);
    return;
  }
  if (c.type==="chance"){
    const events = [
      {t:"Ночной бонус", d:+100},
      {t:"Штраф за парковку", d:-75},
      {t:"Подарок подписчика", d:+60},
      {t:"Лимузин", d:-50},
    ];
    const e = events[Math.floor(Math.random()*events.length)];
    stars = Math.max(0, stars + e.d);
    meStarsEl.textContent = String(stars);
    addLog("CHANCE", `${e.t}: ${e.d>0?"+":"-"}⭐ ${Math.abs(e.d)}`);
    return;
  }
  if (c.type==="gotojail"){
    position = 10; // jail
    updateToken();
    addLog("SYSTEM", `GO TO JAIL → IN JAIL`);
    return;
  }

  addLog("SYSTEM", `Ты на клетке: ${c.name}`);
  // авто-панель на покупку
  if (c.type==="prop" || c.type==="station" || c.type==="utility") openCellPanel(position);
}

/* ROLL */
rollBtn.onclick = () => {
  if (rolling) return;
  rolling = true;
  rollBtn.disabled = true;
  rollBtn.classList.add("rolling");

  setTimeout(() => {
    const roll = Math.floor(Math.random()*6) + 1;
    position = (position + roll) % 40;
    updateToken();
    addLog("YOU", `🎲 rolled ${roll}`);
    applyCell();

    rollBtn.classList.remove("rolling");
    rollBtn.disabled = false;
    rolling = false;

    // показать чат автоматически, чтобы видел лог
    chatPanel.classList.add("open");
  }, 650);
};

/* INIT */
meStarsEl.textContent = String(stars);
renderBoard();
updateToken();
addLog("SYSTEM", "Чат/лог включён. Нажми 🎲 чтобы ходить. Нажми 💬 чтобы открыть/закрыть чат.");
