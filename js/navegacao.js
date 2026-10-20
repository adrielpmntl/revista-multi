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
