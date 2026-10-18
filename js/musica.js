const players = document.querySelectorAll(".c-player");
const faixas = document.querySelectorAll(".c-player audio");

function formatar(segundos) {
  const total = Math.max(0, Math.floor(segundos || 0));
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
}

players.forEach((player) => {
  const botao = player.querySelector(".botao-play");
  const faixa = player.querySelector("audio");
  const barra = player.querySelector(".player-tempo");
  const atual = player.querySelector(".player-atual");
  const total = player.querySelector(".player-total");
  const nome = botao.getAttribute("aria-label").replace(/^Tocar /, "");
  let arrastando = false;

  function marcar(tocando) {
    botao.classList.toggle("tocando", tocando);
    botao.setAttribute("aria-pressed", tocando ? "true" : "false");
    botao.setAttribute("aria-label", (tocando ? "Pausar " : "Tocar ") + nome);
  }

  function pintar() {
    const max = Number(barra.max) || 1;
    barra.style.setProperty("--p", (Number(barra.value) / max) * 100 + "%");
    atual.textContent = formatar(barra.value);
  }

  botao.addEventListener("click", () => {
    if (faixa.paused) {
      faixas.forEach((outra) => {
        if (outra !== faixa) outra.pause();
      });
      faixa.play();
    } else {
      faixa.pause();
    }
  });

  barra.addEventListener("input", () => {
    arrastando = true;
    pintar();
  });

  barra.addEventListener("change", () => {
    faixa.currentTime = Number(barra.value);
    arrastando = false;
  });

  faixa.addEventListener("loadedmetadata", () => {
    barra.max = Math.floor(faixa.duration);
    total.textContent = formatar(faixa.duration);
    pintar();
  });

  faixa.addEventListener("timeupdate", () => {
    if (arrastando) return;
    barra.value = Math.floor(faixa.currentTime);
    pintar();
  });

  faixa.addEventListener("play", () => marcar(true));
  faixa.addEventListener("pause", () => marcar(false));
  faixa.addEventListener("ended", () => {
    faixa.currentTime = 0;
    barra.value = 0;
    pintar();
    marcar(false);
  });
});
