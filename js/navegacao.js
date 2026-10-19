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

(() => {
  if (document.querySelector(".c-nav-sumario")) return;
  const link = document.createElement("a");
  link.className = "c-nav-sumario";
  link.href = "pagina-02.html";
  link.setAttribute("aria-label", "Ir para o sumário");
  if (/pagina-02\.html$/i.test(window.location.pathname)) link.setAttribute("aria-current", "page");
  const icone = document.createElement("span");
  icone.className = "c-nav-sumario-icone";
  icone.setAttribute("aria-hidden", "true");
  const texto = document.createElement("span");
  texto.className = "c-nav-sumario-texto";
  texto.textContent = "SUMÁRIO";
  link.append(icone, texto);
  document.body.appendChild(link);
})();
