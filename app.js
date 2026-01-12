const board = document.getElementById("board");
const token = document.getElementById("token");
const panel = document.getElementById("panel");

const playersEl = document.getElementById("players");
const chatEl = document.getElementById("chat");

const meNameEl = document.getElementById("meName");
const meStarsEl = document.getElementById("meStars");
const rollBtn = document.getElementById("rollBtn");

const chatForm = document.getElementById("chatForm");
const chatText = document.getElementById("chatText");
const addBotPlayers = document.getElementById("addBotPlayers");

/* ====== DEMO STATE (потом подключим к мультиплееру/боту) ====== */
let stars = 1500;
let position = 0;
let rolling = false;

let players = [
  { id: "me", name: "PLAYER", stars: 1500, tag: "YOU" },
];

const COLORSETS = [
  ["#7C3AED","#A78BFA"], // purple
  ["#06B6D4","#67E8F9"], // cyan
  ["#F43F5E","#FDA4AF"], // rose
  ["#F59E0B","#FDE68A"], // amber
  ["#22C55E","#86EFAC"], // green
  ["#3B82F6","#93C5FD"], // blue
];

/* 40 клеток (свои названия, типы как в монополии) */
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

const ownedByMe = new Set();

/* ====== UI HELPERS ====== */
function fmtStars(n){ return `⭐ ${n}`; }
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
  chatEl.appendChild(el);
  chatEl.scrollTop = chatEl.scrollHeight;
}
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderPlayers(){
  playersEl.innerHTML = "";
  for(const p of players){
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `
      <div class="avatar"></div>
      <div class="pmeta">
        <div class="pname">${escapeHtml(p.name)}</div>
        <div class="pstars">${fmtStars(p.stars)}</div>
      </div>
      <div class="ptag">${escapeHtml(p.tag || "")}</div>
    `;
    playersEl.appendChild(card);
  }
}

/* ====== BOARD RENDER (40 perimeter coords) ====== */
function isCorner(i){ return i===0 || i===10 || i===20 || i===30; }
function isHorizontal(i){ return (i>0 && i<10) || (i>20 && i<30); }

function getPerimeterCoords(){
  const coords = [];
  coords.push({x:82,y:82});                // 0 corner (bottom-right)
  for(let k=1;k<=9;k++) coords.push({x:82-k*8,y:82});
  coords.push({x:0,y:82});                 // 10 corner (bottom-left)
  for(let k=1;k<=9;k++) coords.push({x:0,y:82-k*8});
  coords.push({x:0,y:0});                  // 20 corner (top-left)
  for(let k=1;k<=9;k++) coords.push({x:k*8,y:0});
  coords.push({x:82,y:0});                 // 30 corner (top-right)
  for(let k=1;k<=9;k++) coords.push({x:82,y:k*8});
  return coords; // 40
}

function renderBoard(){
  // remove existing cells only
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
      <div class="label">${escapeHtml(c.name)}</div>
      <div class="sub">
        <span class="badge">${escapeHtml(badge)}</span>
        <span>${escapeHtml(right)}</span>
      </div>
    `;

    // click on cell -> open info
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
  if (c.type==="tax") return `-${fmtStars(c.value).slice(2)}`; // "-⭐ N"
  return "";
}

function updateToken(){
  const coords = getPerimeterCoords();
  token.style.left = (coords[position].x + 2) + "%";
  token.style.top  = (coords[position].y + 2) + "%";
}

/* ====== PANEL / GAME ACTIONS ====== */
function openPanel(html){
  panel.style.display = "block";
  panel.innerHTML = html;
}
function closePanel(){ panel.style.display = "none"; }

function openCellPanel(i){
  const c = CELLS[i];
  if (c.type==="prop" || c.type==="station" || c.type==="utility"){
    const owned = ownedByMe.has(i);
    openPanel(`
      <div class="title">${escapeHtml(c.name)}</div>
      <div class="row"><span>Цена</span><span>${fmtStars(c.price)}</span></div>
      <div class="row"><span>Рента</span><span>${fmtStars(c.rent || 10)}</span></div>
      <div class="actions">
        <button class="btn primary" id="buyBtn" ${owned ? "disabled":""}>${owned ? "Уже твоё" : "Купить"}</button>
        <button class="btn ghost" id="closeBtn">Закрыть</button>
      </div>
    `);

    document.getElementById("closeBtn").onclick = closePanel;
    document.getElementById("buyBtn").onclick = () => {
      if (owned) return;
      if (stars < c.price){
        addLog("SYSTEM", `Не хватает ⭐ чтобы купить ${c.name}`);
        return;
      }
      stars -= c.price;
      ownedByMe.add(i);
      meStarsEl.textContent = String(stars);
      renderBoard();
      addLog("SYSTEM", `Ты купил ${c.name} за ⭐ ${c.price}`);
      closePanel();
    };
    return;
  }

  if (c.type==="tax"){
    openPanel(`
      <div class="title">${escapeHtml(c.name)}</div>
      <div class="row"><span>Оплата</span><span>-⭐ ${c.value}</span></div>
      <div class="actions"><button class="btn ghost" id="closeBtn">Ок</button></div>
    `);
    document.getElementById("closeBtn").onclick = closePanel;
    return;
  }

  openPanel(`
    <div class="title">${escapeHtml(c.name)}</div>
    <div class="row"><span>Тип</span><span>${escapeHtml(c.type)}</span></div>
    <div class="actions"><button class="btn ghost" id="closeBtn">Ок</button></div>
  `);
  document.getElementById("closeBtn").onclick = closePanel;
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

  // landing on buyable
  if (c.type==="prop" || c.type==="station" || c.type==="utility"){
    addLog("SYSTEM", `Ты на клетке: ${c.name} (${fmtStars(c.price)})`);
    // auto-open panel to buy
    openCellPanel(position);
    return;
  }

  addLog("SYSTEM", `Ты на клетке: ${c.name}`);
}

/* ====== CONTROLS ====== */
rollBtn.onclick = () => {
  if (rolling) return;
  rolling = true;
  rollBtn.disabled = true;
  rollBtn.classList.add("rolling");

  setTimeout(() => {
    const roll = Math.floor(Math.random()*6) + 1;
    position = (position + roll) % 40;
    updateToken();
    addLog("PLAYER", `🎲 rolled ${roll}`);
    applyCell();

    rollBtn.classList.remove("rolling");
    rollBtn.disabled = false;
    rolling = false;
  }, 650);
};

/* ====== CHAT ====== */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const txt = chatText.value.trim();
  if (!txt) return;
  addLog(players[0].name, txt);
  chatText.value = "";
});

/* ====== DEMO PLAYERS BUTTON ====== */
addBotPlayers.onclick = () => {
  players = [
    { id:"me", name:"PLAYER", stars: stars, tag:"YOU" },
    { id:"p2", name:"Ruppert", stars: 3829, tag:"" },
    { id:"p3", name:"Bennett", stars: 11159, tag:"" },
    { id:"p4", name:"Esteban", stars: 2220, tag:"" },
  ];
  renderPlayers();
  addLog("SYSTEM", "Добавлены demo players (позже подключим реальные из Telegram).");
};

/* ====== INIT ====== */
meNameEl.textContent = "PLAYER";
meStarsEl.textContent = String(stars);
renderPlayers();
renderBoard();
updateToken();
addLog("SYSTEM", "UI готов. Следующий шаг: настоящие аватары/ники из Telegram и мультиплеер.");
