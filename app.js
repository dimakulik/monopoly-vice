const board = document.getElementById("board");
const token = document.getElementById("token");
const panel = document.getElementById("panel");
const moneyEl = document.getElementById("money");
const rollBtn = document.getElementById("roll");

let money = 1500;
let position = 0;
let rolling = false;

/* 40 клеток */
const cells = [
  "START",
  "Vice St", "Chance", "Neon Ave", "Tax",
  "Jail",
  "Pink Blvd", "Chance", "Ocean Dr", "Tax",
  "Parking",
  "Vice Plaza", "Chance", "Neon Sq", "Cyber St",
  "Go Jail",
  "Miami Way", "Chance", "Sunset Blvd", "Tax",
  "Free",
  "Vice Tower", "Chance", "Neon Hills", "Tax",
  "Police",
  "Ocean Tower", "Chance", "Vice Resort", "Luxury",
  "Finish"
];

/* Рисуем поле по периметру */
function drawBoard() {
  board.innerHTML = "";

  // Углы
  addCell(0, "corner", 82, 82);
  addCell(10, "corner", 0, 82);
  addCell(20, "corner", 0, 0);
  addCell(30, "corner", 82, 0);

  // Нижняя сторона
  for (let i = 1; i < 10; i++) addCell(i, "edge bottom", 82 - i * 8, 82);

  // Левая
  for (let i = 11; i < 20; i++) addCell(i, "edge left", 0, 82 - (i - 10) * 8);

  // Верхняя
  for (let i = 21; i < 30; i++) addCell(i, "edge top", (i - 20) * 8, 0);

  // Правая
  for (let i = 31; i < 40; i++) addCell(i, "edge right", 82, (i - 30) * 8);
}

function addCell(i, cls, x, y) {
  const cell = document.createElement("div");
  cell.className = "cell " + cls;
  cell.innerText = cells[i] || "";
  cell.style.left = x + "%";
  cell.style.top = y + "%";
  board.appendChild(cell);
}

drawBoard();
updateToken();

/* Кубик */
rollBtn.onclick = () => {
  if (rolling) return;
  rolling = true;
  rollBtn.innerText = "⏳";

  setTimeout(() => {
    const roll = Math.floor(Math.random() * 6) + 1;
    move(roll);
    rollBtn.innerText = "🎲";
    rolling = false;
  }, 800);
};

function move(steps) {
  position = (position + steps) % 40;
  updateToken();
  panel.style.display = "block";
  panel.innerText = "Ход: " + steps;
}

function updateToken() {
  const cell = board.children[position];
  token.style.left = cell.style.left;
  token.style.top = cell.style.top;
}
