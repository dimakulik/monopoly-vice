const board = document.getElementById("board");
const token = document.getElementById("token");
const panel = document.getElementById("panel");
const moneyEl = document.getElementById("money");

let money = 1500;
let position = 0;

/* 40 клеток как в классической Monopoly */
const cells = [
  { name: "START", type: "start" },
  { name: "Vice Street", price: 60 },
  { name: "Chance", type: "chance" },
  { name: "Neon Ave", price: 60 },
  { name: "Tax", type: "tax", value: 200 },

  { name: "Jail", type: "jail" },
  { name: "Pink Blvd", price: 100 },
  { name: "Chance", type: "chance" },
  { name: "Ocean Drive", price: 120 },
  { name: "Luxury Tax", type: "tax", value: 100 },

  { name: "Parking", type: "parking" },
  { name: "Vice Plaza", price: 140 },
  { name: "Chance", type: "chance" },
  { name: "Neon Square", price: 160 },
  { name: "Cyber Street", price: 180 },

  { name: "Go To Jail", type: "gotojail" },
  { name: "Miami Way", price: 200 },
  { name: "Chance", type: "chance" },
  { name: "Sunset Blvd", price: 220 },
  { name: "Star Tax", type: "tax", value: 150 },

  { name: "Free", type: "free" },
  { name: "Vice Tower", price: 260 },
  { name: "Chance", type: "chance" },
  { name: "Neon Hills", price: 280 },
  { name: "Cyber Tax", type: "tax", value: 100 },

  { name: "Police", type: "jail" },
  { name: "Ocean Tower", price: 300 },
  { name: "Chance", type: "chance" },
  { name: "Vice Resort", price: 320 },
  { name: "Luxury Vice", price: 350 },

  { name: "Finish", type: "finish" }
];

/* Рисуем поле */
function drawBoard() {
  board.innerHTML = "";
  for (let i = 0; i < 40; i++) {
    const cell = document.createElement("div");
    cell.className = "cell " + (cells[i].price ? "property" : "special");
    cell.innerText = cells[i].name;
    board.appendChild(cell);
  }
}
drawBoard();

/* Кубики */
document.getElementById("roll").onclick = () => {
  const roll = Math.floor(Math.random() * 6) + 1;
  move(roll);
};

function move(steps) {
  position = (position + steps) % cells.length;
  updateToken();
  handleCell();
}

function updateToken() {
  const cell = board.children[position];
  const rect = cell.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();

  token.style.left = rect.left - boardRect.left + 10 + "px";
  token.style.top = rect.top - boardRect.top + 10 + "px";
}

function handleCell() {
  const cell = cells[position];
  panel.style.display = "block";

  if (cell.price) {
    panel.innerHTML = `
      <b>${cell.name}</b><br>
      Цена: ⭐ ${cell.price}<br>
      <button onclick="buy(${cell.price})">Купить</button>
    `;
  } else if (cell.type === "tax") {
    money -= cell.value;
    updateMoney();
    panel.innerHTML = `Налог: -⭐ ${cell.value}`;
  } else {
    panel.innerHTML = cell.name;
  }
}

function buy(price) {
  if (money >= price) {
    money -= price;
    updateMoney();
    panel.innerHTML = "Куплено ✔️";
  }
}

function updateMoney() {
  moneyEl.innerText = "⭐ " + money;
}
