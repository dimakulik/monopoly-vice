const cells = [
    { name: "START", x: 20, y: 20 },
    { name: "Vice St", price: 100, rent: 20, x: 130, y: 20, owner: null },
    { name: "Neon Ave", price: 120, rent: 25, x: 240, y: 20, owner: null },
    { name: "Club Blvd", price: 150, rent: 30, x: 350, y: 20, owner: null },
    { name: "Casino Rd", price: 180, rent: 35, x: 350, y: 130, owner: null },
    { name: "Beach Way", price: 200, rent: 40, x: 350, y: 240, owner: null },
    { name: "Hotel Dr", price: 220, rent: 45, x: 240, y: 350, owner: null },
    { name: "JAIL", x: 130, y: 350 }
];

let position = 0;
let money = 500;
const player = document.getElementById("player");
const log = document.getElementById("log");

function movePlayer() {
    player.style.left = cells[position].x + "px";
    player.style.top = cells[position].y + "px";
}

function updateLog(text) {
    log.innerText = `💰 Деньги: $${money}\n${text}`;
}

document.getElementById("roll").onclick = () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    position = (position + dice) % cells.length;
    movePlayer();

    const cell = cells[position];

    if (cell.price && cell.owner === null) {
        if (money >= cell.price) {
            if (confirm(`Купить ${cell.name} за $${cell.price}?`)) {
                money -= cell.price;
                cell.owner = "player";
                updateLog(`Ты купил ${cell.name}`);
            } else {
                updateLog(`Ты отказался от покупки ${cell.name}`);
            }
        }
    } else if (cell.owner === "player") {
        updateLog(`Ты на своей улице ${cell.name}`);
    } else {
        updateLog(`Ты на клетке ${cell.name}`);
    }
};

movePlayer();
updateLog("Игра началась");
