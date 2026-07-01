/**
 * ARQUIVO: resultado.js
 * ---------------------------------------------------------
 * Entra em ação quando resultado.html é carregado.
 * Resgata todos os dados das 7 camadas do localStorage
 * e os exibe de forma visual e organizada na tela.
 */

import { drawNetwork, drawRoute, animatePacket } from './animation.js';

// ─── Restaura o nome do usuário no header ──────────────────────────────────────
const USER_NAME   = localStorage.getItem('osi-nome-usuario') || 'Pedro Xavier';
const userElement = document.querySelector('#userNameDisplay');
if (userElement) userElement.textContent = USER_NAME;
const userElementLegacy = document.querySelector('.user');
if (userElementLegacy) userElementLegacy.textContent = USER_NAME;

// ─── Carrega os dados do localStorage ────────────────────────────────────────
const resultado      = JSON.parse(localStorage.getItem('dadosCriptografados'));
const containerDados = document.querySelector('#dados-conteudo');

if (!resultado || !containerDados) {
  if (containerDados) {
    containerDados.innerHTML = '<p style="color:#8fa0b3;text-align:center;padding:2rem;">Nenhum dado encontrado. <a href="index.html" style="color:#00c896;">Volte e faça uma requisição.</a></p>';
  }
} else {

  containerDados.innerHTML = '';

  // Helper no estilo do João: badge de camada + caixa de dados
  function secao(titulo, conteudoHTML, usarTokenBox = false) {
    const label = document.createElement('span');
    label.className = 'camada-label';
    label.textContent = titulo;
    containerDados.appendChild(label);

    const h3 = document.createElement('h3');
    // extrai só o nome sem emoji para o h3
    h3.textContent = titulo.replace(/^[^\w]+/, '').trim();
    containerDados.appendChild(h3);

    const box = document.createElement('div');
    box.className = usarTokenBox ? 'token-box' : 'payload-box';
    box.innerHTML = conteudoHTML;
    containerDados.appendChild(box);
  }

  // =========================
  // CAMADA 7 — APLICAÇÃO (Dados Originais)
  // =========================
  if (resultado.dadosAplicacao) {
    const a = resultado.dadosAplicacao;
    const campos = Object.entries(a)
      .map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`)
      .join('');
    secao('📱 Camada 7 — Aplicação (Payload Original)', campos);
  }

  // =========================
  // CAMADA 6 — APRESENTAÇÃO (AES-GCM)
  // =========================
  if (resultado.dadosEncriptados) {
    const e = resultado.dadosEncriptados;
    secao('🔐 Camada 6 — Apresentação (AES-GCM 256-bit)', `
      <p><strong>Algoritmo:</strong> ${e.algoritmo}</p>
      <p><strong>Tamanho cifrado:</strong> ${e.tamanho} bytes</p>
      <p><strong>IV (Base64):</strong> <code class="bits-preview">${e.iv}</code></p>
      <p><strong>Payload cifrado (prévia):</strong><br>
        <code class="bits-preview">${e.payload.slice(0, 80)}…</code>
      </p>
    `);
  }

  // =========================
  // TOKEN JWT
  // =========================
  secao('🔑 Token JWT (HS256)', `${resultado.token}`, true);

  // =========================
  // DNS GOOGLE
  // =========================
  if (resultado.dns) {
    const d = resultado.dns;
    secao('🌐 DNS Google (Resolução de Domínio)', `
      <p><strong>Domínio consultado:</strong> ${d.dominio}</p>
      <p><strong>IP resolvido:</strong> ${d.ip ?? 'não resolvido'}</p>
      <p><strong>Status:</strong> ${d.status === 0 ? 'OK (NOERROR)' : (d.status ?? 'erro')}</p>
    `);
  }

  // =========================
  // CAMADA 5 — SESSÃO
  // =========================
  if (resultado.sessao) {
    const s = resultado.sessao;
    secao('🪪 Camada 5 — Sessão', `
      <p><strong>Session ID (crypto.randomUUID):</strong> ${s.sessionId}</p>
      <p><strong>Status da Conexão:</strong> ${s.statusConexao ?? 'ESTABELECIDA'}</p>
      <p><strong>Início da Sessão:</strong> ${s.inicioSessao}</p>
    `);
  }

  // =========================
  // CAMADA 4 — TRANSPORTE (TCP)
  // =========================
  if (resultado.transporte) {
    const t = resultado.transporte;
    secao('📡 Camada 4 — Transporte (TCP)', `
      <p><strong>Protocolo:</strong> ${t.protocoloTransporte}</p>
      <p><strong>Packet ID:</strong> ${t.packetId}</p>
      <p><strong>Session ID:</strong> ${t.sessionId}</p>
      <p><strong>Porta Origem:</strong> ${t.portaOrigem} <em>(efêmera)</em></p>
      <p><strong>Porta Destino:</strong> ${t.portaDestino}</p>
    `);
  }

  // =========================
  // CAMADA 3 — REDE (Dijkstra)
  // Posição correta: após Transporte, ANTES de Enlace e Física
  // =========================
  const h3Rede = document.createElement('h3');
  h3Rede.textContent = '🗺 Camada 3 — Rede (Dijkstra)';
  containerDados.appendChild(h3Rede);

  const rede = resultado.rede;

  if (rede && rede.ids && rede.ids.length >= 2) {
    const infoRota = document.createElement('div');
    infoRota.classList.add('rota-info');
    infoRota.innerHTML = `
      <h4>Roteamento IP (networkObj)</h4>
      <p><em>${
        {
          'SMTP':       '📧 E-mail — MTA local → servidor MX do destinatário',
          'SMTP/POP':   '📧 E-mail — MTA local → servidor MX do destinatário',
          'HTTP/HTTPS': '🌐 Web — cliente → servidor web',
          'HTTPS':      '🌐 Web — cliente → servidor web',
          'WEBSOCKET':  '💬 Chat — cliente → servidor WebSocket',
          'FTP/HTTP':   '📁 Upload — cliente → servidor FTP',
        }[rede.protocolo] ?? `🔀 ${rede.protocolo} — roteamento IP`
      }</em></p>
      <p style="margin-top:.5rem">
        <strong>Destino resolvido via:</strong> ${rede.resolucao}
      </p>
      <hr style="border-color:rgba(255,87,34,.2);margin:.75rem 0">
      <p><strong>ipOrigem:</strong>  ${rede.ipOrigem}  <em>(${rede.origemId} — gateway local)</em></p>
      <p><strong>ipDestino:</strong> ${rede.ipDestino} <em>(${rede.destinoId})</em></p>
      <p><strong>ttl:</strong>       ${rede.ttl}</p>
      <p><strong>Saltos:</strong>    ${rede.ids.length - 1}</p>
      <p><strong>Distância:</strong> ${rede.distancia}px</p>
      <p style="margin-top:.5rem"><strong>rota (IPs):</strong></p>
      <code class="bits-preview">${rede.rota.join(' → ')}</code>
      <p style="margin-top:.5rem"><strong>rota (IDs):</strong></p>
      <code class="bits-preview">${rede.ids.join(' → ')}</code>
    `;
    containerDados.appendChild(infoRota);

    // Move o canvas para dentro de containerDados (na posição da Camada 3)
    const canvas = document.querySelector('#networkCanvas');
    if (canvas) {
      canvas.style.display = 'block';
      containerDados.appendChild(canvas);
    }

    drawNetwork(rede.ids);
    drawRoute(rede.ids, rede.origemId, rede.destinoId);
    animatePacket(rede.ids, rede.origemId, rede.destinoId);

  } else if (rede && rede.erro) {
    const err = document.createElement('p');
    err.textContent = `Erro na camada de rede: ${rede.erro}`;
    containerDados.appendChild(err);
    drawNetwork();
  } else {
    const aviso = document.createElement('p');
    aviso.textContent = 'Roteadores insuficientes para calcular rota.';
    containerDados.appendChild(aviso);
  }

  // =========================
  // CAMADA 2 — ENLACE (Ethernet IEEE 802.3)
  // =========================
  if (resultado.quadro) {
    const q = resultado.quadro;
    secao('🔗 Camada 2 — Enlace (Ethernet IEEE 802.3)', `
      <h4 style="margin-bottom:.75rem;color:#ff5722">Frame a ser enviado para a Camada Física:</h4>
      <p><strong>frameId:</strong> <code>${q.frameId}</code></p>
      <p><strong>macOrigem:</strong> <code>${q.macOrigem}</code> <em>(endereço físico desta máquina — simulado)</em></p>
      <p><strong>macDestino:</strong> <code>${q.macDestino}</code> <em>(roteador/switch receptor — fictício)</em></p>
      <p><strong>tipo:</strong> ${q.tipo}</p>
      <p><strong>crc (MD5):</strong> <code class="bits-preview">${q.crc}</code></p>
      <details style="margin-top:.75rem">
        <summary style="cursor:pointer;color:rgba(255,87,34,.9)">Ver payload encapsulado (dados do transporte)</summary>
        <code class="bits-preview" style="display:block;margin-top:.5rem">${JSON.stringify(q.dados, null, 2).slice(0, 300)}…</code>
      </details>
    `);
  }

  // =========================
  // CAMADA 1 — FÍSICA (Transmissão de Bits)
  // =========================
  if (resultado.fisica) {
    const f = resultado.fisica;
    const preview = f.bits.split(' ').slice(0, 32).join(' ') + ' …';

    const statusIcon  = f.integridadeOk ? '✅' : '❌';
    const statusTexto = f.integridadeOk
      ? 'Mensagem ÍNTEGRA — nenhum frame foi perdido'
      : 'ATENÇÃO: Mensagem CORROMPIDA — os hashes não coincidem!';
    const statusCor = f.integridadeOk ? 'color:#00ff88' : 'color:#ff2d78';

    secao('⚡ Camada 1 — Física (Transmissão de Bits)', `
      <h4 style="margin-bottom:.75rem;color:#ff5722">Objeto recebido da Camada de Enlace:</h4>

      <p><strong>frameId:</strong> <code>${f.objeto.frameId}</code></p>
      <p><strong>macOrigem:</strong> <code>${f.objeto.macOrigem}</code></p>
      <p><strong>macDestino:</strong> <code>${f.objeto.macDestino}</code></p>
      <p><strong>tipo:</strong> ${f.objeto.tipo}</p>
      <p><strong>crc (recebido):</strong> <code class="bits-preview">${f.crcRecebido}</code></p>

      <hr style="border-color:rgba(255,87,34,.2);margin:1rem 0">

      <h4 style="margin-bottom:.5rem;color:#ff5722">Verificação de Integridade (MD5):</h4>
      <p><strong>Hash recalculado:</strong> <code class="bits-preview">${f.hashCalculado}</code></p>
      <p><strong>CRC recebido:</strong>     <code class="bits-preview">${f.crcRecebido}</code></p>
      <p style="margin-top:.5rem;font-size:1.1rem;${statusCor}">
        <strong>${statusIcon} ${statusTexto}</strong>
      </p>

      <hr style="border-color:rgba(255,87,34,.2);margin:1rem 0">

      <h4 style="margin-bottom:.5rem;color:#ff5722">
        Representação Binária — transmitindo pelo meio físico:
      </h4>
      <code class="bits-preview">${preview}</code>

      <p style="margin-top:1rem;color:rgba(255,255,255,.5);font-size:.8rem">
        ✓ Transmissão encerrada. Dados enviados pelo meio físico.
      </p>
    `);
  }

  // Limpa o localStorage após exibir
  localStorage.removeItem('dadosCriptografados');
}
