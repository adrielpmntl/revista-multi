(() => {
  const livro = document.querySelector('#livro');
  const paginas = Array.from(livro.querySelectorAll('.page'));
  const arquivos = paginas.map(pagina => pagina.dataset.arquivo);
  const anterior = document.querySelector('#anterior');
  const proxima = document.querySelector('#proxima');
  const estado = document.querySelector('#estado');
  const erro = document.querySelector('#erro');
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
  const recursos = new Map();
  const folhas = [];
  let flip;
  let atual = lerHash();
  let ocupado = true;
  let gesto = null;
  let semHistorico = false;
  let historicoPendente = null;
  let fade = null;
  let medindo = false;
  let ultimoQuadro = 0;
  let intervalos = [];
  const hash = i => `#p${String(i + 1).padStart(2, '0')}`;
  function lerHash() {
    const valor = Number((location.hash.match(/^#p(\d{2})$/) || [0, 1])[1]);
    return Math.max(0, Math.min(19, valor - 1));
  }
  function texto(url) {
    const absoluto = new URL(url, location.href).href;
    if (!recursos.has(absoluto)) recursos.set(absoluto, fetch(absoluto).then(resposta => {
      if (!resposta.ok) throw new Error(`Não foi possível carregar ${url}.`);
      return resposta.text();
    }));
    return recursos.get(absoluto);
  }
  function script(url, limite = 5000) {
    return new Promise((resolve, reject) => {
      const elemento = document.createElement('script');
      const tempo = setTimeout(() => { elemento.remove(); reject(new Error('Tempo de carregamento excedido.')); }, limite);
      elemento.src = url;
      elemento.onload = () => { clearTimeout(tempo); resolve(); };
      elemento.onerror = () => { clearTimeout(tempo); elemento.remove(); reject(new Error('Biblioteca indisponível.')); };
      document.head.append(elemento);
    });
  }
  async function biblioteca() {
    try { await script('https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js'); }
    catch (_) { await script('js/vendor/page-flip-2.0.7.js'); }
    if (!window.St?.PageFlip) throw new Error('A biblioteca de paginação não carregou.');
  }
  function isolar(css, url) {
    return css.replace(/:root\b/g, ':host').replace(/\bhtml\b/g, '.pagina-contexto').replace(/\bbody\b/g, '.pagina-corpo').replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (_, aspas, caminho) => `url("${new URL(caminho, new URL(url, location.href)).href}")`);
  }
  function iniciarAudio(root) {
    const audios = Array.from(root.querySelectorAll('audio'));
    const formatar = segundos => {
      const total = Math.max(0, Math.floor(segundos || 0));
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    };
    root.querySelectorAll('.c-player').forEach(player => {
      const botao = player.querySelector('.botao-play');
      const audio = player.querySelector('audio');
      const barra = player.querySelector('.player-tempo');
      const atual = player.querySelector('.player-atual');
      const total = player.querySelector('.player-total');
      const nome = botao.getAttribute('aria-label').replace(/^Tocar /, '');
      let arrastando = false;
      const pintar = () => {
        barra.style.setProperty('--p', `${Number(barra.value) / (Number(barra.max) || 1) * 100}%`);
        atual.textContent = formatar(barra.value);
      };
      const marcar = tocando => {
        botao.classList.toggle('tocando', tocando);
        botao.setAttribute('aria-pressed', String(tocando));
        botao.setAttribute('aria-label', `${tocando ? 'Pausar ' : 'Tocar '}${nome}`);
      };
      botao.addEventListener('click', async () => {
        if (audio.paused) {
          audios.forEach(outro => { if (outro !== audio) outro.pause(); });
          try { await audio.play(); } catch (_) { marcar(false); }
        } else audio.pause();
      });
      barra.addEventListener('input', () => { arrastando = true; pintar(); });
      barra.addEventListener('change', () => { audio.currentTime = Number(barra.value); arrastando = false; });
      audio.addEventListener('loadedmetadata', () => {
        barra.max = Math.floor(audio.duration);
        total.textContent = formatar(audio.duration);
        pintar();
      });
      audio.addEventListener('timeupdate', () => { if (!arrastando) { barra.value = Math.floor(audio.currentTime); pintar(); } });
      audio.addEventListener('play', () => marcar(true));
      audio.addEventListener('pause', () => marcar(false));
      audio.addEventListener('ended', () => { audio.currentTime = 0; barra.value = 0; pintar(); marcar(false); });
    });
  }
  async function carregarPagina(pagina, indice) {
    const documento = new DOMParser().parseFromString(await texto(arquivos[indice]), 'text/html');
    const original = documento.querySelector('.moldura') || documento.querySelector('main');
    if (!original) throw new Error(`Conteúdo da página ${indice + 1} ausente.`);
    const root = pagina.attachShadow({ mode: 'open' });
    const estilos = Array.from(documento.querySelectorAll('link[rel="stylesheet"]')).map(link => link.getAttribute('href'));
    for (const url of estilos) {
      const style = document.createElement('style');
      style.textContent = isolar(await texto(url), url);
      root.append(style);
    }
    const ajuste = document.createElement('style');
    ajuste.textContent = await texto('css/leitor-shadow.css');
    const contexto = document.createElement('div');
    contexto.className = 'pagina-contexto';
    const corpo = document.createElement('div');
    corpo.className = 'pagina-corpo';
    corpo.append(document.importNode(original, true));
    contexto.append(corpo);
    root.append(ajuste, contexto);
    contexto.style.setProperty('--u', `${livro.clientWidth / 1440}px`);
    root.querySelectorAll('audio,video').forEach(audio => { audio.preload = 'metadata'; });
    iniciarAudio(root);
    root.addEventListener('click', evento => {
      if (evento.defaultPrevented || evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
      const link = evento.target.closest('a[href]');
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const url = new URL(link.getAttribute('href'), location.href);
      const destino = arquivos.indexOf(url.pathname.split('/').pop());
      if (destino < 0 || url.origin !== location.origin || url.hash) return;
      evento.preventDefault();
      ir(destino, 'direto');
    });
    pagina.setAttribute('role', 'group');
    pagina.setAttribute('aria-label', `Página ${indice + 1} de 20`);
    pagina.tabIndex = -1;
    folhas[indice] = { root, contexto };
    new ResizeObserver(entradas => {
      const largura = entradas[0].contentRect.width;
      if (largura > 0) contexto.style.setProperty('--u', `${largura / 1440}px`);
    }).observe(pagina);
  }
  function pausar() {
    folhas[atual]?.root.querySelectorAll('audio,video').forEach(audio => audio.pause());
  }
  function atualizar(indice, registrar = true) {
    if (indice !== atual) pausar();
    atual = indice;
    paginas.forEach((pagina, n) => {
      pagina.inert = n !== atual;
      pagina.setAttribute('aria-hidden', String(n !== atual));
    });
    anterior.setAttribute('aria-disabled', String(atual === 0));
    proxima.setAttribute('aria-disabled', String(atual === 19));
    anterior.href = hash(Math.max(0, atual - 1));
    proxima.href = hash(Math.min(19, atual + 1));
    estado.textContent = `Página ${atual + 1} de 20`;
    document.title = `Sob Efeito — Página ${atual + 1} de 20`;
    if (registrar && !semHistorico && historicoPendente === null && location.hash !== hash(atual)) history.pushState(null, '', hash(atual));
  }
  async function ir(destino, modo = 'direto', historico = true) {
    if (ocupado || !flip || destino < 0 || destino > 19 || destino === atual) return;
    ocupado = true;
    semHistorico = !historico;
    if (reduzido.matches) {
      pausar();
      fade = livro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100, fill: 'forwards' });
      await fade.finished;
      flip.turnToPage(destino);
      fade.cancel();
      fade = livro.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100, fill: 'forwards' });
      await fade.finished;
      fade.cancel();
      fade = null;
      liberar();
    } else {
      if (modo === 'proxima') flip.flipNext('bottom');
      else if (modo === 'anterior') flip.flipPrev('bottom');
      else flip.flip(destino, 'bottom');
    }
  }
  function liberar() {
    if (fade) return;
    ocupado = false;
    semHistorico = false;
    livro.removeAttribute('aria-busy');
    if (historicoPendente !== null) {
      const destino = historicoPendente;
      historicoPendente = null;
      ir(destino, 'direto', false);
    }
  }
  function medir(tempo) {
    if (!medindo) return;
    if (ultimoQuadro) intervalos.push(tempo - ultimoQuadro);
    ultimoQuadro = tempo;
    requestAnimationFrame(medir);
  }
  function encerrarMedicao() {
    medindo = false;
    if (intervalos.length < 2) return;
    const media = intervalos.reduce((soma, valor) => soma + valor, 0) / intervalos.length;
    livro.dataset.fps = (1000 / media).toFixed(1);
    livro.dataset.quadros = intervalos.length;
    livro.dataset.maiorIntervalo = Math.max(...intervalos).toFixed(1);
  }
  function interativo(evento) {
    return evento.composedPath().some(alvo => alvo instanceof Element && alvo.matches('a,button,input,textarea,select,audio,video,[contenteditable="true"]'));
  }
  function posicao(evento) {
    const caixa = flip.getUI().getDistElement().getBoundingClientRect();
    return { x: evento.clientX - caixa.left, y: evento.clientY - caixa.top };
  }
  function iniciarGesto(evento) {
    if (ocupado || evento.button !== 0 || interativo(evento)) return;
    const p = posicao(evento);
    const rect = flip.getBoundsRect();
    const margem = Math.max(44, rect.pageWidth * .16);
    const canto = (p.x < margem || p.x > rect.pageWidth - margem) && (p.y < margem || p.y > rect.height - margem);
    gesto = { id: evento.pointerId, inicio: p, ultimo: p, canto, ativo: false, largura: rect.pageWidth, altura: rect.height };
    livro.setPointerCapture(evento.pointerId);
    if (canto) dobrar(evento);
  }
  function dobrar(evento) {
    if (!gesto || evento.pointerId !== gesto.id) return;
    const p = posicao(evento);
    gesto.ultimo = p;
    const dx = p.x - gesto.inicio.x;
    if (!gesto.ativo) {
      if (!gesto.canto && Math.abs(dx) < 30) return;
      const voltar = gesto.canto ? gesto.inicio.x < gesto.largura / 2 : dx > 0;
      if ((voltar && atual === 0) || (!voltar && atual === 19)) return;
      gesto.voltar = voltar;
      gesto.ativo = true;
      gesto.base = gesto.canto ? gesto.inicio : { x: voltar ? 1 : gesto.largura - 1, y: gesto.inicio.y < gesto.altura / 2 ? 1 : gesto.altura - 1 };
      if (reduzido.matches) return;
      flip.startUserTouch(gesto.base);
      flip.userMove({ x: gesto.base.x + (voltar ? 7 : -7), y: gesto.base.y }, true);
    }
    if (!reduzido.matches) flip.userMove(p, true);
    if (evento.cancelable) evento.preventDefault();
  }
  function terminarGesto(evento) {
    if (!gesto || evento.pointerId !== gesto.id) return;
    const fim = gesto;
    gesto = null;
    if (!fim.ativo) return;
    const distancia = (fim.ultimo.x - fim.inicio.x) * (fim.voltar ? 1 : -1);
    const completar = evento.type === 'pointerup' && distancia > fim.largura / 2;
    if (reduzido.matches) {
      if (completar) ir(atual + (fim.voltar ? -1 : 1), fim.voltar ? 'anterior' : 'proxima');
      return;
    }
    flip.userStop(fim.ultimo, true);
    const controle = flip.getFlipController();
    const calculo = controle.getCalculation();
    if (!calculo) { liberar(); return; }
    const destino = { x: completar ? -fim.largura : fim.largura, y: calculo.getCorner() === 'bottom' ? fim.altura : 0 };
    controle.animateFlippingTo(calculo.getPosition(), destino, completar);
  }
  function integrar() {
    anterior.addEventListener('click', evento => { evento.preventDefault(); ir(atual - 1, 'anterior'); });
    proxima.addEventListener('click', evento => { evento.preventDefault(); ir(atual + 1, 'proxima'); });
    document.addEventListener('keydown', evento => {
      if (evento.defaultPrevented || evento.ctrlKey || evento.altKey || evento.metaKey || evento.shiftKey) return;
      if (evento.composedPath().some(alvo => alvo instanceof Element && alvo.matches('input,textarea,select,[contenteditable="true"]'))) return;
      if (evento.key === 'ArrowRight' || evento.key === 'ArrowLeft') {
        evento.preventDefault();
        const proximo = evento.key === 'ArrowRight';
        ir(atual + (proximo ? 1 : -1), proximo ? 'proxima' : 'anterior');
      }
    });
    livro.addEventListener('pointerdown', iniciarGesto);
    livro.addEventListener('pointermove', dobrar);
    livro.addEventListener('pointerup', terminarGesto);
    livro.addEventListener('pointercancel', terminarGesto);
    livro.addEventListener('lostpointercapture', terminarGesto);
    window.addEventListener('hashchange', () => {
      const destino = lerHash();
      if (ocupado) historicoPendente = destino;
      else ir(destino, 'direto', false);
    });
    reduzido.addEventListener('change', () => {
      flip.getSettings().flippingTime = reduzido.matches ? 1 : 900;
      livro.classList.toggle('movimento-reduzido', reduzido.matches);
    });
    window.addEventListener('pagehide', pausar);
  }
  async function iniciar() {
    if (location.protocol === 'file:') throw new Error('Para abrir a revista, execute INICIAR-REVISTA.cmd na mesma pasta e mantenha a janela aberta durante a leitura.');
    await Promise.all([biblioteca(), Promise.all(paginas.map(carregarPagina))]);
    await document.fonts.ready;
    flip = new St.PageFlip(livro, {
      width: 1440, height: 1024, size: 'stretch', minWidth: 1440, maxWidth: 1440,
      minHeight: 1, maxHeight: 1024, usePortrait: true, showCover: true,
      drawShadow: true, maxShadowOpacity: .5, flippingTime: reduzido.matches ? 1 : 900,
      mobileScrollSupport: false, clickEventForward: true, swipeDistance: 30,
      autoSize: false, useMouseEvents: false, showPageCorners: false, startPage: atual
    });
    flip.on('flip', evento => atualizar(evento.data));
    flip.on('changeState', evento => {
      if (evento.data === 'read') { encerrarMedicao(); liberar(); }
      else {
        ocupado = true;
        livro.setAttribute('aria-busy', 'true');
        if (!medindo) {
          intervalos = [];
          ultimoQuadro = 0;
          medindo = true;
          requestAnimationFrame(medir);
        }
      }
    });
    flip.loadFromHTML(paginas);
    paginas.forEach((_, indice) => {
      const pagina = flip.getPage(indice);
      pagina.setDensity('soft');
      const copiar = pagina.newTemporaryCopy.bind(pagina);
      pagina.newTemporaryCopy = () => {
        const copia = copiar();
        const elemento = copia.getElement();
        elemento.classList.add('verso-papel');
        elemento.inert = true;
        elemento.setAttribute('aria-hidden', 'true');
        return copia;
      };
    });
    livro.classList.add('pronto');
    livro.classList.toggle('movimento-reduzido', reduzido.matches);
    atualizar(atual, false);
    history.replaceState(null, '', hash(atual));
    integrar();
    liberar();
  }
  iniciar().catch(falha => {
    erro.textContent = falha.message;
    erro.hidden = false;
    estado.textContent = 'Não foi possível abrir o leitor.';
    livro.removeAttribute('aria-busy');
  });
})();
