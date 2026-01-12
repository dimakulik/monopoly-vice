(function initTelegram(){
  try{
    const tg = window.Telegram?.WebApp;
    if(tg){ tg.expand(); tg.ready(); }
  }catch(e){}
})();

let currentScale = 1;

function setAppHeight(){
  document.documentElement.style.setProperty("--appH", `${window.innerHeight}px`);
}

function fitCanvas(){
  const canvas = document.getElementById("canvas");
  const viewport = document.getElementById("viewport");
  const root = document.documentElement;

  const W = parseInt(getComputedStyle(root).getPropertyValue("--canvasW"), 10);
  const H = parseInt(getComputedStyle(root).getPropertyValue("--canvasH"), 10);

  const vr = viewport.getBoundingClientRect();
  const availW = vr.width;
  const availH = vr.height;

  const s = Math.min(availW / W, availH / H, 1);
  currentScale = s;

  const scaledW = W * s;
  const scaledH = H * s;

  const offsetX = (availW - scaledW) / 2;
  const offsetY = (availH - scaledH) / 2;

  canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${s})`;

  const dbg = document.getElementById("debug");
  if(dbg){
    dbg.textContent = `scale=${s.toFixed(3)} viewport=${availW.toFixed(0)}x${availH.toFixed(0)}`;
  }
}

function onResize(){
  setAppHeight();
  fitCanvas();
  requestAnimationFrame(placeTokens);
}

window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

/***********************
 * DATA
 ***********************/
const players = [
  { name:"Artemlasvegas", stars:22000, active:false },
  { name:"Soloha",        stars:22850, active:true  },
  { name:"dimakulik",     stars:25000, active:false },
  { name:"Анна",          stars:25000, active:false },
  { name:"Александр",     stars:25000, active:false },
];

const cells40 = Array.from({length:40}).map((_,i)=>({ id:i, name:`Поле ${i}` }));
cells40[0].name="START";
cells40[10].name="IN JAIL";
cells40[20].name="FREE";
cells40[30].name="GO TO";

/***********************
 * HELPERS
 ***********************/
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}
function formatNum(n){
  return (Number(n)||0).toLocaleString("ru-RU");
}
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

/***********************
 * PLAYERS
 ***********************/
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

/***********************
 * CELLS (перекрытие на 1px чтобы убрать швы)
 ***********************/
function renderCells(){
  const wrap = document.getElementById("cells");
  wrap.innerHTML = "";

  const boardSize = 760;
  const corner = 92;
  const edgeW = 62;
  const edgeH = 92;

  const OVERLAP = 1; // ключ к отсутствию швов

  function addCell(i,x,y,w,h,type){
    const c = document.createElement("div");
    c.className = `cell ${type} ${w>h ? "h":""}`.trim();

    // увеличиваем на 1px чтобы клетки перекрывали швы
    const ww = w + OVERLAP;
    const hh = h + OVERLAP;

    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.width = `${ww}px`;
    c.style.height = `${hh}px`;

    c.dataset.index = String(i);
    c.innerHTML = `<div class="label">${escapeHtml(cells40[i].name)}</div>`;
    wrap.appendChild(c);
  }

  addCell(0, boardSize-corner, boardSize-corner, corner, corner, "corner");
  addCell(10, 0, boardSize-corner, corner, corner, "corner");
  addCell(20, 0, 0, corner, corner, "corner");
  addCell(30, boardSize-corner, 0, corner, corner, "corner");

  for(let k=1;k<=9;k++) addCell(k, boardSize-corner-edgeW*k, boardSize-edgeH, edgeW, edgeH, "edge");
  for(let k=1;k<=9;k++) addCell(10+k, 0, boardSize-corner-edgeW*k, edgeH, edgeW, "edge");
  for(let k=1;k<=9;k++) addCell(20+k, corner+edgeW*(k-1), 0, edgeW, edgeH, "edge");
  for(let k=1;k<=9;k++) addCell(30+k, boardSize-edgeH, corner+edgeW*(k-1), edgeH, edgeW, "edge");
}

/***********************
 * TOKENS
 ***********************/
const tokenState = { me:{index:0}, other:{index:5} };

function renderTokens(){
  const wrap = document.getElementById("tokens");
  wrap.innerHTML = `
    <div id="t_me" class="token you"></div>
    <div id="t_other" class="token other"></div>
  `;
}

function getCellCenter(i){
  const cell = document.querySelector(`.cell[data-index="${i}"]`);
  const board = document.getElementById("board");
  if(!cell || !board) return {x:0,y:0};

  const cr = cell.getBoundingClientRect();
  const br = board.getBoundingClientRect();

  return {
    x: (cr.left - br.left + cr.width/2) / currentScale,
    y: (cr.top  - br.top  + cr.height/2) / currentScale
  };
}

function placeTokens(){
  const me = document.getElementById("t_me");
  const other = document.getElementById("t_other");
  if(!me || !other) return;

  const p1 = getCellCenter(tokenState.me.index);
  const p2 = getCellCenter(tokenState.other.index);

  me.style.left = `${p1.x}px`;
  me.style.top  = `${p1.y}px`;

  other.style.left = `${p2.x + 14}px`;
  other.style.top  = `${p2.y + 14}px`;
}

/***********************
 * CHAT + DICE + ROLL
 ***********************/
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

/* клик железно */
rollBtn.addEventListener("pointerup", async (e)=>{
  e.preventDefault();
  e.stopPropagation();

  const d1 = 1 + Math.floor(Math.random()*6);
  const d2 = 1 + Math.floor(Math.random()*6);

  addMsg(`dimakulik выбрасывает: ${d1}:${d2}`, "sys");

  showDice(d1,d2);
  await sleep(650);
  hideDice();

  tokenState.me.index = (tokenState.me.index + d1 + d2) % 40;
  requestAnimationFrame(placeTokens);
});

// на случай если pointerup не сработает в старом webview:
rollBtn.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); });

/***********************
 * INIT
 ***********************/
renderPlayers();
renderCells();
renderTokens();

addMsg("Кнопка должна кликаться ✅", "sys");
addMsg("Швов между клетками быть не должно ✅", "sys");

onResize();
