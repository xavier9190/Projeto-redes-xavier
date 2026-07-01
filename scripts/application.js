/**
 * ARQUIVO: application.js
 * ---------------------------------------------------------
 * Concentra as regras de negócio da Camada de Aplicação (Camada 7).
 *
 * Responsabilidades:
 * - Identificação do usuário (login via localStorage)
 * - Detecção do protocolo com base no texto inserido
 * - Exibição dinâmica dos formulários (email / chat / web)
 * - Coleta dos dados e disparo para a Camada de Apresentação (Camada 6)
 */

import { camadaApresentacao } from './apresentacao.js';

// ─── Identificação do Usuário ─────────────────────────────────────────────────
let USER_NAME = localStorage.getItem('osi-nome-usuario');

// Se não há nome salvo, pergunta e persiste (default: Pedro Xavier)
if (!USER_NAME) {
  const digitado = prompt('👤 Bem-vindo ao Sistema OSI!\n\nDigite o seu nome para continuar:');
  USER_NAME = (digitado && digitado.trim()) ? digitado.trim() : 'Pedro Xavier';
  localStorage.setItem('osi-nome-usuario', USER_NAME);
}

// Exibe o nome do usuário no cabeçalho
const userElement = document.querySelector('#userNameDisplay');
if (userElement) userElement.textContent = USER_NAME;

// Também atualiza o .user caso exista na página
const userElementLegacy = document.querySelector('.user');
if (userElementLegacy) userElementLegacy.textContent = `Usuário: ${USER_NAME}`;

// Botão de logout / Trocar Usuário
const btnLogout = document.querySelector('#btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('osi-nome-usuario');
    window.location.reload();
  });
}

// ─── Elementos do DOM ─────────────────────────────────────────────────────────
const reqInput        = document.querySelector('#text-input');
const btnEnviar       = document.querySelector('.request-btn');
const protocolDisplay = document.querySelector('.protocol-name');

const emailForm     = document.querySelector('.email-form');
const chatForm      = document.querySelector('.chat-form');
const siteForm      = document.querySelector('.site-form');
const siteHostInput = document.querySelector('#site-host');
const inputFile     = document.querySelector('#arquivo');

// ─── Utilitários ──────────────────────────────────────────────────────────────
function limparFormularios() {
  if (emailForm) emailForm.classList.add('hidden');
  if (chatForm)  chatForm.classList.add('hidden');
  if (siteForm)  siteForm.classList.add('hidden');
}

// Ativa o botão visualmente quando há conteúdo no input
if (reqInput) {
  reqInput.addEventListener('input', () => {
    if (btnEnviar) btnEnviar.classList.toggle('active', reqInput.value.length > 0);
  });
}

// ─── Identificação do Protocolo ao clicar em EXECUTAR ─────────────────────────
if (btnEnviar) {
  btnEnviar.addEventListener('click', (event) => {
    event.preventDefault();

    const rawValue = reqInput ? reqInput.value.trim() : '';
    const value    = rawValue.toLowerCase();

    if (value === '' && (!inputFile || !inputFile.files.length)) return;

    limparFormularios();

    let protocolo = '';

    if (value.includes('@')) {
      // E-mail detectado → SMTP
      protocolo = '📧 SMTP / POP3';
      if (emailForm) emailForm.classList.remove('hidden');

    } else if (value.startsWith('ws://') || value.startsWith('wss://')) {
      // WebSocket explícito
      protocolo = '💬 WEBSOCKET';
      if (chatForm) chatForm.classList.remove('hidden');

    } else if (
      value.startsWith('http') ||
      value.includes('www')    ||
      value.includes('.com')   ||
      value.includes('.br')    ||
      value.includes('.net')   ||
      value.includes('.org')
    ) {
      // URL detectada → HTTP/HTTPS
      protocolo = '🌐 HTTP / HTTPS';
      if (siteForm) {
        siteForm.classList.remove('hidden');
        if (siteHostInput) siteHostInput.value = rawValue;
      }

    } else if (inputFile && inputFile.files.length > 0) {
      // Arquivo selecionado → FTP/HTTP
      protocolo = '📁 FTP / HTTP';

    } else {
      // Texto simples → WebSocket (chat)
      protocolo = '💬 WEBSOCKET';
      if (chatForm) {
        chatForm.classList.remove('hidden');
        const msgInput = document.querySelector('#chat-mensagem');
        if (msgInput) msgInput.value = rawValue;
      }
    }

    if (protocolDisplay) protocolDisplay.textContent = protocolo;

    if (reqInput) {
      reqInput.value = '';
      if (btnEnviar) btnEnviar.classList.remove('active');
    }
  });
}

// ─── Envio: E-mail (SMTP) ─────────────────────────────────────────────────────
if (emailForm) {
  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const dadosEmail = {
      tipo:         'E-mail (SMTP)',
      remetente:    document.querySelector('#remetente')?.value || USER_NAME,
      destinatario: document.querySelector('#destinatario')?.value || '',
      assunto:      document.querySelector('#assunto')?.value || 'Sem assunto',
      corpo:        document.querySelector('#corpo')?.value || '',
      protocolo:    'SMTP/POP',
      timestamp:    new Date().toLocaleTimeString(),
    };

    console.log('=== 1. CAMADA DE APLICAÇÃO (E-mail) ===');
    console.log(dadosEmail);
    await camadaApresentacao(dadosEmail);
    emailForm.reset();
    limparFormularios();
  });
}

// ─── Envio: Chat (WebSocket) ──────────────────────────────────────────────────
if (chatForm) {
  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const dadosChat = {
      tipo:         'Mensagem de Chat',
      usuario:      USER_NAME,
      destinatario: document.querySelector('#chat-destinatario')?.value || '',
      mensagem:     document.querySelector('#chat-mensagem')?.value || '',
      protocolo:    'WEBSOCKET',
      timestamp:    new Date().toLocaleTimeString(),
    };

    console.log('=== 1. CAMADA DE APLICAÇÃO (Chat) ===');
    console.log(dadosChat);
    await camadaApresentacao(dadosChat);
    chatForm.reset();
    limparFormularios();
  });
}

// ─── Envio: Upload de Arquivo (FTP/HTTP) ──────────────────────────────────────
if (inputFile) {
  inputFile.addEventListener('change', async () => {
    if (inputFile.files.length > 0) {
      const file   = inputFile.files[0];
      const partes = file.name.split('.');
      const formato = partes.length > 1 ? partes.pop() : 'desconhecido';

      const dadosArquivo = {
        tipo:        'Upload de Arquivo',
        nomeArquivo: file.name,
        formato,
        remetente:   USER_NAME,
        protocolo:   'FTP/HTTP',
        timestamp:   new Date().toLocaleTimeString(),
      };

      if (protocolDisplay) protocolDisplay.textContent = '📁 FTP / HTTP';

      console.log('=== 1. CAMADA DE APLICAÇÃO (Arquivo) ===');
      console.log(dadosArquivo);
      await camadaApresentacao(dadosArquivo);
    }
  });
}

// ─── Envio: Requisição Web (HTTP/HTTPS) ───────────────────────────────────────
if (siteForm) {
  siteForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const dadosSite = {
      tipo:      'Requisição Web (HTTP)',
      metodo:    document.querySelector('#site-metodo')?.value || 'GET',
      host:      document.querySelector('#site-host')?.value || '',
      usuario:   USER_NAME,
      protocolo: 'HTTP/HTTPS',
      timestamp: new Date().toLocaleTimeString(),
    };

    console.log('=== 1. CAMADA DE APLICAÇÃO (Web) ===');
    console.log(dadosSite);
    await camadaApresentacao(dadosSite);
    siteForm.reset();
    limparFormularios();
  });
}