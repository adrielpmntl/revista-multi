(() => {
  if (document.querySelector('main.capa') && !new URLSearchParams(location.search).has('avulsa')) {
    location.replace(`leitor.html${location.hash || '#p01'}`);
    return;
  }
  document.addEventListener('keydown', evento => {
    if (evento.defaultPrevented || evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    const seletor = evento.key === 'ArrowRight' ? '.c-nav-proxima' : evento.key === 'ArrowLeft' ? '.c-nav-anterior' : null;
    const link = seletor && document.querySelector(seletor);
    if (link) { evento.preventDefault(); location.href = link.href; }
  });
})();

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
