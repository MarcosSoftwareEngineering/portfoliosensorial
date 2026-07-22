# 🎨 Portfólio Sensorial | M.S.E.

Um portfólio web interativo e imersivo, desenvolvido para ir além do visual e entregar uma verdadeira **experiência sensorial** aos usuários e recrutadores. Focado em performance, microinterações e arquitetura limpa.

## 🚀 Visão Geral do Projeto

Este projeto foi desenhado com a mentalidade de Engenharia de Software focada em escalabilidade e manutenibilidade. Ao invés de um currículo estático, a interface atua como uma aplicação interativa que demonstra na prática o domínio sobre manipulação de DOM, Clean Architecture e UX/UI.

### ✨ Funcionalidades e Destaques

* **UX Sensorial e Áudio Imersivo:** Implementação de motor de áudio nativo com fallback em nuvem. Conta com o som nostálgico de inicialização (PS1) ao entrar e microinterações cinematográficas (Netflix Tu-dum) nas transições de página.
* **Área Exclusiva para Recrutadores:** Uma rota dedicada (`recrutadores.html`) desenvolvida estrategicamente para Tech Recruiters e Headhunters, contendo informações filtradas e de alto impacto.
* **Catálogo de Serviços:** Seção modular apresentando atuações em nível Sênior, incluindo Consultoria de Debug, Otimização SEO, Automação com IA (Chatbots), e desenvolvimento de SaaS/PWA.
* **Transições Suaves (Page Transitions):** Script customizado (`page-transition.js`) que intercepta o roteamento padrão do navegador para executar microinterações sonoras de forma assíncrona antes do redirecionamento.
* **SEO e Open Graph:** Tags semânticas configuradas para *rich previews* perfeitos ao compartilhar o link em plataformas como WhatsApp e LinkedIn.

## 🛠️ Tecnologias e Arquitetura

O projeto aplica estritamente o princípio de **Separation of Concerns (SoC)**, isolando marcação, estilo e comportamento.

* **Frontend:** HTML5 Semântico, Vanilla JavaScript, Tailwind CSS (via CDN para prototipagem ágil).
* **Bibliotecas:** `canvas-confetti` para feedback visual imersivo.
* **Arquitetura:** Clean Architecture com modularização de scripts.

## 📂 Estrutura de Arquivos

```text
📦 portfoliosensorial
 ┣ 📂 .vscode             # Configurações de ambiente de desenvolvimento
 ┣ 📂 src
 ┃ ┗ 📂 img               # Assets visuais e logotipo
 ┣ 📂 udio.01.ogg         # Assets de áudio local (Efeitos sonoros e trilha)
 ┣ 📜 index.html          # Página principal e catálogo de serviços
 ┣ 📜 recrutadores.html   # Landing page estratégica para Tech Recruiters
 ┣ 📜 estilo.css          # Estilização customizada e design system
 ┣ 📜 index.js            # Lógica principal, engine de áudio e DOM
 ┗ 📜 page-transition.js  # Middleware de roteamento e microinterações
