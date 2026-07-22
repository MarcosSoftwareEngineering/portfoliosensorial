
/* ====================================================================
   MÓDULO: TRANSIÇÃO SONORA ENTRE PÁGINAS ("Tu-dum")
   ----------------------------------------------------------------
   Responsabilidade única: interceptar cliques em links marcados com
   [data-transition-link], disparar o áudio de impacto e só então
   navegar para o destino. Compartilhado entre index.html e
   recrutadores.html — por isso vive em arquivo próprio, desacoplado
   do index.js (que possui lógica exclusiva da home).
   ==================================================================== */

(function(){
  'use strict';

  const transitionAudio = document.getElementById('transition-audio');

  // Usado apenas como PLANO B, caso o evento 'ended' não dispare
  // (autoplay bloqueado, arquivo corrompido, etc). Em condições normais,
  // a navegação espera o áudio terminar sozinho — igual ao efeito da Netflix.
  const FALLBACK_DELAY_MS = 4200;

  /**
   * Toca o áudio de transição do início ao fim e só então resolve a Promise.
   * Se o áudio não conseguir tocar (autoplay bloqueado) ou não tiver sido
   * encontrado, resolve pelo tempo de fallback para não travar a navegação.
   */
  function playTransitionSoundToCompletion(){
    return new Promise(function(resolve){
      if(!transitionAudio){
        setTimeout(resolve, FALLBACK_DELAY_MS);
        return;
      }

      let resolved = false;
      function finish(){
        if(resolved) return;
        resolved = true;
        transitionAudio.removeEventListener('ended', finish);
        resolve();
      }

      try{
        transitionAudio.currentTime = 0;
        transitionAudio.volume = 1.0; // 0.0 (mudo) a 1.0 (volume máximo)
        transitionAudio.addEventListener('ended', finish);

        const playPromise = transitionAudio.play();
        if(playPromise !== undefined){
          playPromise.catch(function(err){
            console.warn('[TRANSIÇÃO] Áudio bloqueado pela política de autoplay do navegador:', err);
            // Sem áudio tocando, não há 'ended' pra esperar — segue pelo fallback.
            setTimeout(finish, FALLBACK_DELAY_MS);
          });
        }
      }catch(err){
        console.warn('[TRANSIÇÃO] Falha inesperada ao reproduzir o áudio:', err);
        setTimeout(finish, FALLBACK_DELAY_MS);
      }

      // Rede de segurança: se por algum motivo 'ended' nunca disparar
      // (ex: duração indefinida em alguns navegadores), não deixa o usuário preso.
      setTimeout(finish, FALLBACK_DELAY_MS);
    });
  }

  /**
   * Intercepta a navegação nativa, espera o áudio de impacto tocar
   * por completo e só então redireciona para o destino.
   */
  function navigateWithTransition(event, destinationUrl){
    if(!destinationUrl) return;

    event.preventDefault();
    playTransitionSoundToCompletion().then(function(){
      window.location.href = destinationUrl;
    });
  }

  /**
   * Liga o evento de clique a todo elemento marcado com [data-transition-link],
   * usando o próprio href como destino (progressive enhancement: sem JS,
   * o link continua funcionando normalmente).
   */
  function bindTransitionLinks(){
    const triggers = document.querySelectorAll('[data-transition-link]');

    triggers.forEach(function(trigger){
      trigger.addEventListener('click', function(event){
        const destination = trigger.getAttribute('href');
        navigateWithTransition(event, destination);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', bindTransitionLinks);

})();
