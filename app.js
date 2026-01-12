/***********************
 *  TELEGRAM + HEIGHT
 ***********************/
(function initTelegram(){
  try{
    const tg = window.Telegram?.WebApp;
    if(tg){
      tg.expand();
      tg.ready();
    }
  }catch(e){}
})();

function setAppHeight(){
  document.documentElement.style.setProperty("--appH", `${window.innerHeight}px`);
}

/***********************
 *  SCALE BOARD (KEY)
 ***********************/
function fitBoard(){
  const board = document.getElementById("board");
  if(!board) return;

  const root = document.documentElement;
  const base = parseInt(getComputedStyle(root).getPropertyValue("--boardBase"), 10);

  const playersW = parseInt(getComputedStyle(root).getPropertyValue("--playersW"), 10);
  const gap = parseInt(getComputedStyle(root).getPropertyValue("--gap"), 10);
  const pad = parseInt(getComputedStyle(root).getPropertyValue("--pad"), 10);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // свободная зона под board: вся ширина минус колонка игроков/отступы
  const availW = vw - (playersW + gap + pad * 2);
  const availH = vh - (pad * 2);

  const scale = Math.min(availW / base, availH / base, 1);
  board.style.transform = `scale(${scale})`;
}

function onResize(){
  setAppHeight();
  fitBoard();
  placeTokens(); // чтобы фишки не “плыли” при ресайзе
}

window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

/***********************
 *  DATA (PLAYERS + 40 CELLS)
 ***********************/
const players = [
  { id:"p1", name:"Artemlasvegas", money:"$ 22,000k", avatar:"", active:false, badge:"★" },
  { id:"p2", name:"Soloha", money:"$ 22,850k", avatar:"", active:true,  badge:"57" },
  { id:"me", name:"dimakulik", money:"$ 25,000k", avatar:"", active:false, badge:"39", you:true },
  { id:"p3", name:"Анна", money:"$ 25,000k", avatar:"", active:false, badge:"★" },
  { id:"p4", name:"Александр", money:"$ 25,000k", avatar:"", active:false, badge:"" },
];

// 40 клеток (0..39). Поставь свои иконки (png/svg) в /assets и пропиши пути.
// Если иконок нет — оставь пусто, будет текст.
const cells40 = Array.from({length:40}).map((_,i)=>({
  id:i,
  name:`CELL ${i}`,
  icon: "", // пример: "./assets/audi.png"
}));

// Пример: задай несколько иконок, чтобы увидеть как будет
cells40[0].name = "START";  cells40[0].icon = "./assets/start.png";
cells40[10].name = "JAIL";  cells40[10].icon = "./assets/jail.png";
cells40[20].name = "FREE";  cells40[20].icon = "./assets/free.png";
cells40[30].name = "GO TO";  cells40[30].icon = "./assets/goto.png";

/***********************
 *  RENDER PLAYERS
 ***********************/
function renderPlayers(){
  const wrap = document.getElementById("players");
  wrap.innerHTML = "";

  for(const p of players){
    const el = document.createElement("div");
    el.className = `playerCard ${p.active ? "active" : ""} ${p.you ? "you" : ""}`.trim();

    el.innerHTML = `
      <div class="badge">${p.badge || ""}</div>
      <div class="avatar"></div>
      <div class="meta">
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="money">${escapeHtml(p.money)}</div>
      </div>
    `;

    wrap.appendChild(el);
  }
}

/***********************
 *  RENDER 40 CELLS AROUND PERIMETER
 *  Layout: classic Monopoly 40:
 *  0 corner (bottom-right) START
 *  bottom edge: 1..9 (right->left)
 *  10 corner (bottom-left) JAIL
 *  left edge: 11..19 (bottom->top)
 *  20 corner (top-left) FREE
 *  top edge: 21..29 (left->right)
 *  30 corner (top-right) GO TO
 *  right edge: 31..39 (top->bottom)
 *
 *  Это стандартная карта 40.
 ***********************/
function renderCells(){
  const cellsWrap = document.getElementById("cells");
  cellsWrap.innerHTML = "";

  // размеры (должны соответствовать CSS corner/edge)
  const corner = 92;
  const edgeW = 62;
  const edgeH = 92;

  const boardBase = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--boardBase"), 10);
  const boardSize = boardBase;

  // полезные координаты
  const left = 0, top = 0, right = boardSize, bottom = boardSize;

  // helper create cell
  function addCell(i, x, y, w, h, rotateDeg=0, type="edge"){
    const c = document.createElement("div");
    c.className = `cell ${type} ${w>h ? "h" : ""}`.trim();
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    if(rotateDeg) c.style.transform = `rotate(${rotateDeg}deg)`;

    const data = cells40[i] || {name:`CELL ${i}`, icon:""};
    const img = data.icon ? `<img class="icon" src="${data.icon}" alt="">` : "";
    const label = `<div class="label">${escapeHtml(data.name)}</div>`;

    c.innerHTML = `${img}${label}`;
    c.dataset.index = String(i);

    cellsWrap.appendChild(c);
  }

  // corners:
  // 0 bottom-right
  addCell(0, right-corner, bottom-corner, corner, corner, 0, "corner");
  // 10 bottom-left
  addCell(10, left, bottom-corner, corner, corner, 0, "corner");
  // 20 top-left
  addCell(20, left, top, corner, corner, 0, "corner");
  // 30 top-right
  addCell(30, right-corner, top, corner, corner, 0, "corner");

  // bottom edge 1..9 (from bottom-right to bottom-left)
  for(let k=1;k<=9;k++){
    const i = k;
    const x = right - corner - (edgeW * k);
    const y = bottom - edgeH;
    addCell(i, x, y, edgeW, edgeH, 0, "edge");
  }

  // left edge 11..19 (from bottom-left to top-left)
  for(let k=1;k<=9;k++){
    const i = 10 + k; // 11..19
    const x = left;
    const y = bottom - corner - (edgeW * k);
    addCell(i, x, y, edgeH, edgeW, 0, "edge"); // vertical (swap)
  }

  // top edge 21..29 (from top-left to top-right)
  for(let k=1;k<=9;k++){
    const i = 20 + k; // 21..29
    const x = left + corner + (edgeW * (k-1));
    const y = top;
    addCell(i, x, y, edgeW, edgeH, 0, "edge");
  }

  // right edge 31..39 (from top-right to bottom-right)
  for(let k=1;k<=9;k++){
    const i = 30 + k; // 31..39
    const x = right - edgeH;
    const y = top + corner + (edgeW * (k-1));
    addCell(i, x, y, edgeH, edgeW, 0, "edge"); // vertical (swap)
  }
}

/***********************
 *  TOKENS: place and move
 ***********************/
const tokenState = {
  me: { index: 0 },
  other: { index: 5 },
};

function renderTokens(){
  const wrap = document.getElementById("tokens");
  wrap.innerHTML = `
    <div id="t_me" class="token you"></div>
    <div id="t_other" class="token other"></div>
  `;
}

function getCellCenter(index){
  const el = document.querySelector(`.cell[data-index="${index}"]`);
  if(!el) return {x: 0, y: 0};

  // важно: позиции считаем в координатах board (до scale)
  const r = el.getBoundingClientRect();
  const br = document.getElementById("board").getBoundingClientRect();

  // переводим из screen-space в board-space через scale
  const scale = getBoardScale();
  const x = ( (r.left - br.left) + r.width/2 ) / scale;
  const y = ( (r.top - br.top) + r.height/2 ) / scale;
  return {x, y};
}

function getBoardScale(){
  const board = document.getElementById("board");
  const tr = getComputedStyle(board).transform;
  if(!tr || tr === "none") return 1;
  // matrix(a, b, c, d, e, f) => scaleX=a, scaleY=d
  const m = tr.match(/matrix\(([^)]+)\)/);
  if(!m) return 1;
  const parts = m[1].split(",").map(s=>parseFloat(s.trim()));
  return parts[0] || 1;
}

function placeTokens(){
  const me = document.getElementById("t_me");
  const other = document.getElementById("t_other");
  if(!me || !other) return;

  const p1 = getCellCenter(tokenState.me.index);
  const p2 = getCellCenter(tokenState.other.index);

  // небольшое смещение, чтобы фишки не были ровно одна на другой
  me.style.left = `${p1.x}px`;
  me.style.top  = `${p1.y}px`;

  other.style.left = `${p2.x + 14}px`;
  other.style.top  = `${p2.y + 14}px`;
}

async function moveToken(id, steps){
  const state = tokenState[id];
  if(!state) return;

  const from = state.index;
  const to = (from + steps) % 40;

  // простая “пошаговая” анимация по клеткам
  const tokenEl = document.getElementById(id === "me" ? "t_me" : "t_other");
  const scale = getBoardScale();

  for(let s=1; s<=steps; s++){
    state.index = (from + s) % 40;
    const pos = getCellCenter(state.index);

    tokenEl.style.transition = "transform 0.18s ease, left 0.18s ease, top 0.18s ease";
    tokenEl.style.left = `${pos.x}px`;
    tokenEl.style.top  = `${pos.y}px`;

    await sleep(180);
  }

  state.index = to;
  placeTokens();
}

/***********************
 *  CHAT + TURN + DICE
 ***********************/
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const rollBtn = document.getElementById("rollBtn");
const diceOverlay = document.getElementById("diceOverlay");
const turnBanner = document.getElementById("turnBanner");

function addMsg(text, cls=""){
  const el = document.createElement("div");
  el.className = `msg ${cls}`.trim();
  el.textContent = text;
  chatLog.appendChild(el);
  chatLog.scrollTop = chatLog.scrollHeight;
}

sendBtn?.addEventListener("click", ()=>{
  const v = (chatInput.value || "").trim();
  if(!v) return;
  addMsg(`dimakulik: ${v}`, "you");
  chatInput.value = "";
});

chatInput?.addEventListener("keydown", (e)=>{
  if(e.key === "Enter") sendBtn.click();
});

// показываем ход (как у monopoly-one)
function showTurn(isMyTurn){
  turnBanner.classList.toggle("hidden", !isMyTurn);
}

// кубики + движение фишки
rollBtn?.addEventListener("click", async ()=>{
  // random dice
  const d1 = 1 + Math.floor(Math.random()*6);
  const d2 = 1 + Math.floor(Math.random()*6);
  const steps = d1 + d2;

  addMsg(`dimakulik выбрасывает: ${d1}:${d2}`, "sys");
  showDice(d1, d2);

  await sleep(750);
  hideDice();

  await moveToken("me", steps);

  // имитация действий других
  await sleep(300);
  addMsg(`Soloha думает...`, "");
});

function showDice(d1, d2){
  const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  diceOverlay.querySelectorAll(".die")[0].textContent = faces[d1-1];
  diceOverlay.querySelectorAll(".die")[1].textContent = faces[d2-1];
  diceOverlay.classList.remove("hidden");
}
function hideDice(){
  diceOverlay.classList.add("hidden");
}

/***********************
 *  INIT
 ***********************/
function seedChat(){
  addMsg("Artemlasvegas выбрасывает 1:5", "sys");
  addMsg("Artemlasvegas попадает на Holiday Inn", "");
  addMsg("dimakulik — Стала", "you");
  addMsg("Soloha выбрасывает 1:1 и получает ещё один ход (дубль)", "");
  addMsg("Soloha покупает Circle+ за 1,400k", "");
}

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

renderPlayers();
renderCells();
renderTokens();
seedChat();

onResize();
showTurn(true);
