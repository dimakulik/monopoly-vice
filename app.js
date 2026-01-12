const cells = [
    { x: 20, y: 20 },
    { x: 130, y: 20 },
    { x: 240, y: 20 },
    { x: 350, y: 20 },
    { x: 350, y: 130 },
    { x: 350, y: 240 },
    { x: 240, y: 350 },
    { x: 130, y: 350 }
];

let position = 0;
const player = document.getElementById("player");
const log = document.getElementById("log");

function movePlayer() {
    player.style.left = cells[position].x + "px";
    player.style.top = cells[position].y + "px";
}

document.getElementById("roll").onclick = () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    position = (position + dice) % cells.length;
    movePlayer();
    log.innerText = `🎲 Выпало ${dice}`;
};

movePlayer();
