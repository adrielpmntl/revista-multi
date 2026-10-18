document.addEventListener("keydown", (evento) => {
  const alvo = evento.target;
  if (alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable)) return;
  if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
  let link = null;
  if (evento.key === "ArrowRight") link = document.querySelector(".c-nav-proxima");
  if (evento.key === "ArrowLeft") link = document.querySelector(".c-nav-anterior");
  if (link) {
    evento.preventDefault();
    window.location.href = link.getAttribute("href");
  }
});
