let position = 0;
const log = document.getElementById("log");

document.getElementById("roll").onclick = () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    position = (position + dice) % 4;
    log.innerText = `🎲 Выпало ${dice}. Ты на клетке ${position}`;
};
