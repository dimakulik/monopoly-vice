const board = document.getElementById("board");
const token = document.getElementById("token");
const bottomPanel = document.getElementById("bottomPanel");

const meStarsEl = document.getElementById("meStars");
const rollBtn = document.getElementById("rollBtn");

const playersList = document.getElementById("playersList");
const chatBody = document.getElementById("chatBody");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

let stars = 1450;
let position = 0;
let rolling = false;

/* DEMO players (как на 2-м скрине слева) */
let players = [
  { id:"p1", name:"Bennett", stars:11159, badge:"" },
  { id:"p2", name:"Ruppert", stars:3829, badge:"" },
  { id:"p3", name:"Esteban", stars:2220, badge:"" },
  { id:"me", name:"PLAYER", stars:stars, badge:"YOU" },
];

const COLORSETS = [
  ["#7C3AED","#A78BFA"],
  ["#06B6D4","#67E8F9"],
  ["#F43F5E","#FDA4AF"],
  ["#F59E0B","#FDE68A"],
  ["#22C55E","#86EFAC"],
  ["#3B82F6","#93C5FD"],
];

const CELLS = [
  { type:"start", name:"START", bar:["#00F6FF","#FF2BD6"], emoji:"🚀", icon:"star" },
  { type:"prop", name:"Vice Street", price:60, rent:2, set:0, emoji:"🌴", icon:"palm" },
  { type:"chance", name:"CHANCE", emoji:"❓", icon:"question" },
  { type:"prop", name:"Neon Avenue", price:60, rent:4, set:0, emoji:"🌈", icon:"neon" },
  { type:"tax", name:"STAR TAX", value:200, emoji:"🧾", icon:"coin" },

  { type:"station", name:"Skyline Transit", price:200, rent:25, emoji:"🚆", icon:"train" },
  { type:"prop", name:"Pink Boulevard", price:100, rent:6, set:2, emoji:"💖", icon:"heart" },
  { type:"chance", name:"CHANCE", emoji:"❓", icon:"question" },
  { type:"prop", name:"Ocean Drive", price:100, rent:6, set:2, emoji:"🌊", icon:"wave" },
  { type:"prop", name:"Sunset Pier", price:120, rent:8, set:2, emoji:"🌅", icon:"sun" },

  { type:"jail", name:"IN JAIL", emoji:"🚔", icon:"jail" },

  { type:"prop", name:"Club District", price:140, rent:10, set:1, emoji:"🎵", icon:"music" },
  { type:"utility", name:"Neon Power", price:150, rent:12, emoji:"⚡", icon:"bolt" },
  { type:"prop", name:"Vice Plaza", price:140, rent:10, set:1, emoji:"🏙️", icon:"tower" },
  { type:"prop", name:"Arcade Strip", price:160, rent:12, set:1, emoji:"🕹️", icon:"game" },

  { type:"station", name:"Coast Transit", price:200, rent:25, emoji:"🚆", icon:"train" },

  { type:"prop", name:"Cyber Street", price:180, rent:14, set:5, emoji:"💾", icon:"chip" },
  { type:"chance", name:"CHANCE", emoji:"❓", icon:"question" },
  { type:"prop", name:"Miami Way", price:180, rent:14, set:5, emoji:"🚗", icon:"car" },
  { type:"prop", name:"Palm Heights", price:200, rent:16, set:5, emoji:"🌴", icon:"palm" },

  { type:"parking", name:"FREE PARKING", emoji:"🅿️", icon:"park" },

  { type:"prop", name:"Vice Tower", price:220, rent:18, set:3, emoji:"🏢", icon:"tower" },
  { type:"chance", name:"CHANCE", emoji:"❓", icon:"question" },
  { type:"prop", name:"Neon Hills", price:220, rent:18, set:3, emoji:"⛰️", icon:"mount" },
  { type:"prop", name:"Gold Marina", price:240, rent:20, set:3, emoji:"⚓", icon:"anchor" },

  { type:"station", name:"Night Transit", price:200, rent:25, emoji:"🚆", icon:"train" },

  { type:"prop", name:"Ocean Tower", price:260, rent:22, set:4, emoji:"🏢", icon:"tower" },
  { type:"prop", name:"Luxury Mile", price:260, rent:22, set:4, emoji:"💎", icon:"diamond" },
  { type:"utility", name:"Vice Water", price:150, rent:12, emoji:"💧", icon:"drop" },
  { type:"prop", name:"Resort Bay", price:280, rent:24, set:4, emoji:"🏨", icon:"hotel" },

  { type:"gotojail", name:"GO TO JAIL", emoji:"👮", icon:"police" },

  { type:"prop", name:"Neon Resort", price:300, rent:26, set:1, emoji:"🏨", icon:"hotel" },
  { type:"chance", name:"CHANCE", emoji:"❓", icon:"question" },
  { type:"prop", name:"Vice Palace", price:300, rent:26, set:1, emoji:"👑", icon:"crown" },
  { type:"prop", name:"Starline Hotel", price:320, rent:28, set:1, emoji:"🏨", icon:"hotel" },

  { type:"station", name:"Airport Transit", price:200, rent:25, emoji:"✈️", icon:"plane" },
  { type:"chance", name:"CHANCE", emoji:"❓", icon:"question" },
  { type:"prop", name:"Ultra Penthouse", price:350, rent:35, set:0, emoji:"🏡", icon:"pent" },
  { type:"tax", name:"LUXURY TAX", value:100, emoji:"🧾", icon:"coin" },
  { type:"prop", name:"VICE ICON", price:400, rent:50, set:0, emoji:"⭐", icon:"star" },
];

const ownedByMe = new Set();

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

function renderPlayers(){
  // обновим PLAYER в списке по текущему балансу
  players = players.map(p => p.id==="me" ? {...p, stars} : p);

  playersList.innerHTML = "";
  for(const p of players){
    const el = document.createElement("div");
    el.className = "pcard";
    el.innerHTML = `
      <div class="pavatar"></div>
      <div class="pmeta">
        <div class="pname">${escapeHtml(p.name)}</div>
        <div class="pstars">⭐ ${p.stars.toLocaleString()}</div>
      </div>
      <div class="pbadge">${escapeHtml(p.badge || "")}</div>
    `;
    playersList.appendChild(el);
  }
}

/* === coords perim === */
function getPerimeterCoords(){
  const coords = [];
  coords.push({x:82,y:82});
  for(let k=1;k<=9;k++) coords.push({x:82-k*8,y:82});
  coords.push({x:0,y:82});
  for(let k=1;k<=9;k++) coords.push({x:0,y:82-k*8});
  coords.push({x:0,y:0});
  for(let k=1;k<=9;k++) coords.push({x:k*8,y:0});
  coords.push({x:82,y:0});
  for(let k=1;k<=9;k++) coords.push({x:82,y:k*8});
  return coords;
}
function isCorner(i){ return i===0 || i===10 || i===20 || i===30; }
function isHorizontal(i){ return (i>0 && i<10) || (i>20 && i<30); }

/* icons */
function iconSvg(name){
  const stroke = "rgba(255,255,255,0.85)";
  const fill = "rgba(0,246,255,0.18)";
  const pink = "rgba(255,43,214,0.28)";
  const svg = (body) => `<svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  switch(name){
    case "question": return svg(`<path d="M12 18h.01" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-.9.7-1.5 1.1-1.5 2.5" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "coin": return svg(`<circle cx="12" cy="12" r="7" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
    case "train": return svg(`<rect x="7" y="4" width="10" height="12" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
    case "bolt": return svg(`<path d="M13 2L6 14h6l-1 8 7-12h-6l1-8z" fill="${pink}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`);
    case "jail": return svg(`<rect x="6" y="5" width="12" height="14" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/><path d="M10 5v14M14 5v14" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "police": return svg(`<path d="M12 3l8 4v6c0 5-4 8-8 8s-8-3-8-8V7l8-4z" fill="${pink}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "palm": return svg(`<path d="M12 21v-8" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><path d="M12 13c-3 0-6-2-7-4 3 1 6 0 7-2 1 2 4 3 7 2-1 2-4 4-7 4z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`);
    case "wave": return svg(`<path d="M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>`);
    case "sun": return svg(`<circle cx="12" cy="12" r="4" fill="${pink}" stroke="${stroke}" stroke-width="1.5"/>`);
    case "music": return svg(`<path d="M10 18a2 2 0 1 1-1-1.73V7l10-2v8.5" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "tower": return svg(`<path d="M8 21V8l4-4 4 4v13" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "game": return svg(`<rect x="6" y="9" width="12" height="8" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
    case "chip": return svg(`<rect x="7" y="7" width="10" height="10" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
    case "car": return svg(`<path d="M6 15l1-5h10l1 5" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "park": return svg(`<path d="M8 21V9c0-3 2-5 4-5s4 2 4 5v12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
    case "mount": return svg(`<path d="M3 19l6-10 4 6 2-3 6 7" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "anchor": return svg(`<path d="M12 4v10" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="4" r="2" fill="${pink}" stroke="${stroke}" stroke-width="1.5"/>`);
    case "diamond": return svg(`<path d="M12 3l5 6-5 12L7 9l5-6z" fill="${pink}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "drop": return svg(`<path d="M12 3c4 6 6 8 6 11a6 6 0 0 1-12 0c0-3 2-5 6-11z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "hotel": return svg(`<rect x="7" y="6" width="10" height="15" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`);
    case "crown": return svg(`<path d="M5 10l3 3 4-6 4 6 3-3v8H5v-8z" fill="${pink}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "plane": return svg(`<path d="M2 13l20-5-20-5 5 5v10l-5-5z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "pent": return svg(`<path d="M12 3l8 6-3 10H7L4 9l8-6z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
    case "star": return svg(`<path d="M12 3l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 16.9 6.5 19.5 7.9 13 3.2 9.3l6.2-.6L12 3z" fill="${pink}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`);
    case "neon": return svg(`<path d="M6 18V6h6a4 4 0 0 1 0 8H6" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`);
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

    const badge =
      c.type==="start" ? "GO" :
      c.type==="jail" ? "JAIL" :
      c.type==="gotojail" ? "🚓" :
      c.type==="parking" ? "FREE" :
      c.type==="chance" ? "?" :
      c.type==="tax" ? "TAX" :
      c.type==="station" ? "TRANSIT" :
      c.type==="utility" ? "UTIL" :
      c.type==="prop" ? (ownedByMe.has(i) ? "OWNED" : "BUY") : "";

    const priceText =
      (c.type==="prop" || c.type==="station" || c.type==="utility")
        ? (ownedByMe.has(i) ? "" : `⭐ ${c.price}`)
        : (c.type==="tax" ? `-⭐ ${c.value}` : "");

    el.innerHTML = `
      <div class="bar" style="background:linear-gradient(90deg, ${bar[0]}, ${bar[1]})"></div>
      <div class="mid">
        <div class="emoji">${escapeHtml(c.emoji || "✨")}</div>
        ${iconSvg(c.icon || c.type)}
        <span class="badge">${escapeHtml(badge)}</span>
      </div>
      <div class="label">${escapeHtml(c.name)}</div>
      <div class="sub"><span></span><span>${escapeHtml(priceText)}</span></div>
    `;
    el.addEventListener("click", () => openCellPanel(i));
    board.appendChild(el);
  }
}

/* token */
function updateToken(){
  const coords = getPerimeterCoords();
  const c = coords[position];
  const bw = board.clientWidth;
  const bh = board.clientHeight;

  const x = (c.x / 100) * bw + (bw * 0.09);
  const y = (c.y / 100) * bh + (bh * 0.09);

  token.style.left = x + "px";
  token.style.top  = y + "px";
}

/* chat input */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const txt = chatInput.value.trim();
  if (!txt) return;
  addLog("YOU", txt);
  chatInput.value = "";
});

function openBottom(html){
  bottomPanel.style.display = "block";
  bottomPanel.innerHTML = html;
}
function closeBottom(){ bottomPanel.style.display = "none"; }

function openCellPanel(i){
  const c = CELLS[i];

  if (c.type==="prop" || c.type==="station" || c.type==="utility"){
    const owned = ownedByMe.has(i);
    const canBuy = !owned && stars >= c.price;

    openBottom(`
      <div class="title">${escapeHtml(c.name)}</div>
      <div class="row"><span>Цена</span><span>⭐ ${c.price}</span></div>
      <div class="row"><span>Рента</span><span>⭐ ${c.rent || 10}</span></div>
      <div class="actions">
        <button class="btn primary" id="buyBtn" ${canBuy ? "" : "disabled"}>${owned ? "Уже твоё" : (canBuy ? "Купить" : "Не хватает ⭐")}</button>
        <button class="btn ghost" id="closeBtn">Закрыть</button>
      </div>
    `);

    document.getElementById("closeBtn").onclick = closeBottom;
    document.getElementById("buyBtn").onclick = () => {
      if (owned || stars < c.price) return;
      stars -= c.price;
      meStarsEl.textContent = String(stars);
      ownedByMe.add(i);
      renderBoard();
      renderPlayers();
      addLog("SYSTEM", `Ты купил ${c.name} за ⭐ ${c.price}`);
      closeBottom();
    };
    return;
  }

  openBottom(`
    <div class="title">${escapeHtml(c.name)}</div>
    <div class="row"><span>Тип</span><span>${escapeHtml(c.type)}</span></div>
    <div class="actions"><button class="btn ghost" id="closeBtn">Ок</button></div>
  `);
  document.getElementById("closeBtn").onclick = closeBottom;
}

function applyCell(){
  const c = CELLS[position];

  if (c.type==="start"){
    stars += 50;
    meStarsEl.textContent = String(stars);
    renderPlayers();
    addLog("SYSTEM", `START бонус: +⭐ 50`);
    return;
  }
  if (c.type==="tax"){
    stars = Math.max(0, stars - c.value);
    meStarsEl.textContent = String(stars);
    renderPlayers();
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
    renderPlayers();
    addLog("CHANCE", `${e.t}: ${e.d>0?"+":"-"}⭐ ${Math.abs(e.d)}`);
    return;
  }
  if (c.type==="gotojail"){
    position = 10;
    updateToken();
    addLog("SYSTEM", `GO TO JAIL → IN JAIL`);
    return;
  }

  addLog("SYSTEM", `Ты на клетке: ${c.name}`);
  if (c.type==="prop" || c.type==="station" || c.type==="utility") openCellPanel(position);
}

/* roll */
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
  }, 650);
};

/* init */
meStarsEl.textContent = String(stars);
renderPlayers();
renderBoard();
updateToken();
addLog("SYSTEM", "Теперь чат по центру, а игроки слева как в примере.");

window.addEventListener("resize", () => updateToken());
