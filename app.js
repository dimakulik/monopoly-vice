// 1:1 поле как на втором скрине (канвас рисует клетки + вынос ценника наружу)

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const chatLog = document.getElementById("chatLog");

function addLine(text, color="#cfd6db"){
  const d = document.createElement("div");
  d.textContent = text;
  d.style.color = color;
  chatLog.appendChild(d);
  if(chatLog.children.length > 2) chatLog.removeChild(chatLog.firstChild);
}

const BOARD = 900;          // логический размер
const PAD = 0;              // без лишних отступов
const CORNER = 120;         // углы как на скрине
const N = 9;                // клеток на сторону без углов

// вынос ценника наружу
const STRIPE = 36;          // толщина ценника
const OUT = 18;             // насколько выступает

// данные (как на скрине-референсе с брендами)
const top = [
  {logo:"", stripe:"#f0a", price:"600k"},
  {logo:"CHANEL", stripe:null, price:null, rot:true},
  {logo:"?", stripe:"#f0a", price:"600k"},
  {logo:"BOSS", stripe:null, price:null, rot:true},
  {logo:"", stripe:null, price:null},
  {logo:"", stripe:"#ef4444", price:"2,000k"},
  {logo:"adidas", stripe:"#f59e0b", price:"1,000k", rot:true},
  {logo:"?", stripe:"#f59e0b", price:"", rot:false},
  {logo:"PUMA", stripe:"#f59e0b", price:"1,000k", rot:true},
  {logo:"LACOSTE", stripe:"#f59e0b", price:"1,200k", rot:true},
];

const right = [
  {logo:"C+", stripe:"#14b8a6", price:"1,400k"},
  {logo:"R*", stripe:"#ef4444", price:"1,500k"},
  {logo:"friender", stripe:"#14b8a6", price:"1,400k"},
  {logo:"bird", stripe:"#14b8a6", price:"1,600k"},
  {logo:"AUDI", stripe:"#ef4444", price:"2,000k"},
  {logo:"CocaCola", stripe:"#3b82f6", price:"1,800k"},
  {logo:"?", stripe:null, price:null},
  {logo:"pepsi", stripe:"#3b82f6", price:"1,800k"},
  {logo:"Fanta", stripe:"#3b82f6", price:"2,000k"},
];

const bottom = [
  {logo:"KFC", stripe:"#38bdf8", price:"2,800k", rot:true},
  {logo:"PROVIO", stripe:"#ef4444", price:"1,500k", rot:true},
  {logo:"", stripe:"#38bdf8", price:"2,600k"},
  {logo:"", stripe:"#38bdf8", price:"2,600k"},
  {logo:"Ford", stripe:"#ef4444", price:"2,000k", rot:true},
  {logo:"BRITISH", stripe:"#22c55e", price:"2,400k", rot:true},
  {logo:"lufthansa", stripe:"#22c55e", price:"2,200k", rot:true},
  {logo:"?", stripe:null, price:null},
  {logo:"American", stripe:"#22c55e", price:"2,200k", rot:true},
];

const left = [
  {logo:"NOKIA", stripe:"#64748b", price:"4,000k"},
  {logo:"?", stripe:null, price:null},
  {logo:"Apple", stripe:"#64748b", price:"3,500k"},
  {logo:"💎", stripe:null, price:null},
  {logo:"LandRover", stripe:"#ef4444", price:"2,000k"},
  {logo:"Novotel", stripe:"#a855f7", price:"3,200k"},
  {logo:"?", stripe:null, price:null},
  {logo:"Radisson", stripe:"#a855f7", price:"3,000k"},
  {logo:"HolidayInn", stripe:"#a855f7", price:"3,000k"},
];

function resize(){
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw();
}

window.addEventListener("resize", resize);

function drawCell(x,y,w,h){
  ctx.fillStyle="#fff";
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle="#111";
  ctx.lineWidth=2;
  ctx.strokeRect(x,y,w,h);
}

function stripeTop(x,y,w,color,txt){
  ctx.fillStyle=color;
  ctx.fillRect(x, y-OUT, w, STRIPE+OUT);
  ctx.fillStyle="#fff";
  ctx.font="800 18px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(txt, x+w/2, y-OUT/2+STRIPE/2);
}
function stripeBottom(x,y,w,h,color,txt){
  ctx.fillStyle=color;
  ctx.fillRect(x, y+h-STRIPE, w, STRIPE+OUT);
  ctx.fillStyle="#fff";
  ctx.font="800 18px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(txt, x+w/2, y+h-STRIPE/2+OUT/2);
}
function stripeLeft(x,y,h,color,txt){
  ctx.fillStyle=color;
  ctx.fillRect(x-OUT, y, STRIPE+OUT, h);
  ctx.save();
  ctx.translate(x-OUT/2+STRIPE/2, y+h/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillStyle="#fff";
  ctx.font="800 18px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(txt, 0, 0);
  ctx.restore();
}
function stripeRight(x,y,w,h,color,txt){
  ctx.fillStyle=color;
  ctx.fillRect(x+w-STRIPE, y, STRIPE+OUT, h);
  ctx.save();
  ctx.translate(x+w-STRIPE/2+OUT/2, y+h/2);
  ctx.rotate(Math.PI/2);
  ctx.fillStyle="#fff";
  ctx.font="800 18px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(txt, 0, 0);
  ctx.restore();
}

function textInCell(x,y,w,h,label,rot=false){
  ctx.save();
  ctx.translate(x+w/2,y+h/2);
  if(rot) ctx.rotate(-Math.PI/2);
  ctx.fillStyle="#111";
  ctx.font="900 22px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(label,0,0);
  ctx.restore();
}

function draw(){
  const W = canvas.getBoundingClientRect().width;
  const H = canvas.getBoundingClientRect().height;
  ctx.clearRect(0,0,W,H);

  // внешняя рамка как на скрине
  ctx.fillStyle="#15181b";
  ctx.fillRect(0,0,W,H);

  // рабочая область поля
  const bx = 70;
  const by = 40;
  const bw = Math.min(W-120, H-80);
  const bh = bw;

  // фон внутри
  ctx.fillStyle="#0f0f12";
  ctx.fillRect(bx,by,bw,bh);

  // сетка
  const side = bw;
  const inner = side - 2*CORNER;
  const step = inner / N;

  // углы
  // TL (rocket circle)
  drawCell(bx,by,CORNER,CORNER);
  ctx.save();
  ctx.translate(bx+CORNER/2, by+CORNER/2);
  ctx.fillStyle="#111";
  ctx.font="900 44px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("🚀",0,-10);
  ctx.font="900 14px system-ui";
  ctx.fillText("START",0,38);
  ctx.restore();

  // TR (donut corner)
  drawCell(bx+side-CORNER,by,CORNER,CORNER);
  ctx.save();
  ctx.translate(bx+side-CORNER/2, by+CORNER/2);
  ctx.fillStyle="#111";
  ctx.font="900 44px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("🍩",0,-10);
  ctx.font="900 14px system-ui";
  ctx.fillText("GO TO",0,38);
  ctx.restore();

  // BR (jackpot)
  drawCell(bx+side-CORNER,by+side-CORNER,CORNER,CORNER);
  ctx.save();
  ctx.translate(bx+side-CORNER/2, by+side-CORNER/2);
  ctx.fillStyle="#111";
  ctx.font="900 44px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("🎰",0,-10);
  ctx.font="900 14px system-ui";
  ctx.fillText("JACKPOT",0,38);
  ctx.restore();

  // BL (jail)
  drawCell(bx,by+side-CORNER,CORNER,CORNER);
  ctx.save();
  ctx.translate(bx+CORNER/2, by+side-CORNER/2);
  ctx.fillStyle="#111";
  ctx.font="900 44px system-ui";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText("👮",0,-10);
  ctx.font="900 14px system-ui";
  ctx.fillText("IN JAIL",0,38);
  ctx.restore();

  // TOP row (между углами)
  for(let i=0;i<N;i++){
    const x = bx+CORNER + i*step;
    const y = by;
    drawCell(x,y,step,CORNER);
    const d = top[i+1] || {logo:"",stripe:null,price:null};
    if(d.stripe && d.price) stripeTop(x,y,step,d.stripe,d.price);
    if(d.logo) textInCell(x,y,step,CORNER,d.logo, true);
  }

  // RIGHT col
  for(let i=0;i<N;i++){
    const x = bx+side-CORNER;
    const y = by+CORNER + i*step;
    drawCell(x,y,CORNER,step);
    const d = right[i] || {logo:"",stripe:null,price:null};
    if(d.stripe && d.price) stripeRight(x,y,CORNER,step,d.stripe,d.price);
    if(d.logo) textInCell(x,y,CORNER,step,d.logo,false);
  }

  // BOTTOM row
  for(let i=0;i<N;i++){
    const x = bx+side-CORNER - (i+1)*step;
    const y = by+side-CORNER;
    drawCell(x,y,step,CORNER);
    const d = bottom[i] || {logo:"",stripe:null,price:null};
    if(d.stripe && d.price) stripeBottom(x,y,step,CORNER,d.stripe,d.price);
    if(d.logo) textInCell(x,y,step,CORNER,d.logo,true);
  }

  // LEFT col
  for(let i=0;i<N;i++){
    const x = bx;
    const y = by+side-CORNER - (i+1)*step;
    drawCell(x,y,CORNER,step);
    const d = left[i] || {logo:"",stripe:null,price:null};
    if(d.stripe && d.price) stripeLeft(x,y,step,d.stripe,d.price);
    if(d.logo) textInCell(x,y,CORNER,step,d.logo,false);
  }

  // центр (серый как на скрине)
  const cx = bx+CORNER;
  const cy = by+CORNER;
  const cw = side-2*CORNER;
  const ch = side-2*CORNER;
  ctx.fillStyle="#2f363b";
  ctx.fillRect(cx,cy,cw,ch);
}

addLine("MikClever1 выбрасывает 4:5", "#ff5a5a");
addLine("MikClever1 попадает на Lacoste и задумывается о покупке", "#ff5a5a");

setTimeout(resize, 0);
