/***********************
 * Telegram + iOS height fix
 ***********************/
(function initTelegram(){
  try{
    const tg = window.Telegram?.WebApp;
    if(tg){ tg.expand(); tg.ready(); }
  }catch(e){}
})();

function setAppHeight(){
  document.documentElement.style.setProperty("--appH", `${window.innerHeight}px`);
}

/***********************
 * FIT: translate + scale (чтобы ничего не уезжало)
 ***********************/
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

  const scaledW = W * s;
  const scaledH = H * s;

  const offsetX = (availW - scaledW) / 2;
  const offsetY = (availH - scaledH) / 2;

  canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${s})`;

  // debug
  const dbg = document.getElementById("debug");
  if(dbg){
    dbg.textContent = `vw=${window.innerWidth} vh=${window.innerHeight} scale=${s.toFixed(3)} viewport=${availW.toFixed(0)}x${availH.toFixed(0)}`;
  }

  return s;
}

function onResize(){
  setAppHeight();
  fitCanvas();
  placeTokens();
}

window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

/***********************
 * DATA
 ***********************/
const players = [
  { name:"Artemlasvegas", money:"$ 22,000k", active:false },
  { name:"Soloha", money:"$ 22,850k", active:true },
  { name:"dimakulik", money:"$ 25,000k", active:false },
  { name:"Анна", money:"$ 25,000k", active:false },
  { name:"Александр", money:"$ 25,000k", active:false },
];

// 40 клеток (потом заменишь своими названиями/иконками)
const cells40 = Array.from({length:40}).map((_,i)=>({ id:i, name:`CELL ${i}`, icon:"" }));
cells40[0].name="START";
cells40[10].name="IN JAIL";
cells40[20].name="FREE";
cells40[30].name="GO TO";

/***********************
 * RENDER PLAYERS
 ***********************/
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
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
        <div class="money">${escapeHtml(p.money)}</div>
      </div>
    `;
    wrap.appendChild(el);
  });
}

/***********************
 * RENDER 40 CELLS (classic monopoly order)
 ***********************/
function renderCells(){
  const wrap = document.getElementById("cells");
  wrap.innerHTML = "";

  const boardSize = 760;
  const corner = 92;
  const edgeW = 62;
  const edgeH = 92;

  function addCell(i,x,y,w,h,type){
    const c = document.createElement("div");
    c.className = `cell ${type} ${w>h ? "h":""}`.trim();
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    c.dataset.index = String(i);

    const d = cells40[i];
    c.innerHTML = `<div class="label">${escapeHtml(d.name)}</div>`;
    wrap.appendChild(c);
  }

  // corners
  addCell(0, boardSize-corner, boardSize-corner, corner, corner, "corner");
  addCell(10, 0, boardSize-corner, corner, corner, "corner");
  addCell(20, 0, 0, corner, corner, "corner");
  addCell(30, boardSize-corner, 0, corner, corner, "corner");

  // bottom 1..9
  for(let k=1;k<=9;k++) addCell(k, boardSize-corner-edgeW*k, boardSize-edgeH, edgeW, edgeH, "edge");
  // left 11..19
  for(let k=1;k<=9;k++) addCell(10+k, 0, boardSize-corner-edgeW*k, edgeH, edgeW, "edge");
  // top 21..29
  for(let k=1;k<=9;k++) addCell(20+k, corner+edgeW*(k-1), 0, edgeW, edgeH, "edge");
  // right 31..39
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
  return { x: cr.left - br.left + cr.width/2, y: cr.top - br.top + cr.height/2 };
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
 * CHAT + DICE
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
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

rollBtn.addEventListener("click", async ()=>{
  const d1 = 1 + Math.floor(Math.random()*6);
  const d2 = 1 + Math.floor(Math.random()*6);
  addMsg(`dimakulik выбрасывает: ${d1}:${d2}`, "sys");

  showDice(d1,d2);
  await sleep(700);
  hideDice();

  tokenState.me.index = (tokenState.me.index + d1 + d2) % 40;
  placeTokens();
});

/***********************
 * INIT
 ***********************/
renderPlayers();
renderCells();
renderTokens();
addMsg("JS работает ✅ (видишь это сообщение)", "sys");
addMsg("Если поле и игроки видны — layout ок ✅", "sys");

onResize();
