const cells = [
    { name: "START", x: 20, y: 20 },
    { name: "Vice St", price: 100, x: 130, y: 20, owner: null },
    { name: "Neon Ave", price: 120, x: 240, y: 20, owner: null },
    { name: "Club Blvd", price: 150, x: 350, y: 20, owner: null },
    { name: "Casino Rd", price: 180, x: 350, y: 130, owner: null },
    { name: "Beach Way", price: 200, x: 350, y: 240, owner: null },
    { name: "Hotel Dr", price: 220, x: 240, y: 350, owner: null },
    { name: "JAIL", x: 130, y: 350 }
];

let position = 0;
let stars = 500;

const player = document.getElementById("player");
const log = document.getElementById("log");
const starsEl = document.getElementById("stars");

function movePlayer() {
    player.style.left = cells[position].x + "px";
    player.style.top = cells[position].y + "px";
}

function updateHUD(text) {
    starsEl.innerText = stars;
    log.innerText = text;
}

document.getElementById("roll").onclick = () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    position = (position + dice) % cells.length;
    movePlayer();

    const cell = cells[position];

    if (cell.price && cell.owner === null) {
        if (stars >= cell.price) {
            if (confirm(`Купить ${cell.name} за ⭐ ${cell.price}?`)) {
                stars -= cell.price;
                cell.owner = "player";
                updateHUD(`Ты купил ${cell.name}`);
            } else {
                updateHUD(`Ты отказался от ${cell.name}`);
            }
        }
    } else {
        updateHUD(`Ты на клетке ${cell.name}`);
    }
};

movePlayer();
updateHUD("Игра началась");
