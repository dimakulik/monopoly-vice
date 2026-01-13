(function initTelegram(){
  try{
    const tg = window.Telegram?.WebApp;
    if(tg){ tg.expand(); tg.ready(); }
  }catch(e){}
})();

/* =======================
   SIZES
======================= */
const BOARD_SIZE = 760;      // поле
const OUTER_PAD  = 28;       // запас вокруг, чтобы ценники реально "вылезали"
const CANVAS_SIZE = BOARD_SIZE + OUTER_PAD*2;

const CORNER = 92;
const SIDE_CELLS = 9;

let currentScale = 1;
let isRolling = false;

/* =======================
   LAYOUT / FIT
======================= */
function setAppHeight(){
  document.documentElement.style.setProperty("--appH", `${window.innerHeight}px`);
}
function syncCanvasCssVars(){
  document.documentElement.style.setProperty("--canvasW", `${CANVAS_SIZE}px`);
  document.documentElement.style.setProperty("--canvasH", `${CANVAS_SIZE}px`);
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

/* =======================
   PLAYERS (⭐)
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
      </div>`;
    wrap.appendChild(el);
  });
}

/* =======================
   BOARD DATA (как 2-й скрин)
   0  = JACKPOT (низ-право)
   10 = IN JAIL (низ-лево)
   20 = START 🚀 (верх-лево)
   30 = GO TO 🍩 (верх-право)
======================= */
function formatK(n){
  if(n === null || n === undefined) return "";
  return Math.round(n).toLocaleString("en-US") + "k";
}
function cell(label, priceK=null, priceBg="", icon="", kind="prop"){
  return { label, priceK, priceBg, icon, kind };
}
const cells40 = new Array(40);

cells40[0]  = cell("JACKPOT", null, "", "🎰", "corner");
cells40[10] = cell("IN JAIL", null, "", "👮", "corner");
cells40[20] = cell("START",   null, "", "🚀", "corner");
cells40[30] = cell("GO TO",   null, "", "🍩", "corner");

// TOP 21..29
cells40[21] = cell("Botctario", 1080, "#d946ef", "", "prop");
cells40[22] = cell("",          null, "", "🔵", "prop");
cells40[23] = cell("FENDI",     4256, "#d946ef", "", "prop");
cells40[24] = cell("",          null, "", "🟩", "prop");
cells40[25] = cell("",             0, "#ef4444", "⭐", "prop");
cells40[26] = cell("H&M",       6600, "#f59e0b", "", "prop");
cells40[27] = cell("CHANCE",    null, "", "?", "chance");
cells40[28] = cell("DKNY",      4100, "#f59e0b", "", "prop");
cells40[29] = cell("LACOSTE",   6000, "#f59e0b", "", "prop");

// RIGHT 31..39
cells40[31] = cell("VK",         200, "#14b8a6", "", "prop");
cells40[32] = cell("x100",      null, "#b91c1c", "x100", "special");
cells40[33] = cell("YouTube",    240, "#14b8a6", "", "prop");
cells40[34] = cell("Twitter",    600, "#14b8a6", "", "prop");
cells40[35] = cell("AUDI",      2000, "#ef4444", "", "prop");
cells40[36] = cell("Aptekarne", 6050, "#3b82f6", "", "prop");
cells40[37] = cell("CHANCE",    null, "", "?", "chance");
cells40[38] = cell("Mtn Dew",   6050, "#3b82f6", "", "prop");
cells40[39] = cell("b",         8800, "#3b82f6", "", "prop");

// BOTTOM 1..9
cells40[1] = cell("FIJI",       7700, "#22c55e", "", "prop");
cells40[2] = cell("CHANCE",     null, "", "?", "chance");
cells40[3] = cell("RYANAIR",    7175, "#22c55e", "", "prop");
cells40[4] = cell("airshark",   3300, "#22c55e", "", "prop");
cells40[5] = cell("Ford",        250, "#ef4444", "", "prop");
cells40[6] = cell("Burger",     2500, "#38bdf8", "", "prop");
cells40[7] = cell("BurgerKing", 2600, "#38bdf8", "", "prop");
cells40[8] = cell("PROVIO",        0, "#b91c1c", "", "prop");
cells40[9] = cell("KFC",           0, "#38bdf8", "", "prop");

// LEFT 11..19
cells40[11] = cell("HolidayInn",   0, "#a855f7", "", "prop");
cells40[12] = cell("Radisson",     0, "#a855f7", "", "prop");
cells40[13] = cell("CHANCE",     null, "", "?", "chance");
cells40[14] = cell("Novotel",   3200, "#a855f7", "", "prop");
cells40[15] = cell("LandRover",  250, "#ef4444", "", "prop");
cells40[16] = cell("DIAMOND",   null, "", "💎", "special");
cells40[17] = cell("",            0, "#a855f7", "🟢", "prop");
cells40[18] = cell("CHANCE",    null, "", "?", "chance");
cells40[19] = cell("NOKIA",      500, "#64748b", "", "prop");

for(let i=0;i<40;i++){
  if(!cells40[i]) cells40[i] = cell(`Cell ${i}`, null, "", "", "prop");
}

/* =======================
   CANVAS SETUP
======================= */
const canvasEl = document.getElementById("boardCanvas");
const ctx = canvasEl.getContext("2d");
let DPR = 1;
let cellRects = [];

function setupHiDPICanvas(){
  DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvasEl.width  = Math.round(CANVAS_SIZE * DPR);
  canvasEl.height = Math.round(CANVAS_SIZE * DPR);
  canvasEl.style.width  = `${CANVAS_SIZE}px`;
  canvasEl.style.height = `${CANVAS_SIZE}px`;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingEnabled = true;
}

/* =======================
   GEOMETRY
======================= */
function makeSteps(total, n){
  const base = Math.floor(total / n);
  const rem  = total - base * n;
  const sizes = Array.from({length:n}, (_,i)=> base + (i < rem ? 1 : 0));
  const pos = [0];
  for(let i=0;i<n;i++) pos.push(pos[i] + sizes[i]);
  return { sizes, pos };
}
function computeCellRects(){
  const rects = new Array(40);
  const totalSide = BOARD_SIZE - 2*CORNER;
  const steps = makeSteps(totalSide, SIDE_CELLS);

  const ox = OUTER_PAD;
  const oy = OUTER_PAD;

  rects[0]  = {x:ox+BOARD_SIZE-CORNER, y:oy+BOARD_SIZE-CORNER, w:CORNER, h:CORNER};
  rects[10] = {x:ox, y:oy+BOARD_SIZE-CORNER, w:CORNER, h:CORNER};
  rects[20] = {x:ox, y:oy, w:CORNER, h:CORNER};
  rects[30] = {x:ox+BOARD_SIZE-CORNER, y:oy, w:CORNER, h:CORNER};

  // bottom 1..9 right->left
  for(let k=1;k<=9;k++){
    const w = steps.sizes[k-1];
    const x = ox + CORNER + (totalSide - steps.pos[k]);
    rects[k] = { x, y: oy + BOARD_SIZE - CORNER, w, h: CORNER };
  }

  // left 11..19 bottom->top
  for(let k=1;k<=9;k++){
    const h = steps.sizes[k-1];
    const y = oy + CORNER + (totalSide - steps.pos[k]);
    rects[10+k] = { x:ox, y, w: CORNER, h };
  }

  // top 21..29 left->right
  for(let k=1;k<=9;k++){
    const w = steps.sizes[k-1];
    const x = ox + CORNER + steps.pos[k-1];
    rects[20+k] = { x, y:oy, w, h: CORNER };
  }

  // right 31..39 top->bottom
  for(let k=1;k<=9;k++){
    const h = steps.sizes[k-1];
    const y = oy + CORNER + steps.pos[k-1];
    rects[30+k] = { x: ox + BOARD_SIZE - CORNER, y, w: CORNER, h };
  }

  cellRects = rects;
}

const isBottom=i=>i>=1 && i<=9;
const isLeft=i=>i>=11 && i<=19;
const isTop=i=>i>=21 && i<=29;
const isRight=i=>i>=31 && i<=39;
const isCorner=i=>i===0 || i===10 || i===20 || i===30;

/* =======================
   DRAW
======================= */
function draw(){
  ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);

  // фон
  ctx.fillStyle = "#0d0914";
  ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);

  // клетки
  for(let i=0;i<40;i++){
    drawCell(i, cellRects[i]);
  }

  // центр (внутри поля)
  ctx.fillStyle = "#2b2b2b";
  const cx = OUTER_PAD + BOARD_SIZE*0.16;
  const cy = OUTER_PAD + BOARD_SIZE*0.16;
  const cw = BOARD_SIZE*0.68;
  const ch = BOARD_SIZE*0.68;
  ctx.fillRect(cx, cy, cw, ch);

  drawTokens();
}

function drawCell(i, r){
  const c = cells40[i];

  ctx.fillStyle = "#fff";
  ctx.fillRect(r.x, r.y, r.w, r.h);

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

  if(c.priceK !== null && c.priceBg){
    drawPriceStripe(i, r, c.priceBg, formatK(c.priceK));
  }

  if(isCorner(i)){
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 34px -apple-system,system-ui,Arial";
    ctx.fillText(c.icon || "", r.x + r.w/2, r.y + r.h/2 - 4);

    ctx.font = "900 10px -apple-system,system-ui,Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(c.label || "", r.x + r.w/2, r.y + r.h - 8);
    return;
  }

  if(c.kind === "chance"){
    ctx.fillStyle = "#6bbf2a";
    ctx.font = "900 46px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", r.x + r.w/2, r.y + r.h/2);
    return;
  }

  if(c.kind === "special" && c.icon === "x100"){
    ctx.fillStyle = "#111";
    ctx.font = "900 14px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("x100", r.x + r.w/2, r.y + r.h/2);
    return;
  }

  // текст/иконки
  ctx.save();
  ctx.translate(r.x + r.w/2, r.y + r.h/2);

  // верх/низ — вертикально
  if(isTop(i) || isBottom(i)) ctx.rotate(-Math.PI/2);

  if(c.icon){
    ctx.fillStyle = "#111";
    ctx.font = "900 20px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.icon, 0, -10);
  }

  ctx.fillStyle = "#111";
  ctx.font = "900 14px -apple-system,system-ui,Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(c.label || "", 0, 14);

  ctx.restore();
}

/* ✅ ценники "вылезают" как на monopoly-one:
   справа/слева чуть сильнее, как на твоём обведении */
function drawPriceStripe(i, r, bg, text){
  const thick = 20;
  const protrudeTB = 14;
  const protrudeLR = 18;

  ctx.save();
  ctx.fillStyle = bg;

  if(isTop(i)){
    ctx.fillRect(r.x, r.y - protrudeTB, r.w, thick + protrudeTB);
    ctx.fillStyle = "#fff";
    ctx.font = "900 12px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, r.x + r.w/2, r.y - protrudeTB/2 + thick/2);
  } else if(isBottom(i)){
    ctx.fillRect(r.x, r.y + r.h - thick, r.w, thick + protrudeTB);
    ctx.fillStyle = "#fff";
    ctx.font = "900 12px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, r.x + r.w/2, r.y + r.h - thick/2 + protrudeTB/2);
  } else if(isLeft(i)){
    ctx.fillRect(r.x - protrudeLR, r.y, thick + protrudeLR, r.h);
    ctx.translate(r.x - protrudeLR/2 + thick/2, r.y + r.h/2);
    ctx.rotate(-Math.PI/2);
    ctx.fillStyle = "#fff";
    ctx.font = "900 12px -apple-system,system-ui,Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 0);
  } else if(isRight(i)){
    ctx.fillRect(r.x + r.w - thick, r.y, thick + protrudeLR, r.h);
    ctx.translate(r.x + r.w - thick/2 + protrudeLR/2, r.y + r.h/2);
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
  const dies = diceOverlay.querySelectorAll(".die");
  dies[0].textContent = faces[a-1];
  dies[1].textContent = faces[b-1];
  diceOverlay.classList.remove("hidden");
}
function hideDice(){ diceOverlay.classList.add("hidden"); }

rollBtn.addEventListener("pointerup", async (e)=>{
  e.preventDefault(); e.stopPropagation();
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

/* =======================
   INIT
======================= */
function onResize(){
  setAppHeight();
  syncCanvasCssVars();
  fitCanvas();
  setupHiDPICanvas();
  computeCellRects();
  initTokenPositions();
  draw();
}

window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

renderPlayers();
syncCanvasCssVars();
setupHiDPICanvas();
computeCellRects();
initTokenPositions();

addMsg("Цены выступают наружу как в monopoly-one ✅", "sys");

onResize();
