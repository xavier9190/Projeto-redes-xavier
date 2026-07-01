/**
 * ARQUIVO: camada_rede.js
 * ---------------------------------------------------------
 * Representa a Camada de Rede (Camada 3 do Modelo OSI).
 * Responsável pelo roteamento de pacotes entre redes distintas usando IPs.
 *
 * Utiliza o algoritmo de Dijkstra sobre 100 roteadores (points.js)
 * para calcular a melhor rota entre origem e destino.
 *
 * Estrutura de saída (baseada no modelo do professor):
 * {
 *   "ipOrigem":   "10.0.0.1",
 *   "ipDestino":  "10.0.0.9",
 *   "rota":       ["10.0.0.1", "10.0.0.2", "10.0.0.9"],
 *   "ids":        ["R1", "R2", "R9"],
 *   "ttl":        62,
 *   "distancia":  412,
 *   "resolucao":  "DNS Google → example.com (93.184.216.34)",
 *   "protocolo":  "HTTP/HTTPS"
 * }
 */

import { network, routerMap, dijkstra } from './network.js';

// ─── Hashes determinísticos ───────────────────────────────────────────────────

/** Hash de string de IP → índice de roteador ativo */
function ipParaIndice(ip, total) {
  const oct = ip.split('.').map(Number);
  const val = (oct[2] ?? 0) * 256 + (oct[3] ?? 0);
  return val % total;
}

/** Hash de string genérica → índice de roteador ativo */
function strParaIndice(str, total) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xFFFF;
  return h % total;
}

// ─── Camada de Rede ──────────────────────────────────────────────────────────

/**
 * @param {object} transporte - Objeto retornado pela camadaTransporte
 * @param {object|null} dns   - Resultado do DNS Google (pode ser null)
 * @returns {object} networkObj com rota calculada pelo Dijkstra
 */
export function camadaRede(transporte, dns = null) {
  console.log('═══ CAMADA DE REDE (Camada 3) ═══');

  const ativos = network.filter(r => r.ativo);

  if (ativos.length < 2) {
    console.warn('[Rede] Roteadores insuficientes para calcular rota.');
    return { erro: 'Roteadores insuficientes' };
  }

  // ORIGEM: R1 = gateway local fixo para todos os protocolos
  const origemId = 'R1';

  // DESTINO: determinístico pelo IP (DNS) ou pelo protocolo
  const protocolo = transporte.dados?.dados?.protocolo ?? 'WEBSOCKET';
  const dnsIp     = dns?.ip ?? null;

  let destinoIdx, resolucaoLabel;

  if (dnsIp) {
    destinoIdx     = ipParaIndice(dnsIp, ativos.length);
    resolucaoLabel = `DNS Google → ${dns.dominio} (${dnsIp})`;
  } else {
    destinoIdx     = strParaIndice(protocolo, ativos.length);
    resolucaoLabel = `Protocolo ${protocolo} — sem DNS (texto/WebSocket)`;
  }

  const possiveis = ativos.filter(r => r.id !== origemId);
  const destinoId = possiveis[destinoIdx % possiveis.length].id;

  const networkObj = dijkstra(origemId, destinoId);

  if (!networkObj || networkObj.ids.length < 2) {
    console.warn('[Rede] Nenhuma rota encontrada.');
    return { erro: 'Nenhuma rota encontrada', origemId, destinoId };
  }

  const resultado = {
    ...networkObj,
    resolucao:  resolucaoLabel,
    protocolo,
    origemId,
    destinoId,
    dados: transporte, // encapsula os dados do transporte
  };

  console.log('[Rede] Rota calculada:', resultado);
  return resultado;
}
