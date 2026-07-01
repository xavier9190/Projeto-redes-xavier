/**
 * ARQUIVO: network.js
 * ---------------------------------------------------------
 * Camada de Rede — usa os 100 roteadores do points.js
 * Exporta a rede, o mapa de roteadores e o algoritmo de Dijkstra.
 *
 * Estrutura de saída do dijkstra:
 * {
 *   "ipOrigem":  "10.0.0.1",
 *   "ipDestino": "10.0.0.9",
 *   "rota":      ["10.0.0.1", "10.0.0.2", "10.0.0.5", "10.0.0.9"],
 *   "ids":       ["R1", "R2", "R5", "R9"],
 *   "ttl":       60,
 *   "distancia": 412
 * }
 */

import { points } from './points.js';

// Mapa de ID → roteador para lookup O(1)
export const routerMap = {};
points.forEach(p => { routerMap[p.id] = p; });

// Array exportado para a animação
export const network = points;

/**
 * Dijkstra sobre os roteadores do professor.
 * Usa distância euclidiana entre coordenadas como custo.
 * Ignora roteadores com ativo = false.
 *
 * @param {string} origemId   - ex: "R1"
 * @param {string} destinoId  - ex: "R100"
 * @returns {{ ipOrigem, ipDestino, rota, ids, ttl, distancia }}
 */
export function dijkstra(origemId, destinoId) {
  const dist     = {};
  const anterior = {};
  const visitado = new Set();
  const fila     = [];

  // Inicializa todas as distâncias como Infinity
  points.forEach(p => {
    dist[p.id]     = Infinity;
    anterior[p.id] = null;
  });

  dist[origemId] = 0;
  fila.push({ id: origemId, custo: 0 });

  while (fila.length > 0) {
    // Pega o nó com menor custo
    fila.sort((a, b) => a.custo - b.custo);
    const { id: atual } = fila.shift();

    if (visitado.has(atual)) continue;
    visitado.add(atual);

    if (atual === destinoId) break;

    const roteadorAtual = routerMap[atual];
    if (!roteadorAtual || !roteadorAtual.ativo) continue;

    // Percorre as conexões do roteador atual
    for (const vizinhoId of roteadorAtual.conexoes) {
      const vizinho = routerMap[vizinhoId];
      if (!vizinho || !vizinho.ativo) continue;

      // Custo = distância euclidiana entre coordenadas
      const dx    = roteadorAtual.x - vizinho.x;
      const dy    = roteadorAtual.y - vizinho.y;
      const custo = Math.sqrt(dx * dx + dy * dy);

      const novaDist = dist[atual] + custo;
      if (novaDist < dist[vizinhoId]) {
        dist[vizinhoId]     = novaDist;
        anterior[vizinhoId] = atual;
        fila.push({ id: vizinhoId, custo: novaDist });
      }
    }
  }

  // Reconstrói o caminho
  const ids = [];
  let cur   = destinoId;
  while (cur !== null) {
    ids.unshift(cur);
    cur = anterior[cur];
  }

  // Se não chegou na origem, caminho inválido
  if (ids[0] !== origemId) {
    return null;
  }

  // Monta o objeto no formato do professor
  const rota = ids.map(id => routerMap[id].ip);
  const ttl  = Math.max(1, 64 - ids.length);

  return {
    ipOrigem:  routerMap[origemId].ip,
    ipDestino: routerMap[destinoId].ip,
    rota,
    ids,       // IDs (R1, R2…) para a animação
    ttl,
    distancia: Math.round(dist[destinoId]),
  };
}
