(function initTelegram(){
  try{
    const tg = window.Telegram?.WebApp;
    if(tg){ tg.expand(); tg.ready(); }
  }catch(e){}
})();

let currentScale = 1;
let isRolling = false;

function setAppHeight(){
  document.documentElement.style.setProperty("--appH", `${window.innerHeight}px`);
}

function fitCanvas(){
  const canvasWrap = document.getElementById("canvas");
  const viewport = document.getElementById("viewport");
  const root = document.documentElement;

  const W = parseInt(getComputedStyle(root).getPropertyValue("--canvasW"), 10);
  const H = parseInt(getComputedStyle(root).getPropertyValue("--canvasH"), 10);

  const vr = viewport.getBoundingClientRect();
  const availW = vr.width;
  const availH = vr.height;

  const s = Math.min(availW / W, availH / H, 1);
  currentScale = s;

  const offsetX = (availW - W*s) / 2;
  const offsetY = (availH - H*s) / 2;

  canvasWrap.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${s})`;

  const dbg = document.getElementById("debug");
  if(dbg) dbg.textContent = `scale=${s.toFixed(3)} viewport=${availW.toFixed(0)}x${availH.toFixed(0)}`;
}

function onResize(){
  setAppHeight();
  fitCanvas();
  setupHiDPICanvas();
  computeCellRects();
  initTokenPositions();
  draw();
}

window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

/* =======================
   PLAYERS UI (⭐)
======================= */

const players = [
  { name:"Artemlasvegas", stars:22000, active:false },
  { name:"Soloha",        stars:22850, active:true  },
  { name:"dimakulik",     stars:25000, active:false },
  { name:"Анна",          stars:25000, active:false },
  { name:"Александр",     stars:25000, active:false },
];

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}
function formatNum(n){
  return (Number(n)||0).toLocaleString("ru-RU");
}
function renderPlayers(){
  const wrap = document.getElementById("players");
  wrap.innerHTML = "";
  players.forEach(p=>{
    const el = document.createElement("div");
    el.className = `playerCard ${p.active ? "active":""}`.trim();
    el.innerHTML = `
      <div class="avatar"></div>
      <div class="meta">
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="money">⭐ ${formatNum(p.stars)}</div>
      </div>
    `;
    wrap.appendChild(el);
  });
}

/* =======================
   BOARD DATA (как на скрине)
======================= */

// "2,000k"
function formatK(n){
  if(!n) return "";
  const v = Math.round(n / 1000);
  return v.toLocaleString("en-US") + "k";
}

function C(label, price, priceBg, icon=""){
  return { label, price, priceBg, icon };
}

const cells40 = new Array(40);

// углы (теперь тоже такого же размера, как остальные)
cells40[0]  = C("JACKPOT", 0,  "", "🎰");   // bottom-right
cells40[10] = C("IN JAIL", 0,  "", "👮");   // bottom-left
cells40[20] = C("START",   0,  "", "🚀");   // top-left (ракета)
cells40[30] = C("GO TO",   0,  "", "🍩");   // top-right

// bottom 1..9
cells40[1] = C("American", 2200000, "#22c55e", "✈️");
cells40[2] = C("CHANCE",   0,       "",       "?");
cells40[3] = C("Lufthansa",2400000, "#22c55e", "✈️");
cells40[4] = C("British",  2000000, "#ef4444", "✈️");
cells40[5] = C("Ford",     2600000, "#3b82f6", "🚗");
cells40[6] = C("Max",      2600000, "#3b82f6", "🍔");
cells40[7] = C("Burger",   1500000, "#ef4444", "🍔");
cells40[8] = C("PROVIO",   2800000, "#38bdf8", "🏁");
cells40[9] = C("KFC",      1500000, "#ef4444", "🍗");

// left 11..19
cells40[11] = C("Holiday", 3000000, "#a855f7", "🏨");
cells40[12] = C("IHG",     3000000, "#a855f7", "🏨");
cells40[13] = C("Radisson",3000000, "#a855f7", "🏨");
cells40[14] = C("CHANCE",  0,       "",       "?");
cells40[15] = C("Novotel", 3200000, "#8b5cf6", "🏨");
cells40[16] = C("LandRover",2000000,"#ef4444", "🚙");
cells40[17] = C("DIAMOND", 0,       "",       "💎");
cells40[18] = C("Apple",   3500000, "#64748b", "");
cells40[19] = C("CHANCE",  0,       "",       "?");

// top 21..29
cells40[21] = C("CHANEL",  600000,  "#f472b6", "C");
cells40[22] = C("CHANCE",  0,       "",       "?");
cells40[23] = C("BOSS",    600000,  "#f472b6", "B");
cells40[24] = C("CARD",    0,       "",       "▦");
cells40[25] = C("Mercedes",2000000, "#ef4444", "★");
cells40[26] = C("adidas",  1000000, "#f59e0b", "▲");
cells40[27] = C("CHANCE",  0,       "",       "?");
cells40[28] = C("PUMA",    1000000, "#f59e0b", "🐾");
cells40[29] = C("LACOSTE", 1200000, "#f59e0b", "🐊");

// right 31..39
cells40[31] = C("C+",      1400000, "#14b8a6", "⟳");
cells40[32] = C("R*",      1500000, "#b45309", "★");
cells40[33] = C("friender",1400000, "#14b8a6", "f");
cells40[34] = C("bird",    1600000, "#10b981", "🐦");
cells40[35] = C("AUDI",    2000000, "#ef4444", "⭕");
cells40[36] = C("CocaCola",1800000, "#3b82f6", "🥤");
cells40[37] = C("CALL",    0,       "",       "☎");
cells40[38] = C("pepsi",   1800000, "#3b82f6", "🥤");
cells40[39] = C("Fanta",   2000000, "#3b82f6", "🍊");

for(let i=0;i<40;i++){
  if(!cells40[i]) cells40[i] = C(`Поле ${i+1}`, 0, "", "");
}

/* =======================
   CANVAS GEOMETRY
   ОДИНАКОВЫЙ РАЗМЕР КЛЕТОК:
   11x11 сетка, клетка = BOARD/11
======================= */

const BOARD_SIZE = 760;
const CELL = BOARD_SIZE / 11; // одинаковая для всех

const canvasEl = document.getElementById("boardCanvas");
const ctx = canvasEl.getContext("2d");

let DPR = 1;
let cellRects = [];

function setupHiDPICanvas(){
  DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvasEl.width  = Math.round(BOARD_SIZE * DPR);
  canvasEl.height = Math.round(BOARD_SIZE * DPR);
  canvasEl.style.width = `${BOARD_SIZE}px`;
  canvasEl.style.height = `${BOARD_SIZE}px`;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingEnabled = true;
}

function rectAt(col,row){
  return { x: col*CELL, y: row*CELL, w: CELL, h: CELL };
}

/**
 * Индексы по классике:
 * 0 BR -> низ влево до 10 (BL) -> вверх до 20 (TL) -> вправо до 30 (TR) -> вниз до 39
 */
function computeCellRects(){
  const r = new Array(40);

  // bottom row (row 10)
  r[0] = rectAt(10,10);
  for(let i=1;i<=10;i++){
    r[i] = rectAt(10 - i, 10);
  }

  // left col (col 0) rows 9..0
  for(let i=11;i<=20;i++){
    const k = i - 10;      // 1..10
    r[i] = rectAt(0, 10 - k);
  }

  // top row (row 0) cols 1..10
  for(let i=21;i<=30;i++){
    const k = i - 20;      // 1..10
    r[i] = rectAt(k, 0);
  }

  // right col (col 10) rows 1..9
  for(let i=31;i<=39;i++){
    const k = i - 30;      // 1..9
    r[i] = rectAt(10, k);
  }

  cellRects = r;
}

/* =======================
   DRAW
======================= */

function isBottom(i){ return i>=1 && i<=9; }
function isLeft(i){ return i>=11 && i<=19; }
function isTop(i){ return i>=21 && i<=29; }
function isRight(i){ return i>=31 && i<=39; }
function isCorner(i){ return i===0 || i===10 || i===20 || i===30; }

function draw(){
  ctx.clearRect(0,0,BOARD_SIZE,BOARD_SIZE);

  ctx.fillStyle = "#0d0914";
  ctx.fillRect(0,0,BOARD_SIZE,BOARD_SIZE);

  for(let i=0;i<40;i++){
    drawCell(i, cellRects[i]);
  }

  // center
  ctx.fillStyle = "#2b2b2b";
  const cx = CELL*1.5, cy = CELL*1.5, cw = CELL*8, ch = CELL*8;
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);

  drawTokens();
}

function drawCell(i, r){
  const cell = cells40[i];

  // tile
  ctx.fillStyle = "#fff";
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // border (внутрь)
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

  // price on OUTER EDGE (как на 2 скрине)
  if(cell.price && cell.priceBg){
    drawEdgePrice(i, r, cell.priceBg, formatK(cell.price));
  }

  // content
  if(isCorner(i)){
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 30px -apple-system,system-ui,Arial";
    ctx.fillText(cell.icon || "", r.x + r.w/2, r.y + r.h/2 - 4);

    ctx.font = "900 10px -apple-system,system-ui,Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(cell.label || "", r.x + r.w/2, r.y + r.h - 6);
    return;
  }

  if(cell.label === "CHANCE"){
    ctx.fillStyle = "#6bbf2a";
    ctx.font = "900 40px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", r.x + r.w/2, r.y + r.h/2);
    return;
  }

  // icon + label (поворачиваем как в монополии)
  ctx.save();
  ctx.translate(r.x + r.w/2, r.y + r.h/2);

  // верх/низ — вертикально
  if(isTop(i) || isBottom(i)) ctx.rotate(-Math.PI/2);

  if(cell.icon){
    ctx.fillStyle = "#111";
    ctx.font = "900 20px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cell.icon, 0, -8);
  }

  ctx.fillStyle = "#111";
  ctx.font = "900 14px -apple-system,system-ui,Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cell.label || "", 0, 14);

  ctx.restore();
}

/**
 * ЦЕНА У КРАЯ ПОЛЯ:
 * маленькая плашка (не полоса на всю клетку)
 */
function drawEdgePrice(i, r, bg, text){
  const tag = Math.max(14, Math.round(CELL * 0.22)); // аккуратный размер
  const inset = 0;

  ctx.save();
  ctx.fillStyle = bg;

  if(isTop(i)){
    // сверху маленький тег
    ctx.fillRect(r.x + inset, r.y + inset, r.w - inset*2, tag);
    ctx.fillStyle = "#fff";
    ctx.font = "900 12px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, r.x + r.w/2, r.y + tag/2);
  } else if(isBottom(i)){
    ctx.fillRect(r.x + inset, r.y + r.h - tag - inset, r.w - inset*2, tag);
    ctx.fillStyle = "#fff";
    ctx.font = "900 12px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, r.x + r.w/2, r.y + r.h - tag/2 - inset);
  } else if(isLeft(i)){
    ctx.fillRect(r.x + inset, r.y + inset, tag, r.h - inset*2);
    ctx.translate(r.x + tag/2, r.y + r.h/2);
    ctx.rotate(-Math.PI/2);
    ctx.fillStyle = "#fff";
    ctx.font = "900 12px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
  } else if(isRight(i)){
    ctx.fillRect(r.x + r.w - tag - inset, r.y + inset, tag, r.h - inset*2);
    ctx.translate(r.x + r.w - tag/2 - inset, r.y + r.h/2);
    ctx.rotate(Math.PI/2);
    ctx.fillStyle = "#fff";
    ctx.font = "900 12px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

/* =======================
   TOKENS (smooth)
======================= */

const tokenState = { me:{index:0}, other:{index:5} };
const tokenAnim  = { me:{x:0,y:0}, other:{x:0,y:0} };

function cellCenter(index){
  const r = cellRects[index];
  return { x: r.x + r.w/2, y: r.y + r.h/2 };
}

function initTokenPositions(){
  const a = cellCenter(tokenState.me.index);
  const b = cellCenter(tokenState.other.index);
  tokenAnim.me.x = a.x; tokenAnim.me.y = a.y;
  tokenAnim.other.x = b.x + 14; tokenAnim.other.y = b.y + 14;
}

function drawTokens(){
  drawTokenCircle(tokenAnim.me.x, tokenAnim.me.y, 9, "#5ffcff");
  drawTokenCircle(tokenAnim.other.x, tokenAnim.other.y, 9, "#ff4b6e");
}
function drawTokenCircle(x,y,r,color){
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.stroke();
}

function easeInOut(t){
  return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
}

function animateTokenTo(playerKey, target, duration=160){
  return new Promise((resolve)=>{
    const sx = tokenAnim[playerKey].x, sy = tokenAnim[playerKey].y;
    const dx = target.x - sx, dy = target.y - sy;
    const t0 = performance.now();

    function frame(now){
      const t = Math.min((now - t0) / duration, 1);
      const k = easeInOut(t);
      tokenAnim[playerKey].x = sx + dx*k;
      tokenAnim[playerKey].y = sy + dy*k;
      draw();
      if(t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

async function moveTokenSmoothSteps(playerKey, steps){
  for(let s=0; s<steps; s++){
    tokenState[playerKey].index = (tokenState[playerKey].index + 1) % 40;
    const c = cellCenter(tokenState[playerKey].index);
    const target = (playerKey === "other") ? {x:c.x+14,y:c.y+14} : c;
    await animateTokenTo(playerKey, target, 160);
    await sleep(30);
  }
}

/* =======================
   CHAT + DICE + ROLL
======================= */

const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const rollBtn = document.getElementById("rollBtn");
const diceOverlay = document.getElementById("diceOverlay");

function addMsg(text, cls=""){
  const el = document.createElement("div");
  el.className = `msg ${cls}`.trim();
  el.textContent = text;
  chatLog.appendChild(el);
  chatLog.scrollTop = chatLog.scrollHeight;
}

sendBtn.addEventListener("click", ()=>{
  const v = (chatInput.value||"").trim();
  if(!v) return;
  addMsg(`dimakulik: ${v}`, "you");
  chatInput.value = "";
});
chatInput.addEventListener("keydown",(e)=>{ if(e.key==="Enter") sendBtn.click(); });

function showDice(a,b){
  const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  diceOverlay.querySelectorAll(".die")[0].textContent = faces[a-1];
  diceOverlay.querySelectorAll(".die")[1].textContent = faces[b-1];
  diceOverlay.classList.remove("hidden");
}
function hideDice(){ diceOverlay.classList.add("hidden"); }

rollBtn.addEventListener("pointerup", async (e)=>{
  e.preventDefault();
  e.stopPropagation();
  if(isRolling) return;
  isRolling = true;

  const d1 = 1 + Math.floor(Math.random()*6);
  const d2 = 1 + Math.floor(Math.random()*6);
  const steps = d1 + d2;

  addMsg(`dimakulik выбрасывает: ${d1}:${d2}`, "sys");

  showDice(d1,d2);
  await sleep(550);
  hideDice();

  await moveTokenSmoothSteps("me", steps);

  isRolling = false;
});
rollBtn.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); });

/* =======================
   INIT
======================= */

renderPlayers();
setupHiDPICanvas();
computeCellRects();
initTokenPositions();

addMsg("Клетки одинаковые + цены у края ✅", "sys");

onResize();
