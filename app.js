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
 * ВАЖНО:
 * - внутри мы всё равно используем индексы 0..39
 * - но отображаем “Поле 1..40”, чтобы не казалось что “40 пропала”
 */
const cells40 = Array.from({length:40}).map((_,i)=>({
  id:i,
  type:"property",
  label:`Поле ${i+1}`,   // <-- теперь 1..40
  price: 0,
  skinId: "default",
}));

cells40[0]  = { id:0,  type:"start", label:"START",  price:0, skinId:"start" };
cells40[10] = { id:10, type:"jail",  label:"IN JAIL",price:0, skinId:"jail" };
cells40[20] = { id:20, type:"free",  label:"FREE",   price:0, skinId:"free" };
cells40[30] = { id:30, type:"goto",  label:"GO TO",  price:0, skinId:"goto" };

const skins = {
  default: { fill:"#ffffff", accent:"#111111", icon:"",  iconColor:"#111111" },
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
   CANVAS
======================= */

const BOARD_SIZE = 760;
const CORNER = 92;
const SIDE_CELLS = 9;

const canvasEl = document.getElementById("boardCanvas");
const ctx = canvasEl.getContext("2d");

let DPR = 1;
let cellRects = []; // index -> {x,y,w,h}

function setupHiDPICanvas(){
  DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvasEl.width  = Math.round(BOARD_SIZE * DPR);
  canvasEl.height = Math.round(BOARD_SIZE * DPR);
  canvasEl.style.width = `${BOARD_SIZE}px`;
  canvasEl.style.height = `${BOARD_SIZE}px`;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingEnabled = true;
}

/**
 * Делим totalSide на 9 клеток так, чтобы сумма была ровно totalSide
 */
function makeSteps(total, n){
  const base = Math.floor(total / n);
  const rem  = total - base * n;
  const sizes = Array.from({length:n}, (_,i)=> base + (i < rem ? 1 : 0));
  const pos = [0];
  for(let i=0;i<n;i++) pos.push(pos[i] + sizes[i]);
  return { sizes, pos }; // pos[k] = сумма первых k
}

function computeCellRects(){
  const rects = new Array(40);
  const totalSide = BOARD_SIZE - 2*CORNER; // <-- ВОТ КЛЮЧ! между углами по стороне
  // было неправильно: BOARD_SIZE - CORNER
  // правильно: от CORNER до BOARD_SIZE-CORNER -> длина = BOARD_SIZE - 2*CORNER
  // 760 - 184 = 576
  const steps = makeSteps(totalSide, SIDE_CELLS);

  // corners
  rects[0]  = {x:BOARD_SIZE-CORNER, y:BOARD_SIZE-CORNER, w:CORNER, h:CORNER};
  rects[10] = {x:0, y:BOARD_SIZE-CORNER, w:CORNER, h:CORNER};
  rects[20] = {x:0, y:0, w:CORNER, h:CORNER};
  rects[30] = {x:BOARD_SIZE-CORNER, y:0, w:CORNER, h:CORNER};

  // bottom (1..9) справа -> влево, строго между углами
  for(let k=1;k<=9;k++){
    const w = steps.sizes[k-1];
    const x = CORNER + (totalSide - steps.pos[k]); // <-- фикс смещения и длины
    rects[k] = { x, y: BOARD_SIZE - CORNER, w, h: CORNER };
  }

  // left (11..19) снизу -> вверх, строго между углами
  for(let k=1;k<=9;k++){
    const h = steps.sizes[k-1];
    const y = CORNER + (totalSide - steps.pos[k]); // <-- фикс
    rects[10+k] = { x:0, y, w: CORNER, h };
  }

  // top (21..29) слева -> вправо
  for(let k=1;k<=9;k++){
    const w = steps.sizes[k-1];
    const x = CORNER + steps.pos[k-1];
    rects[20+k] = { x, y:0, w, h: CORNER };
  }

  // right (31..39) сверху -> вниз
  for(let k=1;k<=9;k++){
    const h = steps.sizes[k-1];
    const y = CORNER + steps.pos[k-1];
    rects[30+k] = { x: BOARD_SIZE - CORNER, y, w: CORNER, h };
  }

  cellRects = rects;
}

function draw(){
  ctx.clearRect(0,0,BOARD_SIZE,BOARD_SIZE);

  // bg
  ctx.fillStyle = "#0d0914";
  ctx.fillRect(0,0,BOARD_SIZE,BOARD_SIZE);

  // cells
  for(let i=0;i<40;i++){
    drawCell(i, cellRects[i]);
  }

  // center
  ctx.fillStyle = "#2b2b2b";
  const cx = BOARD_SIZE*0.16, cy = BOARD_SIZE*0.16, cw = BOARD_SIZE*0.68, ch = BOARD_SIZE*0.68;
  ctx.fillRect(cx, cy, cw, ch);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);

  drawTokens();
}

function drawCell(i, r){
  const cell = cells40[i];
  const skin = skins[cell.skinId] || skins.default;

  ctx.fillStyle = skin.fill || "#fff";
  ctx.fillRect(r.x, r.y, r.w, r.h);

  // граница внутрь
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

  // accent strip
  ctx.fillStyle = skin.accent || "#111";
  const strip = 10;
  if(i === 0 || i === 10 || i === 20 || i === 30 || i <= 9 || (i >= 20 && i <= 29)){
    ctx.fillRect(r.x, r.y, r.w, strip);
  } else {
    ctx.fillRect(r.x, r.y, strip, r.h);
  }

  // icon
  if(skin.icon){
    ctx.fillStyle = skin.iconColor || "#111";
    ctx.font = "bold 18px -apple-system, system-ui, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(skin.icon, r.x + r.w/2, r.y + r.h/2 - 6);
  }

  // label
  ctx.fillStyle = "#111";
  ctx.font = "bold 10px -apple-system, system-ui, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(cell.label || "", r.x + r.w/2, r.y + r.h - 6);
}

/* =======================
   TOKENS
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

addMsg("Все клетки должны быть без зазоров ✅", "sys");

onResize();
