/* =======================
   CONFIG
======================= */

const BOARD_SIZE = 760;     // размер самого поля
const OUTER_PAD  = 16;      // запас под выступающие цены
const CANVAS_SIZE = BOARD_SIZE + OUTER_PAD*2;

const CORNER = 92;
const SIDE_CELLS = 9;

/* =======================
   CANVAS
======================= */

const canvas = document.getElementById("boardCanvas");
const ctx = canvas.getContext("2d");

let DPR = Math.max(1, window.devicePixelRatio || 1);

canvas.width  = CANVAS_SIZE * DPR;
canvas.height = CANVAS_SIZE * DPR;
canvas.style.width  = CANVAS_SIZE + "px";
canvas.style.height = CANVAS_SIZE + "px";

ctx.setTransform(DPR,0,0,DPR,0,0);
ctx.imageSmoothingEnabled = true;

/* =======================
   BOARD OFFSET (КЛЮЧ!)
======================= */

const OFFSET = OUTER_PAD;

/* =======================
   CELL GEOMETRY
======================= */

let cellRects = [];

function makeSteps(total, n){
  const base = Math.floor(total / n);
  const rem = total - base*n;
  const sizes = Array.from({length:n},(_,i)=>base+(i<rem?1:0));
  const pos=[0];
  for(let i=0;i<n;i++) pos.push(pos[i]+sizes[i]);
  return {sizes,pos};
}

function computeCellRects(){
  const rects = new Array(40);
  const totalSide = BOARD_SIZE - 2*CORNER;
  const steps = makeSteps(totalSide, SIDE_CELLS);

  const ox = OFFSET;
  const oy = OFFSET;

  rects[0]  = {x:ox+BOARD_SIZE-CORNER, y:oy+BOARD_SIZE-CORNER, w:CORNER, h:CORNER};
  rects[10] = {x:ox, y:oy+BOARD_SIZE-CORNER, w:CORNER, h:CORNER};
  rects[20] = {x:ox, y:oy, w:CORNER, h:CORNER};
  rects[30] = {x:ox+BOARD_SIZE-CORNER, y:oy, w:CORNER, h:CORNER};

  for(let k=1;k<=9;k++){
    rects[k] = {
      x: ox+CORNER + (totalSide-steps.pos[k]),
      y: oy+BOARD_SIZE-CORNER,
      w: steps.sizes[k-1],
      h: CORNER
    };
    rects[10+k] = {
      x: ox,
      y: oy+CORNER + (totalSide-steps.pos[k]),
      w: CORNER,
      h: steps.sizes[k-1]
    };
    rects[20+k] = {
      x: ox+CORNER + steps.pos[k-1],
      y: oy,
      w: steps.sizes[k-1],
      h: CORNER
    };
    rects[30+k] = {
      x: ox+BOARD_SIZE-CORNER,
      y: oy+CORNER + steps.pos[k-1],
      w: CORNER,
      h: steps.sizes[k-1]
    };
  }

  cellRects = rects;
}

computeCellRects();

/* =======================
   HELPERS
======================= */

const isTop=i=>i>=21&&i<=29;
const isBottom=i=>i>=1&&i<=9;
const isLeft=i=>i>=11&&i<=19;
const isRight=i=>i>=31&&i<=39;
const isCorner=i=>[0,10,20,30].includes(i);

/* =======================
   DRAW PRICE STRIPE (ВЫСТУП!)
======================= */

function drawPriceStripe(i,r,bg,text){
  const thick=20;
  const protrude=12;

  ctx.save();
  ctx.fillStyle=bg;

  if(isTop(i)){
    ctx.fillRect(r.x, r.y-protrude, r.w, thick+protrude);
    ctx.fillStyle="#fff";
    ctx.font="900 12px system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(text, r.x+r.w/2, r.y-protrude/2+thick/2);
  }
  else if(isBottom(i)){
    ctx.fillRect(r.x, r.y+r.h-thick, r.w, thick+protrude);
    ctx.fillStyle="#fff";
    ctx.font="900 12px system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(text, r.x+r.w/2, r.y+r.h-thick/2+protrude/2);
  }
  else if(isLeft(i)){
    ctx.fillRect(r.x-protrude, r.y, thick+protrude, r.h);
    ctx.translate(r.x-protrude/2+thick/2, r.y+r.h/2);
    ctx.rotate(-Math.PI/2);
    ctx.fillStyle="#fff";
    ctx.font="900 12px system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(text,0,0);
  }
  else if(isRight(i)){
    ctx.fillRect(r.x+r.w-thick, r.y, thick+protrude, r.h);
    ctx.translate(r.x+r.w-thick/2+protrude/2, r.y+r.h/2);
    ctx.rotate(Math.PI/2);
    ctx.fillStyle="#fff";
    ctx.font="900 12px system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(text,0,0);
  }

  ctx.restore();
}

/* =======================
   DRAW
======================= */

function draw(){
  ctx.clearRect(0,0,CANVAS_SIZE,CANVAS_SIZE);

  // фон
  ctx.fillStyle="#0d0914";
  ctx.fillRect(0,0,CANVAS_SIZE,CANVAS_SIZE);

  // клетки
  for(let i=0;i<40;i++){
    const r = cellRects[i];
    ctx.fillStyle="#fff";
    ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle="#111";
    ctx.strokeRect(r.x+.5,r.y+.5,r.w-1,r.h-1);

    // пример цены (для теста)
    if(!isCorner(i)){
      drawPriceStripe(i,r,"#f59e0b","6,000k");
    }
  }
}

draw();
