// если этот код запустился — скрываем nojs баннер
document.getElementById("nojs").style.display = "none";

(function initTelegram(){
  try{
    const tg = window.Telegram?.WebApp;
    if(tg){ tg.expand(); tg.ready(); }
  }catch(e){}
})();

function setAppHeight(){
  document.documentElement.style.setProperty("--appH", `${window.innerHeight}px`);
}

function fitCanvas(){
  const canvas = document.getElementById("canvas");
  const root = document.documentElement;

  const W = parseInt(getComputedStyle(root).getPropertyValue("--canvasW"), 10);
  const H = parseInt(getComputedStyle(root).getPropertyValue("--canvasH"), 10);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // В Telegram на iPhone центрирование ломает.
  // Считаем scale так, чтобы по ширине холст влезал.
  const paddingLeft = 10; // как в CSS margin-left
  const availW = vw - paddingLeft;
  const availH = vh - 20;

  const s = Math.min(availW / W, availH / H, 1);

  // ЛЕВЫЙ ЯКОРЬ (как monopoly-one)
  canvas.style.transformOrigin = "left center";
  canvas.style.transform = `scale(${s})`;

  return s;
}

const players = [
  { name:"Artemlasvegas", money:"$ 22,000k", active:false },
  { name:"Soloha", money:"$ 22,850k", active:true },
  { name:"dimakulik", money:"$ 25,000k", active:false },
  { name:"Анна", money:"$ 25,000k", active:false },
  { name:"Александр", money:"$ 25,000k", active:false },
];

const cells40 = Array.from({length:40}).map((_,i)=>({ id:i, name:`${i}`, icon:"" }));
cells40[0].name="START";
cells40[10].name="IN JAIL";
cells40[20].name="FREE";
cells40[30].name="GO TO";

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
    c.innerHTML = `<div class="label">${escapeHtml(cells40[i].name)}</div>`;
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

function debugLine(scale){
  const d = document.getElementById("debug");
  d.textContent = `DEBUG: vw=${window.innerWidth} vh=${window.innerHeight} scale=${scale.toFixed(3)} canvas=${getComputedStyle(document.documentElement).getPropertyValue("--canvasW").trim()}x${getComputedStyle(document.documentElement).getPropertyValue("--canvasH").trim()}`;
}

function onResize(){
  setAppHeight();
  const s = fitCanvas();
  placeTokens();
  debugLine(s);
}

window.addEventListener("resize", onResize);
window.addEventListener("orientationchange", onResize);

/*** chat demo ***/
const chatLog = document.getElementById("chatLog");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

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

/*** init ***/
renderPlayers();
renderCells();
renderTokens();
addMsg("Если ты это видишь — JS работает ✅", "sys");
addMsg("Если клетки по периметру есть — верстка работает ✅", "sys");
onResize();
