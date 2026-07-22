
(function(){

  /* ---------------- ENGINE DE ÁUDIO SÊNIOR DESACOPLADA ---------------- */
  const themeAudio = document.getElementById('theme-audio');
  const introAudio = document.getElementById('transition-audio');
  let audioUnlocked = false;
  let audioTimeoutId = null;

  const btnStart = document.getElementById('btn-start');
  const splash = document.getElementById('splash');

  // Duração de segurança caso o 'ended' do áudio de abertura não dispare
  // (autoplay bloqueado, arquivo indisponível, etc). Evita travar o usuário na tela de start.
  const INTRO_AUDIO_FALLBACK_MS = 4200;

  /**
   * Toca o "Tu-dum" de abertura do zero ao fim e só resolve a Promise
   * quando o áudio termina — igual ao efeito da Netflix antes de revelar o conteúdo.
   */
  function playIntroSoundToCompletion(){
    return new Promise(function(resolve){
      if(!introAudio){
        setTimeout(resolve, INTRO_AUDIO_FALLBACK_MS);
        return;
      }

      let resolved = false;
      function finish(){
        if(resolved) return;
        resolved = true;
        introAudio.removeEventListener('ended', finish);
        resolve();
      }

      try{
        introAudio.currentTime = 0;
        introAudio.volume = 1.0;
        introAudio.addEventListener('ended', finish);

        const playPromise = introAudio.play();
        if(playPromise !== undefined){
          playPromise.catch(function(err){
            console.warn('[INTRO] Áudio bloqueado pela política de autoplay do navegador:', err);
            setTimeout(finish, INTRO_AUDIO_FALLBACK_MS);
          });
        }
      }catch(err){
        console.warn('[INTRO] Falha inesperada ao reproduzir o áudio:', err);
        setTimeout(finish, INTRO_AUDIO_FALLBACK_MS);
      }

      // Rede de segurança extra
      setTimeout(finish, INTRO_AUDIO_FALLBACK_MS);
    });
  }

  // O clique inicial destrava a engine, toca o "Tu-dum" por completo
  // e só então revela o portfólio de forma orgânica.
  btnStart.addEventListener('click', function() {

    audioUnlocked = true;
    btnStart.disabled = true; // evita cliques duplicados enquanto o áudio de abertura toca

    playIntroSoundToCompletion().then(function(){
      launchSplashEffects();

      document.getElementById('start-overlay').classList.add('fade-out');
      splash.classList.add('fade-out');

      setTimeout(function(){
        document.getElementById('start-overlay').remove();
        splash.remove();
        const splashCanvas = document.getElementById('splash-canvas');
        if(splashCanvas) splashCanvas.remove();

        // Inicia as cores (não toca o áudio de novo aqui pra não dar conflito)
        startMystic(false);

        // A trilha ambiente só entra 5s depois da página já estar aberta,
        // pra fechar com uma pausa de respiro antes do som contínuo.
        setTimeout(function(){
          playThemeSound();
        }, 5000);

      }, 850);
    });
  });

  // O motor do loop: espera a música acabar e reinicia em exatos 5000ms (5s), sem aleatoriedade.
  const THEME_LOOP_DELAY_MS = 5000;
  themeAudio.addEventListener('ended', function() {
    if (mysticActive && audioUnlocked) {
      audioTimeoutId = setTimeout(function() {
        if (mysticActive) {
          playThemeSound();
        }
      }, THEME_LOOP_DELAY_MS);
    }
  });

  let currentThemeVolume = 0.5;

  function playThemeSound(){
    if(!audioUnlocked) return; 
    themeAudio.currentTime = 0;
    themeAudio.volume = currentThemeVolume;
    const playPromise = themeAudio.play();
    if(playPromise !== undefined){
      playPromise.catch(function(err){
        console.warn('[ERRO DE ÁUDIO]', err);
      });
    }
    updateAudioPanelUI();
  }

  // Função independente para PARAR O ÁUDIO sem afetar o resto
  function stopAudio() {
    clearTimeout(audioTimeoutId);
    themeAudio.pause();
    themeAudio.currentTime = 0;
    updateAudioPanelUI();
  }

  /* ---------------- PAINEL FLUTUANTE DE ÁUDIO (Play/Pause + Volume) ---------------- */
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioVolumeSlider = document.getElementById('audio-volume-slider');
  const iconPlay = document.getElementById('icon-play');
  const iconPause = document.getElementById('icon-pause');

  function updateAudioPanelUI(){
    const isPlaying = !themeAudio.paused && audioUnlocked;
    if(audioToggleBtn){
      audioToggleBtn.setAttribute('aria-pressed', String(isPlaying));
    }
    if(iconPlay && iconPause){
      iconPlay.classList.toggle('hidden', isPlaying);
      iconPause.classList.toggle('hidden', !isPlaying);
    }
  }

  if(audioToggleBtn){
    audioToggleBtn.addEventListener('click', function(){
      if(themeAudio.paused){
        audioUnlocked = true;
        clearTimeout(audioTimeoutId);
        if(themeAudio.currentTime > 0 && themeAudio.currentTime < (themeAudio.duration || Infinity)){
          themeAudio.volume = currentThemeVolume;
          const p = themeAudio.play();
          if(p !== undefined){ p.catch(function(err){ console.warn('[ERRO DE ÁUDIO]', err); }); }
          updateAudioPanelUI();
        } else {
          playThemeSound();
        }
      } else {
        themeAudio.pause();
        clearTimeout(audioTimeoutId);
        updateAudioPanelUI();
      }
    });
  }

  if(audioVolumeSlider){
    audioVolumeSlider.addEventListener('input', function(){
      currentThemeVolume = Number(audioVolumeSlider.value) / 100;
      themeAudio.volume = currentThemeVolume;
    });
  }

  themeAudio.addEventListener('play', updateAudioPanelUI);
  themeAudio.addEventListener('pause', updateAudioPanelUI);

  /* ---------------- FEEDBACK SONORO DE CLIQUE (Botões e Links) ---------------- */
  const clickAudio = document.getElementById('click-audio');

  function playClickSound(){
    if(!clickAudio) return;
    // Clona o nó para permitir sobreposição rápida de cliques sucessivos.
    const clone = clickAudio.cloneNode(true);
    clone.volume = clickAudio.volume || 1.0;
    const p = clone.play();
    if(p !== undefined){
      p.catch(function(err){ console.warn('[ERRO DE ÁUDIO DE CLIQUE]', err); });
    }
    clone.addEventListener('ended', function(){ clone.remove(); });
  }

  document.addEventListener('click', function(e){
    const target = e.target.closest('button, a, .theme-dot, input[type="range"]');
    if(target){
      playClickSound();
    }
  }, true);

  /* ---------------- SPLASH SCREEN + CONFETTI ---------------- */
  function launchSplashEffects(){
    if (typeof confetti === 'undefined') return;
    try {
      const canvas = document.getElementById('splash-canvas');
      const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });

      myConfetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });

      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--sky').trim() || '#4F46E5';
      const accentColor2 = getComputedStyle(document.documentElement).getPropertyValue('--emerald').trim() || '#D97706';
      const fireworkColors = [accentColor, accentColor2, '#FFFFFF', accentColor];
      function firework(originX){
        myConfetti({
          particleCount: 70, angle: 90, spread: 70, startVelocity: 45,
          origin: { x: originX, y: 0.5 }, colors: fireworkColors
        });
      }
      setTimeout(function(){ firework(0.2); }, 300);
      setTimeout(function(){ firework(0.8); }, 700);
      setTimeout(function(){ firework(0.5); }, 1100);
    } catch (err) {
      console.warn('Confetti indisponível:', err);
    }
  }

  /* ---------------- THEMES (Fixo + Místico Contínuo) ---------------- */
  const themeOptions = [
    { id: "mystic",    type: "mystic", label: "Modo Místico" },
    { id: "papel",     type: "fixed",  label: "Papel Técnico",  swatch: "#F6F1E6" },
    { id: "blueprint", type: "fixed",  label: "Blueprint",      swatch: "#0F2942" },
    { id: "terminal",  type: "fixed",  label: "Terminal",       swatch: "#0B0F17" },
    { id: "graphite",  type: "fixed",  label: "Graphite",       swatch: "#1C1C1E" }
  ];

  const MYSTIC_VARS = ['--bg','--bg-soft','--surface','--surface-hi','--line','--text','--text-dim','--navy','--sky','--emerald'];

  const mysticStops = [
    { '--bg':'#FFFFFF', '--bg-soft':'#FAF7F1', '--surface':'#F6F1E6', '--surface-hi':'#EFE7D3', '--line':'#E4D9C4', '--text':'#20242C', '--text-dim':'#6B7280', '--navy':'#181D27', '--sky':'#4F46E5', '--emerald':'#D97706' },
    { '--bg':'#0F2942', '--bg-soft':'#0B2135', '--surface':'#153453', '--surface-hi':'#1B3F63', '--line':'#25507A', '--text':'#DCEAF7', '--text-dim':'#9FB8D1', '--navy':'#F3F8FF', '--sky':'#38BDF8', '--emerald':'#FBBF24' },
    { '--bg':'#1A0B2E', '--bg-soft':'#150824', '--surface':'#241238', '--surface-hi':'#2E1745', '--line':'#3D2159', '--text':'#F3E8FF', '--text-dim':'#B49BD1', '--navy':'#FDF4FF', '--sky':'#C084FC', '--emerald':'#F472B6' },
    { '--bg':'#0B0F17', '--bg-soft':'#10141D', '--surface':'#141924', '--surface-hi':'#1B212F', '--line':'#252C3B', '--text':'#E5E9F0', '--text-dim':'#8B94A7', '--navy':'#F5F7FA', '--sky':'#10B981', '--emerald':'#22D3EE' },
    { '--bg':'#0C1F1D', '--bg-soft':'#081613', '--surface':'#123330', '--surface-hi':'#173F3B', '--line':'#1F4F49', '--text':'#E8FFF8', '--text-dim':'#8FC9BE', '--navy':'#FFFDF5', '--sky':'#FBBF24', '--emerald':'#2DD4BF' },
    { '--bg':'#1C1C1E', '--bg-soft':'#161618', '--surface':'#242426', '--surface-hi':'#2B2B2E', '--line':'#3A3A3D', '--text':'#F2F2F2', '--text-dim':'#A8A8AC', '--navy':'#FFFFFF', '--sky':'#A3E635', '--emerald':'#8B5CF6' }
  ];

  const SEGMENT_MS = 9000; 
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let mysticActive = false;
  let mysticRafId = null;
  let mysticStartTime = 0;

  function hexToRgb(hex){
    const h = hex.replace('#','');
    return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) };
  }
  function rgbToHex(r,g,b){
    const c = (n) => Math.round(Math.max(0,Math.min(255,n))).toString(16).padStart(2,'0');
    return '#' + c(r) + c(g) + c(b);
  }
  function lerpColor(hexA, hexB, t){
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    return rgbToHex(a.r + (b.r-a.r)*t, a.g + (b.g-a.g)*t, a.b + (b.b-a.b)*t);
  }
  function easeInOut(t){
    return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
  }

  function clearMysticVars(){
    MYSTIC_VARS.forEach(function(v){ document.documentElement.style.removeProperty(v); });
    document.documentElement.style.removeProperty('--mystic-pulse');
  }

  function mod(a, b){ return ((a % b) + b) % b; }

  function mysticTick(now){
    if(!mysticActive) return;
    const elapsed = Math.max(0, now - mysticStartTime);
    const n = mysticStops.length;
    
    const idx = mod(Math.floor(elapsed / SEGMENT_MS), n);
    const nextIdx = mod(idx + 1, n);
    const localT = mod(elapsed, SEGMENT_MS) / SEGMENT_MS;
    const t = easeInOut(localT);

    const stopA = mysticStops[idx];
    const stopB = mysticStops[nextIdx];
    if(stopA && stopB){
      MYSTIC_VARS.forEach(function(v){
        document.documentElement.style.setProperty(v, lerpColor(stopA[v], stopB[v], t));
      });
    }

    if(!prefersReducedMotion){
      const pulse = (Math.sin(elapsed / 1400) + 1) / 2;
      document.documentElement.style.setProperty('--mystic-pulse', pulse.toFixed(3));
    }

    mysticRafId = requestAnimationFrame(mysticTick);
  }

  // ATENÇÃO AQUI: Agora ele SÓ DESLIGA AS CORES! 
  // Ele não mata mais a sua música no meio da inicialização.
  function stopMystic(){
    mysticActive = false;
    if(mysticRafId) cancelAnimationFrame(mysticRafId);
    document.documentElement.classList.remove('mystic-mode');
    clearMysticVars();
    const dot = document.querySelector('.theme-dot-mystic');
    if(dot) dot.classList.remove('active');
  }

  function startMystic(shouldPlayAudio = true){
    stopMystic();
    mysticActive = true;
    mysticStartTime = performance.now();
    document.documentElement.classList.add('mystic-mode');
    document.querySelectorAll('.theme-dot').forEach(function(d){ d.classList.remove('active'); });
    const dot = document.querySelector('.theme-dot-mystic');
    if(dot) dot.classList.add('active');
    mysticRafId = requestAnimationFrame(mysticTick);
    
    if(shouldPlayAudio && audioUnlocked) {
      stopAudio(); // Se for pra iniciar o áudio, ele zera o anterior e toca.
      playThemeSound();
    }
  }

  function applyTheme(id){
    stopMystic();
    stopAudio(); // Se o usuário for pra um tema fixo, a música PARA definitivamente.
    
    if(id === "papel"){
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", id);
    }
    document.querySelectorAll(".theme-dot").forEach(function(dot){
      dot.classList.toggle("active", dot.dataset.themeId === id);
    });
  }

  function renderThemeSwitcher(){
    const container = document.getElementById("theme-dots");
    
    // Injetando as Labels Premium
    let html = '<span class="theme-label" style="margin-right: -4px;">Dinâmico:</span>';
    
    const mystic = themeOptions.find(function(t) { return t.type === "mystic"; });
    if(mystic){
      html += '<button type="button" class="theme-dot theme-dot-mystic" data-theme-id="mystic" title="Modo Místico (cores fluindo sozinhas)" aria-label="Ativar modo místico"></button>';
    }

    html += '<span class="theme-label" style="margin-left: 4px; margin-right: -4px;">Estáticos:</span>';
    
    themeOptions.filter(function(t) { return t.type === "fixed"; }).forEach(function(t){
      html += '<button type="button" class="theme-dot" style="background:' + t.swatch + '" data-theme-id="' + t.id + '" title="' + t.label + '" aria-label="Tema ' + t.label + '"></button>';
    });

    container.innerHTML = html;

    container.querySelectorAll(".theme-dot:not(.theme-dot-mystic)").forEach(function(dot){
      dot.addEventListener("click", function(){ applyTheme(dot.dataset.themeId); });
    });
    const mysticBtn = container.querySelector(".theme-dot-mystic");
    if(mysticBtn){
      mysticBtn.addEventListener("click", function(){
        if(mysticActive){ applyTheme('papel'); }
        else { startMystic(true); } 
      });
    }
  }

  /* ---------------- MENU HAMBÚRGUER MOBILE ---------------- */
  function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const links = document.querySelectorAll('.mobile-nav-link');

    if(btn && menu) {
      btn.addEventListener('click', function() {
        menu.classList.toggle('hidden');
      });

      // Fecha o menu suavemente após clicar num link
      links.forEach(function(link) {
        link.addEventListener('click', function() {
          menu.classList.add('hidden');
        });
      });
    }
  }

  /* ---------------- OCULTAÇÃO INTELIGENTE (IDLE TIMEOUT) ---------------- */
  let idleTimer;
  let isHoveringUI = false;
  const uiPanels = [document.getElementById('audio-panel'), document.getElementById('theme-switcher')];

  function resetIdleTimer() {
    // 1. Mostra os painéis instantaneamente
    uiPanels.forEach(function(panel) {
      if(panel) panel.classList.remove('idle-hidden');
    });
    
    clearTimeout(idleTimer);

    // 2. Só inicia a contagem para sumir se o mouse não estiver em cima deles
    if (!isHoveringUI) {
      idleTimer = setTimeout(function() {
        uiPanels.forEach(function(panel) {
          if(panel) panel.classList.add('idle-hidden');
        });
      }, 10000); // 10 segundos exatos
    }
  }

  // Detecta interação em todo o site para resetar o timer
  ['mousemove', 'scroll', 'click', 'touchstart', 'keydown'].forEach(function(evt) {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  // Segura os painéis na tela se o usuário for clicar neles
  uiPanels.forEach(function(panel) {
    if(panel) {
      panel.addEventListener('mouseenter', function() { isHoveringUI = true; resetIdleTimer(); });
      panel.addEventListener('mouseleave', function() { isHoveringUI = false; resetIdleTimer(); });
    }
  });

  /* ---------------- DATA ---------------- */
  const stack = [
    "React.js","JavaScript","TypeScript","Node.js","Express",
    "Python","FastAPI","Kotlin","Java","Flutter","PostgreSQL","SQLite"
  ];

  const projects = [
    {
      title: "GlassFlow Pro",
      image: "./src/img/img.06.jpeg",
      link: "#",
      description: "Sistema de ERP e CRM para o setor vidreiro em produção. Conta com geração de orçamentos personalizados, gestão de tipologias e logos personalizadas inclusas.",
      tags: ["SaaS", "Flutter", "Node.js", "PostgreSQL"]
    },
    {
      title: "Relatório de Diagnóstico de Infraestrutura",
      image: "./src/img/Img.02.jpeg",
      link: "https://marcossoftwareengineering.github.io/Diagn-stico/",
      description: "Documentação técnica apontando gargalos em firewalls (Cloudflare) com recurso de exportação para PDF.",
      tags: ["CMS", "WebFTP", "Edge Cache"]
    },
    {
      title: "Assistente Virtual Odontológico",
      image: "./src/img/img.05.jpeg",
      link: "https://marcossoftwareengineering.github.io/BotOdont/",
      description: "Chatbot focado no nicho odontológico para automatizar atendimento primário e qualificação de leads.",
      tags: ["IA", "Automação de Atendimento"]
    },
    {
      title: "Relatório Estratégico: Integração Claude & Excel",
      image: "./src/img/Img.01.jpeg",
      link: "https://marcossoftwareengineering.github.io/Valtercio/",
      description: "Relatório web interativo que substitui PDFs estáticos para demonstrar o ROI da adoção do Claude for Excel.",
      tags: ["HTML5", "Tailwind CSS", "Canvas Confetti", "Open Graph"]
    },
    {
      title: "ChatBot Oftalmológico (Demo)",
      image: "./src/img/img.04.jpeg",
      link: "#",
      description: "Demo interativa que guia o cliente ao agendamento automático, gerando leads e orçamentos.",
      tags: ["ChatBot", "Automação", "UI/UX"]
    }
  ];

  function renderStack(){
    const container = document.getElementById('stack-container');
    container.innerHTML = stack.map(function(tech){
      return '<span class="badge font-mono text-xs px-4 py-2 rounded-full">' + tech + '</span>';
    }).join('');
  }

  function renderProjects(){
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = projects.map(function(p, i){
      const tagsHtml = p.tags.map(function(t){ return '<span class="tag px-2.5 py-1 rounded-md">' + t + '</span>'; }).join('');
      const isLive = p.link && p.link !== '#';
      const linkAttrs = isLive ? 'href="' + p.link + '" target="_blank" rel="noopener"' : 'href="javascript:void(0)" aria-disabled="true"';
      const ctaLabel = isLive ? 'Ver projeto ↗' : 'Em breve';
      return (
        '<article class="card reveal rounded-2xl overflow-hidden flex flex-col" style="transition-delay:' + (i * 0.06) + 's">' +
          '<div class="card-img-wrap h-48">' +
            '<img src="' + p.image + '" alt="' + p.title + '" class="w-full h-full object-cover" loading="lazy" onerror="this.style.opacity=0.15">' +
          '</div>' +
          '<div class="p-6 flex flex-col flex-1">' +
            '<h3 class="font-display font-semibold text-lg mb-2 leading-snug text-[color:var(--navy)]">' + p.title + '</h3>' +
            '<p class="text-sm text-[color:var(--text-dim)] leading-relaxed mb-4 flex-1">' + p.description + '</p>' +
            '<div class="flex flex-wrap gap-2 mb-5">' + tagsHtml + '</div>' +
            '<a ' + linkAttrs + ' class="inline-flex items-center gap-1 text-sm font-medium ' + (isLive ? 'text-[color:var(--sky)]' : 'text-[color:var(--text-dim)] cursor-default') + '">' + ctaLabel + '</a>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function initSmoothScroll(){
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(e){
        const id = a.getAttribute('href');
        if(id.length > 1){
          const target = document.querySelector(id);
          if(target){
            e.preventDefault();
            target.scrollIntoView({behavior:'smooth', block:'start'});
          }
        }
      });
    });
  }

  function initReveal(){
    const items = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function(item){ observer.observe(item); });
  }

  function initTyping(){
    const el = document.getElementById('typed-line');
    const text = "Marcos Vinicius — Full-Stack Engineer, Clean Architecture & SOLID.";
    let i = 0;
    function tick(){
      if(i <= text.length){
        el.innerHTML = text.slice(0, i) + '<span class="cursor"></span>';
        i++;
        setTimeout(tick, 28);
      }
    }
    tick();
  }

  window.handleContactSubmit = function(e){
    e.preventDefault();
    const feedback = document.getElementById('form-feedback');
    feedback.classList.remove('hidden');
    e.target.reset();
    return false;
  };

  function renderFooter(){
    document.getElementById('footer-copy').textContent =
      '© ' + new Date().getFullYear() + ' Marcos Software Engineer. Todos os direitos reservados.';
  }

  /* ---------------- BOOT ---------------- */
  renderThemeSwitcher();
  renderStack();
  renderProjects();
  renderFooter();
  initSmoothScroll();
  initReveal();
  initTyping();
  initMobileMenu();
  
  if(clickAudio){ clickAudio.volume = 1.0; }
  updateAudioPanelUI();
  resetIdleTimer(); // Aciona o gatilho inicial de 10s

})();
