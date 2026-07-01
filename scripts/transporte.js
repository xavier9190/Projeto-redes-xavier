/**
 * ARQUIVO: transporte.js
 * ---------------------------------------------------------
 * Representa a Camada de Transporte (Camada 4 do Modelo OSI).
 * Usa o protocolo TCP para segmentar e encapsular os dados da Camada 5.
 *
 * Mapeamento de portas (TCP):
 *   HTTP/HTTPS → 443
 *   SMTP/POP   → 587
 *   FTP/HTTP   → 21
 *   WEBSOCKET  → 80
 */

const MAPA_PORTAS = {
  'HTTP':       80,
  'HTTP/HTTPS': 443,
  'HTTPS':      443,
  'SMTP':       587,
  'SMTP/POP':   587,
  'FTP':        21,
  'FTP/HTTP':   21,
  'WEBSOCKET':  80,
  'WebSocket':  80,
};

export function camadaTransporte(sessao, protocolo = 'HTTP/HTTPS') {
  // Porta de destino conforme o protocolo detectado pela Camada 7
  const portaDestino = MAPA_PORTAS[protocolo] ?? 80;

  // Porta de origem efêmera (49152–65535), escolhida aleatoriamente pelo SO
  const portaOrigem = Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;

  // Objeto de transporte conforme especificação do professor
  const transportObj = {
    sessionId:           sessao.sessionId,
    packetId:            crypto.randomUUID(),
    protocoloTransporte: 'TCP',
    portaOrigem,
    portaDestino,
    dados:               sessao,
  };

  console.log('═══ CAMADA DE TRANSPORTE (Camada 4) ═══', transportObj);
  return transportObj;
}
