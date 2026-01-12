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
  draw();
}

window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

/* =======================
   DATA
======================= */

const players = [
  { name:"Artemlasvegas", stars:22000, active:false },
  { name:"Soloha",        stars:22850, active:true  },
  { name:"dimakulik",     stars:25000, active:false },
  { name:"Анна",          stars:25000, active:false },
  { name:"Александр",     stars:25000, active:false },
];

/**
 * КЛЕТКИ (кастомизация будущими скинами):
 * - skinId: какой скин применён
 * - type: тип клетки (start, property, chance, tax, jail, etc.)
 * - label: текст
 * - price: цена покупки (⭐) (если property)
 */
const cells40 = Array.from({length:40}).map((_,i)=>({
  id:i,
  type:"property",
  label:`Поле ${i}`,
  price: 0,
  skinId: "default",
}));

cells40[0]  = { id:0,  type:"start", label:"START", price:0, skinId:"start" };
cells40[10] = { id:10, type:"jail",  label:"IN JAIL", price:0, skinId:"jail" };
cells40[20] = { id:20, type:"free",  label:"FREE", price:0, skinId:"free" };
cells40[30] = { id:30, type:"goto",  label:"GO TO", price:0, skinId:"goto" };

/**
 * СКИНЫ (будущее: магазин скинов).
 * Потом ты просто меняешь cell.skinId (например на "gold_start") и redraw.
 */
const skins = {
  default: { fill:"#ffffff", accent:"#111111", icon:"", iconColor:"#111111" },
  start:   { fill:"#ffffff", accent:"#0f7cff", icon:"▶", iconColor:"#0f7cff" },
  jail:    { fill:"#ffffff", accent:"#ff3b5c", icon:"⛓", iconColor:"#ff3b5c" },
  free:    { fill:"#ffffff", accent:"#22c55e", icon:"★", iconColor:"#22c55e" },
  goto:    { fill:"#ffffff", accent:"#f59e0b", icon:"↪", iconColor:"#f59e0b" },
};

/* =======================
   HELPERS
======================= */

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}
function formatNum(n){
  return (Number(n)||0).toLocaleString("ru-RU");
}
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

/* =======================
   PLAYERS UI
======================= */

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
   CANVAS: board + tokens
======================= */

const BOARD_SIZE = 760;
const corner = 92;
const edgeW = 62;
const edgeH = 92;

const canvasEl = document.getElementById("boardCanvas");
const ctx = canvasEl.getContext("2d");

let DPR = 1;

// прямоугольники всех клеток (для рисования и попадания фишек)
let cellRects = []; // index -> {x,y,w,h, rot}

function setupHiDPICanvas(){
  DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvasEl.width  = Math.round(BOARD_SIZE * DPR);
  canvasEl.height = Math.round(BOARD_SIZE * DPR);
  canvasEl.style.width = `${BOARD_SIZE}px`;
  canvasEl.style.height = `${BOARD_SIZE}px`;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingEnabled = true;
}

function computeCellRects(){
  const rects = new Array(40);

  // corners
  rects[0]  = {x:BOARD_SIZE-corner, y:BOARD_SIZE-corner, w:corner, h:corner};
  rects[10] = {x:0, y:BOARD_SIZE-corner, w:corner, h:corner};
  rects[20] = {x:0, y:0, w:corner, h:corner};
  rects[30] = {x:BOARD_SIZE-corner, y:0, w:corner, h:corner};

  // bottom 1..9
  for(let k=1;k<=9;k++){
    rects[k] = { x: BOARD_SIZE-corner-edgeW*k, y: BOARD_SIZE-edgeH, w: edgeW, h: edgeH };
  }
  // left 11..19
  for(let k=1;k<=9;k++){
    rects[10+k] = { x: 0, y: BOARD_SIZE-corner-edgeW*k, w: edgeH, h: edgeW };
  }
  // top 21..29
  for(let k=1;k<=9;k++){
    rects[20+k] = { x: corner+edgeW*(k-1), y: 0, w: edgeW, h: edgeH };
  }
  // right 31..39
  for(let k=1;k<=9;k++){
    rects[30+k] = { x: BOARD_SIZE-edgeH, y: corner+edgeW*(k-1), w: edgeH, h: edgeW };
  }

  cellRects = rects;
}

function draw(){
  if(!cellRects.length) computeCellRects();

  // background
  ctx.clearRect(0,0,BOARD_SIZE,BOARD_SIZE);
  ctx.fillStyle = "#0d0914";
  ctx.fillRect(0,0,BOARD_SIZE,BOARD_SIZE);

  // draw cells (единый canvas => НЕТ ШВОВ)
  for(let i=0;i<40;i++){
    drawCell(i, cellRects[i]);
  }

  // center area
  ctx.fillStyle = "#2b2b2b";
  const cx = BOARD_SIZE*0.16, cy = BOARD_SIZE*0.16, cw = BOARD_SIZE*0.68, ch = BOARD_SIZE*0.68;
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx, cy, cw, ch);

  // tokens
  drawTokens();
}

function drawCell(i, r){
  const cell = cells40[i];
  const skin = skins[cell.skinId] || skins.default;

  // fill
  ctx.fillStyle = skin.fill || "#fff";
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // border (рисуем линию внутри, чтобы не было “шва” по краю соседей)
  ctx.strokeStyle = "rgba(17,17,17,1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

  // accent strip (типа цветной полоски как у монополии)
  ctx.fillStyle = skin.accent || "#111";
  // полоска сверху для вертикальных, слева для горизонтальных — упрощённо
  const strip = 10;
  if(r.h >= r.w){ // высокая (боковые)
    ctx.fillRect(r.x, r.y, r.w, strip);
  }else{
    ctx.fillRect(r.x, r.y, strip, r.h);
  }

  // icon
  if(skin.icon){
    ctx.fillStyle = skin.iconColor || "#111";
    ctx.font = "bold 18px -apple-system, system-ui, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(skin.icon, r.x + r.w/2, r.y + r.h/2 - 8);
  }

  // label
  ctx.fillStyle = "#111";
  ctx.font = "bold 10px -apple-system, system-ui, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const text = cell.label || "";
  ctx.fillText(text, r.x + r.w/2, r.y + r.h - 6);

  // price (если property и цена есть)
  if(cell.type === "property" && cell.price > 0){
    ctx.fillStyle = "#111";
    ctx.font = "bold 9px -apple-system, system-ui, Arial";
    ctx.fillText(`⭐ ${formatNum(cell.price)}`, r.x + r.w/2, r.y + 14);
  }
}

/* =======================
   TOKENS (плавная анимация)
======================= */

const tokenState = {
  me:    { index:0 },
  other: { index:5 },
};

const tokenAnim = {
  me:    { x:0, y:0 },
  other: { x:0, y:0 },
};

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
  // me
  drawTokenCircle(tokenAnim.me.x, tokenAnim.me.y, 9, "#5ffcff");
  // other
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
    const sx = tokenAnim[playerKey].x;
    const sy = tokenAnim[playerKey].y;
    const dx = target.x - sx;
    const dy = target.y - sy;
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
   FUTURE: кастомизация скинов
   Пример (потом будет "купил скин" -> применил):
   applySkinToCell(0, "default") или applySkinToCell(0, "start")
======================= */
function applySkinToCell(cellIndex, skinId){
  if(!cells40[cellIndex]) return;
  cells40[cellIndex].skinId = skinId;
  draw();
}

/* =======================
   INIT
======================= */

renderPlayers();
computeCellRects();
setupHiDPICanvas();
initTokenPositions();

addMsg("Поле рисуется на Canvas — швов быть не должно ✅", "sys");
addMsg("Кастомизация: у каждой клетки есть skinId ✅", "sys");

onResize();
