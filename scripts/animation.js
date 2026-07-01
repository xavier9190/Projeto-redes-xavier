/**
 * ARQUIVO: animation.js
 * ---------------------------------------------------------
 * Responsável por animar o percurso do pacote na rede
 * sobre o canvas HTML5 da Camada de Rede (Camada 3).
 *
 * Desenha os 100 roteadores, as conexões entre eles,
 * destaca a rota calculada pelo Dijkstra e anima o pacote
 * se movendo de nó em nó até o destino.
 */

import { network, routerMap } from './network.js';

const canvas = document.querySelector('#networkCanvas');
const ctx    = canvas ? canvas.getContext('2d') : null;

// =====================
// IMAGENS DOS ROTEADORES
// =====================
const imgOK   = new Image();
imgOK.src     = './assets/router-green.png';

const imgFail = new Image();
imgFail.src   = './assets/router-red.png';

// =====================
// IMAGEM DO PACOTE
// =====================
const imgPacket = new Image();
imgPacket.src   = './assets/packet.png';

// =====================
// ESCALA — os pontos do professor usam coords até ~1000x650
// Ajusta para caber no canvas (1000x600)
// =====================
const SCALE_X = canvas ? canvas.width  / 1024 : 1;
const SCALE_Y = canvas ? canvas.height / 680  : 1;

function sx(x) { return x * SCALE_X; }
function sy(y) { return y * SCALE_Y; }

// =====================
// DESENHA A REDE COMPLETA
// =====================
export function drawNetwork(pathIds = []) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pathSet = new Set(pathIds);

  // Conexões
  network.forEach(router => {
    router.conexoes.forEach(vizinhoId => {
      const vizinho = routerMap[vizinhoId];
      if (!vizinho) return;

      // Destaca arestas que fazem parte do caminho
      const noRota =
        pathSet.has(router.id) && pathSet.has(vizinhoId) &&
        pathIds.indexOf(vizinhoId) === pathIds.indexOf(router.id) + 1;

      ctx.beginPath();
      ctx.moveTo(sx(router.x), sy(router.y));
      ctx.lineTo(sx(vizinho.x), sy(vizinho.y));
      ctx.strokeStyle = noRota ? 'rgba(0,255,255,0.8)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth   = noRota ? 3 : 0.8;
      ctx.stroke();
    });
  });

  // Nós (roteadores)
  network.forEach(router => {
    const img = router.ativo ? imgOK : imgFail;
    ctx.drawImage(img, sx(router.x) - 14, sy(router.y) - 14, 28, 28);
  });
}

// =====================
// DESENHA O CAMINHO SOBRE A REDE
// =====================
export function drawRoute(pathIds, origemId, destinoId) {
  if (!ctx || !pathIds || pathIds.length < 2) return;

  // Linha da rota
  ctx.beginPath();
  const first = routerMap[pathIds[0]];
  ctx.moveTo(sx(first.x), sy(first.y));
  for (let i = 1; i < pathIds.length; i++) {
    const r = routerMap[pathIds[i]];
    if (r) ctx.lineTo(sx(r.x), sy(r.y));
  }
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth   = 4;
  ctx.shadowColor  = '#00ffff';
  ctx.shadowBlur   = 10;
  ctx.stroke();
  ctx.shadowBlur   = 0;
  ctx.lineWidth    = 1;

  // Nó Origem (amarelo)
  const origem = routerMap[origemId];
  if (origem) {
    ctx.beginPath();
    ctx.arc(sx(origem.x), sy(origem.y), 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 220, 0, 0.85)';
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font      = 'bold 9px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(origemId, sx(origem.x), sy(origem.y));
  }

  // Nó Destino (verde neon)
  const destino = routerMap[destinoId];
  if (destino) {
    ctx.beginPath();
    ctx.arc(sx(destino.x), sy(destino.y), 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 255, 120, 0.85)';
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font      = 'bold 9px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(destinoId, sx(destino.x), sy(destino.y));
  }
}

// =====================
// UTILIDADE
// =====================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================
// ANIMAÇÃO DO PACOTE
// =====================
export async function animatePacket(pathIds, origemId, destinoId) {
  if (!ctx || !pathIds || pathIds.length < 2) return;

  for (let i = 0; i < pathIds.length - 1; i++) {
    const start = routerMap[pathIds[i]];
    const end   = routerMap[pathIds[i + 1]];
    if (!start || !end) continue;
    await animateSegment(start, end, pathIds, origemId, destinoId);
  }
}

async function animateSegment(start, end, pathIds, origemId, destinoId) {
  const frames = 60;
  for (let f = 0; f <= frames; f++) {
    const t = f / frames;
    const x = sx(start.x) + (sx(end.x) - sx(start.x)) * t;
    const y = sy(start.y) + (sy(end.y) - sy(start.y)) * t;

    drawNetwork(pathIds);
    drawRoute(pathIds, origemId, destinoId);

    // Pacote
    if (imgPacket.complete && imgPacket.naturalWidth > 0) {
      ctx.drawImage(imgPacket, x - 20, y - 20, 40, 40);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle   = '#00c896';
      ctx.shadowColor = '#00c896';
      ctx.shadowBlur  = 12;
      ctx.fill();
      ctx.shadowBlur  = 0;
    }

    await sleep(16); // ~60fps
  }
}
