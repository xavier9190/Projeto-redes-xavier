/**
 * ARQUIVO: enlace.js
 * ---------------------------------------------------------
 * Representa a Camada de Enlace de Dados (Camada 2 do Modelo OSI).
 * Responsável pelo endereçamento físico (MAC) e verificação de erros (CRC).
 *
 * Estrutura do frame Ethernet IEEE 802.3:
 * {
 *   frameId:    "F001",
 *   macOrigem:  "XX:XX:XX:XX:XX:XX",  // endereço físico simulado da máquina local
 *   macDestino: "AA:BB:CC:DD:EE:FF",  // MAC fictício do roteador/switch receptor
 *   tipo:       "IPv4",
 *   crc:        "AB1234...",           // MD5 do JSON.stringify dos dados
 *   dados:      { ... }               // payload encapsulado (objeto do transporte)
 * }
 *
 * Nota: Browsers não expõem o MAC real do dispositivo por razões de segurança.
 * Simulamos um MAC localmente administrado (bit U/L = 1) gerado e persistido
 * no localStorage, representando o endereço físico fixo desta máquina.
 */

import md5 from 'https://esm.sh/md5@2';

// ─── Contador de frames ───────────────────────────────────────────────────────
let frameCounter = parseInt(sessionStorage.getItem('osi-frame-counter') ?? '0', 10);

function gerarFrameId() {
  frameCounter++;
  sessionStorage.setItem('osi-frame-counter', String(frameCounter));
  return `F${String(frameCounter).padStart(3, '0')}`;
}

// ─── MAC Origem — simulado e persistido (representa este dispositivo) ─────────
function obterMacOrigem() {
  const salvo = localStorage.getItem('osi-mac-origem');
  if (salvo) return salvo;

  // Gera MAC aleatório de 6 bytes — localmente administrado (bit U/L = 1, bit I/G = 0)
  const bytes = Array.from(crypto.getRandomValues(new Uint8Array(6)));
  bytes[0] = (bytes[0] & 0xFE) | 0x02;   // unicast + locally administered
  const mac = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
  localStorage.setItem('osi-mac-origem', mac);
  console.log('[Enlace] MAC Origem gerado e persistido:', mac);
  return mac;
}

// ─── MAC Destino — endereço fictício do roteador/switch receptor ──────────────
function gerarMacDestino(semente) {
  // Derivado deterministicamente do packetId para ser rastreável
  const hex   = semente.replace(/-/g, '').slice(0, 12).toUpperCase();
  const bytes = hex.match(/.{2}/g) ?? [];
  // Garante que é unicast + locally administered
  bytes[0] = ((parseInt(bytes[0], 16) & 0xFE) | 0x02)
    .toString(16).padStart(2, '0').toUpperCase();
  return bytes.join(':');
}

// ─── Camada de Enlace ─────────────────────────────────────────────────────────

export function camadaEnlace(transporte) {
  console.log('═══ CAMADA DE ENLACE (Camada 2) ═══');

  const frameId    = gerarFrameId();
  const macOrigem  = obterMacOrigem();
  const macDestino = gerarMacDestino(transporte.packetId);
  const tipo       = 'IPv4';

  // CRC = MD5 do JSON.stringify do payload — permite verificar integridade na camada física
  const dadosStr = JSON.stringify(transporte);
  const crc      = md5(dadosStr).toUpperCase();

  const quadro = {
    frameId,
    macOrigem,
    macDestino,
    tipo,
    crc,
    dados: transporte,
  };

  console.log('[Enlace] Frame criado:', {
    frameId,
    macOrigem,
    macDestino,
    tipo,
    crc,
  });

  return quadro;
}
